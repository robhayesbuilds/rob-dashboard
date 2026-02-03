import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query activities by date
export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
  },
});

// Query recent activities (last 7 days)
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("activities")
      .order("desc")
      .take(limit);
  },
});

// Sync activities (called by sync script)
export const sync = mutation({
  args: {
    activities: v.array(v.object({
      date: v.string(),
      time: v.string(),
      type: v.string(),
      description: v.string(),
      metadata: v.optional(v.object({
        platform: v.optional(v.string()),
        url: v.optional(v.string()),
        project: v.optional(v.string()),
      })),
    })),
  },
  handler: async (ctx, args) => {
    let added = 0;
    for (const activity of args.activities) {
      // Check if activity already exists (by date+time+description)
      const existing = await ctx.db
        .query("activities")
        .withIndex("by_date", (q) => q.eq("date", activity.date))
        .filter((q) => 
          q.and(
            q.eq(q.field("time"), activity.time),
            q.eq(q.field("description"), activity.description)
          )
        )
        .first();
      
      if (!existing) {
        await ctx.db.insert("activities", activity);
        added++;
      }
    }
    return { added, total: args.activities.length };
  },
});

// Clear activities for a date (for re-sync)
export const clearDate = mutation({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    
    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }
    return { deleted: activities.length };
  },
});
