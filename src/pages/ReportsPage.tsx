import { useFiles } from "@/contexts/FileContext";
import { formatFileSize } from "@/lib/fileAnalyzer";
import { motion } from "framer-motion";
import { BarChart3, Download, FileText, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FileCategory } from "@/types/file";

const ReportsPage = () => {
  const { files, folders, folderMeta } = useFiles();

  const totalSize = files.reduce((a, f) => a + f.size, 0);
  const activeFolders = folders.filter((f) => f.files.length > 0);

  // Generate CSV content
  const exportCSV = () => {
    const header = "File Name,Category,Size (bytes),Upload Date,Keywords\n";
    const rows = files
      .map(
        (f) =>
          `"${f.name}","${f.category}",${f.size},"${new Date(f.uploadedAt).toISOString()}","${f.keywords.join("; ")}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sfo-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate text report for download
  const exportReport = () => {
    let report = "SEMANTIC FILE ORGANIZER - REPORT\n";
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += "=".repeat(50) + "\n\n";
    report += `Total Files: ${files.length}\n`;
    report += `Total Size: ${formatFileSize(totalSize)}\n`;
    report += `Categories Used: ${activeFolders.length}\n\n`;
    report += "CATEGORY BREAKDOWN:\n";
    report += "-".repeat(30) + "\n";
    activeFolders.forEach((f) => {
      report += `\n${f.icon} ${f.name} (${f.files.length} files)\n`;
      f.files.forEach((file) => {
        report += `  • ${file.name} - ${formatFileSize(file.size)} - Keywords: ${file.keywords.slice(0, 5).join(", ")}\n`;
      });
    });
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sfo-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate max for bar chart
  const maxFiles = Math.max(...activeFolders.map((f) => f.files.length), 1);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <BarChart3 size={24} className="text-primary" /> Reports
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View statistics and export your data
        </p>
      </motion.div>

      {files.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <PieChart size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm font-display">Upload files first to generate reports</p>
        </div>
      ) : (
        <>
          {/* Export buttons */}
          <div className="flex gap-3">
            <Button onClick={exportCSV} variant="outline" className="gap-2">
              <Download size={16} /> Export CSV
            </Button>
            <Button onClick={exportReport} variant="outline" className="gap-2">
              <FileText size={16} /> Export Report
            </Button>
          </div>

          {/* Category bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="font-display text-sm font-semibold text-foreground mb-4">
              Files per Category
            </h2>
            <div className="space-y-3">
              {(Object.keys(folderMeta) as FileCategory[]).map((cat) => {
                const count = folders.find((f) => f.name === cat)?.files.length || 0;
                if (count === 0) return null;
                const pct = (count / maxFiles) * 100;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-foreground flex items-center gap-1.5 flex-shrink-0">
                      <span>{folderMeta[cat].icon}</span> {cat}
                    </span>
                    <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="h-full rounded-full gradient-primary"
                      />
                    </div>
                    <span className="text-sm font-display font-bold text-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Summary table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="font-display text-sm font-semibold text-foreground mb-4">
              Summary Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <p className="text-2xl font-display font-bold text-foreground">{files.length}</p>
                <p className="text-xs text-muted-foreground">Total Files</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <p className="text-2xl font-display font-bold text-foreground">{activeFolders.length}</p>
                <p className="text-xs text-muted-foreground">Categories</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <p className="text-2xl font-display font-bold text-foreground">
                  {formatFileSize(totalSize)}
                </p>
                <p className="text-xs text-muted-foreground">Total Size</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <p className="text-2xl font-display font-bold text-foreground">
                  {new Set(files.flatMap((f) => f.keywords)).size}
                </p>
                <p className="text-xs text-muted-foreground">Unique Keywords</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
