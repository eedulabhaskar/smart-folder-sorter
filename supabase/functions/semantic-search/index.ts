// Edge function: semantic-search
// Uses Lovable AI to interpret a natural-language query and rank user files.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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

    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Missing query" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load file index for this user
    const { data: files, error: filesErr } = await supabase
      .from("files")
      .select("id, name, category_name, keywords, summary, content_excerpt")
      .eq("user_id", userId)
      .eq("status", "done")
      .limit(200);

    if (filesErr) throw filesErr;
    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ results: [], interpretation: "No files to search yet." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build a compact catalog for the LLM
    const catalog = files.map((f, i) => ({
      idx: i,
      id: f.id,
      name: f.name,
      category: f.category_name,
      keywords: f.keywords?.slice(0, 8) ?? [],
      summary: (f.summary || f.content_excerpt || "").slice(0, 400),
    }));

    const systemPrompt = `You match a user's natural-language query against a catalog of their files.
- Return up to 10 files most relevant to the query.
- Provide a relevance score 0-100 for each match.
- Provide a one-sentence "why" explaining the match using filename, category, keywords, or summary.
- Also provide a one-sentence interpretation of the user's query.`;

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
          {
            role: "user",
            content: `Query: ${query}\n\nFile catalog (JSON):\n${JSON.stringify(catalog)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "rank_files",
              description: "Return ranked search results.",
              parameters: {
                type: "object",
                properties: {
                  interpretation: { type: "string" },
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        score: { type: "number", minimum: 0, maximum: 100 },
                        why: { type: "string" },
                      },
                      required: ["id", "score", "why"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["interpretation", "results"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "rank_files" } },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      let msg = "Search failed.";
      if (aiResp.status === 429) msg = "Rate limit reached. Please try again shortly.";
      if (aiResp.status === 402) msg = "AI credits exhausted. Add credits in workspace settings.";
      return new Response(JSON.stringify({ error: msg }), {
        status: aiResp.status === 429 || aiResp.status === 402 ? aiResp.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    const parsed = toolCall?.function?.arguments
      ? JSON.parse(toolCall.function.arguments)
      : { interpretation: "", results: [] };

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("semantic-search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
