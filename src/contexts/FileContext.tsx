import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { AnalyzedFile, SemanticFolder, FileCategory } from "@/types/file";
import { analyzeFile } from "@/lib/fileAnalyzer";
import { saveUserFiles, loadUserFiles, addActivity } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const folderMeta: Record<FileCategory, { icon: string; color: string }> = {
  Education: { icon: "📚", color: "174 72% 50%" },
  Finance: { icon: "💰", color: "40 90% 55%" },
  Health: { icon: "🏥", color: "150 60% 45%" },
  Technology: { icon: "💻", color: "220 80% 60%" },
  Legal: { icon: "⚖️", color: "280 60% 60%" },
  Marketing: { icon: "📢", color: "340 70% 55%" },
  Science: { icon: "🔬", color: "200 70% 50%" },
  Others: { icon: "📁", color: "215 12% 50%" },
};

interface FileContextType {
  files: AnalyzedFile[];
  folders: SemanticFolder[];
  folderMeta: Record<FileCategory, { icon: string; color: string }>;
  isProcessing: boolean;
  uploadFiles: (newFiles: File[]) => Promise<void>;
  removeFile: (id: string) => void;
}

const FileContext = createContext<FileContextType | null>(null);

export function FileProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<AnalyzedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load files from storage on user change
  useEffect(() => {
    if (user) {
      const stored = loadUserFiles(user.id);
      setFiles(stored);
    } else {
      setFiles([]);
    }
  }, [user?.id]);

  // Persist files on change
  useEffect(() => {
    if (user && files.length > 0) {
      saveUserFiles(user.id, files);
    }
  }, [files, user?.id]);

  const folders: SemanticFolder[] = (Object.keys(folderMeta) as FileCategory[]).map((name) => ({
    name,
    icon: folderMeta[name].icon,
    color: folderMeta[name].color,
    files: files.filter((f) => f.category === name),
  }));

  const uploadFiles = useCallback(async (newFiles: File[]) => {
    if (!user) return;
    setIsProcessing(true);

    let successCount = 0;
    for (const file of newFiles) {
      try {
        const result = await analyzeFile(file);
        setFiles((prev) => [...prev, result]);
        addActivity(user.id, {
          action: "upload",
          fileName: result.name,
          category: result.category,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to analyze ${file.name}:`, error);
        toast({
          title: "Processing Error",
          description: `Failed to analyze ${file.name}`,
          variant: "destructive",
        });
      }
    }

    setIsProcessing(false);
    if (successCount > 0) {
      toast({
        title: "Upload Complete",
        description: `${successCount} file${successCount > 1 ? "s" : ""} analyzed and organized.`,
      });
    }
  }, [user, toast]);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return (
    <FileContext.Provider value={{ files, folders, folderMeta, isProcessing, uploadFiles, removeFile }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFiles() {
  const ctx = useContext(FileContext);
  if (!ctx) throw new Error("useFiles must be used within FileProvider");
  return ctx;
}
