export interface AnalyzedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  keywords: string[];
  category: FileCategory;
  uploadedAt: Date;
  file: File;
}

export type FileCategory =
  | "Education"
  | "Finance"
  | "Health"
  | "Technology"
  | "Legal"
  | "Marketing"
  | "Science"
  | "Others";

export interface SemanticFolder {
  name: FileCategory;
  icon: string;
  files: AnalyzedFile[];
  color: string;
}
