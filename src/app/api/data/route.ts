import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const WORKSPACE = process.env.WORKSPACE_PATH || '/home/openclaw/.openclaw/workspace';

function readFile(filePath: string): string {
  try {
    return fs.readFileSync(path.join(WORKSPACE, filePath), 'utf-8');
  } catch {
    return '';
  }
}

function getToday(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export async function GET() {
  const today = getToday();
  
  // Read memory files
  const memory = readFile('MEMORY.md');
  const todayLog = readFile(`memory/${today}.md`);
  const socialLog = readFile('memory/social-log.md');
  
  // Parse cron jobs from the OpenClaw gateway
  let cronJobs: any[] = [];
  try {
    // We'll fetch this from the API if available, otherwise return empty
    const cronData = await fetch('http://localhost:3033/api/cron/list', {
      headers: { 'Authorization': `Bearer ${process.env.GATEWAY_TOKEN}` }
    }).then(r => r.json()).catch(() => ({ jobs: [] }));
    
    cronJobs = (cronData.jobs || []).map((job: any) => ({
      name: job.name,
      schedule: job.schedule?.expr || 'unknown',
      nextRun: job.state?.nextRunAtMs 
        ? new Date(job.state.nextRunAtMs).toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })
        : 'Not scheduled',
      payload: job.payload?.text?.slice(0, 100) + '...',
      enabled: job.enabled
    }));
  } catch (e) {
    // Cron fetch failed, that's OK
  }

  return NextResponse.json({
    memory: memory.slice(0, 2000),
    todayLog,
    socialLog,
    cronJobs,
    timestamp: new Date().toISOString()
  });
}
