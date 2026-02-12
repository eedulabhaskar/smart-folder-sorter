import type { AnalyzedFile } from "@/types/file";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X, Tag, FolderOpen, Sparkles } from "lucide-react";

interface AIExplanationProps {
  file: AnalyzedFile | null;
  onClose: () => void;
}

export const AIExplanation = ({ file, onClose }: AIExplanationProps) => {
  if (!file) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="rounded-xl border border-primary/20 bg-primary/5 p-4 relative overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-md hover:bg-secondary text-muted-foreground"
        >
          <X size={14} />
        </button>

        <div className="relative space-y-3">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-primary" />
            <h3 className="font-display text-sm font-semibold text-primary">AI Classification Explanation</h3>
          </div>

          <p className="text-sm text-foreground leading-relaxed">
            <Sparkles size={13} className="inline text-primary mr-1" />
            This file was classified as{" "}
            <span className="font-semibold text-primary">{file.category}</span> because
            the following keywords were detected in its content:
          </p>

          <div className="flex flex-wrap gap-1.5">
            {file.keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs text-primary"
              >
                <Tag size={10} />
                {kw}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <FolderOpen size={12} />
            <span>
              File <span className="font-medium text-foreground">{file.name}</span> →{" "}
              <span className="text-primary">/{file.category}/</span>
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
