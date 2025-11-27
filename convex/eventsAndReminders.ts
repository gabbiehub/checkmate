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

    let classEvents: any[] = [];

    if (user.role === "teacher") {
      // Get all classes taught by this teacher
      const classes = await ctx.db
        .query("classes")
        .withIndex("by_teacher", (q) => q.eq("teacherId", args.userId))
        .collect();
      
      // Get all events for these classes
      for (const classInfo of classes) {
        const events = await ctx.db
          .query("events")
          .withIndex("by_class", (q) => q.eq("classId", classInfo._id))
          .collect();
        
        const enrichedEvents = events.map((event) => ({
          ...event,
          className: classInfo.name,
        }));
        
        classEvents.push(...enrichedEvents);
      }
    } else {
      // Get all classes the student is enrolled in
      const memberships = await ctx.db
        .query("classMembers")
        .withIndex("by_student", (q) => q.eq("studentId", args.userId))
        .collect();
      
      // Get class details and events for each membership
      for (const membership of memberships) {
        const classInfo = await ctx.db.get(membership.classId);
        if (!classInfo) continue;
          const events = await ctx.db
          .query("events")
          .withIndex("by_class", (q) => q.eq("classId", classInfo._id))
          .collect();
        
        const enrichedEvents = events
          .filter((event) => !event.isPersonal) // Only non-personal (class-wide) events
          .map((event) => ({
            ...event,
            className: classInfo.name,
          }));
        
        classEvents.push(...enrichedEvents);
      }
    }    // Get personal events for this user
    const personalEvents = await ctx.db
      .query("events")
      .withIndex("by_creator", (q) => q.eq("createdBy", args.userId))
      .collect();
    
    const enrichedPersonalEvents = personalEvents
      .filter((event) => event.isPersonal) // Only personal events
      .map((event) => ({
        ...event,
        className: "Personal",
      }));

    return [...classEvents, ...enrichedPersonalEvents];
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
    }    const allEvents = [];
    for (const classInfo of classes) {
      if (!classInfo) continue;
      
      const events = await ctx.db
        .query("events")
        .withIndex("by_class", (q) => q.eq("classId", classInfo._id))
        .collect();
      
      // Filter by date range and enrich with class info
      const filteredEvents = events
        .filter((event) => {
          // For students, only include class-wide events
          if (user.role === "student" && event.isPersonal) {
            return false;
          }
          return event.date >= args.startDate && event.date <= args.endDate;
        })
        .map((event) => ({
          ...event,
          className: classInfo.name,
        }));
      
      allEvents.push(...filteredEvents);
    }

    // Get personal events for this user
    const personalEvents = await ctx.db
      .query("events")
      .withIndex("by_creator", (q) => q.eq("createdBy", args.userId))
      .collect();
    
    const filteredPersonalEvents = personalEvents
      .filter((event) => 
        event.isPersonal && 
        event.date >= args.startDate && 
        event.date <= args.endDate
      )
      .map((event) => ({
        ...event,
        className: "Personal",
      }));

    return [...allEvents, ...filteredPersonalEvents];
  },
});

// Get events for a class
export const getClassEvents = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const classInfo = await ctx.db.get(args.classId);
    if (!classInfo) {
      return [];
    }

    const events = await ctx.db
      .query("events")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    // Filter out personal events - only show class-wide events
    const classWideEvents = events.filter((event) => !event.isPersonal);

    return classWideEvents.map((event) => ({
      ...event,
      className: classInfo.name,
    }));
  },
});

// Create an event
export const createEvent = mutation({
  args: {
    classId: v.optional(v.id("classes")),
    title: v.string(),
    description: v.optional(v.string()),
    date: v.string(),
    time: v.optional(v.string()),
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
    isPersonal: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.createdBy);
    if (!user) {
      throw new Error("User not found");
    }

    // If it's a class event, verify the user has permission
    if (args.classId && !args.isPersonal) {
      const cls = await ctx.db.get(args.classId);
      if (!cls) {
        throw new Error("Class not found");
      }
      
      // Only teachers can create class-wide events
      if (user.role !== "teacher" || cls.teacherId !== args.createdBy) {
        throw new Error("Only the class teacher can create class-wide events");
      }
    }    return await ctx.db.insert("events", {
      classId: args.classId,
      title: args.title,
      description: args.description,
      date: args.date,
      time: args.time,
      eventType: args.eventType,
      classType: args.classType,
      createdBy: args.createdBy,
      isPersonal: args.isPersonal || false, // Default to false if not provided
      createdAt: Date.now(),
    });
  },
});

// Update an event
export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.string()),
    time: v.optional(v.string()),
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
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user has permission to update this event
    if (event.createdBy !== args.userId) {
      throw new Error("You don't have permission to update this event");
    }

    // Build update object with only provided fields
    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.date !== undefined) updates.date = args.date;
    if (args.time !== undefined) updates.time = args.time;
    if (args.eventType !== undefined) updates.eventType = args.eventType;
    if (args.classType !== undefined) updates.classType = args.classType;

    await ctx.db.patch(args.eventId, updates);
    return { success: true };
  },
});

// Delete an event
export const deleteEvent = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user has permission to delete this event
    if (event.createdBy !== args.userId) {
      throw new Error("You don't have permission to delete this event");
    }

    await ctx.db.delete(args.eventId);
    return { success: true };
  },
});

// Get reminders for a user
export const getUserReminders = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }    // Get personal reminders
    const personalReminders = await ctx.db
      .query("reminders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const filteredPersonalReminders = personalReminders.filter((r) => !r.isClassWide);

    let classReminders: any[] = [];

    if (user.role === "student") {
      // Get all classes the student is enrolled in
      const memberships = await ctx.db
        .query("classMembers")
        .withIndex("by_student", (q) => q.eq("studentId", args.userId))
        .collect();      // Get class-wide reminders for each class
      for (const membership of memberships) {
        const reminders = await ctx.db
          .query("reminders")
          .withIndex("by_class", (q) => q.eq("classId", membership.classId))
          .collect();
        
        const classWideReminders = reminders.filter((r) => r.isClassWide);
        
        const classInfo = await ctx.db.get(membership.classId);
        
        const enrichedReminders = classWideReminders.map((reminder) => ({
          ...reminder,
          className: classInfo?.name || "Unknown Class",
        }));

        classReminders.push(...enrichedReminders);
      }
    }

    return [...filteredPersonalReminders, ...classReminders];
  },
});

// Create a reminder
export const createReminder = mutation({
  args: {
    userId: v.id("users"),
    classId: v.optional(v.id("classes")),
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.string(),
    isClassWide: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // If creating a class-wide reminder, verify teacher permission
    if (args.isClassWide && args.classId) {
      const cls = await ctx.db.get(args.classId);
      if (!cls) {
        throw new Error("Class not found");
      }
      
      if (user.role !== "teacher" || cls.teacherId !== args.userId) {
        throw new Error("Only the class teacher can create class-wide reminders");
      }
    }    return await ctx.db.insert("reminders", {
      userId: args.userId,
      classId: args.classId,
      title: args.title,
      description: args.description,
      dueDate: args.dueDate,
      completed: false,
      isClassWide: args.isClassWide || false, // Default to false if not provided
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
