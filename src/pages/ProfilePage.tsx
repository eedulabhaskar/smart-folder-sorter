import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFiles } from "@/contexts/FileContext";
import { updateProfile } from "@/lib/auth";
import { formatFileSize } from "@/lib/fileAnalyzer";
import { getStorageUsage } from "@/lib/storage";
import { motion } from "framer-motion";
import { User, Mail, Calendar, HardDrive, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const { files } = useFiles();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const storage = getStorageUsage();

  const handleSave = () => {
    if (!name.trim()) return;
    const updated = updateProfile({ name: name.trim() });
    if (updated) {
      setUser(updated);
      toast({ title: "Profile Updated", description: "Your name has been updated." });
    }
  };

  const storagePct = Math.min((storage.used / storage.total) * 100, 100);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <User size={24} className="text-primary" /> Profile
        </h1>
      </motion.div>

      {/* Avatar & info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-2xl font-display font-bold text-primary-foreground">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-display font-bold text-foreground">{user?.name}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail size={13} /> {user?.email}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Calendar size={12} /> Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <Button onClick={handleSave} className="gap-2">
            <Save size={16} /> Save Changes
          </Button>
        </div>
      </motion.div>

      {/* Storage usage */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <h2 className="font-display text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <HardDrive size={16} className="text-primary" /> Storage Usage
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {formatFileSize(storage.used)} of {formatFileSize(storage.total)} used
            </span>
            <span className="font-display font-bold text-foreground">{storagePct.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full gradient-primary transition-all"
              style={{ width: `${storagePct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {files.length} files stored locally
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
