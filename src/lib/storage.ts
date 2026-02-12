/**
 * Persist and restore user file data using localStorage.
 * Simulates cloud sync by saving analyzed file metadata.
 */

import type { AnalyzedFile } from "@/types/file";

const FILES_KEY_PREFIX = "sfo_files_";
const ACTIVITY_KEY_PREFIX = "sfo_activity_";

export interface ActivityEntry {
  id: string;
  action: string;
  fileName: string;
  category: string;
  timestamp: string;
}

/** Save files for a specific user */
export function saveUserFiles(userId: string, files: AnalyzedFile[]) {
  // Store metadata only (not the File object or full content for size reasons)
  const serializable = files.map((f) => ({
    id: f.id,
    name: f.name,
    size: f.size,
    type: f.type,
    content: f.content.slice(0, 2000), // truncate for storage
    keywords: f.keywords,
    category: f.category,
    uploadedAt: f.uploadedAt instanceof Date ? f.uploadedAt.toISOString() : f.uploadedAt,
  }));
  try {
    localStorage.setItem(FILES_KEY_PREFIX + userId, JSON.stringify(serializable));
  } catch {
    // Storage quota exceeded - silently fail
  }
}

/** Restore files for a specific user */
export function loadUserFiles(userId: string): AnalyzedFile[] {
  try {
    const data = localStorage.getItem(FILES_KEY_PREFIX + userId);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return parsed.map((f: any) => ({
      ...f,
      uploadedAt: new Date(f.uploadedAt),
      file: new File([], f.name), // placeholder File object
    }));
  } catch {
    return [];
  }
}

/** Add an activity entry */
export function addActivity(userId: string, entry: Omit<ActivityEntry, "id" | "timestamp">) {
  const activities = getActivities(userId);
  activities.unshift({
    ...entry,
    id: `act_${Date.now()}`,
    timestamp: new Date().toISOString(),
  });
  // Keep last 50 entries
  try {
    localStorage.setItem(ACTIVITY_KEY_PREFIX + userId, JSON.stringify(activities.slice(0, 50)));
  } catch {
    // ignore
  }
}

/** Get activity history */
export function getActivities(userId: string): ActivityEntry[] {
  try {
    const data = localStorage.getItem(ACTIVITY_KEY_PREFIX + userId);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/** Calculate storage usage in bytes */
export function getStorageUsage(): { used: number; total: number } {
  let used = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("sfo_")) {
      used += (localStorage.getItem(key) || "").length * 2; // UTF-16
    }
  }
  return { used, total: 5 * 1024 * 1024 }; // 5MB typical quota
}
