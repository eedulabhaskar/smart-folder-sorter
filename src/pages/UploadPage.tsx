import { useState } from "react";
import { useFiles } from "@/contexts/FileContext";
import { FileUpload } from "@/components/FileUpload";
import { FolderGrid } from "@/components/FolderGrid";
import { FileList } from "@/components/FileList";
import { FilePreview } from "@/components/FilePreview";
import { AIExplanation } from "@/components/AIExplanation";
import { SearchBar } from "@/components/SearchBar";
import { motion } from "framer-motion";
import type { AnalyzedFile, FileCategory } from "@/types/file";

const UploadPage = () => {
  const { files, folders, folderMeta, isProcessing, uploadFiles } = useFiles();
  const [selectedFolder, setSelectedFolder] = useState<FileCategory | null>(null);
  const [previewFile, setPreviewFile] = useState<AnalyzedFile | null>(null);
  const [explanationFile, setExplanationFile] = useState<AnalyzedFile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleFileClick = (file: AnalyzedFile) => {
    setPreviewFile(file);
    setExplanationFile(file);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Upload & Organize</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload files and watch them get auto-categorized
        </p>
      </motion.div>

      <FileUpload onFilesUploaded={uploadFiles} isProcessing={isProcessing} />

      {files.length > 0 && (
        <div className="w-full max-w-md">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      )}

      {/* AI Explanation panel */}
      <AIExplanation file={explanationFile} onClose={() => setExplanationFile(null)} />

      {selectedFolder ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setSelectedFolder(null)}
              className="text-sm text-primary hover:underline"
            >
              ← All Folders
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="text-2xl">{folderMeta[selectedFolder]?.icon}</span>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {selectedFolder}
            </h2>
            <span className="text-sm text-muted-foreground ml-2">
              ({activeFiles.length} files)
            </span>
          </div>
          <FileList files={activeFiles} onPreview={handleFileClick} />
        </motion.div>
      ) : (
        <FolderGrid
          folders={folders.filter((f) => f.files.length > 0)}
          onSelectFolder={setSelectedFolder}
        />
      )}

      <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
};

export default UploadPage;
