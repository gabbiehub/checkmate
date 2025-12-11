import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

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
    scheduleNotification: v.optional(v.boolean()), // Whether to schedule a push notification
    notificationMinutesBefore: v.optional(v.number()), // Minutes before event to send notification
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
      
      // Check if user is teacher
      const isTeacher = user.role === "teacher" && cls.teacherId === args.createdBy;
      
      // Check if user is beadle
      const beadleMembership = await ctx.db
        .query("classMembers")
        .withIndex("by_class_and_student", (q) =>
          q.eq("classId", args.classId!).eq("studentId", args.createdBy)
        )
        .first();
      const isBeadle = beadleMembership?.isBeadle === true;
      
      if (!isTeacher && !isBeadle) {
        throw new Error("Only the class teacher or beadles can create class-wide events");
      }
    }

    const eventId = await ctx.db.insert("events", {
      classId: args.classId,
      title: args.title,
      description: args.description,
      date: args.date,
      time: args.time,
      eventType: args.eventType,
      classType: args.classType,
      createdBy: args.createdBy,
      isPersonal: args.isPersonal || false,
      createdAt: Date.now(),
    });

    // Schedule notification if requested
    if (args.scheduleNotification && args.classId && !args.isPersonal) {
      const minutesBefore = args.notificationMinutesBefore ?? 60; // Default 1 hour before
      
      // Calculate notification time
      const eventDateTime = new Date(`${args.date}T${args.time || "09:00"}`);
      const notificationTime = eventDateTime.getTime() - (minutesBefore * 60 * 1000);
      
      // Only schedule if notification time is in the future
      if (notificationTime > Date.now()) {
        await ctx.db.insert("scheduledNotifications", {
          eventId,
          classId: args.classId,
          title: `Upcoming: ${args.title}`,
          body: args.description || `Event scheduled for ${args.date}${args.time ? ` at ${args.time}` : ""}`,
          scheduledFor: notificationTime,
          status: "pending",
          createdBy: args.createdBy,
          createdAt: Date.now(),
        });
      }
    }

    return eventId;
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
    dueTime: v.optional(v.string()),
    isClassWide: v.boolean(),
    scheduleNotification: v.optional(v.boolean()),
    notificationMinutesBefore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // If creating a class-wide reminder, verify teacher or beadle permission
    if (args.isClassWide && args.classId) {
      const cls = await ctx.db.get(args.classId);
      if (!cls) {
        throw new Error("Class not found");
      }
      
      // Check if user is teacher
      const isTeacher = user.role === "teacher" && cls.teacherId === args.userId;
      
      // Check if user is beadle
      const beadleMembership = await ctx.db
        .query("classMembers")
        .withIndex("by_class_and_student", (q) =>
          q.eq("classId", args.classId!).eq("studentId", args.userId)
        )
        .first();
      const isBeadle = beadleMembership?.isBeadle === true;
      
      if (!isTeacher && !isBeadle) {
        throw new Error("Only the class teacher or beadles can create class-wide reminders");
      }
    }

    const reminderId = await ctx.db.insert("reminders", {
      userId: args.userId,
      classId: args.classId,
      title: args.title,
      description: args.description,
      dueDate: args.dueDate,
      completed: false,
      isClassWide: args.isClassWide || false,
      createdAt: Date.now(),
    });

    // Schedule notification if requested
    if (args.scheduleNotification && args.classId && args.isClassWide) {
      const minutesBefore = args.notificationMinutesBefore ?? 60;
      
      const reminderDateTime = new Date(`${args.dueDate}T${args.dueTime || "09:00"}`);
      const notificationTime = reminderDateTime.getTime() - (minutesBefore * 60 * 1000);
      
      if (notificationTime > Date.now()) {
        await ctx.db.insert("scheduledNotifications", {
          reminderId,
          classId: args.classId,
          title: `Reminder: ${args.title}`,
          body: args.description || `Due on ${args.dueDate}${args.dueTime ? ` at ${args.dueTime}` : ""}`,
          scheduledFor: notificationTime,
          status: "pending",
          createdBy: args.userId,
          createdAt: Date.now(),
        });
      }
    }

    return reminderId;
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

// Get pending scheduled notifications
export const getPendingNotifications = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const notifications = await ctx.db
      .query("scheduledNotifications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Return notifications that should be sent (scheduledFor <= now)
    return notifications.filter((n) => n.scheduledFor <= now);
  },
});

// Get scheduled notifications for a class
export const getClassScheduledNotifications = query({
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
      throw new Error("Only the class teacher or beadles can view scheduled notifications");
    }

    const notifications = await ctx.db
      .query("scheduledNotifications")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    // Enrich with creator info
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        const creator = await ctx.db.get(notification.createdBy);
        return {
          ...notification,
          creatorName: creator?.name || "Unknown",
        };
      })
    );

    // Sort by scheduled time, upcoming first
    return enrichedNotifications.sort((a, b) => a.scheduledFor - b.scheduledFor);
  },
});

// Cancel a scheduled notification
export const cancelScheduledNotification = mutation({
  args: {
    notificationId: v.id("scheduledNotifications"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    const cls = await ctx.db.get(notification.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    // Verify user has permission (teacher, beadle, or the creator)
    const isTeacher = cls.teacherId === args.userId;
    const isCreator = notification.createdBy === args.userId;
    const beadleMembership = await ctx.db
      .query("classMembers")
      .withIndex("by_class_and_student", (q) =>
        q.eq("classId", notification.classId).eq("studentId", args.userId)
      )
      .first();
    const isBeadle = beadleMembership?.isBeadle === true;

    if (!isTeacher && !isBeadle && !isCreator) {
      throw new Error("You don't have permission to cancel this notification");
    }

    await ctx.db.patch(args.notificationId, {
      status: "cancelled",
    });

    return { success: true };
  },
});

// Internal mutation to mark notification as sent
export const markNotificationSent = internalMutation({
  args: {
    notificationId: v.id("scheduledNotifications"),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      status: args.success ? "sent" : "failed",
      sentAt: Date.now(),
    });
  },
});

// Internal mutation to process notifications
export const processScheduledNotifications = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const pendingNotifications = await ctx.db
      .query("scheduledNotifications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const toProcess = pendingNotifications.filter((n) => n.scheduledFor <= now);
    
    const results: Array<{ notificationId: Id<"scheduledNotifications">; processed: boolean }> = [];
    
    for (const notification of toProcess) {
      // Get all class members to notify
      const classMembers = await ctx.db
        .query("classMembers")
        .withIndex("by_class", (q) => q.eq("classId", notification.classId))
        .collect();

      const targetIds = notification.targetStudentIds || classMembers.map((m) => m.studentId);

      // Mark as sent (in a real implementation, this would trigger FCM)
      await ctx.db.patch(notification._id, {
        status: "sent",
        sentAt: Date.now(),
      });

      results.push({ notificationId: notification._id, processed: true });
    }

    return {
      processed: results.length,
      results,
    };
  },
});

// Action to send push notifications via external service (FCM)
// This would be called by a scheduled job or cron
export const sendPushNotifications = action({
  args: {},
  handler: async (ctx): Promise<{ processed: number; results: Array<{ notificationId: Id<"scheduledNotifications">; processed: boolean }> }> => {
    // Process pending notifications
    const result = await ctx.runMutation(internal.eventsAndReminders.processScheduledNotifications, {}) as { processed: number; results: Array<{ notificationId: Id<"scheduledNotifications">; processed: boolean }> };
    
    // In a real implementation, you would:
    // 1. Get push subscriptions for target users
    // 2. Call FCM or web-push API to send notifications
    // 3. Update notification status based on delivery results
    
    // Example FCM integration (requires setup):
    // const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `key=${process.env.FCM_SERVER_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     notification: { title, body },
    //     to: fcmToken,
    //   }),
    // });

    return result;
  },
});

// Subscribe to push notifications
export const subscribeToPushNotifications = mutation({
  args: {
    userId: v.id("users"),
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    // Check if subscription already exists
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        userId: args.userId,
        keys: args.keys,
      });
      return existing._id;
    }

    // Create new subscription
    return await ctx.db.insert("pushSubscriptions", {
      userId: args.userId,
      endpoint: args.endpoint,
      keys: args.keys,
      createdAt: Date.now(),
    });
  },
});

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = mutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (subscription) {
      await ctx.db.delete(subscription._id);
    }

    return { success: true };
  },
});

// Get classes where user is a beadle
export const getBeadleClasses = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("classMembers")
      .withIndex("by_student", (q) => q.eq("studentId", args.userId))
      .collect();

    const beadleMemberships = memberships.filter((m) => m.isBeadle === true);

    const classes = await Promise.all(
      beadleMemberships.map(async (m) => {
        const cls = await ctx.db.get(m.classId);
        if (!cls) return null;

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
