import { useAuth } from "@/contexts/AuthContext";
import { useFiles } from "@/contexts/FileContext";
import { getActivities } from "@/lib/storage";
import { formatFileSize } from "@/lib/fileAnalyzer";
import { StatsBar } from "@/components/StatsBar";
import { motion } from "framer-motion";
import { Upload, FileText, FolderOpen, Clock, TrendingUp, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";

const DashboardPage = () => {
  const { user } = useAuth();
  const { files, folders } = useFiles();

  const activities = useMemo(
    () => (user ? getActivities(user.id).slice(0, 8) : []),
    [user, files.length]
  );

  // Weekly stats (mock based on actual data)
  const todayFiles = files.filter(
    (f) => new Date(f.uploadedAt).toDateString() === new Date().toDateString()
  ).length;

  const topCategory = folders
    .filter((f) => f.files.length > 0)
    .sort((a, b) => b.files.length - a.files.length)[0];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Welcome back, <span className="text-gradient-primary">{user?.name?.split(" ")[0]}</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here's your file organization summary
        </p>
      </motion.div>

      {/* Stats */}
      <StatsBar files={files} folders={folders} />

      {/* Quick actions + summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1 rounded-xl border border-border bg-card p-5 space-y-4"
        >
          <h2 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" /> Quick Summary
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Today's uploads</span>
              <span className="font-display font-bold text-foreground">{todayFiles}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total files</span>
              <span className="font-display font-bold text-foreground">{files.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Categories used</span>
              <span className="font-display font-bold text-foreground">
                {folders.filter((f) => f.files.length > 0).length}
              </span>
            </div>
            {topCategory && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Top category</span>
                <span className="font-display font-bold text-primary">
                  {topCategory.icon} {topCategory.name}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Storage used</span>
              <span className="font-display font-bold text-foreground">
                {formatFileSize(files.reduce((a, f) => a + f.size, 0))}
              </span>
            </div>
          </div>

          <Link
            to="/upload"
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Upload size={16} /> Upload Files
          </Link>
        </motion.div>

        {/* Recent activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card p-5"
        >
          <h2 className="font-display text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <Activity size={16} className="text-primary" /> Recent Activity
          </h2>

          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No activity yet. Upload some files to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center gap-3 rounded-lg bg-secondary/30 px-3 py-2.5"
                >
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      <span className="font-medium">{act.fileName}</span>
                      <span className="text-muted-foreground"> → </span>
                      <span className="text-primary">{act.category}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(act.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Folder overview */}
      {folders.filter((f) => f.files.length > 0).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <FolderOpen size={16} className="text-primary" /> Folder Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {folders
              .filter((f) => f.files.length > 0)
              .map((folder) => (
                <div
                  key={folder.name}
                  className="rounded-lg border border-border bg-card p-3 text-center hover:border-primary/30 transition-colors"
                >
                  <span className="text-2xl block">{folder.icon}</span>
                  <p className="text-xs font-medium text-foreground mt-1">{folder.name}</p>
                  <p className="text-xs text-muted-foreground">{folder.files.length} files</p>
                </div>
              ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardPage;
