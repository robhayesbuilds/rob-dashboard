'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password check - in production use proper auth
    if (password === process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || password === 'robhayes2026') {
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
      fetch('/api/data')
        .then(res => res.json())
        .then(setData)
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold text-white mb-6">🤖 Rob Hayes Dashboard</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full p-3 rounded bg-gray-700 text-white mb-4"
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white p-3 rounded font-semibold hover:bg-indigo-700"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">⚡ Rob Hayes Dashboard</h1>
          <button
            onClick={() => {
              localStorage.removeItem('rob-dashboard-auth');
              setIsAuthenticated(false);
            }}
            className="text-sm text-gray-400 hover:text-white"
          >
            Logout
          </button>
        </div>
      </header>

      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex gap-1 p-2">
          {['overview', 'social', 'activity', 'cron'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab data={data} />}
            {activeTab === 'social' && <SocialTab data={data} />}
            {activeTab === 'activity' && <ActivityTab data={data} />}
            {activeTab === 'cron' && <CronTab data={data} />}
          </>
        )}
      </main>
    </div>
  );
}

function OverviewTab({ data }: { data: any }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card title="📊 Status" color="indigo">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">X Account</span>
            <span className="text-green-400">✅ @robhayesbuilds</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Reddit</span>
            <span className="text-green-400">✅ u/AccordingTart4877</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">GitHub</span>
            <span className="text-green-400">✅ robhayesbuilds</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Vercel</span>
            <span className="text-green-400">✅ Connected</span>
          </div>
        </div>
      </Card>

      <Card title="🎯 Current Focus" color="yellow">
        <ul className="space-y-2 text-sm">
          <li>• Dashboard MVP (tonight)</li>
          <li>• Social warmup (ongoing)</li>
          <li>• SaaS idea validation</li>
        </ul>
      </Card>

      <Card title="📈 Progress" color="green">
        <div className="space-y-2 text-sm">
          <div>Day 2 of building</div>
          <div className="text-gray-400">ShipPage abandoned - pivoting</div>
          <div className="text-gray-400">Accounts warmed up</div>
        </div>
      </Card>

      <Card title="📝 Today's Activity" color="blue">
        <pre className="text-xs text-gray-300 whitespace-pre-wrap max-h-48 overflow-auto">
          {data?.todayLog || 'No activity yet'}
        </pre>
      </Card>

      <Card title="🧠 Memory" color="purple">
        <pre className="text-xs text-gray-300 whitespace-pre-wrap max-h-48 overflow-auto">
          {data?.memory || 'Loading...'}
        </pre>
      </Card>

      <Card title="⏰ Next Cron" color="orange">
        <div className="space-y-1 text-sm">
          {data?.cronJobs?.slice(0, 3).map((job: any, i: number) => (
            <div key={i} className="text-gray-300">
              {job.name}: {job.nextRun}
            </div>
          )) || 'Loading...'}
        </div>
      </Card>
    </div>
  );
}

function SocialTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <Card title="📱 Social Log" color="blue">
        <pre className="text-sm text-gray-300 whitespace-pre-wrap">
          {data?.socialLog || 'No social activity logged'}
        </pre>
      </Card>
    </div>
  );
}

function ActivityTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <Card title="📅 Today's Log" color="green">
        <pre className="text-sm text-gray-300 whitespace-pre-wrap max-h-[600px] overflow-auto">
          {data?.todayLog || 'No activity logged today'}
        </pre>
      </Card>
    </div>
  );
}

function CronTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <Card title="⏰ Scheduled Jobs" color="orange">
        <div className="space-y-4">
          {data?.cronJobs?.map((job: any, i: number) => (
            <div key={i} className="bg-gray-700 p-3 rounded">
              <div className="font-semibold text-white">{job.name}</div>
              <div className="text-sm text-gray-400">Schedule: {job.schedule}</div>
              <div className="text-sm text-gray-400">Next: {job.nextRun}</div>
              <div className="text-xs text-gray-500 mt-1">{job.payload}</div>
            </div>
          )) || 'Loading...'}
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children, color }: { title: string; children: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'border-indigo-500',
    yellow: 'border-yellow-500',
    green: 'border-green-500',
    blue: 'border-blue-500',
    purple: 'border-purple-500',
    orange: 'border-orange-500',
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border-l-4 ${colors[color]}`}>
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}
