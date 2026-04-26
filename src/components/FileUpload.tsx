import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Loader2 } from "lucide-react";

interface FileUploadProps {
  onFilesUploaded: (files: File[]) => void;
  isProcessing: boolean;
  progress?: { current: number; total: number; currentName: string } | null;
}

export const FileUpload = ({ onFilesUploaded, isProcessing, progress }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files);
      if (dropped.length > 0) onFilesUploaded(dropped);
    },
    [onFilesUploaded]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        onFilesUploaded(Array.from(e.target.files));
        e.target.value = "";
      }
    },
    [onFilesUploaded]
  );

  const pct = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative block w-full cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 overflow-hidden
          ${isDragging
            ? "border-primary bg-primary/5 glow-primary-strong"
            : "border-border hover:border-primary/50 hover:bg-card/50"}
          ${isProcessing ? "pointer-events-none opacity-90" : ""}`}
      >
        {isProcessing && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-x-0 h-0.5 bg-primary/40 animate-pulse" />
          </div>
        )}

        <input
          type="file"
          multiple
          accept=".txt,.pdf,.md,.docx,.csv,.json"
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center gap-3">
          {isProcessing ? (
            <>
              <Loader2 size={36} className="text-primary animate-spin" />
              <p className="font-display text-sm font-medium text-primary">
                Uploading {progress?.current}/{progress?.total}: {progress?.currentName}
              </p>
              <div className="w-full max-w-sm h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  className="h-full gradient-primary"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Files appear instantly — AI classification continues in the background
              </p>
            </>
          ) : (
            <>
              <div className="rounded-full p-3 bg-primary/10 border border-primary/20">
                <Upload size={24} className="text-primary" />
              </div>
              <div>
                <p className="font-display text-sm font-medium text-foreground">
                  Drop files here or click to upload
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports PDF, DOCX, TXT, MD, CSV, JSON
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-1 justify-center">
                {["PDF", "DOCX", "TXT", "MD", "CSV"].map((ext) => (
                  <span
                    key={ext}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                  >
                    <FileText size={12} /> {ext}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </label>
    </motion.div>
  );
};
