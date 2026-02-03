import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all cron jobs
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("cronJobs").collect();
  },
});

// Sync cron jobs
export const sync = mutation({
  args: {
    jobs: v.array(v.object({
      jobId: v.string(),
      name: v.string(),
      schedule: v.string(),
      lastRun: v.optional(v.string()),
      nextRun: v.optional(v.string()),
      status: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // Clear existing and replace
    const existing = await ctx.db.query("cronJobs").collect();
    for (const job of existing) {
      await ctx.db.delete(job._id);
    }
    
    for (const job of args.jobs) {
      await ctx.db.insert("cronJobs", job);
    }
    return { synced: args.jobs.length };
  },
});
