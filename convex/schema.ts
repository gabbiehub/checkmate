import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("teacher"), v.literal("student")),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  classes: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    teacherId: v.id("users"),
    code: v.string(), // Join code
    createdAt: v.number(),
  })
    .index("by_teacher", ["teacherId"])
    .index("by_code", ["code"]),

  classMembers: defineTable({
    classId: v.id("classes"),
    studentId: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_class", ["classId"])
    .index("by_student", ["studentId"])
    .index("by_class_and_student", ["classId", "studentId"]),

  attendance: defineTable({
    classId: v.id("classes"),
    studentId: v.id("users"),
    date: v.string(), // ISO date string
    status: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("late"),
      v.literal("excused")
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_class", ["classId"])
    .index("by_student", ["studentId"])
    .index("by_class_and_date", ["classId", "date"]),

  events: defineTable({
    classId: v.id("classes"),
    title: v.string(),
    description: v.optional(v.string()),
    date: v.string(), // ISO date string
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_class", ["classId"])
    .index("by_date", ["date"]),

  reminders: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.string(), // ISO date string
    completed: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_due_date", ["dueDate"]),
});
