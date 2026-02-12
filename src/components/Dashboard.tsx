import { useState, useCallback } from "react";
import type { AnalyzedFile, SemanticFolder, FileCategory } from "@/types/file";
import { analyzeFile } from "@/lib/fileAnalyzer";
import { FileUpload } from "@/components/FileUpload";
import { FolderSidebar } from "@/components/FolderSidebar";
import { FolderGrid } from "@/components/FolderGrid";
import { FileList } from "@/components/FileList";
import { FilePreview } from "@/components/FilePreview";
import { SearchBar } from "@/components/SearchBar";
import { StatsBar } from "@/components/StatsBar";
import { motion, AnimatePresence } from "framer-motion";
import { Folders, Menu, X } from "lucide-react";

const folderMeta: Record<FileCategory, { icon: string; color: string }> = {
  Education: { icon: "📚", color: "174 72% 50%" },
  Finance: { icon: "💰", color: "40 90% 55%" },
  Health: { icon: "🏥", color: "150 60% 45%" },
  Technology: { icon: "💻", color: "220 80% 60%" },
  Legal: { icon: "⚖️", color: "280 60% 60%" },
  Marketing: { icon: "📢", color: "340 70% 55%" },
  Science: { icon: "🔬", color: "200 70% 50%" },
  Others: { icon: "📁", color: "215 12% 50%" },
};

const Dashboard = () => {
  const [files, setFiles] = useState<AnalyzedFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FileCategory | null>(null);
  const [previewFile, setPreviewFile] = useState<AnalyzedFile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Build folders from analyzed files
  const folders: SemanticFolder[] = (Object.keys(folderMeta) as FileCategory[])
    .map((name) => ({
      name,
      icon: folderMeta[name].icon,
      color: folderMeta[name].color,
      files: files.filter((f) => f.category === name),
    }))
    .filter((f) => f.files.length > 0 || selectedFolder === f.name);

  // Handle file uploads
  const handleFilesUploaded = useCallback(async (newFiles: File[]) => {
    setIsProcessing(true);
    const analyzed: AnalyzedFile[] = [];

    for (const file of newFiles) {
      try {
        const result = await analyzeFile(file);
        analyzed.push(result);
        // Add files one by one for live update effect
        setFiles((prev) => [...prev, result]);
      } catch (error) {
        console.error(`Failed to analyze ${file.name}:`, error);
      }
    }

    setIsProcessing(false);
  }, []);

  // Filter files by search
  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      !searchQuery ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.keywords.some((k) => k.includes(searchQuery.toLowerCase())) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = !selectedFolder || f.category === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const activeFiles = selectedFolder
    ? filteredFiles.filter((f) => f.category === selectedFolder)
    : filteredFiles;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-secondary text-muted-foreground"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Folders size={18} className="text-primary-foreground" />
            </div>
            <h1 className="text-lg font-display font-bold text-gradient-primary">
              Semantic File Organizer
            </h1>
          </div>
        </div>
        <div className="hidden sm:block w-72">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || typeof window !== "undefined") && (
            <FolderSidebar
              folders={folders}
              selectedFolder={selectedFolder}
              onSelectFolder={(f) => {
                setSelectedFolder(f === selectedFolder ? null : f);
                setSidebarOpen(false);
              }}
              totalFiles={files.length}
              isOpen={sidebarOpen}
            />
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Mobile search */}
          <div className="sm:hidden">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          {/* Stats */}
          <StatsBar files={files} folders={folders} />

          {/* Upload area */}
          <FileUpload onFilesUploaded={handleFilesUploaded} isProcessing={isProcessing} />

          {/* Folder cards or file list */}
          {selectedFolder ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{folderMeta[selectedFolder].icon}</span>
                <h2 className="text-xl font-display font-semibold text-foreground">
                  {selectedFolder}
                </h2>
                <span className="text-sm text-muted-foreground ml-2">
                  ({activeFiles.length} files)
                </span>
              </div>
              <FileList
                files={activeFiles}
                onPreview={setPreviewFile}
              />
            </motion.div>
          ) : (
            <FolderGrid
              folders={folders}
              onSelectFolder={setSelectedFolder}
            />
          )}
        </main>
      </div>

      {/* File preview dialog */}
      <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
};

export default Dashboard;
