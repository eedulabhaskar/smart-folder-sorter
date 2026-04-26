import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AnalyzedFile } from "@/types/file";
import { formatFileSize } from "@/lib/fileAnalyzer";
import { FileText, Tag, Clock, HardDrive, FolderOpen, Sparkles, Brain } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFiles } from "@/contexts/FileContext";
import { useState, useEffect } from "react";

interface FilePreviewProps {
  file: AnalyzedFile | null;
  onClose: () => void;
}

export const FilePreview = ({ file, onClose }: FilePreviewProps) => {
  const { categories, reassignFile } = useFiles();
  const [selectedCat, setSelectedCat] = useState(file?.category_name ?? "");

  useEffect(() => {
    if (file) setSelectedCat(file.category_name);
  }, [file]);

  if (!file) return null;

  const handleReassign = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCat = e.target.value;
    setSelectedCat(newCat);
    if (newCat !== file.category_name) {
      await reassignFile(file.id, newCat);
    }
  };

  return (
    <Dialog open={!!file} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-card border-border overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            {file.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 bg-secondary rounded-full px-2.5 py-1">
            <HardDrive size={12} /> {formatFileSize(file.size)}
          </span>
          <span className="flex items-center gap-1 bg-secondary rounded-full px-2.5 py-1">
            <Clock size={12} /> {new Date(file.created_at).toLocaleString()}
          </span>
          <span className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-1 border border-primary/20">
            <FolderOpen size={12} /> {file.category_name}
          </span>
          {file.status === "done" && (
            <span className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-1 border border-primary/20">
              <Sparkles size={12} /> {file.confidence}% confidence
            </span>
          )}
        </div>

        {/* Reassign category */}
        <div>
          <label className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-1 block">
            Move to category
          </label>
          <select
            value={selectedCat}
            onChange={handleReassign}
            className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* AI summary */}
        {file.summary && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs uppercase tracking-wider text-primary mb-1 font-display flex items-center gap-1">
              <Brain size={12} /> AI Summary
            </p>
            <p className="text-sm text-foreground leading-relaxed">{file.summary}</p>
          </div>
        )}

        {/* Reasoning */}
        {file.reasoning && (
          <div>
            <p className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-1">
              Why this category
            </p>
            <p className="text-sm text-foreground">{file.reasoning}</p>
          </div>
        )}

        {/* Keywords */}
        {file.keywords.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-xs font-display text-muted-foreground uppercase tracking-wider">
              <Tag size={12} /> Keywords
            </div>
            <div className="flex flex-wrap gap-1.5">
              {file.keywords.map((kw) => (
                <span key={kw} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content excerpt */}
        {file.content_excerpt && (
          <div>
            <p className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-2">
              Content Preview
            </p>
            <ScrollArea className="h-48 rounded-lg border border-border bg-background p-4">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-body leading-relaxed">
                {file.content_excerpt}
              </pre>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
