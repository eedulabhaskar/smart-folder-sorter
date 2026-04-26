import { motion } from "framer-motion";
import type { AnalyzedFile } from "@/types/file";
import { formatFileSize } from "@/lib/fileAnalyzer";
import { FileText, Eye, Clock, Tag, Loader2, AlertTriangle, Trash2, Download } from "lucide-react";
import { useFiles } from "@/contexts/FileContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FileListProps {
  files: AnalyzedFile[];
  onPreview: (file: AnalyzedFile) => void;
}

export const FileList = ({ files, onPreview }: FileListProps) => {
  const { removeFile } = useFiles();
  const { toast } = useToast();

  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText size={32} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm font-display">No files in this folder</p>
      </div>
    );
  }

  const handleDownload = async (e: React.MouseEvent, file: AnalyzedFile) => {
    e.stopPropagation();
    const { data, error } = await supabase.storage
      .from("user-files")
      .createSignedUrl(file.storage_path, 60);
    if (error || !data) {
      toast({ title: "Download failed", description: error?.message, variant: "destructive" });
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = file.name;
    a.click();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this file?")) return;
    await removeFile(id);
  };

  return (
    <div className="space-y-2">
      {files.map((file, i) => (
        <motion.div
          key={file.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(i * 0.03, 0.3) }}
          className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-all duration-200 cursor-pointer"
          onClick={() => onPreview(file)}
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            {file.status === "processing" || file.status === "pending" ? (
              <Loader2 size={18} className="text-primary animate-spin" />
            ) : file.status === "error" ? (
              <AlertTriangle size={18} className="text-destructive" />
            ) : (
              <FileText size={18} className="text-primary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-display text-sm font-medium text-foreground truncate">{file.name}</p>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{formatFileSize(file.size)}</span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {new Date(file.created_at).toLocaleString()}
              </span>
              {file.status === "done" && (
                <span className="text-primary">{file.confidence}% confident</span>
              )}
              {file.status === "processing" && <span className="text-primary">Analyzing…</span>}
              {file.status === "error" && (
                <span className="text-destructive">{file.error_message || "Error"}</span>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
            <Tag size={12} className="text-muted-foreground" />
            {file.keywords.slice(0, 3).map((kw) => (
              <span key={kw} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                {kw}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => handleDownload(e, file)}
              className="p-2 rounded-md hover:bg-primary/10 text-primary"
              title="Download"
            >
              <Download size={14} />
            </button>
            <button
              onClick={() => onPreview(file)}
              className="p-2 rounded-md hover:bg-primary/10 text-primary"
              title="Preview"
            >
              <Eye size={14} />
            </button>
            <button
              onClick={(e) => handleDelete(e, file.id)}
              className="p-2 rounded-md hover:bg-destructive/10 text-destructive"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
