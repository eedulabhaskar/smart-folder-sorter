// Edge function: analyze-file
// Receives extracted text + filename, calls Lovable AI to classify, summarize,
// produce confidence + reasoning, then updates the files row.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface AnalyzePayload {
  fileId: string;
  text: string;
  fileName: string;
  availableCategories: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body: AnalyzePayload = await req.json();
    if (!body.fileId || typeof body.text !== "string") {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark processing
    await supabase
      .from("files")
      .update({ status: "processing" })
      .eq("id", body.fileId)
      .eq("user_id", userId);

    // Truncate to keep prompt size reasonable
    const excerpt = (body.text || "").slice(0, 8000);
    const categories = body.availableCategories?.length
      ? body.availableCategories
      : ["Education", "Finance", "Health", "Technology", "Legal", "Marketing", "Science", "Others"];

    const systemPrompt = `You are an expert document classifier. Analyze the document and return a structured classification.
- Pick exactly ONE category from the provided list. If none fits, choose "Others".
- Provide 5-8 concise lowercase keywords actually found in the text.
- Provide a 1-2 sentence reason explaining why this category was chosen, citing keywords.
- Provide a 2-3 sentence neutral summary of the document's content.
- Confidence is a number 0-100 reflecting how sure you are.`;

    const userPrompt = `Filename: ${body.fileName}
Allowed categories: ${categories.join(", ")}

Document content:
"""
${excerpt || "(empty document)"}
"""`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_document",
              description: "Return the document classification result.",
              parameters: {
                type: "object",
                properties: {
                  category: { type: "string", enum: categories },
                  confidence: { type: "number", minimum: 0, maximum: 100 },
                  keywords: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 10 },
                  reasoning: { type: "string" },
                  summary: { type: "string" },
                },
                required: ["category", "confidence", "keywords", "reasoning", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_document" } },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);

      let userMessage = "AI analysis failed.";
      if (aiResp.status === 429) userMessage = "Rate limit reached. Please try again shortly.";
      if (aiResp.status === 402) userMessage = "AI credits exhausted. Add credits in workspace settings.";

      await supabase
        .from("files")
        .update({ status: "error", error_message: userMessage })
        .eq("id", body.fileId)
        .eq("user_id", userId);

      return new Response(JSON.stringify({ error: userMessage }), {
        status: aiResp.status === 429 || aiResp.status === 402 ? aiResp.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("AI returned no structured output");

    const parsed = JSON.parse(toolCall.function.arguments);
    const category = categories.includes(parsed.category) ? parsed.category : "Others";

    // Look up category_id for this user
    const { data: catRow } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .eq("name", category)
      .maybeSingle();

    const updates = {
      category_name: category,
      category_id: catRow?.id ?? null,
      confidence: Math.round(Number(parsed.confidence) || 0),
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 10) : [],
      reasoning: String(parsed.reasoning || "").slice(0, 1000),
      summary: String(parsed.summary || "").slice(0, 1500),
      content_excerpt: excerpt.slice(0, 2000),
      status: "done",
      error_message: null,
    };

    const { error: updErr } = await supabase
      .from("files")
      .update(updates)
      .eq("id", body.fileId)
      .eq("user_id", userId);
    if (updErr) throw updErr;

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: userId,
      action: "ai_classify",
      description: `Classified "${body.fileName}" as ${category} (${updates.confidence}%)`,
      meta: { fileId: body.fileId, category, confidence: updates.confidence },
    });

    return new Response(JSON.stringify({ success: true, ...updates }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-file error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
