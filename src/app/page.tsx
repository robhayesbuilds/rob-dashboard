'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

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

function StatusDot({ status }: { status: string }) {
  const colors = {
    ok: 'bg-emerald-500',
    error: 'bg-red-500',
    pending: 'bg-amber-500',
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[status as keyof typeof colors] || colors.pending} animate-pulse`} />
  );
}

function StatCard({ title, value, subtitle, icon, trend }: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
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
  const typeConfig = {
    social: { icon: '📱', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    build: { icon: '🔨', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    research: { icon: '📚', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    other: { icon: '📝', color: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' },
  };
  const config = typeConfig[activity.type as keyof typeof typeConfig] || typeConfig.other;
  
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-card/30 hover:bg-card/50 transition-colors group">
      <div className="text-2xl">{config.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-relaxed">{activity.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className={`text-xs ${config.color}`}>
            {activity.type}
          </Badge>
          <span className="text-xs text-muted-foreground">{activity.time}</span>
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

  useEffect(() => {
    if (isAuthenticated) {
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
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-5xl animate-bounce">⚡</div>
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
            <div className="flex items-center gap-4">
              {data?.lastSynced && (
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Synced {new Date(data.lastSynced).toLocaleTimeString()}
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
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
            <TabsTrigger value="overview" className="data-[state=active]:bg-background">
              📊 Overview
            </TabsTrigger>
            <TabsTrigger value="social" className="data-[state=active]:bg-background">
              📱 Social
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-background">
              📝 Activity
            </TabsTrigger>
            <TabsTrigger value="cron" className="data-[state=active]:bg-background">
              ⏰ Cron
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
                icon={<span className="text-xl">📊</span>}
              />
              <StatCard
                title="Social Posts"
                value={socialActivities.length}
                subtitle="X + Reddit engagement"
                icon={<span className="text-xl">📱</span>}
              />
              <StatCard
                title="Build Tasks"
                value={buildActivities.length}
                subtitle="Code & development"
                icon={<span className="text-xl">🔨</span>}
              />
              <StatCard
                title="Active Crons"
                value={data?.cronJobs?.length || 0}
                subtitle="Scheduled jobs"
                icon={<span className="text-xl">⏰</span>}
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Social Stats */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span>📱</span> Social Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* X/Twitter */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold">
                        𝕏
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
                      <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                        R
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
                    <span>✨</span> Today&apos;s Highlights
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
                  <span>🕐</span> Recent Activity
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
                    <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center text-white text-3xl font-bold">
                      𝕏
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
                    <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white text-3xl font-bold">
                      R
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

            {/* Social Activity Feed */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Recent Social Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {socialActivities.length > 0 ? (
                  <div className="space-y-3">
                    {socialActivities.map((activity, i) => (
                      <ActivityItem key={i} activity={activity} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No social activity today yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>📝</span> Activity Log
                </CardTitle>
                <CardDescription>{today}</CardDescription>
              </CardHeader>
              <CardContent>
                {todayActivities.length > 0 ? (
                  <div className="space-y-3">
                    {todayActivities.map((activity, i) => (
                      <ActivityItem key={i} activity={activity} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No activities logged today</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cron Tab */}
          <TabsContent value="cron">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>⏰</span> Scheduled Jobs
                </CardTitle>
                <CardDescription>Automated tasks running in the background</CardDescription>
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
