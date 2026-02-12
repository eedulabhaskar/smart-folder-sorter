import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AnalyzedFile } from "@/types/file";
import { formatFileSize } from "@/lib/fileAnalyzer";
import { FileText, Tag, Clock, HardDrive, FolderOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FilePreviewProps {
  file: AnalyzedFile | null;
  onClose: () => void;
}

export const FilePreview = ({ file, onClose }: FilePreviewProps) => {
  if (!file) return null;

  return (
    <Dialog open={!!file} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            {file.name}
          </DialogTitle>
        </DialogHeader>

        {/* Metadata */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 bg-secondary rounded-full px-2.5 py-1">
            <HardDrive size={12} />
            {formatFileSize(file.size)}
          </span>
          <span className="flex items-center gap-1 bg-secondary rounded-full px-2.5 py-1">
            <Clock size={12} />
            {file.uploadedAt.toLocaleString()}
          </span>
          <span className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-1 border border-primary/20">
            <FolderOpen size={12} />
            {file.category}
          </span>
        </div>

        {/* Keywords */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 text-xs font-display text-muted-foreground uppercase tracking-wider">
            <Tag size={12} />
            Keywords
          </div>
          <div className="flex flex-wrap gap-1.5">
            {file.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Content preview */}
        <div>
          <p className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-2">
            Content Preview
          </p>
          <ScrollArea className="h-64 rounded-lg border border-border bg-background p-4">
            <pre className="text-sm text-foreground whitespace-pre-wrap font-body leading-relaxed">
              {file.content || "(No text content extracted)"}
            </pre>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
