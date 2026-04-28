/**
 * AI Search page — natural-language semantic search over user files.
 * Calls the `semantic-search` edge function and renders ranked results.
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFiles } from "@/contexts/FileContext";
import { Search, Loader2, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { FilePreview } from "@/components/FilePreview";
import type { AnalyzedFile } from "@/types/file";

interface SearchHit {
  fileId: string;
  score: number;
  reason?: string;
}

const SearchPage = () => {
  const { files } = useFiles();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [preview, setPreview] = useState<AnalyzedFile | null>(null);

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("semantic-search", {
        body: { query },
      });
      if (error) throw error;
      setHits((data?.results as SearchHit[]) ?? []);
    } catch (err) {
      toast({
        title: "Search failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resolved = hits
    .map((h) => ({ hit: h, file: files.find((f) => f.id === h.fileId) }))
    .filter((r): r is { hit: SearchHit; file: AnalyzedFile } => Boolean(r.file));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">AI Search</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ask in natural language — e.g. "find invoices from last month".
        </p>
      </motion.div>

      <form onSubmit={runSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you looking for?"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Search"}
        </button>
      </form>

      <div className="space-y-2">
        {!loading && resolved.length === 0 && hits.length === 0 && (
          <p className="text-sm text-muted-foreground">Run a search to see results.</p>
        )}
        {resolved.map(({ hit, file }) => (
          <button
            key={file.id}
            onClick={() => setPreview(file)}
            className="w-full text-left p-3 rounded-lg border border-border bg-card hover:border-primary transition-colors"
          >
            <div className="flex items-start gap-3">
              <FileText size={18} className="text-primary mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{file.category_name}</span>
                  <span className="ml-auto text-xs text-primary">{Math.round(hit.score * 100)}%</span>
                </div>
                {hit.reason && (
                  <p className="text-xs text-muted-foreground mt-1">{hit.reason}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <FilePreview file={preview} onClose={() => setPreview(null)} />
    </div>
  );
};

export default SearchPage;
