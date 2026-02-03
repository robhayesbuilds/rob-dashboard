'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  IconChartBar,
  IconDeviceMobile,
  IconHammer,
  IconClock,
  IconBrandTwitter,
  IconBrandReddit,
  IconActivity,
  IconNotes,
  IconBook,
  IconSparkles,
  IconLogout,
  IconRefresh,
  IconExternalLink,
  IconHistory,
  IconHeart,
  IconMessageCircle,
  IconUserPlus,
  IconAt,
} from '@tabler/icons-react';

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
  platform: 'x' | 'reddit';
  type: 'post' | 'reply' | 'comment' | 'like' | 'follow' | 'join';
  content: string;
  link?: string;
}

interface CronRun {
  name: string;
  runAt: string;
  status: 'ok' | 'error' | 'skipped';
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

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ok: 'bg-emerald-500',
    error: 'bg-red-500',
    pending: 'bg-amber-500',
    skipped: 'bg-gray-500',
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || colors.pending} animate-pulse`} />
  );
}

function StatCard({ title, value, subtitle, icon }: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: React.ReactNode;
}) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-border transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    social: { icon: <IconDeviceMobile className="w-5 h-5" />, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    build: { icon: <IconHammer className="w-5 h-5" />, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    research: { icon: <IconBook className="w-5 h-5" />, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    other: { icon: <IconNotes className="w-5 h-5" />, color: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' },
  };
  const config = typeConfig[activity.type] || typeConfig.other;
  
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-card/30 hover:bg-card/50 transition-colors group">
      <div className="text-muted-foreground group-hover:text-foreground transition-colors">
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-relaxed">{activity.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className={`text-xs ${config.color}`}>
            {activity.type}
          </Badge>
          <span className="text-xs text-muted-foreground">{activity.date} {activity.time}</span>
        </div>
      </div>
    </div>
  );
}

function SocialPostItem({ post }: { post: SocialPost }) {
  const typeIcons: Record<string, React.ReactNode> = {
    reply: <IconMessageCircle className="w-4 h-4" />,
    comment: <IconMessageCircle className="w-4 h-4" />,
    like: <IconHeart className="w-4 h-4" />,
    follow: <IconUserPlus className="w-4 h-4" />,
    join: <IconUserPlus className="w-4 h-4" />,
    post: <IconAt className="w-4 h-4" />,
  };
  
  const platformIcon = post.platform === 'reddit' 
    ? <IconBrandReddit className="w-5 h-5 text-orange-500" />
    : <IconBrandTwitter className="w-5 h-5" />;
  
  const typeColors: Record<string, string> = {
    reply: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    comment: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    like: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    follow: 'bg-green-500/10 text-green-500 border-green-500/20',
    join: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    post: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };
  
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
      <div className="flex-shrink-0">{platformIcon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-relaxed">{post.content}</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="outline" className={`text-xs ${typeColors[post.type] || ''}`}>
            <span className="mr-1">{typeIcons[post.type]}</span>
            {post.type}
          </Badge>
          <span className="text-xs text-muted-foreground">{post.date} {post.time}</span>
          {post.link && (
            <a 
              href={post.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <IconExternalLink className="w-3 h-3" />
              View
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function CronJobRow({ job }: { job: { name: string; schedule: string; nextRun: string; status: string } }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
      <div className="flex items-center gap-3">
        <StatusDot status={job.status} />
        <div>
          <p className="font-medium text-sm">{job.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{job.schedule}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-muted-foreground">{job.nextRun}</p>
        <Badge variant={job.status === 'ok' ? 'default' : 'destructive'} className="mt-1 text-xs">
          {job.status}
        </Badge>
      </div>
    </div>
  );
}

function CronHistoryItem({ run }: { run: CronRun }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-card/20 hover:bg-card/40 transition-colors">
      <div className="flex items-center gap-3">
        <StatusDot status={run.status} />
        <div>
          <p className="text-sm font-medium">{run.name}</p>
          {run.note && <p className="text-xs text-muted-foreground">{run.note}</p>}
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{run.runAt}</span>
    </div>
  );
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem('rob-dashboard-auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    fetch('/data.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'robhayes2026') {
      setIsAuthenticated(true);
      localStorage.setItem('rob-dashboard-auth', 'true');
    } else {
      alert('Wrong password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rob-dashboard-auth');
    setIsAuthenticated(false);
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md relative bg-card/80 backdrop-blur-xl border-border/50">
          <CardHeader className="text-center space-y-4">
            <Avatar className="w-20 h-20 mx-auto ring-2 ring-primary/20">
              <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=rob" />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">RH</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">Rob Hayes</CardTitle>
              <CardDescription>AI SaaS Builder Dashboard</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground"
              />
              <Button type="submit" className="w-full" size="lg">
                Access Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <IconRefresh className="w-12 h-12 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayActivities = data?.activities.filter(a => a.date === today) || [];
  const socialActivities = todayActivities.filter(a => a.type === 'social');
  const buildActivities = todayActivities.filter(a => a.type === 'build');

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=rob" />
                <AvatarFallback className="bg-primary text-primary-foreground">RH</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-semibold">Rob Hayes</h1>
                <p className="text-xs text-muted-foreground">AI Builder</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {data?.lastSynced && (
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Synced {new Date(data.lastSynced).toLocaleTimeString()}
                </span>
              )}
              <Button variant="ghost" size="icon" onClick={fetchData} disabled={loading}>
                <IconRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <IconLogout className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/10">
            <CardContent className="py-4">
              <p className="text-destructive text-sm">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background gap-2">
              <IconChartBar className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="data-[state=active]:bg-background gap-2">
              <IconDeviceMobile className="w-4 h-4" />
              <span className="hidden sm:inline">Social</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-background gap-2">
              <IconActivity className="w-4 h-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="cron" className="data-[state=active]:bg-background gap-2">
              <IconClock className="w-4 h-4" />
              <span className="hidden sm:inline">Cron</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Activities Today"
                value={todayActivities.length}
                subtitle="Total logged activities"
                icon={<IconChartBar className="w-5 h-5" />}
              />
              <StatCard
                title="Social Posts"
                value={data?.socialHistory?.length || 0}
                subtitle="Total X + Reddit"
                icon={<IconDeviceMobile className="w-5 h-5" />}
              />
              <StatCard
                title="Build Tasks"
                value={buildActivities.length}
                subtitle="Code & development"
                icon={<IconHammer className="w-5 h-5" />}
              />
              <StatCard
                title="Cron Runs"
                value={data?.cronHistory?.length || 0}
                subtitle="Past executions"
                icon={<IconClock className="w-5 h-5" />}
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Social Stats */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconDeviceMobile className="w-5 h-5" />
                    Social Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* X/Twitter */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center">
                        <IconBrandTwitter className="w-5 h-5 text-white dark:text-black" />
                      </div>
                      <div>
                        <p className="font-medium">{data?.social?.x?.handle || '@robhayesbuilds'}</p>
                        <p className="text-xs text-muted-foreground">{data?.social?.x?.posts || 0} posts</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{data?.social?.x?.followers || 0}</p>
                      <p className="text-xs text-muted-foreground">followers</p>
                    </div>
                  </div>

                  {/* Reddit */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                        <IconBrandReddit className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{data?.social?.reddit?.handle || 'u/AccordingTart4877'}</p>
                        <p className="text-xs text-muted-foreground">{data?.social?.reddit?.comments || 0} comments</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{data?.social?.reddit?.karma || 0}</p>
                      <p className="text-xs text-muted-foreground">karma</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Today's Highlights */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconSparkles className="w-5 h-5" />
                    Today&apos;s Highlights
                  </CardTitle>
                  <CardDescription>Key accomplishments</CardDescription>
                </CardHeader>
                <CardContent>
                  {data?.status?.todayHighlights && data.status.todayHighlights.length > 0 ? (
                    <ul className="space-y-3">
                      {data.status.todayHighlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span className="text-primary mt-0.5">●</span>
                          <span className="text-foreground/80">{h}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-sm">No highlights yet today</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconActivity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todayActivities.length > 0 ? (
                  <div className="space-y-3">
                    {todayActivities.slice(0, 5).map((activity, i) => (
                      <ActivityItem key={i} activity={activity} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No activities logged today</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* X Card */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center">
                      <IconBrandTwitter className="w-8 h-8 text-white dark:text-black" />
                    </div>
                    <div>
                      <CardTitle>Twitter / X</CardTitle>
                      <CardDescription>{data?.social?.x?.handle}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-lg bg-background/50">
                      <p className="text-3xl font-bold">{data?.social?.x?.followers || 0}</p>
                      <p className="text-sm text-muted-foreground">Followers</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-background/50">
                      <p className="text-3xl font-bold">{data?.social?.x?.posts || 0}</p>
                      <p className="text-sm text-muted-foreground">Posts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reddit Card */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center">
                      <IconBrandReddit className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <CardTitle>Reddit</CardTitle>
                      <CardDescription>{data?.social?.reddit?.handle}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-lg bg-background/50">
                      <p className="text-3xl font-bold">{data?.social?.reddit?.karma || 0}</p>
                      <p className="text-sm text-muted-foreground">Karma</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-background/50">
                      <p className="text-3xl font-bold">{data?.social?.reddit?.comments || 0}</p>
                      <p className="text-sm text-muted-foreground">Comments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Social History */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconHistory className="w-5 h-5" />
                  Social Activity History
                </CardTitle>
                <CardDescription>All posts, replies, comments, and follows</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.socialHistory && data.socialHistory.length > 0 ? (
                  <div className="space-y-3">
                    {data.socialHistory.map((post, i) => (
                      <SocialPostItem key={i} post={post} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No social activity recorded yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconNotes className="w-5 h-5" />
                  Activity Log
                </CardTitle>
                <CardDescription>Recent activities across all days</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.activities && data.activities.length > 0 ? (
                  <div className="space-y-3">
                    {data.activities.map((activity, i) => (
                      <ActivityItem key={i} activity={activity} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No activities logged</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cron Tab */}
          <TabsContent value="cron" className="space-y-6">
            {/* Active Jobs */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconClock className="w-5 h-5" />
                  Active Cron Jobs
                </CardTitle>
                <CardDescription>Scheduled tasks running automatically</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.cronJobs && data.cronJobs.length > 0 ? (
                  <div className="space-y-3">
                    {data.cronJobs.map((job, i) => (
                      <CronJobRow key={i} job={job} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No cron jobs configured</p>
                )}
              </CardContent>
            </Card>

            {/* Run History */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconHistory className="w-5 h-5" />
                  Execution History
                </CardTitle>
                <CardDescription>Past cron job runs</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.cronHistory && data.cronHistory.length > 0 ? (
                  <div className="space-y-2">
                    {data.cronHistory.map((run, i) => (
                      <CronHistoryItem key={i} run={run} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No execution history found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
