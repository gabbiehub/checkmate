import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all classes for a teacher
export const getTeacherClasses = query({
  args: { teacherId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("classes")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();
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
      memberships.map((m) => ctx.db.get(m.classId))
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
  },
  handler: async (ctx, args) => {
    // Generate a random 6-character join code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const classId = await ctx.db.insert("classes", {
      name: args.name,
      description: args.description,
      teacherId: args.teacherId,
      code,
      createdAt: Date.now(),
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
      memberships.map((m) => ctx.db.get(m.studentId))
    );

    return students.filter((s) => s !== null);
  },
});
