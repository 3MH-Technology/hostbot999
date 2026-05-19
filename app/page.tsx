"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Bot, Server, Activity, Settings, LogOut, Plus, Play, Square, 
  RefreshCw, Terminal, Cpu, HardDrive, FileCode, AlertTriangle,
  UploadCloud, Search, MoreVertical, ChevronRight, Clock, Trash2, X
} from "lucide-react";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from "recharts";

interface BotData {
  id: string;
  name: string;
  language: string;
  status: string;
  created_at: string;
  code?: string;
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState("overview");
  const [bots, setBots] = useState<BotData[]>([]);
  const [selectedBot, setSelectedBot] = useState<BotData | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState({ cpu: 0, memory: 0 });
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<any>({ cpu: 0, memory: 0 });
  
  const [isCreating, setIsCreating] = useState(false);
  const [newBot, setNewBot] = useState({ 
    name: "", 
    language: "nodejs", 
    code: "console.log('Bot started successfully!');\nsetInterval(() => console.log('Ping from Node.js Bot'), 5000);" 
  });

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fetch all bots
  const fetchBots = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/bots', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setBots(data);
      
      // Update selected bot status if it exists
      if (selectedBot) {
        const updated = data.find((b: BotData) => b.id === selectedBot.id);
        if (updated) setSelectedBot(updated);
      } else if (data.length > 0) {
        setSelectedBot(data[0]);
      }
    } catch (e) {
      console.error("Failed to fetch bots", e);
    }
  };

  // Check auth on load
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) setIsAuthenticated(true);
  }, []);

  // Initial load and polling for bots status
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchBots();
    const interval = setInterval(fetchBots, 3000);
    return () => clearInterval(interval);
  }, [selectedBot?.id, isAuthenticated]);

  // Fetch logs & metrics for the selected bot
  useEffect(() => {
    if (!selectedBot) return;
    
    const fetchDetails = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const [logsRes, metricsRes] = await Promise.all([
          fetch(`/api/bots/${selectedBot.id}/logs`, { headers }),
          fetch(`/api/bots/${selectedBot.id}/metrics`, { headers })
        ]);
        
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setLogs(logsData.logs || []);
        }
        
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData);
          setMetricsHistory(prev => {
            const newHistory = [...prev, { 
              time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }), 
              cpu: metricsData.cpu, 
              ram: metricsData.memory 
            }];
            if (newHistory.length > 20) newHistory.shift();
            return newHistory;
          });
        }
      } catch (e) {
        console.error("Failed to fetch details", e);
      }
    };

    fetchDetails();
    const interval = setInterval(fetchDetails, 2000);
    return () => clearInterval(interval);
  }, [selectedBot?.id]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Fetch system metrics
  useEffect(() => {
    if (activeTab !== 'overview' && activeTab !== 'system') return;
    
    const fetchSystemMetrics = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/system', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSystemMetrics(data);
        }
      } catch (e) {
        console.error("Failed to fetch system metrics", e);
      }
    };

    fetchSystemMetrics();
    const interval = setInterval(fetchSystemMetrics, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('auth_token', data.token);
        setIsAuthenticated(true);
      } else {
        setLoginError(data.message || data.error || "Invalid credentials");
      }
    } catch (e) {
      setLoginError("Connection failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setBots([]);
    setSelectedBot(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBot.name.trim()) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      await fetch('/api/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBot)
      });
      setIsCreating(false);
      setNewBot({ 
        name: "", 
        language: "nodejs", 
        code: "console.log('Bot started successfully!');\nsetInterval(() => console.log('Ping from Node.js Bot'), 5000);" 
      });
      fetchBots();
    } catch (e) {
      console.error("Failed to create bot", e);
    }
  };

  const handleLanguageChange = (lang: string) => {
    let defaultCode = "console.log('Bot started successfully!');\nsetInterval(() => console.log('Ping from Node.js Bot'), 5000);";

    if (lang === 'python') {
      defaultCode = 'import time\nprint("Bot started successfully!")\nwhile True:\n    print("Ping from Python Bot")\n    time.sleep(5)';
    } else if (lang === 'go') {
      defaultCode = 'package main\n\nimport (\n\t"fmt"\n\t"time"\n)\n\nfunc main() {\n\tfmt.Println("Bot started successfully!")\n\tfor {\n\t\tfmt.Println("Ping from Go Bot")\n\t\ttime.Sleep(5 * time.Second)\n\t}\n}';
    }

    setNewBot({ ...newBot, language: lang, code: defaultCode });
  };

  const handleAction = async (action: 'start' | 'stop' | 'delete', botId?: string) => {
    const targetId = botId || selectedBot?.id;
    if (!targetId) return;
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/bots/${targetId}${action === 'delete' ? '' : `/${action}`}`, { 
        method: action === 'delete' ? 'DELETE' : 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (action === 'delete' && selectedBot?.id === targetId) {
        setSelectedBot(null);
        setLogs([]);
        setMetricsHistory([]);
      }
      fetchBots();
    } catch (e) {
      console.error(`Failed to ${action} bot`, e);
    }
  };

  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const handleDeleteAllBots = async () => {
    try {
      setIsDeletingAll(false);
      const token = localStorage.getItem('auth_token');
      await Promise.all(bots.map(bot => 
        fetch(`/api/bots/${bot.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ));
      setSelectedBot(null);
      setLogs([]);
      setMetricsHistory([]);
      fetchBots();
    } catch (e) {
      console.error("Failed to delete all bots", e);
    }
  };

  const runningBotsCount = bots.filter(b => b.status === 'running').length;
  const errorBotsCount = bots.filter(b => b.status === 'error').length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Server className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100">Welcome to BotOps</h1>
            <p className="text-zinc-500 text-sm mt-2">Sign in to manage your bot fleet</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Username</label>
              <input
                type="text"
                required
                value={loginData.username}
                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                placeholder="••••••••"
              />
            </div>
            {loginError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                {loginError}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98] mt-2"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <Server className="w-6 h-6 text-emerald-500 mr-3" />
          <span className="font-bold text-zinc-100 tracking-wide">BotOps</span>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1">
          {[
            { id: "overview", icon: Activity, label: "Overview" },
            { id: "bots", icon: Bot, label: "My Bots" },
            { id: "system", icon: HardDrive, label: "System Resources" },
            { id: "settings", icon: Settings, label: "Settings" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? "bg-emerald-500/10 text-emerald-400" 
                  : "hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold text-zinc-100 capitalize">
            {activeTab.replace("-", " ")}
          </h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search bots..." 
                className="bg-zinc-900 border border-zinc-800 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all w-64"
              />
            </div>
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-full text-sm font-medium flex items-center transition-colors shadow-lg shadow-emerald-900/20"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Bot
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-6">
                {[
                  { label: "Total Bots", value: bots.length.toString(), icon: Bot, color: "text-blue-400" },
                  { label: "Running", value: runningBotsCount.toString(), icon: Play, color: "text-emerald-400" },
                  { label: "Errors", value: errorBotsCount.toString(), icon: AlertTriangle, color: "text-rose-400" },
                  { label: "System Load", value: `${systemMetrics.cpuUsage ?? 0}%`, icon: Cpu, color: "text-amber-400" },
                ].map((stat, i) => (
                  <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-500 mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-zinc-100">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg bg-zinc-800/50 ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* Bot List */}
                <div className="col-span-1 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col h-[600px]">
                  <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                    <h2 className="font-semibold text-zinc-100">Active Bots</h2>
                    <button className="text-zinc-400 hover:text-zinc-200"><MoreVertical className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 overflow-auto p-2 space-y-1">
                    {bots.length === 0 ? (
                      <div className="text-center text-zinc-500 mt-10 text-sm">No bots found. Create one!</div>
                    ) : (
                      bots.map((bot) => (
                        <button
                          key={bot.id}
                          onClick={() => {
                            setSelectedBot(bot);
                            setMetricsHistory([]); // Reset chart on switch
                          }}
                          className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${
                            selectedBot?.id === bot.id ? "bg-zinc-800" : "hover:bg-zinc-800/50"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${
                              bot.status === 'running' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                              bot.status === 'error' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-zinc-500'
                            }`} />
                            <div>
                              <p className="font-medium text-sm text-zinc-200">{bot.name}</p>
                              <p className="text-xs text-zinc-500 uppercase tracking-wider">{bot.language}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-600" />
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Bot Details & Metrics */}
                {selectedBot ? (
                  <div className="col-span-2 space-y-6">
                    {/* Controls */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h2 className="text-2xl font-bold text-zinc-100 mb-1">{selectedBot.name}</h2>
                          <div className="flex items-center space-x-3 text-sm text-zinc-400">
                            <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> {selectedBot.status}</span>
                            <span>•</span>
                            <span className="flex items-center uppercase"><FileCode className="w-3 h-3 mr-1"/> {selectedBot.language}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {selectedBot.status !== 'running' && (
                            <button onClick={() => handleAction('start')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-emerald-400 transition-colors" title="Start">
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          {selectedBot.status === 'running' && (
                            <button onClick={() => handleAction('stop')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-amber-400 transition-colors" title="Stop">
                              <Square className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => { handleAction('stop'); setTimeout(() => handleAction('start'), 500); }} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-blue-400 transition-colors" title="Restart">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleAction('delete')} className="p-2 bg-zinc-800 hover:bg-rose-900/50 rounded-lg text-rose-400 transition-colors" title="Delete Bot">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Mini Metrics */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-800/50">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-zinc-500 uppercase">CPU Usage</span>
                            <span className="text-sm font-bold text-zinc-200">{metrics.cpu}%</span>
                          </div>
                          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(metrics.cpu, 100)}%` }} />
                          </div>
                        </div>
                        <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-800/50">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-zinc-500 uppercase">Memory</span>
                            <span className="text-sm font-bold text-zinc-200">{metrics.memory} MB</span>
                          </div>
                          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${Math.min((metrics.memory / 1024) * 100, 100)}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Chart */}
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={metricsHistory.length > 0 ? metricsHistory : [{ time: '0', cpu: 0 }]}>
                            <defs>
                              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                              itemStyle={{ color: '#e4e4e7' }}
                            />
                            <Area type="monotone" dataKey="cpu" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Terminal Logs */}
                    <div className="bg-[#0c0c0e] border border-zinc-800 rounded-xl flex flex-col h-64 font-mono text-xs">
                      <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 rounded-t-xl">
                        <div className="flex items-center text-zinc-400">
                          <Terminal className="w-4 h-4 mr-2" />
                          <span>Live Logs</span>
                        </div>
                        <div className="flex space-x-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                        </div>
                      </div>
                      <div className="flex-1 overflow-auto p-4 space-y-1.5 text-zinc-300">
                        {logs.length === 0 ? (
                          <div className="text-zinc-600 italic">No logs available. Start the bot to see output.</div>
                        ) : (
                          logs.map((log, i) => (
                            <div key={i} className={`${
                              log.includes("ERR:") || log.includes("WARN") ? "text-amber-400" : 
                              log.includes("started") ? "text-emerald-400" : ""
                            }`}>
                              {log}
                            </div>
                          ))
                        )}
                        <div ref={logsEndRef} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
                    Select a bot to view details
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "bots" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bots.map((bot) => (
                  <div key={bot.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-100">{bot.name}</h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{bot.language}</p>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        bot.status === 'running' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        bot.status === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                        'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                        {bot.status}
                      </div>
                    </div>
                    <div className="flex-1 text-sm text-zinc-400 mb-6">
                      Created: {new Date(bot.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2 pt-4 border-t border-zinc-800/50">
                      <button 
                        onClick={() => { setActiveTab('overview'); setSelectedBot(bot); }}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        View Details
                      </button>
                      {bot.status !== 'running' && (
                        <button onClick={() => handleAction('start', bot.id)} className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors">
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {bot.status === 'running' && (
                        <button onClick={() => handleAction('stop', bot.id)} className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors">
                          <Square className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {bots.length === 0 && (
                  <div className="col-span-full text-center py-12 bg-zinc-900/30 border border-zinc-800 rounded-xl border-dashed">
                    <Bot className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-zinc-300 mb-2">No bots deployed</h3>
                    <p className="text-zinc-500 mb-6">Create your first bot to get started.</p>
                    <button 
                      onClick={() => setIsCreating(true)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20"
                    >
                      Deploy Bot
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "system" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center">
                    <Cpu className="w-5 h-5 mr-2 text-emerald-400" />
                    CPU Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-400">Total Usage</span>
                        <span className="text-zinc-200 font-medium">{systemMetrics.cpuUsage ?? 0}%</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(systemMetrics.cpuUsage ?? 0, 100)}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase">Cores</p>
                        <p className="text-lg font-medium text-zinc-200">{systemMetrics.cpus || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase">Load Avg (1m)</p>
                        <p className="text-lg font-medium text-zinc-200">{systemMetrics.loadavg?.[0]?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center">
                    <HardDrive className="w-5 h-5 mr-2 text-blue-400" />
                    Memory Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-400">Used Memory</span>
                        <span className="text-zinc-200 font-medium">{systemMetrics.memory?.used || 0} MB / {systemMetrics.memory?.total || 'Unknown'} MB</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${systemMetrics.memory?.usagePercent || 0}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase">Free Memory</p>
                        <p className="text-lg font-medium text-zinc-200">{systemMetrics.memory?.free || 'Unknown'} MB</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 md:col-span-2">
                  <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center">
                    <Server className="w-5 h-5 mr-2 text-purple-400" />
                    System Details
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase">Platform</p>
                      <p className="text-sm font-medium text-zinc-200">{systemMetrics.platform || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase">Architecture</p>
                      <p className="text-sm font-medium text-zinc-200">{systemMetrics.arch || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase">Uptime</p>
                      <p className="text-sm font-medium text-zinc-200">{systemMetrics.uptime ? Math.round(systemMetrics.uptime / 3600) : 0} Hours</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase">Node.js Version</p>
                      <p className="text-sm font-medium text-zinc-200">{systemMetrics.nodeVersion || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6 max-w-3xl">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-zinc-100 mb-4">Platform Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Admin Username</label>
                    <input 
                      type="text" 
                      disabled
                      value="moh777"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-zinc-500 mt-1.5">Username cannot be changed in this version.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Change Password</label>
                    <input 
                      type="password" 
                      placeholder="New password"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 mb-3"
                    />
                    <input 
                      type="password" 
                      placeholder="Confirm new password"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div className="pt-4 border-t border-zinc-800/50">
                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-zinc-900/50 border border-rose-900/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-rose-400 mb-2">Danger Zone</h3>
                <p className="text-sm text-zinc-400 mb-4">Irreversible actions for your platform.</p>
                <button 
                  onClick={() => setIsDeletingAll(true)}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Delete All Bots
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create Bot Modal */}
        {isCreating && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-full">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-zinc-100">Deploy New Bot</h2>
                <button onClick={() => setIsCreating(false)} className="text-zinc-400 hover:text-zinc-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 overflow-auto flex-1 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Bot Name</label>
                  <input 
                    type="text" 
                    required
                    value={newBot.name}
                    onChange={(e) => setNewBot({...newBot, name: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                    placeholder="e.g., SupportBot"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Runtime Environment</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => handleLanguageChange('nodejs')}
                      className={`py-2.5 border rounded-lg text-sm font-medium transition-colors ${newBot.language === 'nodejs' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
                    >
                      Node.js
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleLanguageChange('python')}
                      className={`py-2.5 border rounded-lg text-sm font-medium transition-colors ${newBot.language === 'python' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
                    >
                      Python 3
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLanguageChange('go')}
                      className={`py-2.5 border rounded-lg text-sm font-medium transition-colors ${newBot.language === 'go' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
                    >
                      Go (Golang)
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Bot Source Code</label>
                  <textarea 
                    required
                    value={newBot.code}
                    onChange={(e) => setNewBot({...newBot, code: e.target.value})}
                    className="w-full h-64 bg-[#0c0c0e] border border-zinc-800 rounded-lg px-4 py-3 text-zinc-300 font-mono text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                    spellCheck="false"
                  />
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setIsCreating(false)}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20"
                  >
                    Deploy Bot
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete All Bots Confirmation Modal */}
        {isDeletingAll && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-rose-900/50 rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
              <div className="p-6 border-b border-zinc-800 flex items-center space-x-3">
                <div className="p-2 bg-rose-500/10 rounded-full text-rose-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-zinc-100">Delete All Bots?</h2>
              </div>
              <div className="p-6">
                <p className="text-zinc-400 mb-6">
                  Are you absolutely sure you want to delete all deployed bots? This action is permanent and cannot be undone. All bot data, logs, and configurations will be lost.
                </p>
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => setIsDeletingAll(false)}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteAllBots}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-rose-900/20"
                  >
                    Yes, Delete All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
