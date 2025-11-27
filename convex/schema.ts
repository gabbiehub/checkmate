import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("teacher"), v.literal("student")),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
    // ID field for both students and teachers/employees
    idNumber: v.optional(v.string()),
    // Student-specific field
    studentLevel: v.optional(v.union(
      v.literal("elementary"),
      v.literal("junior_high"),
      v.literal("senior_high"),
      v.literal("college")
    )),
    // Common fields
    phone: v.optional(v.string()),
    office: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),
  classes: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    teacherId: v.id("users"),
    code: v.string(), // Join code
    createdAt: v.number(),
    // Seating chart configuration
    seatingRows: v.optional(v.number()),
    seatingCols: v.optional(v.number()),
    seatingFinalized: v.optional(v.boolean()),
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
    .index("by_class_and_date", ["classId", "date"]),  events: defineTable({
    classId: v.optional(v.id("classes")), // Optional for personal events
    title: v.string(),
    description: v.optional(v.string()),
    date: v.string(), // ISO date string
    time: v.optional(v.string()), // Time of event
    eventType: v.optional(v.union(
      v.literal("exam"),
      v.literal("activity"),
      v.literal("class"),
      v.literal("deadline"),
      v.literal("other")
    )),
    classType: v.optional(v.union(
      v.literal("in-person"),
      v.literal("online"),
      v.literal("async")
    )),
    createdBy: v.id("users"),
    isPersonal: v.optional(v.boolean()), // Optional for backward compatibility
    createdAt: v.number(),
  })
    .index("by_class", ["classId"])
    .index("by_date", ["date"])
    .index("by_creator", ["createdBy"]),
  reminders: defineTable({
    userId: v.id("users"),
    classId: v.optional(v.id("classes")), // For class-wide reminders
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.string(), // ISO date string
    completed: v.boolean(),
    isClassWide: v.optional(v.boolean()), // Optional for backward compatibility
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_due_date", ["dueDate"])
    .index("by_class", ["classId"]),

  // Seating assignments
  seatAssignments: defineTable({
    classId: v.id("classes"),
    studentId: v.id("users"),
    row: v.number(),
    col: v.number(),
    assignedAt: v.number(),
  })
    .index("by_class", ["classId"])
    .index("by_student", ["studentId"])
    .index("by_class_and_position", ["classId", "row", "col"])
    .index("by_class_and_student", ["classId", "studentId"]),
});
