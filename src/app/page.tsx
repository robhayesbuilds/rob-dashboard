'use client';

import { useState, useEffect } from 'react';

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

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'robhayes2026') {
      setIsAuthenticated(true);
      localStorage.setItem('rob-dashboard-auth', 'true');
    } else {
      alert('Wrong password');
    }
  };

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

  const handleLogout = () => {
    localStorage.removeItem('rob-dashboard-auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-gray-800/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-gray-700/50 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🤖</div>
            <h1 className="text-3xl font-bold text-white">Rob Hayes</h1>
            <p className="text-gray-400 mt-2">AI Builder Dashboard</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full p-4 rounded-xl bg-gray-900/50 text-white border border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all mb-4"
          />
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25"
          >
            Access Dashboard
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-5xl mb-4">⚡</div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'social', label: 'Social', icon: '📱' },
    { id: 'activity', label: 'Activity', icon: '📝' },
    { id: 'cron', label: 'Cron Jobs', icon: '⏰' },
  ];

  const today = new Date().toISOString().split('T')[0];
  const todayActivities = data?.activities.filter(a => a.date === today) || [];
  const socialActivities = todayActivities.filter(a => a.type === 'social');
  const buildActivities = todayActivities.filter(a => a.type === 'build');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/30 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🤖</span>
            <div>
              <h1 className="text-xl font-bold text-white">Rob Hayes</h1>
              <p className="text-xs text-gray-400">AI SaaS Builder</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {data?.lastSynced && (
              <span className="text-xs text-gray-500">
                Synced: {new Date(data.lastSynced).toLocaleTimeString()}
              </span>
            )}
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 bg-gray-800/30 p-1 rounded-xl w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 pb-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6 text-red-400">
            Error: {error}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Status Card */}
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>⚡</span> Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Active</span>
                  <span className="text-white">
                    {data?.status?.lastActive 
                      ? new Date(data.status.lastActive).toLocaleTimeString() 
                      : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Today&apos;s Activities</span>
                  <span className="text-white">{todayActivities.length}</span>
                </div>
              </div>
            </div>

            {/* Social Stats */}
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>📱</span> Social
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">𝕏</span>
                    <div>
                      <p className="text-white font-medium">{data?.social?.x?.handle || '@robhayesbuilds'}</p>
                      <p className="text-xs text-gray-400">{data?.social?.x?.posts || 0} posts</p>
                    </div>
                  </div>
                  <span className="text-indigo-400 font-bold">{data?.social?.x?.followers || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔴</span>
                    <div>
                      <p className="text-white font-medium">{data?.social?.reddit?.handle || 'u/AccordingTart4877'}</p>
                      <p className="text-xs text-gray-400">{data?.social?.reddit?.comments || 0} comments</p>
                    </div>
                  </div>
                  <span className="text-orange-400 font-bold">{data?.social?.reddit?.karma || 0} karma</span>
                </div>
              </div>
            </div>

            {/* Today's Highlights */}
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>✨</span> Today&apos;s Highlights
              </h3>
              {data?.status?.todayHighlights && data.status.todayHighlights.length > 0 ? (
                <ul className="space-y-2">
                  {data.status.todayHighlights.map((h, i) => (
                    <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-indigo-400">•</span>
                      {h}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No highlights yet today</p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-xl rounded-2xl p-6 border border-indigo-500/30 md:col-span-2 lg:col-span-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-white">{todayActivities.length}</p>
                  <p className="text-gray-400 text-sm">Activities Today</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-indigo-400">{socialActivities.length}</p>
                  <p className="text-gray-400 text-sm">Social Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-400">{buildActivities.length}</p>
                  <p className="text-gray-400 text-sm">Build Tasks</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-400">{data?.cronJobs?.length || 0}</p>
                  <p className="text-gray-400 text-sm">Active Crons</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* X Card */}
              <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-4xl">𝕏</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">Twitter/X</h3>
                    <p className="text-gray-400">{data?.social?.x?.handle}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-white">{data?.social?.x?.followers || 0}</p>
                    <p className="text-gray-400 text-sm">Followers</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-white">{data?.social?.x?.posts || 0}</p>
                    <p className="text-gray-400 text-sm">Posts/Replies</p>
                  </div>
                </div>
              </div>

              {/* Reddit Card */}
              <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-4xl">🔴</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">Reddit</h3>
                    <p className="text-gray-400">{data?.social?.reddit?.handle}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-white">{data?.social?.reddit?.karma || 0}</p>
                    <p className="text-gray-400 text-sm">Karma</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-white">{data?.social?.reddit?.comments || 0}</p>
                    <p className="text-gray-400 text-sm">Comments</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Activity Feed */}
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Social Activity</h3>
              {socialActivities.length > 0 ? (
                <div className="space-y-3">
                  {socialActivities.map((activity, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-xl">
                      <span className="text-xl">{activity.platform === 'reddit' ? '🔴' : '𝕏'}</span>
                      <div>
                        <p className="text-white">{activity.description}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No social activity today yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Activity Log - {today}</h3>
            {todayActivities.length > 0 ? (
              <div className="space-y-2">
                {todayActivities.map((activity, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-xl hover:bg-gray-900/70 transition-colors"
                  >
                    <span className="text-lg">
                      {activity.type === 'social' ? '📱' : 
                       activity.type === 'build' ? '🔨' : 
                       activity.type === 'research' ? '📚' : '📝'}
                    </span>
                    <div className="flex-1">
                      <p className="text-white">{activity.description}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs text-gray-500">{activity.time}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          activity.type === 'social' ? 'bg-blue-500/20 text-blue-400' :
                          activity.type === 'build' ? 'bg-green-500/20 text-green-400' :
                          activity.type === 'research' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {activity.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No activities logged today yet</p>
            )}
          </div>
        )}

        {activeTab === 'cron' && (
          <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Cron Jobs</h3>
            {data?.cronJobs && data.cronJobs.length > 0 ? (
              <div className="space-y-3">
                {data.cronJobs.map((job, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <span className={`w-3 h-3 rounded-full ${
                        job.status === 'ok' ? 'bg-green-500' : 
                        job.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="text-white font-medium">{job.name}</p>
                        <p className="text-xs text-gray-400">{job.schedule}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-300">{job.nextRun}</p>
                      <p className="text-xs text-gray-500">{job.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No cron jobs configured</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
