import { useState, useMemo } from "react";
import { useFiles } from "@/contexts/FileContext";
import { formatFileSize } from "@/lib/fileAnalyzer";
import { SearchBar } from "@/components/SearchBar";
import { AIExplanation } from "@/components/AIExplanation";
import { motion } from "framer-motion";
import { History, FileText, ArrowUpDown, Eye } from "lucide-react";
import type { AnalyzedFile, FileCategory } from "@/types/file";

const HistoryPage = () => {
  const { files, folderMeta } = useFiles();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<FileCategory | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedFile, setSelectedFile] = useState<AnalyzedFile | null>(null);

  const filtered = useMemo(() => {
    let result = [...files];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          f.keywords.some((k) => k.includes(q))
      );
    }
    if (categoryFilter !== "all") {
      result = result.filter((f) => f.category === categoryFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date") cmp = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      else if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "size") cmp = a.size - b.size;
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [files, search, categoryFilter, sortBy, sortDir]);

  const toggleSort = (col: "date" | "name" | "size") => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("desc"); }
  };

  const categories = Object.keys(folderMeta) as FileCategory[];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <History size={24} className="text-primary" /> File History
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse all processed files with filters and sorting
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:max-w-xs">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as FileCategory | "all")}
          className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* AI Explanation */}
      <AIExplanation file={selectedFile} onClose={() => setSelectedFile(null)} />

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm font-display">
            {files.length === 0 ? "No files uploaded yet" : "No files match your filters"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th
                    className="px-4 py-3 text-left font-display font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("name")}
                  >
                    <span className="flex items-center gap-1">
                      File Name <ArrowUpDown size={12} />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left font-display font-semibold text-muted-foreground">
                    Category
                  </th>
                  <th
                    className="px-4 py-3 text-left font-display font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("date")}
                  >
                    <span className="flex items-center gap-1">
                      Date <ArrowUpDown size={12} />
                    </span>
                  </th>
                  <th
                    className="px-4 py-3 text-left font-display font-semibold text-muted-foreground cursor-pointer hover:text-foreground hidden sm:table-cell"
                    onClick={() => toggleSort("size")}
                  >
                    <span className="flex items-center gap-1">
                      Size <ArrowUpDown size={12} />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left font-display font-semibold text-muted-foreground hidden md:table-cell">
                    Keywords
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((file, i) => (
                  <motion.tr
                    key={file.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-primary flex-shrink-0" />
                        <span className="font-medium text-foreground truncate max-w-[200px]">
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs text-primary">
                        {folderMeta[file.category]?.icon} {file.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex gap-1">
                        {file.keywords.slice(0, 3).map((kw) => (
                          <span key={kw} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedFile(file)}
                        className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        title="View AI explanation"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
