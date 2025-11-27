import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all events for a user (teacher or student)
export const getUserEvents = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }

    let classes: any[] = [];

    if (user.role === "teacher") {
      // Get all classes taught by this teacher
      classes = await ctx.db
        .query("classes")
        .withIndex("by_teacher", (q) => q.eq("teacherId", args.userId))
        .collect();
    } else {
      // Get all classes the student is enrolled in
      const memberships = await ctx.db
        .query("classMembers")
        .withIndex("by_student", (q) => q.eq("studentId", args.userId))
        .collect();
      
      // Get class details for each membership
      classes = (await Promise.all(
        memberships.map((m) => ctx.db.get(m.classId))
      )).filter((c) => c !== null);
    }

    // Get all events for these classes
    const allEvents = [];
    for (const classInfo of classes) {
      if (!classInfo) continue;
      
      const events = await ctx.db
        .query("events")
        .withIndex("by_class", (q) => q.eq("classId", classInfo._id))
        .collect();
      
      // Enrich events with class information
      const enrichedEvents = events.map((event) => ({
        ...event,
        className: classInfo.name,
      }));
      
      allEvents.push(...enrichedEvents);
    }

    return allEvents;
  },
});

// Get events for a specific date range
export const getEventsInRange = query({
  args: { 
    userId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }

    let classes: any[] = [];

    if (user.role === "teacher") {
      classes = await ctx.db
        .query("classes")
        .withIndex("by_teacher", (q) => q.eq("teacherId", args.userId))
        .collect();
    } else {
      const memberships = await ctx.db
        .query("classMembers")
        .withIndex("by_student", (q) => q.eq("studentId", args.userId))
        .collect();
      
      classes = (await Promise.all(
        memberships.map((m) => ctx.db.get(m.classId))
      )).filter((c) => c !== null);
    }

    const allEvents = [];
    for (const classInfo of classes) {
      if (!classInfo) continue;
      
      const events = await ctx.db
        .query("events")
        .withIndex("by_class", (q) => q.eq("classId", classInfo._id))
        .collect();
      
      // Filter by date range and enrich with class info
      const filteredEvents = events
        .filter((event) => event.date >= args.startDate && event.date <= args.endDate)
        .map((event) => ({
          ...event,
          className: classInfo.name,
        }));
      
      allEvents.push(...filteredEvents);
    }

    return allEvents;
  },
});

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
