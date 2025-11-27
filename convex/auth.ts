import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Simple auth - In production, use Convex Auth or a proper auth provider
// This is a basic implementation for demonstration

// Sign up a new user
export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(), // In production, hash this!
    name: v.string(),
    role: v.union(v.literal("teacher"), v.literal("student")),
    idNumber: v.optional(v.string()),
    studentLevel: v.optional(v.union(
      v.literal("elementary"),
      v.literal("junior_high"),
      v.literal("senior_high"),
      v.literal("college")
    )),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const now = Date.now();

    // Create new user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      role: args.role,
      createdAt: now,
      idNumber: args.idNumber,
      studentLevel: args.studentLevel,
    });

    // In production, you'd create a session token here
    return {
      userId,
      email: args.email,
      name: args.name,
      role: args.role,
      idNumber: args.idNumber,
      studentLevel: args.studentLevel,
      createdAt: now,
    };
  },
});

// Sign in an existing user
export const signIn = mutation({
  args: {
    email: v.string(),
    password: v.string(), // In production, compare hashed passwords!
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();    if (!user) {
      throw new Error("Invalid email or password");
    }

    // In production, verify password hash here
    // For now, we'll just return the user

    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      idNumber: user.idNumber,
      studentLevel: user.studentLevel,
      phone: user.phone,
      office: user.office,
      createdAt: user.createdAt,
    };
  },
});

// Get current user by email (for checking if logged in)
export const getCurrentUser = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});
