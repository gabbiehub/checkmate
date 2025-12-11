import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Seat object validator
const seatValidator = v.object({
  x: v.number(),
  y: v.number(),
  studentId: v.optional(v.id("users")),
  label: v.optional(v.string()),
  isEmpty: v.optional(v.boolean()),
});

// Get seat plan for a class (real-time query)
export const getByClass = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const seatPlan = await ctx.db
      .query("seatPlans")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .first();

    if (!seatPlan) {
      return null;
    }

    // Enrich seats with student information
    const enrichedSeats = await Promise.all(
      seatPlan.seats.map(async (seat) => {
        if (seat.studentId) {
          const student = await ctx.db.get(seat.studentId);
          return {
            ...seat,
            studentName: student?.name,
            studentEmail: student?.email,
            studentIdNumber: student?.idNumber,
          };
        }
        return seat;
      })
    );

    return {
      ...seatPlan,
      seats: enrichedSeats,
    };
  },
});

// Create or update seat plan for a class
export const createOrUpdate = mutation({
  args: {
    classId: v.id("classes"),
    rows: v.number(),
    columns: v.number(),
    seats: v.array(seatValidator),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify the class exists
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    // Check if user is teacher or beadle
    const isTeacher = cls.teacherId === args.userId;
    
    const beadleMembership = await ctx.db
      .query("classMembers")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", args.classId).eq("studentId", args.userId)
      )
      .first();
    const isBeadle = beadleMembership?.isBeadle === true;

    if (!isTeacher && !isBeadle) {
      throw new Error("Only the class teacher or beadles can modify seat plans");
    }

    // Check if seating is finalized (only teacher can edit after finalization)
    if (cls.seatingFinalized && !isTeacher) {
      throw new Error("Seating has been finalized. Only the teacher can make changes.");
    }

    // Check if a seat plan already exists
    const existingPlan = await ctx.db
      .query("seatPlans")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .first();

    const now = Date.now();

    if (existingPlan) {
      // Update existing plan
      await ctx.db.patch(existingPlan._id, {
        rows: args.rows,
        columns: args.columns,
        seats: args.seats,
        updatedAt: now,
      });

      // Also update the class seating dimensions
      await ctx.db.patch(args.classId, {
        seatingRows: args.rows,
        seatingCols: args.columns,
      });

      // Sync seat assignments table for backward compatibility
      await syncSeatAssignments(ctx, args.classId, args.seats);

      return { success: true, planId: existingPlan._id, updated: true };
    } else {
      // Create new plan
      const planId = await ctx.db.insert("seatPlans", {
        classId: args.classId,
        rows: args.rows,
        columns: args.columns,
        seats: args.seats,
        createdAt: now,
        updatedAt: now,
        createdBy: args.userId,
      });

      // Also update the class seating dimensions
      await ctx.db.patch(args.classId, {
        seatingRows: args.rows,
        seatingCols: args.columns,
      });

      // Sync seat assignments table for backward compatibility
      await syncSeatAssignments(ctx, args.classId, args.seats);

      return { success: true, planId, updated: false };
    }
  },
});

// Helper function to sync seatAssignments table
async function syncSeatAssignments(
  ctx: any,
  classId: any,
  seats: Array<{ x: number; y: number; studentId?: any; label?: string; isEmpty?: boolean }>
) {
  // Remove all existing seat assignments for this class
  const existingAssignments = await ctx.db
    .query("seatAssignments")
    .withIndex("by_class", (q: any) => q.eq("classId", classId))
    .collect();

  for (const assignment of existingAssignments) {
    await ctx.db.delete(assignment._id);
  }

  // Create new assignments based on seats
  const now = Date.now();
  for (const seat of seats) {
    if (seat.studentId && !seat.isEmpty) {
      await ctx.db.insert("seatAssignments", {
        classId,
        studentId: seat.studentId,
        row: seat.y,
        col: seat.x,
        assignedAt: now,
      });
    }
  }
}

// Assign a student to a specific seat
export const assignStudentToSeat = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("users"),
    x: v.number(),
    y: v.number(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    // Check if user is teacher or beadle
    const isTeacher = cls.teacherId === args.userId;
    const beadleMembership = await ctx.db
      .query("classMembers")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", args.classId).eq("studentId", args.userId)
      )
      .first();
    const isBeadle = beadleMembership?.isBeadle === true;

    if (!isTeacher && !isBeadle) {
      throw new Error("Only the class teacher or beadles can assign seats");
    }

    if (cls.seatingFinalized && !isTeacher) {
      throw new Error("Seating has been finalized. Only the teacher can make changes.");
    }

    // Get current seat plan
    const seatPlan = await ctx.db
      .query("seatPlans")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .first();

    if (!seatPlan) {
      throw new Error("No seat plan found for this class. Please create one first.");
    }

    // Update seats array
    const updatedSeats = seatPlan.seats.map((seat) => {
      // Remove student from their current seat if they're being moved
      if (seat.studentId === args.studentId) {
        return { ...seat, studentId: undefined };
      }
      // Assign student to new seat
      if (seat.x === args.x && seat.y === args.y) {
        return { ...seat, studentId: args.studentId };
      }
      return seat;
    });

    await ctx.db.patch(seatPlan._id, {
      seats: updatedSeats,
      updatedAt: Date.now(),
    });

    // Sync to seatAssignments table
    await syncSeatAssignments(ctx, args.classId, updatedSeats);

    return { success: true };
  },
});

// Remove a student from their seat
export const removeStudentFromSeat = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("users"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    // Check permissions
    const isTeacher = cls.teacherId === args.userId;
    const beadleMembership = await ctx.db
      .query("classMembers")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", args.classId).eq("studentId", args.userId)
      )
      .first();
    const isBeadle = beadleMembership?.isBeadle === true;

    if (!isTeacher && !isBeadle) {
      throw new Error("Only the class teacher or beadles can remove seat assignments");
    }

    if (cls.seatingFinalized && !isTeacher) {
      throw new Error("Seating has been finalized. Only the teacher can make changes.");
    }

    // Get current seat plan
    const seatPlan = await ctx.db
      .query("seatPlans")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .first();

    if (!seatPlan) {
      throw new Error("No seat plan found for this class");
    }

    // Remove student from their seat
    const updatedSeats = seatPlan.seats.map((seat) => {
      if (seat.studentId === args.studentId) {
        return { ...seat, studentId: undefined };
      }
      return seat;
    });

    await ctx.db.patch(seatPlan._id, {
      seats: updatedSeats,
      updatedAt: Date.now(),
    });

    // Sync to seatAssignments table
    await syncSeatAssignments(ctx, args.classId, updatedSeats);

    return { success: true };
  },
});

// Toggle a seat as empty/disabled
export const toggleSeatEmpty = mutation({
  args: {
    classId: v.id("classes"),
    x: v.number(),
    y: v.number(),
    isEmpty: v.boolean(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    // Check permissions
    const isTeacher = cls.teacherId === args.userId;
    const beadleMembership = await ctx.db
      .query("classMembers")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", args.classId).eq("studentId", args.userId)
      )
      .first();
    const isBeadle = beadleMembership?.isBeadle === true;

    if (!isTeacher && !isBeadle) {
      throw new Error("Only the class teacher or beadles can modify seats");
    }

    // Get current seat plan
    const seatPlan = await ctx.db
      .query("seatPlans")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .first();

    if (!seatPlan) {
      throw new Error("No seat plan found for this class");
    }

    // Update the specific seat
    const updatedSeats = seatPlan.seats.map((seat) => {
      if (seat.x === args.x && seat.y === args.y) {
        return { 
          ...seat, 
          isEmpty: args.isEmpty,
          studentId: args.isEmpty ? undefined : seat.studentId 
        };
      }
      return seat;
    });

    await ctx.db.patch(seatPlan._id, {
      seats: updatedSeats,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Initialize a default seat plan for a class
export const initializeSeatPlan = mutation({
  args: {
    classId: v.id("classes"),
    rows: v.number(),
    columns: v.number(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    // Check permissions
    const isTeacher = cls.teacherId === args.userId;
    const beadleMembership = await ctx.db
      .query("classMembers")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", args.classId).eq("studentId", args.userId)
      )
      .first();
    const isBeadle = beadleMembership?.isBeadle === true;

    if (!isTeacher && !isBeadle) {
      throw new Error("Only the class teacher or beadles can initialize seat plans");
    }

    // Check if a plan already exists
    const existingPlan = await ctx.db
      .query("seatPlans")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .first();

    if (existingPlan) {
      throw new Error("A seat plan already exists for this class");
    }

    // Generate default seat layout
    const seats: Array<{ x: number; y: number; label: string; isEmpty: boolean }> = [];
    for (let y = 0; y < args.rows; y++) {
      for (let x = 0; x < args.columns; x++) {
        seats.push({
          x,
          y,
          label: `${String.fromCharCode(65 + y)}${x + 1}`,
          isEmpty: false,
        });
      }
    }

    const now = Date.now();
    const planId = await ctx.db.insert("seatPlans", {
      classId: args.classId,
      rows: args.rows,
      columns: args.columns,
      seats,
      createdAt: now,
      updatedAt: now,
      createdBy: args.userId,
    });

    // Update class dimensions
    await ctx.db.patch(args.classId, {
      seatingRows: args.rows,
      seatingCols: args.columns,
    });

    return { success: true, planId };
  },
});

// Get unassigned students for a class (students without seats)
export const getUnassignedStudents = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    // Get seat plan
    const seatPlan = await ctx.db
      .query("seatPlans")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .first();

    // Get all class members
    const members = await ctx.db
      .query("classMembers")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    // Get assigned student IDs from seat plan
    const assignedStudentIds = new Set(
      seatPlan?.seats
        .filter((seat) => seat.studentId)
        .map((seat) => seat.studentId) || []
    );

    // Filter unassigned students
    const unassignedMembers = members.filter(
      (member) => !assignedStudentIds.has(member.studentId)
    );

    // Enrich with student information
    const students = await Promise.all(
      unassignedMembers.map(async (member) => {
        const student = await ctx.db.get(member.studentId);
        if (!student) return null;
        return {
          id: student._id,
          name: student.name,
          email: student.email,
          idNumber: student.idNumber,
        };
      })
    );

    return students.filter((s): s is NonNullable<typeof s> => s !== null);
  },
});
