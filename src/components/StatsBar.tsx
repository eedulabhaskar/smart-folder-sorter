import { motion } from "framer-motion";
import type { AnalyzedFile, SemanticFolder } from "@/types/file";
import { FileText, FolderOpen, Tag, HardDrive } from "lucide-react";
import { formatFileSize } from "@/lib/fileAnalyzer";

interface StatsBarProps {
  files: AnalyzedFile[];
  folders: SemanticFolder[];
}

export const StatsBar = ({ files, folders }: StatsBarProps) => {
  if (files.length === 0) return null;

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const uniqueKeywords = new Set(files.flatMap((f) => f.keywords)).size;

  const stats = [
    { icon: FileText, label: "Files", value: files.length, color: "text-primary" },
    { icon: FolderOpen, label: "Folders", value: folders.length, color: "text-primary" },
    { icon: Tag, label: "Keywords", value: uniqueKeywords, color: "text-primary" },
    { icon: HardDrive, label: "Total Size", value: formatFileSize(totalSize), color: "text-primary" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-border bg-card p-3 flex items-center gap-3"
        >
          <div className="p-2 rounded-md bg-primary/10">
            <stat.icon size={16} className={stat.color} />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-foreground leading-none">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
};
