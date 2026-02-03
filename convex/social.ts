import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all social stats
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("socialStats").collect();
  },
});

// Get stats for a platform
export const getByPlatform = query({
  args: { platform: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("socialStats")
      .withIndex("by_platform", (q) => q.eq("platform", args.platform))
      .first();
  },
});

// Sync social stats
export const sync = mutation({
  args: {
    stats: v.array(v.object({
      platform: v.string(),
      handle: v.string(),
      followers: v.number(),
      posts: v.number(),
      engagement: v.optional(v.number()),
      lastUpdated: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    for (const stat of args.stats) {
      const existing = await ctx.db
        .query("socialStats")
        .withIndex("by_platform", (q) => q.eq("platform", stat.platform))
        .first();
      
      if (existing) {
        await ctx.db.patch(existing._id, stat);
      } else {
        await ctx.db.insert("socialStats", stat);
      }
    }
    return { synced: args.stats.length };
  },
});
