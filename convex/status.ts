import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get current status
export const getCurrent = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("status")
      .withIndex("by_key", (q) => q.eq("key", "current"))
      .first();
  },
});

// Update status
export const update = mutation({
  args: {
    currentTask: v.optional(v.string()),
    lastActive: v.string(),
    todayHighlights: v.array(v.string()),
    lastSynced: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("status")
      .withIndex("by_key", (q) => q.eq("key", "current"))
      .first();
    
    const data = {
      key: "current",
      ...args,
    };
    
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("status", data);
    }
    return { updated: true };
  },
});

// Get daily summary
export const getDailySummary = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailySummaries")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();
  },
});

// Sync daily summary
export const syncDailySummary = mutation({
  args: {
    date: v.string(),
    summary: v.string(),
    socialCount: v.number(),
    buildCount: v.number(),
    totalActivities: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailySummaries")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("dailySummaries", args);
    }
    return { synced: true };
  },
});
