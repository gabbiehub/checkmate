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

    // Check if user is teacher or beadle
    const isTeacher = cls.teacherId === args.teacherId;
    
    // Check if user is a beadle for this class
    const beadleMembership = await ctx.db
      .query("classMembers")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", args.classId).eq("studentId", args.teacherId)
      )
      .first();
    const isBeadle = beadleMembership?.isBeadle === true;

    if (!isTeacher && !isBeadle) {
      throw new Error("Only the class teacher or beadles can mark attendance");
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

    // Check if user is teacher or beadle
    const isTeacher = cls.teacherId === args.teacherId;
    
    // Check if user is a beadle for this class
    const beadleMembership = await ctx.db
      .query("classMembers")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", args.classId).eq("studentId", args.teacherId)
      )
      .first();
    const isBeadle = beadleMembership?.isBeadle === true;

    if (!isTeacher && !isBeadle) {
      throw new Error("Only the class teacher or beadles can mark attendance");
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

// Get comprehensive analytics for a teacher
export const getTeacherAnalytics = query({
  args: { teacherId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all classes for this teacher
    const classes = await ctx.db
      .query("classes")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();

    if (classes.length === 0) {
      return {
        totalClasses: 0,
        totalStudents: 0,
        averageAttendance: 0,
        atRiskStudents: [],
        classPerformance: [],
        recentTrends: [],
      };
    }

    // Get all class members and attendance records
    let totalStudents = 0;
    let allAttendanceRecords: any[] = [];
    const classPerformance: any[] = [];
    const studentAttendanceMap: Map<string, { 
      studentId: string; 
      name: string; 
      className: string;
      classCode: string;
      absences: number; 
      totalSessions: number;
    }> = new Map();

    for (const cls of classes) {
      // Get students in this class
      const members = await ctx.db
        .query("classMembers")
        .withIndex("by_class", (q) => q.eq("classId", cls._id))
        .collect();
      
      totalStudents += members.length;

      // Get attendance records for this class
      const records = await ctx.db
        .query("attendance")
        .withIndex("by_class", (q) => q.eq("classId", cls._id))
        .collect();
      
      allAttendanceRecords = allAttendanceRecords.concat(records);

      // Calculate class attendance rate
      const uniqueDates = [...new Set(records.map(r => r.date))];
      const presentOrLate = records.filter(r => r.status === "present" || r.status === "late").length;
      const classAttendance = records.length > 0 
        ? Math.round((presentOrLate / records.length) * 100)
        : 0;

      // Track student absences for at-risk calculation
      for (const member of members) {
        const student = await ctx.db.get(member.studentId);
        if (!student) continue;

        const studentRecords = records.filter(r => r.studentId === member.studentId);
        const absences = studentRecords.filter(r => r.status === "absent").length;
        const key = `${member.studentId}-${cls._id}`;
        
        studentAttendanceMap.set(key, {
          studentId: member.studentId,
          name: student.name,
          className: cls.name,
          classCode: cls.code,
          absences,
          totalSessions: uniqueDates.length,
        });
      }

      classPerformance.push({
        id: cls._id,
        name: cls.name,
        code: cls.code,
        description: cls.description,
        students: members.length,
        attendance: classAttendance,
        totalSessions: uniqueDates.length,
      });
    }

    // Calculate overall attendance
    const totalPresentOrLate = allAttendanceRecords.filter(
      r => r.status === "present" || r.status === "late"
    ).length;
    const averageAttendance = allAttendanceRecords.length > 0
      ? Math.round((totalPresentOrLate / allAttendanceRecords.length) * 100)
      : 0;

    // Identify at-risk students (3+ absences or attendance rate below 75%)
    const atRiskStudents: any[] = [];
    studentAttendanceMap.forEach((data) => {
      const attendanceRate = data.totalSessions > 0 
        ? ((data.totalSessions - data.absences) / data.totalSessions) * 100
        : 100;
      
      // Consider at-risk if 3+ absences or below 75% attendance
      if (data.absences >= 3 || (data.totalSessions >= 5 && attendanceRate < 75)) {
        const allowableAbsences = Math.max(0, Math.floor(data.totalSessions * 0.25));
        atRiskStudents.push({
          ...data,
          allowableRemaining: Math.max(0, allowableAbsences - data.absences),
          attendanceRate: Math.round(attendanceRate),
        });
      }
    });

    // Sort at-risk students by absences (descending)
    atRiskStudents.sort((a, b) => b.absences - a.absences);

    // Sort class performance by attendance (descending)
    classPerformance.sort((a, b) => b.attendance - a.attendance);

    // Calculate attendance trends (last 7 days)
    const today = new Date();
    const recentTrends: { date: string; attendance: number }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRecords = allAttendanceRecords.filter(r => r.date === dateStr);
      const dayPresentOrLate = dayRecords.filter(
        r => r.status === "present" || r.status === "late"
      ).length;
      const dayAttendance = dayRecords.length > 0
        ? Math.round((dayPresentOrLate / dayRecords.length) * 100)
        : 0;
      
      recentTrends.push({
        date: dateStr,
        attendance: dayAttendance,
      });
    }

    return {
      totalClasses: classes.length,
      totalStudents,
      averageAttendance,
      atRiskStudents: atRiskStudents.slice(0, 10), // Top 10 at-risk
      classPerformance,
      recentTrends,
    };
  },
});

// Get student analytics (for student users)
export const getStudentAnalytics = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all classes the student is enrolled in
    const memberships = await ctx.db
      .query("classMembers")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    if (memberships.length === 0) {
      return {
        totalClasses: 0,
        overallAttendance: 0,
        classPerformance: [],
        recentAttendance: [],
        stats: { present: 0, late: 0, absent: 0, excused: 0 },
      };
    }

    let allRecords: any[] = [];
    const classPerformance: any[] = [];

    for (const membership of memberships) {
      const cls = await ctx.db.get(membership.classId);
      if (!cls) continue;

      // Get all attendance records for this class
      const classRecords = await ctx.db
        .query("attendance")
        .withIndex("by_class", (q) => q.eq("classId", membership.classId))
        .collect();

      // Filter for this student
      const studentRecords = classRecords.filter(r => r.studentId === args.studentId);
      allRecords = allRecords.concat(studentRecords);

      // Calculate class-specific stats
      const present = studentRecords.filter(r => r.status === "present").length;
      const late = studentRecords.filter(r => r.status === "late").length;
      const absent = studentRecords.filter(r => r.status === "absent").length;
      const total = studentRecords.length;
      
      const attendance = total > 0 
        ? Math.round(((present + late) / total) * 100)
        : 0;

      classPerformance.push({
        id: cls._id,
        name: cls.name,
        code: cls.code,
        description: cls.description,
        attendance,
        present,
        late,
        absent,
        totalSessions: total,
      });
    }

    // Calculate overall stats
    const stats = {
      present: allRecords.filter(r => r.status === "present").length,
      late: allRecords.filter(r => r.status === "late").length,
      absent: allRecords.filter(r => r.status === "absent").length,
      excused: allRecords.filter(r => r.status === "excused").length,
    };

    const overallAttendance = allRecords.length > 0
      ? Math.round(((stats.present + stats.late) / allRecords.length) * 100)
      : 0;

    // Get recent attendance (last 10 records)
    const recentAttendance = allRecords
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map(r => ({
        date: r.date,
        status: r.status,
        classId: r.classId,
      }));

    // Sort class performance by attendance
    classPerformance.sort((a, b) => b.attendance - a.attendance);

    return {
      totalClasses: memberships.length,
      overallAttendance,
      classPerformance,
      recentAttendance,
      stats,
    };
  },
});

// Get class settings
export const getClassSettings = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const cls = await ctx.db.get(args.classId);
    if (!cls) return null;

    return {
      name: cls.name,
      description: cls.description || "",
      autoMarkAbsent: cls.autoMarkAbsent ?? true,
      allowLateSubmissions: cls.allowLateSubmissions ?? false,
      sendReminders: cls.sendReminders ?? true,
      requireConfirmation: cls.requireConfirmation ?? false,
    };
  },
});

// Update class settings
export const updateClassSettings = mutation({
  args: {
    classId: v.id("classes"),
    teacherId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    autoMarkAbsent: v.boolean(),
    allowLateSubmissions: v.boolean(),
    sendReminders: v.boolean(),
    requireConfirmation: v.boolean(),
  },
  handler: async (ctx, args) => {
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    if (cls.teacherId !== args.teacherId) {
      throw new Error("Only the class teacher can update settings");
    }

    await ctx.db.patch(args.classId, {
      name: args.name,
      description: args.description,
      autoMarkAbsent: args.autoMarkAbsent,
      allowLateSubmissions: args.allowLateSubmissions,
      sendReminders: args.sendReminders,
      requireConfirmation: args.requireConfirmation,
    });

    return { success: true };
  },
});

// Get class beadles
export const getClassBeadles = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const beadles = await ctx.db
      .query("classMembers")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .filter((q) => q.eq(q.field("isBeadle"), true))
      .collect();

    const enrichedBeadles = await Promise.all(
      beadles.map(async (beadle) => {
        const student = await ctx.db.get(beadle.studentId);
        if (!student) return null;
        return {
          id: beadle.studentId as string,
          name: student.name,
          email: student.email,
          membershipId: beadle._id as string,
        };
      })
    );

    return enrichedBeadles.filter((b): b is NonNullable<typeof b> => b !== null);
  },
});

// Add a beadle to a class
export const addBeadle = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("users"),
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    if (cls.teacherId !== args.teacherId) {
      throw new Error("Only the class teacher can add beadles");
    }

    // Find the membership record
    const membership = await ctx.db
      .query("classMembers")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", args.classId).eq("studentId", args.studentId)
      )
      .first();

    if (!membership) {
      throw new Error("Student is not a member of this class");
    }

    // Update the membership to mark as beadle
    await ctx.db.patch(membership._id, {
      isBeadle: true,
    });

    return { success: true };
  },
});

// Remove a beadle from a class
export const removeBeadle = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("users"),
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    if (cls.teacherId !== args.teacherId) {
      throw new Error("Only the class teacher can remove beadles");
    }

    // Find the membership record
    const membership = await ctx.db
      .query("classMembers")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", args.classId).eq("studentId", args.studentId)
      )
      .first();

    if (!membership) {
      throw new Error("Student is not a member of this class");
    }

    // Update the membership to remove beadle status
    await ctx.db.patch(membership._id, {
      isBeadle: false,
    });

    return { success: true };
  },
});

// Get available students (non-beadles) for beadle selection
export const getAvailableStudentsForBeadle = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("classMembers")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .filter((q) => q.neq(q.field("isBeadle"), true))
      .collect();

    const students = await Promise.all(
      members.map(async (m) => {
        const student = await ctx.db.get(m.studentId);
        if (!student) return null;
        return {
          id: student._id as string,
          name: student.name,
          email: student.email,
        };
      })
    );

    return students.filter((s): s is NonNullable<typeof s> => s !== null);
  },
});

// Check if a user is a beadle for a class
export const isUserBeadle = query({
  args: { 
    classId: v.id("classes"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("classMembers")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", args.classId).eq("studentId", args.userId)
      )
      .first();

    return membership?.isBeadle === true;
  },
});

// Assign beadle role to a student (alias for addBeadle)
export const assignBeadle = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get the class to verify it exists and get teacherId
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    // Find the membership record
    const membership = await ctx.db
      .query("classMembers")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", args.classId).eq("studentId", args.studentId)
      )
      .first();

    if (!membership) {
      throw new Error("Student is not a member of this class");
    }

    // Check if already a beadle
    if (membership.isBeadle) {
      throw new Error("Student is already a beadle for this class");
    }

    // Update the membership to mark as beadle
    await ctx.db.patch(membership._id, {
      isBeadle: true,
    });

    return { success: true, message: "Student has been assigned as beadle" };
  },
});

// Revoke beadle access from a student (alias for removeBeadle)
export const revokeBeadleAccess = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get the class to verify it exists
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    // Find the membership record
    const membership = await ctx.db
      .query("classMembers")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", args.classId).eq("studentId", args.studentId)
      )
      .first();

    if (!membership) {
      throw new Error("Student is not a member of this class");
    }

    // Check if the student is actually a beadle
    if (!membership.isBeadle) {
      throw new Error("Student is not a beadle for this class");
    }

    // Update the membership to remove beadle status
    await ctx.db.patch(membership._id, {
      isBeadle: false,
    });

    return { success: true, message: "Beadle access has been revoked" };
  },
});

// Get student's role/membership info for a class
export const getStudentClassRole = query({
  args: {
    classId: v.id("classes"),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("classMembers")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", args.classId).eq("studentId", args.studentId)
      )
      .first();

    if (!membership) {
      return null;
    }

    return {
      isMember: true,
      isBeadle: membership.isBeadle === true,
      joinedAt: membership.joinedAt,
    };
  },
});
