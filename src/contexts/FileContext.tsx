/**
 * FileContext — central store for files, categories, and activity.
 *
 * Reads/writes through Supabase. Handles file uploads:
 *   1. Extract text in the browser (PDF, DOCX, TXT, MD).
 *   2. Upload the original file to Storage (bucket `user-files`).
 *   3. Insert a row in `files` with status=pending.
 *   4. Call the `analyze-file` edge function with the extracted text.
 *   5. Edge function classifies + summarizes via Lovable AI and updates the row.
 *
 * Realtime subscriptions keep the UI in sync as edge function updates land.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { extractText } from "@/lib/fileAnalyzer";
import type { AnalyzedFile, Category, SemanticFolder, ActivityEntry } from "@/types/file";

interface FileContextType {
  files: AnalyzedFile[];
  categories: Category[];
  folders: SemanticFolder[];
  activities: ActivityEntry[];
  isLoading: boolean;
  isProcessing: boolean;
  uploadProgress: { current: number; total: number; currentName: string } | null;
  uploadFiles: (newFiles: File[]) => Promise<void>;
  removeFile: (id: string) => Promise<void>;
  reassignFile: (id: string, categoryName: string) => Promise<void>;
  createCategory: (name: string, icon?: string) => Promise<{ error?: string }>;
  renameCategory: (id: string, newName: string) => Promise<{ error?: string }>;
  deleteCategory: (id: string) => Promise<void>;
  mergeCategories: (sourceId: string, targetId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const FileContext = createContext<FileContextType | null>(null);

const SAFE_EMOJIS = ["📁", "📂", "📊", "📌", "🗂️", "📎", "🏷️", "✨", "🔖", "🎯"];

export function FileProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const { toast } = useToast();

  const [files, setFiles] = useState<AnalyzedFile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<
    { current: number; total: number; currentName: string } | null
  >(null);

  // Build folders from categories + files.
  const folders: SemanticFolder[] = categories.map((c) => ({
    ...c,
    files: files.filter((f) => f.category_name === c.name),
  }));

  /** Fetch files, categories, and activity for the current user. */
  const refresh = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [filesRes, catsRes, actsRes] = await Promise.all([
        supabase.from("files").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name", { ascending: true }),
        supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(50),
      ]);
      if (filesRes.data) setFiles(filesRes.data as AnalyzedFile[]);
      if (catsRes.data) setCategories(catsRes.data as Category[]);
      if (actsRes.data) setActivities(actsRes.data as ActivityEntry[]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setFiles([]);
      setCategories([]);
      setActivities([]);
      setIsLoading(false);
    }
  }, [user, refresh]);

  // Realtime subscription so AI updates appear automatically.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`files-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "files", filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setFiles((prev) =>
              prev.find((f) => f.id === (payload.new as AnalyzedFile).id)
                ? prev
                : [payload.new as AnalyzedFile, ...prev]
            );
          } else if (payload.eventType === "UPDATE") {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === (payload.new as AnalyzedFile).id ? (payload.new as AnalyzedFile) : f
              )
            );
          } else if (payload.eventType === "DELETE") {
            setFiles((prev) => prev.filter((f) => f.id !== (payload.old as AnalyzedFile).id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_log", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setActivities((prev) => [payload.new as ActivityEntry, ...prev].slice(0, 50));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  /** Upload a single file: store, insert row, trigger AI. */
  const uploadOne = useCallback(
    async (file: File): Promise<void> => {
      if (!user || !session) throw new Error("Not authenticated");

      // 1. Extract text on the client.
      const text = await extractText(file);

      // 2. Upload original file to user's folder in storage.
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${user.id}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("user-files")
        .upload(storagePath, file, { upsert: false, contentType: file.type || undefined });
      if (upErr) throw upErr;

      // 3. Insert pending row.
      const { data: row, error: insErr } = await supabase
        .from("files")
        .insert({
          user_id: user.id,
          name: file.name,
          size: file.size,
          mime_type: file.type || null,
          storage_path: storagePath,
          status: "pending",
          content_excerpt: text.slice(0, 2000),
        })
        .select()
        .single();
      if (insErr || !row) throw insErr ?? new Error("Insert failed");

      // 4. Call edge function — fire-and-forget so multi-file batches stay parallel.
      const availableCategories = categories.map((c) => c.name);
      supabase.functions
        .invoke("analyze-file", {
          body: {
            fileId: row.id,
            text,
            fileName: file.name,
            availableCategories,
          },
        })
        .then(({ error }) => {
          if (error) {
            console.error("analyze-file error:", error);
            toast({
              title: "Analysis failed",
              description: `${file.name}: ${error.message}`,
              variant: "destructive",
            });
          }
        });
    },
    [user, session, categories, toast]
  );

  const uploadFiles = useCallback(
    async (newFiles: File[]) => {
      if (!user) return;
      if (newFiles.length === 0) return;
      setIsProcessing(true);
      setUploadProgress({ current: 0, total: newFiles.length, currentName: newFiles[0].name });
      let success = 0;
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        setUploadProgress({ current: i + 1, total: newFiles.length, currentName: file.name });
        try {
          await uploadOne(file);
          success++;
        } catch (e) {
          console.error("Upload failed:", file.name, e);
          toast({
            title: "Upload failed",
            description: `${file.name}: ${e instanceof Error ? e.message : "Unknown error"}`,
            variant: "destructive",
          });
        }
      }
      setIsProcessing(false);
      setUploadProgress(null);
      if (success > 0) {
        toast({
          title: "Upload complete",
          description: `${success} file${success > 1 ? "s" : ""} uploaded — AI is classifying them now.`,
        });
      }
    },
    [user, uploadOne, toast]
  );

  const removeFile = useCallback(
    async (id: string) => {
      if (!user) return;
      const file = files.find((f) => f.id === id);
      if (!file) return;
      // Best-effort storage cleanup
      await supabase.storage.from("user-files").remove([file.storage_path]);
      const { error } = await supabase.from("files").delete().eq("id", id);
      if (error) {
        toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      } else {
        await supabase.from("activity_log").insert({
          user_id: user.id,
          action: "delete_file",
          description: `Deleted "${file.name}"`,
        });
      }
    },
    [user, files, toast]
  );

  const reassignFile = useCallback(
    async (id: string, categoryName: string) => {
      if (!user) return;
      const cat = categories.find((c) => c.name === categoryName);
      const { error } = await supabase
        .from("files")
        .update({ category_name: categoryName, category_id: cat?.id ?? null })
        .eq("id", id);
      if (error) {
        toast({ title: "Update failed", description: error.message, variant: "destructive" });
        return;
      }
      const file = files.find((f) => f.id === id);
      await supabase.from("activity_log").insert({
        user_id: user.id,
        action: "reassign",
        description: `Moved "${file?.name ?? "file"}" to ${categoryName}`,
      });
    },
    [user, categories, files, toast]
  );

  const createCategory = useCallback(
    async (name: string, icon?: string) => {
      if (!user) return { error: "Not authenticated" };
      const trimmed = name.trim();
      if (!trimmed) return { error: "Name is required" };
      const chosenIcon = icon || SAFE_EMOJIS[Math.floor(Math.random() * SAFE_EMOJIS.length)];
      const { error } = await supabase.from("categories").insert({
        user_id: user.id,
        name: trimmed,
        icon: chosenIcon,
        color: "215 12% 50%",
        is_default: false,
      });
      if (error) return { error: error.message };
      await supabase.from("activity_log").insert({
        user_id: user.id,
        action: "create_category",
        description: `Created category "${trimmed}"`,
      });
      return {};
    },
    [user]
  );

  const renameCategory = useCallback(
    async (id: string, newName: string) => {
      if (!user) return { error: "Not authenticated" };
      const trimmed = newName.trim();
      if (!trimmed) return { error: "Name required" };
      const old = categories.find((c) => c.id === id);
      if (!old) return { error: "Category not found" };
      const { error: catErr } = await supabase
        .from("categories")
        .update({ name: trimmed })
        .eq("id", id);
      if (catErr) return { error: catErr.message };
      // Cascade rename to files using the legacy name string.
      await supabase
        .from("files")
        .update({ category_name: trimmed })
        .eq("user_id", user.id)
        .eq("category_name", old.name);
      await supabase.from("activity_log").insert({
        user_id: user.id,
        action: "rename_category",
        description: `Renamed "${old.name}" to "${trimmed}"`,
      });
      return {};
    },
    [user, categories]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      if (!user) return;
      const cat = categories.find((c) => c.id === id);
      if (!cat) return;
      // Move any files in this category to "Others" (or first available default).
      const fallback = categories.find((c) => c.name === "Others") ?? categories[0];
      if (fallback && fallback.id !== id) {
        await supabase
          .from("files")
          .update({ category_name: fallback.name, category_id: fallback.id })
          .eq("user_id", user.id)
          .eq("category_name", cat.name);
      }
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) {
        toast({ title: "Delete failed", description: error.message, variant: "destructive" });
        return;
      }
      await supabase.from("activity_log").insert({
        user_id: user.id,
        action: "delete_category",
        description: `Deleted category "${cat.name}"`,
      });
    },
    [user, categories, toast]
  );

  const mergeCategories = useCallback(
    async (sourceId: string, targetId: string) => {
      if (!user || sourceId === targetId) return;
      const src = categories.find((c) => c.id === sourceId);
      const tgt = categories.find((c) => c.id === targetId);
      if (!src || !tgt) return;
      await supabase
        .from("files")
        .update({ category_name: tgt.name, category_id: tgt.id })
        .eq("user_id", user.id)
        .eq("category_name", src.name);
      await supabase.from("categories").delete().eq("id", sourceId);
      await supabase.from("activity_log").insert({
        user_id: user.id,
        action: "merge_category",
        description: `Merged "${src.name}" into "${tgt.name}"`,
      });
    },
    [user, categories]
  );

  return (
    <FileContext.Provider
      value={{
        files,
        categories,
        folders,
        activities,
        isLoading,
        isProcessing,
        uploadProgress,
        uploadFiles,
        removeFile,
        reassignFile,
        createCategory,
        renameCategory,
        deleteCategory,
        mergeCategories,
        refresh,
      }}
    >
      {children}
    </FileContext.Provider>
  );
}

export function useFiles() {
  const ctx = useContext(FileContext);
  if (!ctx) throw new Error("useFiles must be used within FileProvider");
  return ctx;
}
