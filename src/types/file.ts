// File and category types — aligned with Supabase tables.

export type FileStatus = "pending" | "processing" | "done" | "error";

export interface AnalyzedFile {
  id: string;
  name: string;
  size: number;
  mime_type: string | null;
  storage_path: string;
  content_excerpt: string | null;
  keywords: string[];
  category_name: string;
  category_id: string | null;
  confidence: number; // 0-100
  reasoning: string | null;
  summary: string | null;
  status: FileStatus;
  error_message: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
}

export interface SemanticFolder extends Category {
  files: AnalyzedFile[];
}

export interface ActivityEntry {
  id: string;
  action: string;
  description: string;
  meta: Record<string, unknown> | null;
  created_at: string;
}
