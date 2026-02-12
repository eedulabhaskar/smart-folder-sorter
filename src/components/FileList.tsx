import { motion } from "framer-motion";
import type { AnalyzedFile } from "@/types/file";
import { formatFileSize } from "@/lib/fileAnalyzer";
import { FileText, Eye, Clock, Tag } from "lucide-react";

interface FileListProps {
  files: AnalyzedFile[];
  onPreview: (file: AnalyzedFile) => void;
}

export const FileList = ({ files, onPreview }: FileListProps) => {
  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText size={32} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm font-display">No files in this folder</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file, i) => (
        <motion.div
          key={file.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
          className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4
            hover:border-primary/30 transition-all duration-200 cursor-pointer"
          onClick={() => onPreview(file)}
        >
          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-primary" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-display text-sm font-medium text-foreground truncate">
              {file.name}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{formatFileSize(file.size)}</span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {file.uploadedAt.toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Keywords */}
          <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
            <Tag size={12} className="text-muted-foreground" />
            {file.keywords.slice(0, 3).map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              >
                {kw}
              </span>
            ))}
          </div>

          {/* Preview button */}
          <button className="p-2 rounded-md opacity-0 group-hover:opacity-100 
            hover:bg-primary/10 text-primary transition-all flex-shrink-0">
            <Eye size={16} />
          </button>
        </motion.div>
      ))}
    </div>
  );
};
