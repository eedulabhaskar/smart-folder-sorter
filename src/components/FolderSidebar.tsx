import { motion } from "framer-motion";
import type { SemanticFolder, FileCategory } from "@/types/file";
import { Folder, ChevronRight } from "lucide-react";

interface FolderSidebarProps {
  folders: SemanticFolder[];
  selectedFolder: FileCategory | null;
  onSelectFolder: (folder: FileCategory) => void;
  totalFiles: number;
  isOpen: boolean;
}

const allCategories: { name: FileCategory; icon: string }[] = [
  { name: "Education", icon: "📚" },
  { name: "Finance", icon: "💰" },
  { name: "Health", icon: "🏥" },
  { name: "Technology", icon: "💻" },
  { name: "Legal", icon: "⚖️" },
  { name: "Marketing", icon: "📢" },
  { name: "Science", icon: "🔬" },
  { name: "Others", icon: "📁" },
];

export const FolderSidebar = ({
  folders,
  selectedFolder,
  onSelectFolder,
  totalFiles,
  isOpen,
}: FolderSidebarProps) => {
  const folderFileCount = (name: FileCategory) =>
    folders.find((f) => f.name === name)?.files.length || 0;

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`
        w-64 border-r border-border bg-card/30 backdrop-blur-sm flex-shrink-0
        overflow-y-auto
        ${isOpen ? "fixed inset-y-0 left-0 z-40 pt-14" : "hidden lg:block"}
      `}
    >
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/60 z-[-1] lg:hidden"
          onClick={() => onSelectFolder(selectedFolder!)}
        />
      )}

      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Folder size={16} className="text-primary" />
          <span className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground">
            Semantic Folders
          </span>
        </div>

        {/* All files button */}
        <button
          onClick={() => onSelectFolder(selectedFolder!)}
          className={`
            w-full flex items-center justify-between rounded-lg px-3 py-2.5 mb-1
            text-sm transition-colors
            ${
              !selectedFolder
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }
          `}
        >
          <span className="flex items-center gap-2">
            <span>🗂️</span>
            <span className="font-medium">All Files</span>
          </span>
          <span className="text-xs bg-secondary rounded-full px-2 py-0.5">
            {totalFiles}
          </span>
        </button>

        <div className="h-px bg-border my-3" />

        {/* Category folders */}
        <div className="space-y-0.5">
          {allCategories.map((cat) => {
            const count = folderFileCount(cat.name);
            const isActive = selectedFolder === cat.name;

            return (
              <button
                key={cat.name}
                onClick={() => onSelectFolder(cat.name)}
                className={`
                  w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm
                  transition-all duration-200 group
                  ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20 glow-primary"
                      : count > 0
                      ? "text-foreground hover:bg-secondary"
                      : "text-muted-foreground/50 hover:bg-secondary/50 hover:text-muted-foreground"
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span className={isActive ? "font-semibold" : "font-medium"}>
                    {cat.name}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  {count > 0 && (
                    <span className="text-xs bg-secondary rounded-full px-2 py-0.5">
                      {count}
                    </span>
                  )}
                  {isActive && <ChevronRight size={14} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.aside>
  );
};
