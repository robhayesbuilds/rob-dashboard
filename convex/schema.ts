import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Daily activity entries
  activities: defineTable({
    date: v.string(), // YYYY-MM-DD
    time: v.string(), // HH:MM
    type: v.string(), // "social", "build", "research", "other"
    description: v.string(),
    metadata: v.optional(v.object({
      platform: v.optional(v.string()),
      url: v.optional(v.string()),
      project: v.optional(v.string()),
    })),
  }).index("by_date", ["date"]),

  // Social media stats
  socialStats: defineTable({
    platform: v.string(), // "x", "reddit"
    handle: v.string(),
    followers: v.number(),
    posts: v.number(),
    engagement: v.optional(v.number()),
    lastUpdated: v.string(),
  }).index("by_platform", ["platform"]),

  // Cron job status
  cronJobs: defineTable({
    jobId: v.string(),
    name: v.string(),
    schedule: v.string(),
    lastRun: v.optional(v.string()),
    nextRun: v.optional(v.string()),
    status: v.string(), // "ok", "error", "pending"
  }).index("by_jobId", ["jobId"]),

  // Overall status
  status: defineTable({
    key: v.string(), // "current" - singleton
    currentTask: v.optional(v.string()),
    lastActive: v.string(),
    todayHighlights: v.array(v.string()),
    lastSynced: v.string(),
  }).index("by_key", ["key"]),

  // Daily summaries
  dailySummaries: defineTable({
    date: v.string(), // YYYY-MM-DD
    summary: v.string(),
    socialCount: v.number(),
    buildCount: v.number(),
    totalActivities: v.number(),
  }).index("by_date", ["date"]),
});
