#!/usr/bin/env npx tsx
/**
 * Sync Script - Reads local memory files and pushes to Convex
 * Run via cron every 30 minutes
 */

import { ConvexHttpClient } from "convex/browser";
import * as fs from "fs";
import * as path from "path";

const WORKSPACE = process.env.WORKSPACE_PATH || "/home/openclaw/.openclaw/workspace";
const CONVEX_URL = process.env.CONVEX_URL || "";

// Sensitive patterns to filter out
const SENSITIVE_PATTERNS = [
  /password[:\s=]+\S+/gi,
  /token[:\s=]+\S+/gi,
  /api[_-]?key[:\s=]+\S+/gi,
  /secret[:\s=]+\S+/gi,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // emails
  /\+\d{1,3}\s?\d{6,14}/g, // phone numbers
  /ghp_[A-Za-z0-9_]+/g, // GitHub tokens
  /sk-[A-Za-z0-9]+/g, // OpenAI keys
  /CONVEX_DEPLOY_KEY/gi,
];

function filterSensitive(text: string): string {
  let filtered = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    filtered = filtered.replace(pattern, "[REDACTED]");
  }
  return filtered;
}

function parseDate(filename: string): string | null {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

interface Activity {
  date: string;
  time: string;
  type: string;
  description: string;
  metadata?: {
    platform?: string;
    url?: string;
    project?: string;
  };
}

function parseActivityLine(line: string, date: string): Activity | null {
  // Match patterns like "07:15 - Did something" or "- 07:15: Did something"
  const timeMatch = line.match(/(\d{1,2}:\d{2})\s*[-:]\s*(.+)/);
  if (!timeMatch) return null;

  const time = timeMatch[1];
  let description = filterSensitive(timeMatch[2].trim());
  
  // Determine type based on keywords
  let type = "other";
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes("reddit") || lowerDesc.includes("twitter") || 
      lowerDesc.includes("x.com") || lowerDesc.includes("follow") ||
      lowerDesc.includes("comment") || lowerDesc.includes("reply") ||
      lowerDesc.includes("post") || lowerDesc.includes("like")) {
    type = "social";
  } else if (lowerDesc.includes("build") || lowerDesc.includes("code") ||
             lowerDesc.includes("deploy") || lowerDesc.includes("fix") ||
             lowerDesc.includes("create") || lowerDesc.includes("update")) {
    type = "build";
  } else if (lowerDesc.includes("research") || lowerDesc.includes("study") ||
             lowerDesc.includes("learn") || lowerDesc.includes("read")) {
    type = "research";
  }

  // Extract platform if social
  let metadata: Activity["metadata"] = undefined;
  if (type === "social") {
    if (lowerDesc.includes("reddit")) {
      metadata = { platform: "reddit" };
    } else if (lowerDesc.includes("twitter") || lowerDesc.includes("x.com") || lowerDesc.includes(" x ")) {
      metadata = { platform: "x" };
    }
  }

  return { date, time, type, description, metadata };
}

function parseMemoryFile(filepath: string): Activity[] {
  const activities: Activity[] = [];
  const filename = path.basename(filepath);
  const date = parseDate(filename);
  
  if (!date) return activities;

  try {
    const content = fs.readFileSync(filepath, "utf-8");
    const lines = content.split("\n");

    for (const line of lines) {
      const activity = parseActivityLine(line, date);
      if (activity) {
        activities.push(activity);
      }
    }
  } catch (e) {
    console.error(`Error reading ${filepath}:`, e);
  }

  return activities;
}

interface SocialStat {
  platform: string;
  handle: string;
  followers: number;
  posts: number;
  engagement?: number;
  lastUpdated: string;
}

function parseSocialLog(): SocialStat[] {
  const stats: SocialStat[] = [];
  const filepath = path.join(WORKSPACE, "memory/social-log.md");
  
  if (!fs.existsSync(filepath)) return stats;

  try {
    const content = fs.readFileSync(filepath, "utf-8");
    
    // Parse X stats
    const xFollowers = content.match(/X.*?followers?[:\s]+(\d+)/i);
    const xPosts = content.match(/X.*?posts?[:\s]+(\d+)/i) || content.match(/X.*?replies?[:\s]+(\d+)/i);
    
    stats.push({
      platform: "x",
      handle: "@robhayesbuilds",
      followers: xFollowers ? parseInt(xFollowers[1]) : 0,
      posts: xPosts ? parseInt(xPosts[1]) : 0,
      lastUpdated: new Date().toISOString(),
    });

    // Parse Reddit stats
    const redditKarma = content.match(/Reddit.*?karma[:\s]+(\d+)/i);
    const redditComments = content.match(/Reddit.*?comments?[:\s]+(\d+)/i);
    
    stats.push({
      platform: "reddit",
      handle: "u/AccordingTart4877",
      followers: redditKarma ? parseInt(redditKarma[1]) : 0,
      posts: redditComments ? parseInt(redditComments[1]) : 0,
      lastUpdated: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Error parsing social log:", e);
  }

  return stats;
}

async function main() {
  if (!CONVEX_URL) {
    console.error("CONVEX_URL not set");
    process.exit(1);
  }

  const client = new ConvexHttpClient(CONVEX_URL);
  const today = new Date().toISOString().split("T")[0];

  console.log(`[${new Date().toISOString()}] Starting sync...`);

  // 1. Sync activities from today's memory file
  const todayFile = path.join(WORKSPACE, `memory/${today}.md`);
  if (fs.existsSync(todayFile)) {
    const activities = parseMemoryFile(todayFile);
    if (activities.length > 0) {
      const result = await client.mutation("activities:sync" as any, { activities });
      console.log(`Activities: synced ${result.added} new of ${activities.length} total`);
    }
  }

  // 2. Sync social stats
  const socialStats = parseSocialLog();
  if (socialStats.length > 0) {
    await client.mutation("social:sync" as any, { stats: socialStats });
    console.log(`Social: synced ${socialStats.length} platforms`);
  }

  // 3. Update status
  const highlights: string[] = [];
  // Read today's file for highlights
  if (fs.existsSync(todayFile)) {
    const content = fs.readFileSync(todayFile, "utf-8");
    const lines = content.split("\n").filter(l => l.startsWith("### ") || l.startsWith("## "));
    highlights.push(...lines.slice(0, 5).map(l => filterSensitive(l.replace(/^#+\s*/, ""))));
  }

  await client.mutation("status:update" as any, {
    lastActive: new Date().toISOString(),
    todayHighlights: highlights,
    lastSynced: new Date().toISOString(),
  });

  console.log(`[${new Date().toISOString()}] Sync complete!`);
}

main().catch(console.error);
