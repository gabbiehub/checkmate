import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get events for a class
export const getClassEvents = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();
  },
});

// Create an event
export const createEvent = mutation({
  args: {
    classId: v.id("classes"),
    title: v.string(),
    description: v.optional(v.string()),
    date: v.string(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("events", {
      classId: args.classId,
      title: args.title,
      description: args.description,
      date: args.date,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });
  },
});

// Get reminders for a user
export const getUserReminders = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reminders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Create a reminder
export const createReminder = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reminders", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      dueDate: args.dueDate,
      completed: false,
      createdAt: Date.now(),
    });
  },
});

// Toggle reminder completion
export const toggleReminder = mutation({
  args: {
    reminderId: v.id("reminders"),
  },
  handler: async (ctx, args) => {
    const reminder = await ctx.db.get(args.reminderId);
    if (!reminder) {
      throw new Error("Reminder not found");
    }

    await ctx.db.patch(args.reminderId, {
      completed: !reminder.completed,
    });
  },
});
