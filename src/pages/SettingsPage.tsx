import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { changePassword } from "@/lib/auth";
import { motion } from "framer-motion";
import { Settings, Lock, Trash2, Cloud, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState("");

  const handleChangePassword = () => {
    setPwError("");
    if (!currentPw || !newPw) {
      setPwError("Please fill in both fields.");
      return;
    }
    if (newPw.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    const result = changePassword(currentPw, newPw);
    if (result.error) {
      setPwError(result.error);
    } else {
      setCurrentPw("");
      setNewPw("");
      toast({ title: "Password Changed", description: "Your password has been updated." });
    }
  };

  const handleClearData = () => {
    if (!user) return;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("sfo_files_") || key?.startsWith("sfo_activity_")) {
        keys.push(key);
      }
    }
    keys.forEach((k) => localStorage.removeItem(k));
    toast({
      title: "Data Cleared",
      description: "All file data and activity history have been removed. Refresh to see changes.",
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Settings size={24} className="text-primary" /> Settings
        </h1>
      </motion.div>

      {/* Change password */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-border bg-card p-6 space-y-4"
      >
        <h2 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
          <Lock size={16} className="text-primary" /> Change Password
        </h2>

        {pwError && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle size={14} /> {pwError}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="currentPw">Current Password</Label>
          <Input
            id="currentPw"
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPw">New Password</Label>
          <Input
            id="newPw"
            type="password"
            placeholder="Min. 6 characters"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
          />
        </div>
        <Button onClick={handleChangePassword} className="gap-2">
          <Lock size={14} /> Update Password
        </Button>
      </motion.div>

      {/* Cloud sync info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-6 space-y-3"
      >
        <h2 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
          <Cloud size={16} className="text-primary" /> Cloud Sync
        </h2>
        <p className="text-sm text-muted-foreground">
          Your files and activity are saved locally in browser storage and automatically restored
          when you log in. This simulates cloud sync for the hackathon prototype.
        </p>
        <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-primary">
          <Cloud size={14} />
          <span>Auto-sync is active — data persists across sessions</span>
        </div>
      </motion.div>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border border-destructive/20 bg-card p-6 space-y-3"
      >
        <h2 className="font-display text-sm font-semibold text-destructive flex items-center gap-2">
          <Trash2 size={16} /> Danger Zone
        </h2>
        <p className="text-sm text-muted-foreground">
          Clear all stored file data and activity history. This action cannot be undone.
        </p>
        <Button variant="destructive" onClick={handleClearData} className="gap-2">
          <Trash2 size={14} /> Clear All Data
        </Button>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
