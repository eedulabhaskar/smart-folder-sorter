import { useFiles } from "@/contexts/FileContext";
import { formatFileSize } from "@/lib/fileAnalyzer";
import { motion } from "framer-motion";
import { BarChart3, Download, FileText, PieChart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const ReportsPage = () => {
  const { files, folders, categories } = useFiles();
  const { toast } = useToast();
  const [zipping, setZipping] = useState(false);

  const totalSize = files.reduce((a, f) => a + f.size, 0);
  const activeFolders = folders.filter((f) => f.files.length > 0);

  const exportCSV = () => {
    const header = "File Name,Category,Confidence,Size (bytes),Upload Date,Keywords,Summary\n";
    const rows = files
      .map((f) => {
        const esc = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
        return `${esc(f.name)},${esc(f.category_name)},${f.confidence},${f.size},${esc(new Date(f.created_at).toISOString())},${esc(f.keywords.join("; "))},${esc(f.summary || "")}`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    triggerDownload(blob, `sfo-report-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportReport = () => {
    let report = "SEMANTIC FILE ORGANIZER - REPORT\n";
    report += `Generated: ${new Date().toLocaleString()}\n${"=".repeat(50)}\n\n`;
    report += `Total Files: ${files.length}\nTotal Size: ${formatFileSize(totalSize)}\nCategories Used: ${activeFolders.length}\n\n`;
    report += "CATEGORY BREAKDOWN:\n" + "-".repeat(30) + "\n";
    activeFolders.forEach((f) => {
      report += `\n${f.icon} ${f.name} (${f.files.length} files)\n`;
      f.files.forEach((file) => {
        report += `  • ${file.name} - ${formatFileSize(file.size)} - ${file.confidence}% - ${file.keywords.slice(0, 5).join(", ")}\n`;
        if (file.summary) report += `      ${file.summary}\n`;
      });
    });
    triggerDownload(new Blob([report], { type: "text/plain" }), `sfo-report-${new Date().toISOString().slice(0, 10)}.txt`);
  };

  /** Download all files as a single ZIP organized by category folders. */
  const exportZip = async () => {
    if (files.length === 0) return;
    setZipping(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      let downloaded = 0;
      for (const file of files) {
        const folderName = sanitize(file.category_name);
        const fileName = sanitize(file.name);
        const { data, error } = await supabase.storage
          .from("user-files")
          .createSignedUrl(file.storage_path, 60);
        if (error || !data) continue;
        const resp = await fetch(data.signedUrl);
        const blob = await resp.blob();
        zip.folder(folderName)?.file(fileName, blob);
        downloaded++;
      }

      // Add a manifest
      const manifest = files
        .map(
          (f) =>
            `${f.category_name}/${f.name}\n  Confidence: ${f.confidence}%\n  Keywords: ${f.keywords.join(", ")}\n  Summary: ${f.summary || "—"}\n`
        )
        .join("\n");
      zip.file("manifest.txt", manifest);

      const out = await zip.generateAsync({ type: "blob" });
      triggerDownload(out, `semantic-files-${new Date().toISOString().slice(0, 10)}.zip`);
      toast({ title: "Export complete", description: `${downloaded} files packaged.` });
    } catch (e) {
      console.error(e);
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setZipping(false);
    }
  };

  const maxFiles = Math.max(...activeFolders.map((f) => f.files.length), 1);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <BarChart3 size={24} className="text-primary" /> Reports & Export
        </h1>
        <p className="text-sm text-muted-foreground mt-1">View statistics and export your data</p>
      </motion.div>

      {files.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <PieChart size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm font-display">Upload files first to generate reports</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <Button onClick={exportCSV} variant="outline" className="gap-2">
              <Download size={16} /> Export CSV
            </Button>
            <Button onClick={exportReport} variant="outline" className="gap-2">
              <FileText size={16} /> Export Text Report
            </Button>
            <Button onClick={exportZip} className="gap-2" disabled={zipping}>
              <Package size={16} />
              {zipping ? "Building ZIP…" : "Download organized ZIP"}
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="font-display text-sm font-semibold text-foreground mb-4">Files per Category</h2>
            <div className="space-y-3">
              {categories.map((cat) => {
                const count = folders.find((f) => f.id === cat.id)?.files.length || 0;
                if (count === 0) return null;
                const pct = (count / maxFiles) * 100;
                return (
                  <div key={cat.id} className="flex items-center gap-3">
                    <span className="w-32 text-sm text-foreground flex items-center gap-1.5 flex-shrink-0">
                      <span>{cat.icon}</span>
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="h-full rounded-full gradient-primary"
                      />
                    </div>
                    <span className="text-sm font-display font-bold text-foreground w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="font-display text-sm font-semibold text-foreground mb-4">Summary Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Total Files" value={files.length} />
              <Stat label="Categories" value={activeFolders.length} />
              <Stat label="Total Size" value={formatFileSize(totalSize)} />
              <Stat
                label="Avg Confidence"
                value={
                  files.length
                    ? `${Math.round(
                        files.filter((f) => f.status === "done").reduce((a, f) => a + f.confidence, 0) /
                          Math.max(files.filter((f) => f.status === "done").length, 1)
                      )}%`
                    : "—"
                }
              />
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="p-3 rounded-lg bg-secondary/30 text-center">
    <p className="text-2xl font-display font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const sanitize = (s: string) => s.replace(/[/\\?%*:|"<>]/g, "_").trim() || "Untitled";

export default ReportsPage;
