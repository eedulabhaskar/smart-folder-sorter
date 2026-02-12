import type { FileCategory, AnalyzedFile } from "@/types/file";

// Keyword dictionaries for each category
const categoryKeywords: Record<FileCategory, string[]> = {
  Education: [
    "school", "university", "student", "teacher", "course", "curriculum",
    "education", "learning", "exam", "grade", "degree", "lecture", "study",
    "academic", "classroom", "homework", "research", "thesis", "diploma",
    "scholarship", "tutorial", "training", "syllabus", "semester", "college",
  ],
  Finance: [
    "bank", "money", "investment", "stock", "revenue", "profit", "tax",
    "budget", "expense", "loan", "credit", "debit", "financial", "accounting",
    "salary", "income", "interest", "dividend", "portfolio", "market",
    "insurance", "mortgage", "payment", "invoice", "transaction", "capital",
  ],
  Health: [
    "health", "medical", "doctor", "patient", "hospital", "medicine",
    "disease", "treatment", "diagnosis", "symptom", "therapy", "clinical",
    "surgery", "prescription", "vaccine", "wellness", "nutrition", "fitness",
    "mental", "healthcare", "pharmacy", "nurse", "blood", "cancer", "virus",
  ],
  Technology: [
    "software", "hardware", "computer", "programming", "algorithm", "data",
    "cloud", "network", "server", "database", "api", "code", "developer",
    "javascript", "python", "machine", "artificial", "intelligence", "web",
    "mobile", "app", "digital", "cybersecurity", "blockchain", "iot",
    "framework", "react", "neural", "computing", "automation",
  ],
  Legal: [
    "law", "legal", "court", "judge", "attorney", "contract", "regulation",
    "compliance", "policy", "rights", "liability", "lawsuit", "statute",
    "jurisdiction", "plaintiff", "defendant", "clause", "amendment",
    "arbitration", "litigation", "patent", "trademark", "copyright",
  ],
  Marketing: [
    "marketing", "brand", "advertising", "campaign", "social", "media",
    "seo", "content", "audience", "engagement", "conversion", "analytics",
    "strategy", "promotion", "customer", "target", "market", "sales",
    "branding", "digital", "influencer", "funnel", "roi", "leads",
  ],
  Science: [
    "science", "experiment", "hypothesis", "theory", "research", "biology",
    "chemistry", "physics", "laboratory", "molecule", "atom", "cell",
    "genome", "evolution", "quantum", "particle", "energy", "equation",
    "scientific", "discovery", "observation", "specimen", "ecology",
  ],
  Others: [],
};

/**
 * Extract text content from a File object
 */
export async function extractText(file: File): Promise<string> {
  if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
    return await file.text();
  }

  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    return await extractPdfText(file);
  }

  // Fallback: try reading as text
  try {
    return await file.text();
  } catch {
    return "";
  }
}

/**
 * Extract text from PDF using pdf.js
 */
async function extractPdfText(file: File): Promise<string> {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      pages.push(text);
    }

    return pages.join("\n");
  } catch (error) {
    console.error("PDF extraction error:", error);
    return "";
  }
}

/**
 * Extract keywords from text content
 */
export function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  // Count word frequency
  const freq: Record<string, number> = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }

  // Sort by frequency and return top keywords
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Categorize text content into a semantic folder
 */
export function categorizeContent(text: string, keywords: string[]): FileCategory {
  const lowerText = text.toLowerCase();
  const scores: Record<FileCategory, number> = {
    Education: 0,
    Finance: 0,
    Health: 0,
    Technology: 0,
    Legal: 0,
    Marketing: 0,
    Science: 0,
    Others: 0,
  };

  // Score each category based on keyword matches
  for (const [category, catKeywords] of Object.entries(categoryKeywords)) {
    if (category === "Others") continue;
    for (const keyword of catKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      const matches = lowerText.match(regex);
      if (matches) {
        scores[category as FileCategory] += matches.length;
      }
    }
    // Bonus for extracted keywords matching category keywords
    for (const kw of keywords) {
      if (catKeywords.includes(kw)) {
        scores[category as FileCategory] += 3;
      }
    }
  }

  // Find highest scoring category
  let bestCategory: FileCategory = "Others";
  let bestScore = 2; // Minimum threshold to avoid "Others" for everything

  for (const [cat, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat as FileCategory;
    }
  }

  return bestCategory;
}

/**
 * Analyze a file: extract text, keywords, and categorize
 */
export async function analyzeFile(file: File): Promise<AnalyzedFile> {
  const content = await extractText(file);
  const keywords = extractKeywords(content);
  const category = categorizeContent(content, keywords);

  return {
    id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    size: file.size,
    type: file.type || "text/plain",
    content,
    keywords,
    category,
    uploadedAt: new Date(),
    file,
  };
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
