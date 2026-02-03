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

interface SocialPost {
  date: string;
  time: string;
  platform: "x" | "reddit";
  type: "post" | "reply" | "comment" | "like" | "follow" | "join";
  content: string;
  link?: string;
}

interface CronRun {
  name: string;
  runAt: string;
  status: "ok" | "error" | "skipped";
  note?: string;
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
  socialHistory: SocialPost[];
  cronJobs: Array<{
    name: string;
    schedule: string;
    nextRun: string;
    status: string;
  }>;
  cronHistory: CronRun[];
}

function parseActivityLine(line: string, date: string): Activity | null {
  // Match patterns like "- 07:15 - Did something" or "07:15 - Did something"
  const timeMatch = line.match(/[-*]?\s*(\d{1,2}:\d{2})\s*[-:]\s*(.+)/) ||
                    line.match(/\*\*(\d{1,2}:\d{2})\*\*\s*[-:]?\s*(.+)/);
  if (!timeMatch) return null;

  const time = timeMatch[1];
  let description = filterSensitive(timeMatch[2].trim());
  
  // Remove markdown formatting
  description = description.replace(/\*\*/g, "").replace(/`/g, "");
  
  // Determine type based on keywords
  let type = "other";
  let platform: string | undefined;
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes("reddit") || lowerDesc.includes("r/")) {
    type = "social";
    platform = "reddit";
  } else if (lowerDesc.includes("twitter") || lowerDesc.includes("x.com") || 
             lowerDesc.includes("@") || lowerDesc.match(/\b(tweet|follow|reply to @)/i)) {
    type = "social";
    platform = "x";
  } else if (lowerDesc.includes("build") || lowerDesc.includes("code") ||
             lowerDesc.includes("deploy") || lowerDesc.includes("fix") ||
             lowerDesc.includes("create") || lowerDesc.includes("dashboard") ||
             lowerDesc.includes("push") || lowerDesc.includes("commit")) {
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
      // Get section headers with ✅ as highlights
      if ((line.includes("✅") || line.includes("SUCCESS")) && 
          (line.startsWith("### ") || line.startsWith("## "))) {
        const highlight = filterSensitive(line.replace(/^#+\s*/, "").trim());
        if (highlight) highlights.push(highlight);
      }
    }
  } catch (e) {
    // File might not exist
  }
  
  return highlights.slice(0, 8);
}

function parseSocialHistory(): { stats: DashboardData["social"]; history: SocialPost[] } {
  const defaultStats: DashboardData["social"] = {
    x: { handle: "@robhayesbuilds", followers: 0, posts: 2, lastUpdated: new Date().toISOString() },
    reddit: { handle: "u/AccordingTart4877", karma: 1, comments: 2, lastUpdated: new Date().toISOString() },
  };
  const history: SocialPost[] = [];

  const socialLogPath = path.join(WORKSPACE, "memory/social-log.md");
  if (!fs.existsSync(socialLogPath)) return { stats: defaultStats, history };

  try {
    const content = fs.readFileSync(socialLogPath, "utf-8");
    const lines = content.split("\n");
    
    // Parse stats from header
    const followersMatch = content.match(/(\d+)\s*followers?/i);
    const postsMatch = content.match(/(\d+)\s*(?:posts?|replies)/i);
    const karmaMatch = content.match(/~?(\d+)\s*karma/i);
    const commentsMatch = content.match(/(\d+)\s*comments?/i);
    
    if (followersMatch) defaultStats.x.followers = parseInt(followersMatch[1]);
    if (postsMatch) defaultStats.x.posts = parseInt(postsMatch[1]);
    if (karmaMatch) defaultStats.reddit.karma = parseInt(karmaMatch[1]);
    if (commentsMatch) defaultStats.reddit.comments = parseInt(commentsMatch[1]);

    // Parse table rows for history
    let currentDate = "";
    for (const line of lines) {
      // Check for date headers
      const dateMatch = line.match(/###\s*(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        currentDate = dateMatch[1];
        continue;
      }
      
      // Parse table rows: | Time | Platform | Type | Content | Link |
      const tableMatch = line.match(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]*)\s*\|/);
      if (tableMatch && !line.includes("---") && !line.toLowerCase().includes("time")) {
        const [, time, platform, type, content, link] = tableMatch;
        
        if (time && platform && type && content) {
          const platformLower = platform.trim().toLowerCase();
          const typeLower = type.trim().toLowerCase();
          
          // Extract link from markdown format [text](url)
          const linkMatch = link?.match(/\[([^\]]+)\]\(([^)]+)\)/);
          const actualLink = linkMatch ? linkMatch[2] : link?.trim();
          
          history.push({
            date: currentDate || new Date().toISOString().split("T")[0],
            time: time.trim(),
            platform: platformLower.includes("reddit") ? "reddit" : "x",
            type: (typeLower.includes("reply") ? "reply" : 
                   typeLower.includes("comment") ? "comment" :
                   typeLower.includes("like") ? "like" :
                   typeLower.includes("follow") ? "follow" :
                   typeLower.includes("join") ? "join" : "post") as SocialPost["type"],
            content: filterSensitive(content.trim()),
            link: actualLink && actualLink !== "-" ? actualLink : undefined,
          });
        }
      }
    }
  } catch (e) {
    console.error("Error parsing social log:", e);
  }

  return { stats: defaultStats, history };
}

function parseCronHistory(): CronRun[] {
  const history: CronRun[] = [];
  
  // Read from memory files to find cron execution logs
  const memoryDir = path.join(WORKSPACE, "memory");
  const files = fs.readdirSync(memoryDir).filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/));
  
  // Get last 7 days of files
  const recentFiles = files.sort().reverse().slice(0, 7);
  
  for (const file of recentFiles) {
    const date = file.replace(".md", "");
    const filepath = path.join(memoryDir, file);
    
    try {
      const content = fs.readFileSync(filepath, "utf-8");
      
      // Look for cron-related entries
      const cronPatterns = [
        { pattern: /morning.?briefing/gi, name: "morning-briefing" },
        { pattern: /social.?warmup/gi, name: "social-warmup" },
        { pattern: /research.?session/gi, name: "research-session" },
        { pattern: /night.?briefing/gi, name: "night-briefing" },
        { pattern: /build.?session/gi, name: "build-session" },
        { pattern: /dashboard.?sync/gi, name: "dashboard-sync" },
      ];
      
      for (const { pattern, name } of cronPatterns) {
        if (pattern.test(content)) {
          // Find the time if mentioned
          const timeMatch = content.match(new RegExp(`(\\d{1,2}:\\d{2}).*${name.replace("-", ".?")}`, "i")) ||
                           content.match(new RegExp(`${name.replace("-", ".?")}.*?(\\d{1,2}:\\d{2})`, "i"));
          
          history.push({
            name,
            runAt: timeMatch ? `${date} ${timeMatch[1]} UTC` : `${date}`,
            status: "ok",
          });
        }
      }
    } catch (e) {
      // Skip files with errors
    }
  }
  
  // Sort by date descending and dedupe
  return history.sort((a, b) => b.runAt.localeCompare(a.runAt)).slice(0, 20);
}

async function main() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  
  console.log(`[${now.toISOString()}] Starting sync...`);

  // 1. Parse today's and yesterday's activities
  const todayFile = path.join(WORKSPACE, `memory/${today}.md`);
  const activities = fs.existsSync(todayFile) ? parseMemoryFile(todayFile, today) : [];
  
  // Also get yesterday for context
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split("T")[0];
  const yesterdayFile = path.join(WORKSPACE, `memory/${yesterday}.md`);
  if (fs.existsSync(yesterdayFile)) {
    activities.push(...parseMemoryFile(yesterdayFile, yesterday));
  }
  
  // Sort by date+time descending
  activities.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  
  // 2. Get highlights
  const highlights = fs.existsSync(todayFile) ? getHighlights(todayFile) : [];
  
  // 3. Parse social stats and history
  const { stats: social, history: socialHistory } = parseSocialHistory();
  
  // 4. Parse cron history
  const cronHistory = parseCronHistory();
  
  // 5. Get current cron jobs
  const cronJobs = [
    { name: "morning-briefing", schedule: "01:00 UTC (8am Bangkok)", nextRun: "Tomorrow 01:00", status: "ok" },
    { name: "social-warmup", schedule: "Every 2h (9-21 UTC)", nextRun: "Next odd hour", status: "ok" },
    { name: "research-session", schedule: "14:00 UTC (9pm Bangkok)", nextRun: "Today 14:00", status: "ok" },
    { name: "night-briefing", schedule: "15:00 UTC (10pm Bangkok)", nextRun: "Today 15:00", status: "ok" },
    { name: "build-session", schedule: "17:00 UTC (midnight Bangkok)", nextRun: "Today 17:00", status: "ok" },
    { name: "dashboard-sync", schedule: "*/30 * * * * (every 30m)", nextRun: "In ~30 min", status: "ok" },
  ];

  // 6. Build the data object
  const data: DashboardData = {
    lastSynced: now.toISOString(),
    status: {
      lastActive: now.toISOString(),
      todayHighlights: highlights,
    },
    activities: activities.slice(0, 50), // Last 50 activities
    social,
    socialHistory: socialHistory.slice(0, 30), // Last 30 social posts
    cronJobs,
    cronHistory,
  };

  // 7. Write to public/data.json
  const outputPath = path.join(DASHBOARD_PATH, "public/data.json");
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`Written ${activities.length} activities, ${socialHistory.length} social posts, ${cronHistory.length} cron runs to ${outputPath}`);

  // 8. Commit and push to GitHub
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
