import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Status validator for attendance
const statusValidator = v.union(
  v.literal("present"),
  v.literal("absent"),
  v.literal("late"),
  v.literal("excused")
);

// Offline record validator for batch syncing
const offlineRecordValidator = v.object({
  classId: v.id("classes"),
  studentId: v.id("users"),
  date: v.string(),
  status: statusValidator,
  timestamp: v.number(), // Local timestamp when marked
  notes: v.optional(v.string()),
});

/**
 * Mark a single student's attendance
 * This is the primary mutation for one-tap attendance marking
 */
export const markStudent = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("users"),
    date: v.string(), // ISO date string (YYYY-MM-DD)
    status: statusValidator,
    notes: v.optional(v.string()),
    markedBy: v.id("users"), // User marking the attendance (teacher or beadle)
  },
  handler: async (ctx, args) => {
    // Verify the class exists
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    // Verify user has permission (teacher or beadle)
    const isTeacher = cls.teacherId === args.markedBy;
    
    const beadleMembership = await ctx.db
      .query("classMembers")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", args.classId).eq("studentId", args.markedBy)
      )
      .first();
    const isBeadle = beadleMembership?.isBeadle === true;

    if (!isTeacher && !isBeadle) {
      throw new Error("Only the class teacher or beadles can mark attendance");
    }

    // Verify the student is enrolled in the class
    const studentMembership = await ctx.db
      .query("classMembers")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", args.classId).eq("studentId", args.studentId)
      )
      .first();

    if (!studentMembership) {
      throw new Error("Student is not enrolled in this class");
    }

    // Check if attendance already exists for this student on this date
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_class_and_date", (q) =>
        q.eq("classId", args.classId).eq("date", args.date)
      )
      .filter((q) => q.eq(q.field("studentId"), args.studentId))
      .first();

    if (existing) {
      // Update existing attendance record
      await ctx.db.patch(existing._id, {
        status: args.status,
        notes: args.notes,
      });
      return { 
        success: true, 
        updated: true, 
        recordId: existing._id,
        studentId: args.studentId,
        status: args.status,
      };
    } else {
      // Create new attendance record
      const recordId = await ctx.db.insert("attendance", {
        classId: args.classId,
        studentId: args.studentId,
        date: args.date,
        status: args.status,
        notes: args.notes,
        createdAt: Date.now(),
      });
      return { 
        success: true, 
        updated: false, 
        recordId,
        studentId: args.studentId,
        status: args.status,
      };
    }
  },
});

/**
 * Batch mark attendance for multiple students (for offline sync)
 */
export const batchMarkAttendance = mutation({
  args: {
    records: v.array(offlineRecordValidator),
    markedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const results: Array<{
      studentId: Id<"users">;
      success: boolean;
      error?: string;
    }> = [];

    for (const record of args.records) {
      try {
        // Verify the class exists
        const cls = await ctx.db.get(record.classId);
        if (!cls) {
          results.push({
            studentId: record.studentId,
            success: false,
            error: "Class not found",
          });
          continue;
        }

        // Verify user has permission
        const isTeacher = cls.teacherId === args.markedBy;
        const beadleMembership = await ctx.db
          .query("classMembers")
          .withIndex("by_class_and_student", (q) =>
            q.eq("classId", record.classId).eq("studentId", args.markedBy)
          )
          .first();
        const isBeadle = beadleMembership?.isBeadle === true;

        if (!isTeacher && !isBeadle) {
          results.push({
            studentId: record.studentId,
            success: false,
            error: "Permission denied",
          });
          continue;
        }

        // Check if attendance already exists
        const existing = await ctx.db
          .query("attendance")
          .withIndex("by_class_and_date", (q) =>
            q.eq("classId", record.classId).eq("date", record.date)
          )
          .filter((q) => q.eq(q.field("studentId"), record.studentId))
          .first();

        if (existing) {
          // Only update if the offline record is newer (based on timestamp)
          await ctx.db.patch(existing._id, {
            status: record.status,
            notes: record.notes,
          });
        } else {
          await ctx.db.insert("attendance", {
            classId: record.classId,
            studentId: record.studentId,
            date: record.date,
            status: record.status,
            notes: record.notes,
            createdAt: record.timestamp,
          });
        }

        results.push({
          studentId: record.studentId,
          success: true,
        });
      } catch (error: any) {
        results.push({
          studentId: record.studentId,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    return {
      success: true,
      synced: successCount,
      failed: results.length - successCount,
      results,
    };
  },
});

/**
 * Get attendance records for a class on a specific date
 */
export const getByClassAndDate = query({
  args: {
    classId: v.id("classes"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("attendance")
      .withIndex("by_class_and_date", (q) =>
        q.eq("classId", args.classId).eq("date", args.date)
      )
      .collect();

    // Enrich with student info
    const enrichedRecords = await Promise.all(
      records.map(async (record) => {
        const student = await ctx.db.get(record.studentId);
        return {
          ...record,
          studentName: student?.name,
          studentEmail: student?.email,
          studentIdNumber: student?.idNumber,
        };
      })
    );

    return enrichedRecords;
  },
});

/**
 * Get attendance status map for a class on a date (optimized for UI)
 * Returns a map of studentId -> status for quick lookups
 */
export const getAttendanceStatusMap = query({
  args: {
    classId: v.id("classes"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("attendance")
      .withIndex("by_class_and_date", (q) =>
        q.eq("classId", args.classId).eq("date", args.date)
      )
      .collect();

    // Create a map for O(1) lookups
    const statusMap: Record<string, {
      status: "present" | "absent" | "late" | "excused";
      recordId: Id<"attendance">;
      notes?: string;
    }> = {};

    for (const record of records) {
      statusMap[record.studentId] = {
        status: record.status,
        recordId: record._id,
        notes: record.notes,
      };
    }

    return statusMap;
  },
});

/**
 * Get all attendance sessions (unique dates) for a class
 */
export const getClassSessions = query({
  args: {
    classId: v.id("classes"),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("attendance")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    // Get unique dates and count attendance for each
    const sessionMap = new Map<string, {
      present: number;
      late: number;
      absent: number;
      excused: number;
      total: number;
    }>();

    for (const record of records) {
      if (!sessionMap.has(record.date)) {
        sessionMap.set(record.date, {
          present: 0,
          late: 0,
          absent: 0,
          excused: 0,
          total: 0,
        });
      }
      const stats = sessionMap.get(record.date)!;
      stats[record.status]++;
      stats.total++;
    }

    // Convert to array and sort by date descending
    const sessions = Array.from(sessionMap.entries()).map(([date, stats]) => ({
      date,
      ...stats,
      attendanceRate: stats.total > 0 
        ? Math.round(((stats.present + stats.late) / stats.total) * 100)
        : 0,
    }));

    sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return sessions;
  },
});

/**
 * Delete attendance record
 */
export const deleteRecord = mutation({
  args: {
    recordId: v.id("attendance"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.recordId);
    if (!record) {
      throw new Error("Attendance record not found");
    }

    const cls = await ctx.db.get(record.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    // Only teachers can delete attendance records
    if (cls.teacherId !== args.userId) {
      throw new Error("Only the class teacher can delete attendance records");
    }

    await ctx.db.delete(args.recordId);
    return { success: true };
  },
});

/**
 * Internal mutation for batch marking (called by the action)
 */
export const internalBatchMarkAttendance = internalMutation({
  args: {
    records: v.array(offlineRecordValidator),
    markedBy: v.id("users"),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    synced: number;
    failed: number;
    results: Array<{
      studentId: Id<"users">;
      success: boolean;
      error?: string;
    }>;
  }> => {
    const results: Array<{
      studentId: Id<"users">;
      success: boolean;
      error?: string;
    }> = [];

    for (const record of args.records) {
      try {
        // Verify the class exists
        const cls = await ctx.db.get(record.classId);
        if (!cls) {
          results.push({
            studentId: record.studentId,
            success: false,
            error: "Class not found",
          });
          continue;
        }

        // Verify user has permission
        const isTeacher = cls.teacherId === args.markedBy;
        const beadleMembership = await ctx.db
          .query("classMembers")
          .withIndex("by_class_and_student", (q) =>
            q.eq("classId", record.classId).eq("studentId", args.markedBy)
          )
          .first();
        const isBeadle = beadleMembership?.isBeadle === true;

        if (!isTeacher && !isBeadle) {
          results.push({
            studentId: record.studentId,
            success: false,
            error: "Permission denied",
          });
          continue;
        }

        // Check if attendance already exists
        const existing = await ctx.db
          .query("attendance")
          .withIndex("by_class_and_date", (q) =>
            q.eq("classId", record.classId).eq("date", record.date)
          )
          .filter((q) => q.eq(q.field("studentId"), record.studentId))
          .first();

        if (existing) {
          // Only update if the offline record is newer (based on timestamp)
          await ctx.db.patch(existing._id, {
            status: record.status,
            notes: record.notes,
          });
        } else {
          await ctx.db.insert("attendance", {
            classId: record.classId,
            studentId: record.studentId,
            date: record.date,
            status: record.status,
            notes: record.notes,
            createdAt: record.timestamp,
          });
        }

        results.push({
          studentId: record.studentId,
          success: true,
        });
      } catch (error: any) {
        results.push({
          studentId: record.studentId,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    return {
      success: true,
      synced: successCount,
      failed: results.length - successCount,
      results,
    };
  },
});

/**
 * Action for syncing offline records (can be called from client)
 * This wraps the batch mutation and can handle more complex logic if needed
 */
export const syncOfflineRecords = action({
  args: {
    records: v.array(offlineRecordValidator),
    markedBy: v.id("users"),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    synced: number;
    failed: number;
    results: Array<{
      studentId: Id<"users">;
      success: boolean;
      error?: string;
    }>;
  }> => {
    // Call the internal batch mutation
    const result = await ctx.runMutation(internal.attendance.internalBatchMarkAttendance, {
      records: args.records,
      markedBy: args.markedBy,
    });

    return result;
  },
});

/**
 * Get comprehensive class attendance analytics
 * Provides aggregated summaries for beadle dashboard
 */
export const getClassAnalytics = query({
  args: {
    classId: v.id("classes"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify the class exists
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    // Verify user has permission (teacher or beadle)
    const isTeacher = cls.teacherId === args.userId;
    const beadleMembership = await ctx.db
      .query("classMembers")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", args.classId).eq("studentId", args.userId)
      )
      .first();
    const isBeadle = beadleMembership?.isBeadle === true;

    if (!isTeacher && !isBeadle) {
      throw new Error("Only the class teacher or beadles can view attendance analytics");
    }

    // Get all class members
    const classMembers = await ctx.db
      .query("classMembers")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    // Get all attendance records for this class
    const allAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    // Get student details
    const studentIds = classMembers.map((m) => m.studentId);
    const students = await Promise.all(
      studentIds.map(async (id) => {
        const student = await ctx.db.get(id);
        return student;
      })
    );

    const studentMap = new Map(
      students.filter(Boolean).map((s) => [s!._id, s!])
    );

    // Calculate overall class statistics
    const totalStudents = classMembers.length;
    const uniqueDates = [...new Set(allAttendance.map((a) => a.date))].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
    const totalSessions = uniqueDates.length;

    // Overall attendance breakdown
    const overallStats = {
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
      total: allAttendance.length,
    };

    for (const record of allAttendance) {
      overallStats[record.status]++;
    }

    // Calculate percentages
    const overallPercentages = {
      presentRate:
        overallStats.total > 0
          ? Math.round(((overallStats.present + overallStats.late) / overallStats.total) * 100)
          : 0,
      absentRate:
        overallStats.total > 0
          ? Math.round((overallStats.absent / overallStats.total) * 100)
          : 0,
      lateRate:
        overallStats.total > 0
          ? Math.round((overallStats.late / overallStats.total) * 100)
          : 0,
      excusedRate:
        overallStats.total > 0
          ? Math.round((overallStats.excused / overallStats.total) * 100)
          : 0,
    };

    // Per-student analytics
    const studentAnalytics = studentIds.map((studentId) => {
      const student = studentMap.get(studentId);
      const studentRecords = allAttendance.filter((a) => a.studentId === studentId);

      const stats = {
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        total: studentRecords.length,
      };

      for (const record of studentRecords) {
        stats[record.status]++;
      }

      const attendanceRate =
        stats.total > 0
          ? Math.round(((stats.present + stats.late) / stats.total) * 100)
          : 0;

      // Determine risk level based on absences
      let riskLevel: "low" | "medium" | "high" | "none" = "none";
      const absencePercentage = stats.total > 0 ? (stats.absent / stats.total) * 100 : 0;
      if (absencePercentage >= 30) {
        riskLevel = "high";
      } else if (absencePercentage >= 20) {
        riskLevel = "medium";
      } else if (absencePercentage >= 10) {
        riskLevel = "low";
      }

      // Get recent attendance trend (last 5 sessions)
      const recentDates = uniqueDates.slice(0, 5);
      const recentRecords = studentRecords.filter((r) =>
        recentDates.includes(r.date)
      );
      const recentPresentCount = recentRecords.filter(
        (r) => r.status === "present" || r.status === "late"
      ).length;
      const recentTrend =
        recentRecords.length > 0
          ? Math.round((recentPresentCount / recentRecords.length) * 100)
          : null;

      // Streak calculation (consecutive present days)
      let currentStreak = 0;
      for (const date of uniqueDates) {
        const record = studentRecords.find((r) => r.date === date);
        if (record && (record.status === "present" || record.status === "late")) {
          currentStreak++;
        } else {
          break;
        }
      }

      return {
        studentId,
        studentName: student?.name || "Unknown Student",
        studentEmail: student?.email,
        studentIdNumber: student?.idNumber,
        stats,
        attendanceRate,
        riskLevel,
        recentTrend,
        currentStreak,
        lastAttendance: studentRecords[0]?.date || null,
      };
    });

    // Sort by attendance rate (ascending) to show worst performers first
    studentAnalytics.sort((a, b) => a.attendanceRate - b.attendanceRate);

    // Students at risk (more than 3 absences or >20% absence rate)
    const atRiskStudents = studentAnalytics.filter(
      (s) => s.riskLevel === "high" || s.riskLevel === "medium"
    );

    // Daily breakdown for the last 7 sessions
    const dailyBreakdown = uniqueDates.slice(0, 7).map((date) => {
      const dayRecords = allAttendance.filter((a) => a.date === date);
      const dayStats = {
        present: dayRecords.filter((r) => r.status === "present").length,
        late: dayRecords.filter((r) => r.status === "late").length,
        absent: dayRecords.filter((r) => r.status === "absent").length,
        excused: dayRecords.filter((r) => r.status === "excused").length,
        total: dayRecords.length,
      };
      return {
        date,
        ...dayStats,
        attendanceRate:
          dayStats.total > 0
            ? Math.round(((dayStats.present + dayStats.late) / dayStats.total) * 100)
            : 0,
      };
    });

    // Calculate weekly trend
    const weeklyTrend =
      dailyBreakdown.length >= 2
        ? dailyBreakdown[0].attendanceRate - dailyBreakdown[dailyBreakdown.length - 1].attendanceRate
        : 0;

    // Today's summary
    const today = new Date().toISOString().split("T")[0];
    const todayRecords = allAttendance.filter((a) => a.date === today);
    const todayStats = {
      present: todayRecords.filter((r) => r.status === "present").length,
      late: todayRecords.filter((r) => r.status === "late").length,
      absent: todayRecords.filter((r) => r.status === "absent").length,
      excused: todayRecords.filter((r) => r.status === "excused").length,
      unmarked: totalStudents - todayRecords.length,
      total: todayRecords.length,
      attendanceRate:
        todayRecords.length > 0
          ? Math.round(
              ((todayRecords.filter((r) => r.status === "present").length +
                todayRecords.filter((r) => r.status === "late").length) /
                todayRecords.length) *
                100
            )
          : 0,
    };

    return {
      className: cls.name,
      classCode: cls.code,
      totalStudents,
      totalSessions,
      overallStats,
      overallPercentages,
      todayStats,
      dailyBreakdown,
      weeklyTrend,
      studentAnalytics,
      atRiskStudents,
      lastUpdated: Date.now(),
    };
  },
});

/**
 * Get a specific student's attendance history for a class
 */
export const getStudentAttendanceHistory = query({
  args: {
    classId: v.id("classes"),
    studentId: v.id("users"),
    requestedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify the class exists
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    // Verify user has permission (teacher, beadle, or the student themselves)
    const isTeacher = cls.teacherId === args.requestedBy;
    const isSelf = args.requestedBy === args.studentId;
    const beadleMembership = await ctx.db
      .query("classMembers")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", args.classId).eq("studentId", args.requestedBy)
      )
      .first();
    const isBeadle = beadleMembership?.isBeadle === true;

    if (!isTeacher && !isBeadle && !isSelf) {
      throw new Error("You don't have permission to view this student's attendance");
    }

    // Get student info
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // Get all attendance records for this student in this class
    const records = await ctx.db
      .query("attendance")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .filter((q) => q.eq(q.field("studentId"), args.studentId))
      .collect();

    // Sort by date descending
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate statistics
    const stats = {
      present: records.filter((r) => r.status === "present").length,
      late: records.filter((r) => r.status === "late").length,
      absent: records.filter((r) => r.status === "absent").length,
      excused: records.filter((r) => r.status === "excused").length,
      total: records.length,
    };

    const attendanceRate =
      stats.total > 0
        ? Math.round(((stats.present + stats.late) / stats.total) * 100)
        : 0;

    return {
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        idNumber: student.idNumber,
      },
      records: records.map((r) => ({
        id: r._id,
        date: r.date,
        status: r.status,
        notes: r.notes,
        createdAt: r.createdAt,
      })),
      stats,
      attendanceRate,
    };
  },
});
