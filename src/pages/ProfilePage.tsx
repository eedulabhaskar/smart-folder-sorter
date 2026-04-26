import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFiles } from "@/contexts/FileContext";
import { supabase } from "@/integrations/supabase/client";
import { formatFileSize } from "@/lib/fileAnalyzer";
import { motion } from "framer-motion";
import { User, Mail, Calendar, HardDrive, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { files } = useFiles();
  const { toast } = useToast();
  const [name, setName] = useState(profile?.name || "");
  const [saving, setSaving] = useState(false);

  const totalSize = files.reduce((a, f) => a + f.size, 0);

  const handleSave = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ name: name.trim() }).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      toast({ title: "Profile updated", description: "Your name has been updated." });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <User size={24} className="text-primary" /> Profile
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-2xl font-display font-bold text-primary-foreground">
            {(profile?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-display font-bold text-foreground">{profile?.name || "User"}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail size={13} /> {profile?.email}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Calendar size={12} /> Joined{" "}
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save size={16} /> {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <h2 className="font-display text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <HardDrive size={16} className="text-primary" /> Storage
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{files.length} files</span>
            <span className="font-display font-bold text-foreground">{formatFileSize(totalSize)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Files are securely stored in the cloud and only accessible to you.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
