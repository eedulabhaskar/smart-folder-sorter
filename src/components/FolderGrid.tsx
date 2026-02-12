import { motion } from "framer-motion";
import type { SemanticFolder, FileCategory } from "@/types/file";
import { FileText, ArrowRight } from "lucide-react";

interface FolderGridProps {
  folders: SemanticFolder[];
  onSelectFolder: (folder: FileCategory) => void;
}

export const FolderGrid = ({ folders, onSelectFolder }: FolderGridProps) => {
  if (folders.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">📂</div>
        <p className="font-display text-sm text-muted-foreground">
          Upload files to see them organized into semantic folders
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-display font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Organized Folders
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {folders.map((folder, i) => (
          <motion.button
            key={folder.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelectFolder(folder.name)}
            className="group relative rounded-xl border border-border bg-card p-5 text-left
              transition-all duration-300 hover:border-primary/40 hover:glow-primary
              overflow-hidden"
          >
            {/* Subtle gradient overlay */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at 30% 30%, hsl(${folder.color} / 0.06), transparent 70%)`,
              }}
            />

            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{folder.icon}</span>
                <ArrowRight
                  size={16}
                  className="text-muted-foreground opacity-0 group-hover:opacity-100 
                    group-hover:translate-x-0 -translate-x-2 transition-all"
                />
              </div>

              <h3 className="font-display font-semibold text-foreground mb-1">
                {folder.name}
              </h3>

              <div className="flex items-center gap-1.5 text-muted-foreground">
                <FileText size={13} />
                <span className="text-sm">
                  {folder.files.length} {folder.files.length === 1 ? "file" : "files"}
                </span>
              </div>

              {/* Preview of file names */}
              {folder.files.length > 0 && (
                <div className="mt-3 space-y-1">
                  {folder.files.slice(0, 3).map((f) => (
                    <p
                      key={f.id}
                      className="text-xs text-muted-foreground truncate"
                    >
                      • {f.name}
                    </p>
                  ))}
                  {folder.files.length > 3 && (
                    <p className="text-xs text-primary">
                      +{folder.files.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
