/**
 * Frontend-side file analysis utilities (text extraction only).
 * AI classification + summarization happen on the server in the
 * `analyze-file` edge function.
 */

const MAX_TEXT_BYTES = 200_000;

/** Extract plain text from a File object. */
export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (
    file.type === "text/plain" ||
    file.type === "text/markdown" ||
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".csv") ||
    name.endsWith(".json")
  ) {
    const t = await file.text();
    return t.slice(0, MAX_TEXT_BYTES);
  }

  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return await extractPdfText(file);
  }

  if (
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return await extractDocxText(file);
  }

  // For images & unknown binaries, we only have the filename to go on.
  return `[Binary file: ${file.name}]`;
}

async function extractPdfText(file: File): Promise<string> {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      pages.push(tc.items.map((item: any) => item.str).join(" "));
    }
    return pages.join("\n").slice(0, MAX_TEXT_BYTES);
  } catch (error) {
    console.error("PDF extraction error:", error);
    return "";
  }
}

async function extractDocxText(file: File): Promise<string> {
  // Lightweight DOCX text extraction by reading the document.xml inside the zip.
  // We use jszip which is already installed for export functionality.
  try {
    const JSZip = (await import("jszip")).default;
    const buf = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);
    const docXml = await zip.file("word/document.xml")?.async("string");
    if (!docXml) return "";
    // Strip XML tags, leave text only.
    const text = docXml
      .replace(/<w:p[^>]*>/g, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, MAX_TEXT_BYTES);
  } catch (e) {
    console.error("DOCX extraction error:", e);
    return "";
  }
}

/** Format bytes as a human-readable string. */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
