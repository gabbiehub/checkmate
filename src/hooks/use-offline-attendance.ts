import { useState, useEffect, useCallback, useRef } from "react";
import { Id } from "../../convex/_generated/dataModel";

// Type definitions
export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface OfflineAttendanceRecord {
  classId: Id<"classes">;
  studentId: Id<"users">;
  date: string;
  status: AttendanceStatus;
  timestamp: number;
  notes?: string;
  synced: boolean;
}

interface UseOfflineAttendanceOptions {
  classId: Id<"classes">;
  date: string;
  onSync?: (results: SyncResult) => void;
}

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  results: Array<{
    studentId: Id<"users">;
    success: boolean;
    error?: string;
  }>;
}

const STORAGE_KEY = "checkmate_offline_attendance";

/**
 * Custom hook for managing offline attendance with local storage persistence
 */
export function useOfflineAttendance({ classId, date, onSync }: UseOfflineAttendanceOptions) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingRecords, setPendingRecords] = useState<OfflineAttendanceRecord[]>([]);
  const [localAttendance, setLocalAttendance] = useState<Map<string, AttendanceStatus>>(new Map());
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInProgressRef = useRef(false);

  // Load pending records from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const records: OfflineAttendanceRecord[] = JSON.parse(stored);
        setPendingRecords(records.filter(r => !r.synced));
        
        // Build local attendance map for current class/date
        const localMap = new Map<string, AttendanceStatus>();
        records
          .filter(r => r.classId === classId && r.date === date && !r.synced)
          .forEach(r => localMap.set(r.studentId, r.status));
        setLocalAttendance(localMap);
      } catch (e) {
        console.error("Failed to parse offline attendance records:", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [classId, date]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Persist pending records to localStorage whenever they change
  useEffect(() => {
    if (pendingRecords.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingRecords));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [pendingRecords]);

  /**
   * Queue an attendance mark for offline storage
   */
  const queueAttendanceMark = useCallback((
    studentId: Id<"users">,
    status: AttendanceStatus,
    notes?: string
  ) => {
    const newRecord: OfflineAttendanceRecord = {
      classId,
      studentId,
      date,
      status,
      timestamp: Date.now(),
      notes,
      synced: false,
    };

    setPendingRecords(prev => {
      // Remove any existing record for this student/class/date
      const filtered = prev.filter(
        r => !(r.classId === classId && r.studentId === studentId && r.date === date)
      );
      return [...filtered, newRecord];
    });

    // Update local attendance map
    setLocalAttendance(prev => {
      const newMap = new Map(prev);
      newMap.set(studentId, status);
      return newMap;
    });

    return newRecord;
  }, [classId, date]);

  /**
   * Remove a pending record (when successfully synced online)
   */
  const removePendingRecord = useCallback((studentId: Id<"users">) => {
    setPendingRecords(prev => 
      prev.filter(r => !(r.classId === classId && r.studentId === studentId && r.date === date))
    );
    setLocalAttendance(prev => {
      const newMap = new Map(prev);
      newMap.delete(studentId);
      return newMap;
    });
  }, [classId, date]);

  /**
   * Mark records as synced
   */
  const markAsSynced = useCallback((studentIds: Id<"users">[]) => {
    const studentIdSet = new Set(studentIds);
    setPendingRecords(prev => 
      prev.filter(r => !studentIdSet.has(r.studentId) || r.classId !== classId || r.date !== date)
    );
    setLocalAttendance(prev => {
      const newMap = new Map(prev);
      studentIds.forEach(id => newMap.delete(id));
      return newMap;
    });
  }, [classId, date]);

  /**
   * Get pending records for syncing
   */
  const getPendingRecordsForSync = useCallback(() => {
    return pendingRecords.filter(r => !r.synced);
  }, [pendingRecords]);

  /**
   * Get the local attendance status for a student (pending offline record)
   */
  const getLocalStatus = useCallback((studentId: Id<"users">): AttendanceStatus | null => {
    return localAttendance.get(studentId) || null;
  }, [localAttendance]);

  /**
   * Check if a student has a pending offline record
   */
  const hasPendingRecord = useCallback((studentId: Id<"users">): boolean => {
    return localAttendance.has(studentId);
  }, [localAttendance]);

  /**
   * Get count of pending records
   */
  const pendingCount = pendingRecords.filter(r => !r.synced).length;

  /**
   * Clear all pending records (use with caution)
   */
  const clearPendingRecords = useCallback(() => {
    setPendingRecords([]);
    setLocalAttendance(new Map());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    isOnline,
    pendingRecords: getPendingRecordsForSync(),
    pendingCount,
    localAttendance,
    isSyncing,
    setIsSyncing,
    queueAttendanceMark,
    removePendingRecord,
    markAsSynced,
    getLocalStatus,
    hasPendingRecord,
    clearPendingRecords,
  };
}

/**
 * Utility function to format date for attendance (YYYY-MM-DD)
 */
export function formatAttendanceDate(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

/**
 * Utility function to get a readable date string
 */
export function getReadableDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
