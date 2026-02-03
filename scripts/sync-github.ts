#!/usr/bin/env npx tsx
/**
 * Sync Script - Reads local memory files and pushes to GitHub as JSON
 * Run via cron every 30 minutes
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const WORKSPACE = process.env.WORKSPACE_PATH || "/home/openclaw/.openclaw/workspace";
const DASHBOARD_PATH = path.join(WORKSPACE, "projects/rob-dashboard");

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
  /prod:[a-z]+-[a-z]+-\d+\|[a-f0-9]+/g, // Convex keys
];

function filterSensitive(text: string): string {
  let filtered = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    filtered = filtered.replace(pattern, "[REDACTED]");
  }
  return filtered;
}

interface Activity {
  date: string;
  time: string;
  type: string;
  description: string;
  platform?: string;
}

interface DashboardData {
  lastSynced: string;
  status: {
    lastActive: string;
    todayHighlights: string[];
  };
  activities: Activity[];
  social: {
    x: { handle: string; followers: number; posts: number; lastUpdated: string };
    reddit: { handle: string; karma: number; comments: number; lastUpdated: string };
  };
  cronJobs: Array<{
    name: string;
    schedule: string;
    nextRun: string;
    status: string;
  }>;
}

function parseActivityLine(line: string, date: string): Activity | null {
  // Match patterns like "07:15 - Did something" or "- **07:15** Did something"
  const timeMatch = line.match(/(\d{1,2}:\d{2})\s*[-:]\s*(.+)/) || 
                    line.match(/\*\*(\d{1,2}:\d{2})\*\*\s*[-:]?\s*(.+)/);
  if (!timeMatch) return null;

  const time = timeMatch[1];
  let description = filterSensitive(timeMatch[2].trim());
  
  // Determine type based on keywords
  let type = "other";
  let platform: string | undefined;
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes("reddit")) {
    type = "social";
    platform = "reddit";
  } else if (lowerDesc.includes("twitter") || lowerDesc.includes("x.com") || lowerDesc.match(/\b(x|tweet|follow)/)) {
    type = "social";
    platform = "x";
  } else if (lowerDesc.includes("build") || lowerDesc.includes("code") ||
             lowerDesc.includes("deploy") || lowerDesc.includes("fix") ||
             lowerDesc.includes("create") || lowerDesc.includes("dashboard")) {
    type = "build";
  } else if (lowerDesc.includes("research") || lowerDesc.includes("study") ||
             lowerDesc.includes("learn") || lowerDesc.includes("read")) {
    type = "research";
  }

  return { date, time, type, description, platform };
}

function parseMemoryFile(filepath: string, date: string): Activity[] {
  const activities: Activity[] = [];
  
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

function getHighlights(filepath: string): string[] {
  const highlights: string[] = [];
  
  try {
    const content = fs.readFileSync(filepath, "utf-8");
    const lines = content.split("\n");
    
    for (const line of lines) {
      if (line.startsWith("### ") || line.startsWith("## ")) {
        const highlight = filterSensitive(line.replace(/^#+\s*/, "").trim());
        if (highlight && !highlight.toLowerCase().includes("password")) {
          highlights.push(highlight);
        }
      }
    }
  } catch (e) {
    // File might not exist
  }
  
  return highlights.slice(0, 5);
}

function parseSocialStats(): DashboardData["social"] {
  const defaultStats: DashboardData["social"] = {
    x: { handle: "@robhayesbuilds", followers: 0, posts: 2, lastUpdated: new Date().toISOString() },
    reddit: { handle: "u/AccordingTart4877", karma: 1, comments: 2, lastUpdated: new Date().toISOString() },
  };

  const socialLogPath = path.join(WORKSPACE, "memory/social-log.md");
  if (!fs.existsSync(socialLogPath)) return defaultStats;

  try {
    const content = fs.readFileSync(socialLogPath, "utf-8");
    
    // Parse X stats
    const xFollowers = content.match(/followers?[:\s]+(\d+)/i);
    const xPosts = content.match(/(?:posts?|replies?|tweets?)[:\s]+(\d+)/i);
    
    if (xFollowers) defaultStats.x.followers = parseInt(xFollowers[1]);
    if (xPosts) defaultStats.x.posts = parseInt(xPosts[1]);

    // Parse Reddit stats  
    const redditKarma = content.match(/karma[:\s]+(\d+)/i);
    const redditComments = content.match(/comments?[:\s]+(\d+)/i);
    
    if (redditKarma) defaultStats.reddit.karma = parseInt(redditKarma[1]);
    if (redditComments) defaultStats.reddit.comments = parseInt(redditComments[1]);
  } catch (e) {
    console.error("Error parsing social log:", e);
  }

  return defaultStats;
}

async function main() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  
  console.log(`[${now.toISOString()}] Starting sync...`);

  // 1. Parse today's activities
  const todayFile = path.join(WORKSPACE, `memory/${today}.md`);
  const activities = fs.existsSync(todayFile) ? parseMemoryFile(todayFile, today) : [];
  
  // 2. Get highlights
  const highlights = fs.existsSync(todayFile) ? getHighlights(todayFile) : [];
  
  // 3. Parse social stats
  const social = parseSocialStats();
  
  // 4. Get cron jobs (read from a simple format or hardcode current ones)
  const cronJobs = [
    { name: "morning-briefing", schedule: "01:00 UTC", nextRun: "Tomorrow 01:00", status: "ok" },
    { name: "social-warmup", schedule: "Every 2h (9-21 UTC)", nextRun: "Next odd hour", status: "ok" },
    { name: "research-session", schedule: "14:00 UTC", nextRun: "Today 14:00", status: "ok" },
    { name: "night-briefing", schedule: "15:00 UTC", nextRun: "Today 15:00", status: "ok" },
    { name: "build-session", schedule: "17:00 UTC", nextRun: "Today 17:00", status: "ok" },
  ];

  // 5. Build the data object
  const data: DashboardData = {
    lastSynced: now.toISOString(),
    status: {
      lastActive: now.toISOString(),
      todayHighlights: highlights,
    },
    activities,
    social,
    cronJobs,
  };

  // 6. Write to public/data.json
  const outputPath = path.join(DASHBOARD_PATH, "public/data.json");
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`Written ${activities.length} activities to ${outputPath}`);

  // 7. Commit and push to GitHub
  try {
    process.chdir(DASHBOARD_PATH);
    execSync("git add public/data.json");
    execSync(`git commit -m "Sync data ${now.toISOString()}" --allow-empty`);
    execSync("git push");
    console.log("Pushed to GitHub");
  } catch (e: any) {
    console.error("Git error:", e.message);
  }

  console.log(`[${new Date().toISOString()}] Sync complete!`);
}

main().catch(console.error);
