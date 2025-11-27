import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all classes for a teacher
export const getTeacherClasses = query({
  args: { teacherId: v.id("users") },
  handler: async (ctx, args) => {
    const classes = await ctx.db
      .query("classes")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();

    // Enrich with student count
    const classesWithCount = await Promise.all(
      classes.map(async (cls) => {
        const memberCount = await ctx.db
          .query("classMembers")
          .withIndex("by_class", (q) => q.eq("classId", cls._id))
          .collect();
        return {
          ...cls,
          studentCount: memberCount.length,
        };
      })
    );

    return classesWithCount;
  },
});

// Get all classes for a student
export const getStudentClasses = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("classMembers")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    const classes = await Promise.all(
      memberships.map(async (m) => {
        const cls = await ctx.db.get(m.classId);
        if (!cls) return null;
        
        // Get student count
        const memberCount = await ctx.db
          .query("classMembers")
          .withIndex("by_class", (q) => q.eq("classId", cls._id))
          .collect();

        return {
          ...cls,
          studentCount: memberCount.length,
        };
      })
    );

    return classes.filter((c) => c !== null);
  },
});

// Create a new class
export const createClass = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    teacherId: v.id("users"),
    code: v.optional(v.string()),
    schedule: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Use provided code or generate a random 6-character join code
    const code = args.code || Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Check if code already exists
    const existingClass = await ctx.db
      .query("classes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    
    if (existingClass) {
      throw new Error("This class code is already in use. Please choose a different one.");
    }
    
    const classId = await ctx.db.insert("classes", {
      name: args.name,
      description: args.description,
      teacherId: args.teacherId,
      code,
      schedule: args.schedule,
      createdAt: Date.now(),
      seatingRows: 6,
      seatingCols: 8,
      seatingFinalized: false,
    });

    return { classId, code };
  },
});

// Join a class with a code
export const joinClass = mutation({
  args: {
    code: v.string(),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const classToJoin = await ctx.db
      .query("classes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (!classToJoin) {
      throw new Error("Class not found with that code");
    }

    // Check if already a member
    const existingMembership = await ctx.db
      .query("classMembers")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", classToJoin._id).eq("studentId", args.studentId)
      )
      .first();

    if (existingMembership) {
      throw new Error("Already a member of this class");
    }

    await ctx.db.insert("classMembers", {
      classId: classToJoin._id,
      studentId: args.studentId,
      joinedAt: Date.now(),
    });

    return classToJoin;
  },
});

// Get students in a class
export const getClassStudents = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("classMembers")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    const students = await Promise.all(
      memberships.map(async (m) => {
        const student = await ctx.db.get(m.studentId);
        if (!student) return null;
        
        // Get seat assignment if exists
        const seatAssignment = await ctx.db
          .query("seatAssignments")
          .withIndex("by_class_and_student", (q) =>
            q.eq("classId", args.classId).eq("studentId", m.studentId)
          )
          .first();

        return {
          ...student,
          joinedAt: m.joinedAt,
          seatAssignment: seatAssignment ? { row: seatAssignment.row, col: seatAssignment.col } : null,
        };
      })
    );

    return students.filter((s) => s !== null);
  },
});

// Get a single class by ID
export const getClass = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const cls = await ctx.db.get(args.classId);
    if (!cls) return null;

    // Get student count
    const memberCount = await ctx.db
      .query("classMembers")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    return {
      ...cls,
      studentCount: memberCount.length,
    };
  },
});

// Get seating chart for a class
export const getSeatingChart = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const cls = await ctx.db.get(args.classId);
    if (!cls) return null;

    const seatAssignments = await ctx.db
      .query("seatAssignments")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    // Enrich with student information
    const enrichedSeats = await Promise.all(
      seatAssignments.map(async (seat) => {
        const student = await ctx.db.get(seat.studentId);
        return {
          ...seat,
          studentName: student?.name,
          studentIdNumber: student?.idNumber,
          studentEmail: student?.email,
        };
      })
    );

    return {
      rows: cls.seatingRows || 6,
      cols: cls.seatingCols || 8,
      finalized: cls.seatingFinalized || false,
      seats: enrichedSeats,
    };
  },
});

// Assign or update a seat for a student
export const assignSeat = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("users"),
    row: v.number(),
    col: v.number(),
  },
  handler: async (ctx, args) => {
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    // Check if seating is finalized
    if (cls.seatingFinalized) {
      throw new Error("Seating arrangement has been finalized by the teacher");
    }

    // Check if the seat is already taken by someone else
    const existingSeat = await ctx.db
      .query("seatAssignments")
      .withIndex("by_class_and_position", (q) =>
        q.eq("classId", args.classId).eq("row", args.row).eq("col", args.col)
      )
      .first();

    if (existingSeat && existingSeat.studentId !== args.studentId) {
      throw new Error("This seat is already taken");
    }

    // Remove existing seat assignment for this student
    const currentAssignment = await ctx.db
      .query("seatAssignments")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", args.classId).eq("studentId", args.studentId)
      )
      .first();

    if (currentAssignment) {
      await ctx.db.delete(currentAssignment._id);
    }

    // Create new seat assignment
    await ctx.db.insert("seatAssignments", {
      classId: args.classId,
      studentId: args.studentId,
      row: args.row,
      col: args.col,
      assignedAt: Date.now(),
    });

    return { success: true };
  },
});

// Finalize seating arrangement (teacher only)
export const finalizeSeating = mutation({
  args: {
    classId: v.id("classes"),
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    if (cls.teacherId !== args.teacherId) {
      throw new Error("Only the class teacher can finalize seating");
    }

    await ctx.db.patch(args.classId, {
      seatingFinalized: true,
    });

    return { success: true };
  },
});

// Unfinalize seating arrangement (teacher only)
export const unfinalizeSeating = mutation({
  args: {
    classId: v.id("classes"),
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    if (cls.teacherId !== args.teacherId) {
      throw new Error("Only the class teacher can unfinalize seating");
    }

    await ctx.db.patch(args.classId, {
      seatingFinalized: false,
    });

    return { success: true };
  },
});

// Initialize seating chart dimensions (teacher only)
export const initializeSeatingChart = mutation({
  args: {
    classId: v.id("classes"),
    teacherId: v.id("users"),
    rows: v.number(),
    cols: v.number(),
  },
  handler: async (ctx, args) => {
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    if (cls.teacherId !== args.teacherId) {
      throw new Error("Only the class teacher can initialize seating chart");
    }

    await ctx.db.patch(args.classId, {
      seatingRows: args.rows,
      seatingCols: args.cols,
      seatingFinalized: false,
    });

    return { success: true };
  },
});

// Get attendance records for a student in a class
export const getStudentAttendance = query({
  args: { 
    classId: v.id("classes"),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("attendance")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    // Filter for this student
    const studentRecords = records.filter(r => r.studentId === args.studentId);
    
    // Sort by date descending
    studentRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Calculate stats
    const stats = {
      present: studentRecords.filter(r => r.status === "present").length,
      late: studentRecords.filter(r => r.status === "late").length,
      absent: studentRecords.filter(r => r.status === "absent").length,
      excused: studentRecords.filter(r => r.status === "excused").length,
      total: studentRecords.length,
    };
    
    const attendanceRate = stats.total > 0 
      ? Math.round(((stats.present + stats.late) / stats.total) * 100)
      : 0;
    
    return {
      records: studentRecords,
      stats,
      attendanceRate,
    };
  },
});

// Get class-wide attendance statistics
export const getClassAttendanceStats = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("attendance")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();
    
    if (records.length === 0) {
      return { averageAttendance: 0, totalSessions: 0 };
    }
    
    // Get unique dates (sessions)
    const uniqueDates = [...new Set(records.map(r => r.date))];
    
    // Calculate average attendance rate
    const presentOrLate = records.filter(r => r.status === "present" || r.status === "late").length;
    const averageAttendance = Math.round((presentOrLate / records.length) * 100);
    
    return {
      averageAttendance,
      totalSessions: uniqueDates.length,
    };
  },
});

// Get teacher's overall attendance statistics across all their classes
export const getTeacherAttendanceStats = query({
  args: { teacherId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all classes for this teacher
    const classes = await ctx.db
      .query("classes")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();
    
    if (classes.length === 0) {
      return { averageAttendance: 0, totalSessions: 0, totalClasses: 0 };
    }
    
    // Get all attendance records for all classes
    let allRecords: any[] = [];
    for (const cls of classes) {
      const records = await ctx.db
        .query("attendance")
        .withIndex("by_class", (q) => q.eq("classId", cls._id))
        .collect();
      allRecords = allRecords.concat(records);
    }
    
    if (allRecords.length === 0) {
      return { averageAttendance: 0, totalSessions: 0, totalClasses: classes.length };
    }
    
    // Get unique dates across all classes
    const uniqueDates = [...new Set(allRecords.map(r => r.date))];
    
    // Calculate average attendance rate
    const presentOrLate = allRecords.filter(r => r.status === "present" || r.status === "late").length;
    const averageAttendance = Math.round((presentOrLate / allRecords.length) * 100);
    
    return {
      averageAttendance,
      totalSessions: uniqueDates.length,
      totalClasses: classes.length,
    };
  },
});

// Mark attendance for a student
export const markAttendance = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("users"),
    date: v.string(),
    status: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("late"),
      v.literal("excused")
    ),
    notes: v.optional(v.string()),
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    if (cls.teacherId !== args.teacherId) {
      throw new Error("Only the class teacher can mark attendance");
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
      // Update existing attendance
      await ctx.db.patch(existing._id, {
        status: args.status,
        notes: args.notes,
      });
      return { success: true, updated: true };
    } else {
      // Create new attendance record
      await ctx.db.insert("attendance", {
        classId: args.classId,
        studentId: args.studentId,
        date: args.date,
        status: args.status,
        notes: args.notes,
        createdAt: Date.now(),
      });
      return { success: true, updated: false };
    }
  },
});

// Mark all students with the same attendance status
export const markAllAttendance = mutation({
  args: {
    classId: v.id("classes"),
    date: v.string(),
    status: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("late"),
      v.literal("excused")
    ),
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    if (cls.teacherId !== args.teacherId) {
      throw new Error("Only the class teacher can mark attendance");
    }

    // Get all students in the class
    const members = await ctx.db
      .query("classMembers")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    // Mark attendance for each student
    for (const member of members) {
      const existing = await ctx.db
        .query("attendance")
        .withIndex("by_class_and_date", (q) =>
          q.eq("classId", args.classId).eq("date", args.date)
        )
        .filter((q) => q.eq(q.field("studentId"), member.studentId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          status: args.status,
        });
      } else {
        await ctx.db.insert("attendance", {
          classId: args.classId,
          studentId: member.studentId,
          date: args.date,
          status: args.status,
          createdAt: Date.now(),
        });
      }
    }

    return { success: true, count: members.length };
  },
});

// Get today's attendance for a class
export const getTodayAttendance = query({
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

    // Enrich with student information
    const enrichedRecords = await Promise.all(
      records.map(async (record) => {
        const student = await ctx.db.get(record.studentId);
        return {
          ...record,
          studentName: student?.name,
          studentIdNumber: student?.idNumber,
        };
      })
    );

    // Get all students in the class
    const allStudents = await ctx.db
      .query("classMembers")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    // Find students without attendance records
    const studentsWithoutAttendance = await Promise.all(
      allStudents
        .filter(m => !records.find(r => r.studentId === m.studentId))
        .map(async (member) => {
          const student = await ctx.db.get(member.studentId);
          return {
            studentId: member.studentId,
            studentName: student?.name,
            studentIdNumber: student?.idNumber,
            status: null,
          };
        })
    );

    return {
      records: enrichedRecords,
      unmarked: studentsWithoutAttendance,
      stats: {
        total: allStudents.length,
        present: records.filter(r => r.status === "present").length,
        late: records.filter(r => r.status === "late").length,
        absent: records.filter(r => r.status === "absent").length,
        excused: records.filter(r => r.status === "excused").length,
        unmarked: studentsWithoutAttendance.length,
      },
    };
  },
});
