import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Loader2 } from "lucide-react";

interface FileUploadProps {
  onFilesUploaded: (files: File[]) => void;
  isProcessing: boolean;
}

export const FileUpload = ({ onFilesUploaded, isProcessing }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        (f) =>
          f.type === "text/plain" ||
          f.type === "application/pdf" ||
          f.name.endsWith(".txt") ||
          f.name.endsWith(".md") ||
          f.name.endsWith(".pdf")
      );
      if (droppedFiles.length > 0) onFilesUploaded(droppedFiles);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative block w-full cursor-pointer rounded-xl border-2 border-dashed p-8 text-center
          transition-all duration-300 overflow-hidden
          ${
            isDragging
              ? "border-primary bg-primary/5 glow-primary-strong"
              : "border-border hover:border-primary/50 hover:bg-card/50"
          }
          ${isProcessing ? "pointer-events-none opacity-70" : ""}
        `}
      >
        {/* Scan line animation when processing */}
        {isProcessing && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-x-0 h-0.5 bg-primary/40 animate-scan-line" />
          </div>
        )}

        <input
          type="file"
          multiple
          accept=".txt,.pdf,.md"
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center gap-3">
          {isProcessing ? (
            <>
              <Loader2 size={36} className="text-primary animate-spin" />
              <p className="font-display text-sm font-medium text-primary">
                Analyzing files...
              </p>
              <p className="text-xs text-muted-foreground">
                Extracting text, detecting keywords & categorizing
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
                  Supports .txt, .md, and .pdf files
                </p>
              </div>
              <div className="flex gap-2 mt-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                  <FileText size={12} /> TXT
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                  <FileText size={12} /> PDF
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                  <FileText size={12} /> MD
                </span>
              </div>
            </>
          )}
        </div>
      </label>
    </motion.div>
  );
};
