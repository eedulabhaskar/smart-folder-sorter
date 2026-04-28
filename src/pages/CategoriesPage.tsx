/**
 * Categories page — manage semantic folders (create, rename, delete, merge).
 */
import { useState } from "react";
import { useFiles } from "@/contexts/FileContext";
import { Plus, Pencil, Trash2, GitMerge, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const CategoriesPage = () => {
  const { categories, files, createCategory, renameCategory, deleteCategory, mergeCategories } = useFiles();
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [mergeSource, setMergeSource] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await createCategory(newName);
    if (res.error) {
      toast({ title: "Failed", description: res.error, variant: "destructive" });
    } else {
      toast({ title: "Category created" });
      setNewName("");
    }
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const res = await renameCategory(editingId, editName);
    if (res.error) {
      toast({ title: "Rename failed", description: res.error, variant: "destructive" });
    } else {
      toast({ title: "Renamed" });
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Files inside will move to Others.`)) return;
    await deleteCategory(id);
    toast({ title: "Category deleted" });
  };

  const handleMergeTarget = async (targetId: string) => {
    if (!mergeSource || mergeSource === targetId) {
      setMergeSource(null);
      return;
    }
    await mergeCategories(mergeSource, targetId);
    toast({ title: "Categories merged" });
    setMergeSource(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Categories</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create, rename, merge, or delete your semantic folders.
        </p>
      </motion.div>

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2"
        >
          <Plus size={16} /> Add
        </button>
      </form>

      {mergeSource && (
        <div className="p-3 rounded-lg border border-primary bg-primary/5 text-sm text-foreground">
          Select a target category to merge into. <button onClick={() => setMergeSource(null)} className="text-primary underline ml-1">Cancel</button>
        </div>
      )}

      <div className="space-y-2">
        {categories.map((cat) => {
          const count = files.filter((f) => f.category_name === cat.name).length;
          const isEditing = editingId === cat.id;
          const isMergeSrc = mergeSource === cat.id;
          return (
            <div
              key={cat.id}
              className={`p-3 rounded-lg border bg-card flex items-center gap-3 transition-colors ${
                isMergeSrc ? "border-primary" : "border-border"
              }`}
            >
              <span className="text-xl">{cat.icon}</span>
              {isEditing ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-2 py-1 rounded bg-background border border-border text-sm"
                  autoFocus
                />
              ) : (
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{cat.name}</div>
                  <div className="text-xs text-muted-foreground">{count} file{count !== 1 ? "s" : ""}</div>
                </div>
              )}
              <div className="flex items-center gap-1">
                {isEditing ? (
                  <>
                    <button onClick={saveEdit} className="p-2 rounded hover:bg-secondary text-primary">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-2 rounded hover:bg-secondary text-muted-foreground">
                      <X size={16} />
                    </button>
                  </>
                ) : mergeSource ? (
                  <button
                    onClick={() => handleMergeTarget(cat.id)}
                    disabled={isMergeSrc}
                    className="px-3 py-1.5 rounded text-xs bg-primary text-primary-foreground disabled:opacity-30"
                  >
                    {isMergeSrc ? "Source" : "Merge into"}
                  </button>
                ) : (
                  <>
                    <button onClick={() => startEdit(cat.id, cat.name)} title="Rename" className="p-2 rounded hover:bg-secondary text-muted-foreground">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => setMergeSource(cat.id)} title="Merge" className="p-2 rounded hover:bg-secondary text-muted-foreground">
                      <GitMerge size={16} />
                    </button>
                    <button onClick={() => handleDelete(cat.id, cat.name)} title="Delete" className="p-2 rounded hover:bg-destructive/10 text-destructive">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoriesPage;
