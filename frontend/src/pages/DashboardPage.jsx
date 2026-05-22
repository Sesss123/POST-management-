import React, { useState, useEffect, useCallback } from 'react';
// Neural Sync Trigger
import { useNavigate } from 'react-router-dom';
import { reportApi, itemApi, announcementApi } from '../api/api';
import { 
  Banknote, 
  TrendingUp,
  Clock,
  Activity,
  Package,
  Layers,
  ChevronRight,
  RefreshCcw,
  Filter,
  CheckCircle2,
  Plus,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Brain,
  Users,
  ShieldAlert,
  Zap,
  Info,
  X
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { StatCard, AppButton, Skeleton, useToast, AppModal, FormInput } from '../components/ui';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f472b6'];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState([]);

  // Phase 5: Neural AI Assistant States
  const [aiDiagnosticState, setAiDiagnosticState] = useState('idle'); // 'idle', 'scanning', 'typing'
  const [aiInsightText, setAiInsightText] = useState('');
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);

  const aiInsightsList = React.useMemo(() => {
    const lowStockCount = stats?.lowStockItems?.length || 0;
    return [
      `⚠️ CRITICAL STOCK PROTOCOL: Low-stock threshold breached (${lowStockCount} items). Recommend initiating bulk supplier replenishments immediately to avoid order bottlenecks during peak rush hours.`,
      `📊 INTENSITY ANALYSIS: Operations peak between 19:00 - 21:30. Real-time queue volume is projected to scale. Pre-cooking high-frequency starters will reduce preparation delay.`,
      `💡 REVENUE VECTOR OUTLOOK: Liquid assets stream is showing positive momentum. Main course segment distribution remains the dominant margin driver. Recommend maintaining current item pricing configurations.`,
      `🎯 OPERATIONS FEEDBACK: Customer tables QR alert metrics are active. Keep cashier terminal notifications responsive to maintain table request resolution times below 1.5 minutes.`
    ];
  }, [stats]);

  const startAiScan = useCallback(() => {
    setAiDiagnosticState('scanning');
    setAiInsightText('');
    
    setTimeout(() => {
      setAiDiagnosticState('typing');
      setCurrentInsightIndex((prev) => (prev + 1) % aiInsightsList.length);
    }, 2000);
  }, [aiInsightsList]);

  // Trigger initial scan when telemetry data is ready
  useEffect(() => {
    if (stats) {
      startAiScan();
    }
  }, [stats, startAiScan]);

  // Typing effect engine
  useEffect(() => {
    if (aiDiagnosticState !== 'typing') return;
    
    const targetText = aiInsightsList[currentInsightIndex];
    let charIndex = 0;
    
    const typingInterval = setInterval(() => {
      if (charIndex < targetText.length) {
        setAiInsightText(targetText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setAiDiagnosticState('idle');
      }
    }, 20);

    return () => clearInterval(typingInterval);
  }, [aiDiagnosticState, currentInsightIndex, aiInsightsList]);
  
  const [dateRange, setDateRange] = useState({
      from: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
  });

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const [statsRes, analyticsRes, annRes] = await Promise.all([
        reportApi.getDashboard(),
        reportApi.getAnalytics(dateRange.from, dateRange.to),
        announcementApi.getActive()
      ]);
      setStats(statsRes.data.data);
      setAnalytics(analyticsRes.data.data);
      if (annRes.data.success) setAnnouncements(annRes.data.data);
    } catch (err) {
      console.error(err);
      addToast('Neural synchronization failure: Check network protocols', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [showRefillModal, setShowRefillModal] = useState(false);
  const [refillItem, setRefillItem] = useState(null);
  const [refillQty, setRefillQty] = useState('');
  const [refillSubmitting, setRefillSubmitting] = useState(false);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(val || 0).replace('LKR', 'Rs.');
  };

  const handleDateChange = (e) => {
      setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRefillSubmit = async (e) => {
      e.preventDefault();
      if (!refillItem || !refillQty) return;
      setRefillSubmitting(true);
      try {
          const payload = {
              purchase_unit_type: refillItem.purchase_unit_type || 'item',
              purchase_unit_qty: parseFloat(refillQty),
              units_per_purchase_unit: 1,
              cost_per_purchase_unit: null,
              note: 'Quick refill from dashboard'
          };
          await itemApi.receiveStock(refillItem.uuid || refillItem.id, payload);
          addToast('Inventory replenished successfully', 'success');
          setShowRefillModal(false);
          setRefillQty('');
          fetchData();
      } catch (error) {
          addToast(error.response?.data?.message || 'Failed to update stock', 'error');
      } finally {
          setRefillSubmitting(false);
      }
  };

  const openRefill = (item) => {
      setRefillItem(item);
      setRefillQty('');
      setShowRefillModal(true);
  };

  if (loading && !stats) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700 bg-slate-50 p-8 rounded-[40px]">
        <header className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-xl">
           <div className="space-y-4">
              <Skeleton className="h-12 w-80 rounded-2xl" />
              <Skeleton className="h-5 w-64 rounded-lg" />
           </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-[36px]" />)}
        </div>
      </div>
    );
  }

  const dismissedAnnouncements = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]');
  const activeAnnouncements = announcements.filter(ann => !dismissedAnnouncements.includes(ann.id));

  const dismissAnnouncement = (id) => {
      const updated = [...dismissedAnnouncements, id];
      localStorage.setItem('dismissedAnnouncements', JSON.stringify(updated));
      setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-1000 pb-12 selection:bg-indigo-500/30 max-w-[1600px] mx-auto">
      {/* 00. ANNOUNCEMENT PROTOCOLS */}
      {activeAnnouncements.length > 0 && (
          <div className="space-y-4 mb-8">
              {activeAnnouncements.map(ann => {
                  const typeStyles = {
                      urgent: "bg-rose-500 border-rose-400 text-white shadow-rose-900/20",
                      warning: "bg-amber-500 border-amber-400 text-white shadow-amber-900/20",
                      success: "bg-emerald-500 border-emerald-400 text-white shadow-emerald-900/20",
                      info: "bg-indigo-600 border-indigo-500 text-white shadow-indigo-900/20"
                  }[ann.type] || "bg-slate-900 border-slate-700 text-white";

                  const Icon = {
                      urgent: ShieldAlert,
                      warning: AlertTriangle,
                      success: Zap,
                      info: Info
                  }[ann.type] || Info;

                  return (
                      <div key={ann.id} className={cn(
                          "relative overflow-hidden p-8 rounded-[3rem] border-2 shadow-2xl transition-all duration-700 animate-in slide-in-from-top-4",
                          typeStyles
                      )}>
                          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-32 -mt-32"></div>
                          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                              <div className="flex items-center gap-6">
                                  <div className="w-16 h-16 bg-white/20 rounded-[1.8rem] flex items-center justify-center border border-white/20 backdrop-blur-xl shadow-inner">
                                      <Icon size={28} />
                                  </div>
                                  <div>
                                      <div className="flex items-center gap-3 mb-1">
                                          <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Command Transmission</span>
                                          <div className="h-1 w-1 rounded-full bg-white/40" />
                                          <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Ref: {ann.id}</span>
                                      </div>
                                      <h3 className="text-2xl font-black tracking-tight uppercase leading-none mb-2">{ann.title}</h3>
                                      <p className="text-sm font-bold opacity-80 max-w-3xl leading-relaxed">{ann.message}</p>
                                  </div>
                              </div>
                              <button 
                                  onClick={() => dismissAnnouncement(ann.id)}
                                  className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/10 group shadow-xl"
                              >
                                  <X size={20} className="group-hover:rotate-90 transition-transform" />
                              </button>
                          </div>
                      </div>
                  );
              })}
          </div>
      )}
      {/* 01. NEURAL COMMAND HEADER */}
      <header className="relative group overflow-hidden rounded-[40px] border border-slate-100 shadow-2xl bg-white p-8">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] opacity-40 group-hover:scale-110 transition-transform duration-1000"></div>
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[500px] h-[500px] bg-purple-50 rounded-full blur-[120px] opacity-40 group-hover:scale-110 transition-transform duration-1000"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex items-center gap-8">
                <div className="w-20 h-20 bg-slate-900 rounded-[28px] flex items-center justify-center text-white shadow-2xl relative group-hover:rotate-6 transition-all duration-500">
                    <Brain size={40} className="text-indigo-400" />
                    <div className="absolute -top-1 -right-1 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-white shadow-sm"></span>
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Sparkles size={16} className="text-indigo-600" />
                        <span className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400">RestoLedger OS v4.0</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Neural Command</h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Real-time enterprise telemetry protocol</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 w-full lg:w-auto">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-[24px] px-6 py-4 shadow-inner w-full sm:w-auto">
                    <Filter size={18} className="text-slate-400 mr-4" />
                    <div className="flex items-center gap-3">
                        <input 
                            type="date" 
                            name="from"
                            value={dateRange.from}
                            onChange={handleDateChange}
                            className="bg-transparent text-xs font-black text-slate-900 outline-none border-none uppercase w-32"
                        />
                        <span className="text-slate-300 text-[10px] font-black mx-2">TO</span>
                        <input 
                            type="date" 
                            name="to"
                            value={dateRange.to}
                            onChange={handleDateChange}
                            className="bg-transparent text-xs font-black text-slate-900 outline-none border-none uppercase w-32"
                        />
                    </div>
                </div>
                <AppButton 
                    variant="primary" 
                    size="lg"
                    onClick={() => fetchData(true)} 
                    loading={refreshing}
                    icon={RefreshCcw}
                    className="rounded-[24px] shadow-2xl shadow-indigo-900/20 h-16 px-10 font-black uppercase text-sm tracking-[0.2em] bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
                >
                    Sync Network
                </AppButton>
            </div>
        </div>
      </header>

      {/* 01.5 NEURAL AI ASSISTANT DIAGNOSTICS */}
      <div className="relative group overflow-hidden rounded-[40px] border border-slate-800/80 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-[0_20px_50px_rgba(99,102,241,0.25)] text-white">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Scan Bar animation when scanning */}
        {aiDiagnosticState === 'scanning' && (
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_20px_rgba(99,102,241,0.8)] opacity-70 animate-scan pointer-events-none"></div>
        )}

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <div className={cn(
              "w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl relative",
              aiDiagnosticState === 'scanning' && "animate-pulse"
            )}>
              <Brain className={cn("text-indigo-400 w-8 h-8", aiDiagnosticState === 'scanning' ? "animate-pulse" : "animate-spin-slow")} />
              {aiDiagnosticState === 'scanning' && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Cognitive Neural Assistant</span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Diagnostics: {aiDiagnosticState.toUpperCase()}</span>
              </div>
              
              <div className="min-h-[50px] font-mono text-sm leading-relaxed text-indigo-100 flex items-start gap-1">
                {aiDiagnosticState === 'scanning' ? (
                  <span className="text-slate-400 italic animate-pulse">Running heuristic operations... Scanning inventory metrics, kitchen cues, and cash balances...</span>
                ) : (
                  <p className="font-mono">
                    {aiInsightText}
                    {aiDiagnosticState === 'typing' && <span className="w-2.5 h-4 bg-indigo-400 animate-blink inline-block ml-1 align-middle"></span>}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            disabled={aiDiagnosticState !== 'idle'}
            onClick={startAiScan}
            className="px-6 py-3.5 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300 border border-white/10 hover:border-indigo-500/30 rounded-2xl flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shrink-0"
          >
            <Sparkles size={14} className="text-indigo-400" />
            Refresh Intelligence
          </button>
        </div>
      </div>

      {/* 02. KPI MATRIX BENTO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-slate-900 to-indigo-900 rounded-[44px] blur opacity-0 group-hover:opacity-10 transition duration-500"></div>
              <StatCard 
                  title="Gross Revenue" 
                  value={formatCurrency(stats?.summary?.todaySales)} 
                  icon={Banknote} 
                  variant="dark"
                  className="border-none shadow-2xl rounded-[40px] h-40"
              />
          </div>
          <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[44px] blur opacity-0 group-hover:opacity-10 transition duration-500"></div>
              <StatCard 
                  title="Liquid Assets" 
                  value={formatCurrency(stats?.summary?.todayCash)} 
                  icon={TrendingUp} 
                  variant="success"
                  className="border-none shadow-2xl rounded-[40px] h-40"
              />
          </div>
          <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[44px] blur opacity-0 group-hover:opacity-10 transition duration-500"></div>
              <StatCard 
                  title="Net Velocity" 
                  value={`${stats?.recentInvoices?.length || 0} Tx/Day`} 
                  icon={Activity} 
                  variant="primary"
                  className="border-none shadow-2xl rounded-[40px] h-40"
              />
          </div>
          <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-rose-500 rounded-[44px] blur opacity-0 group-hover:opacity-10 transition duration-500"></div>
              <StatCard 
                  title="Credit Exposure" 
                  value={formatCurrency(stats?.summary?.totalNaya)} 
                  icon={Users} 
                  variant="credit"
                  className="border-none shadow-2xl rounded-[40px] h-40"
              />
          </div>
      </div>

      {/* 03. INTELLIGENCE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Visual Telemetry */}
          <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl p-10 relative overflow-hidden group">
                  <div className="absolute -right-32 -top-32 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-1000"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 relative z-10 gap-6">
                      <div>
                          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Growth Trajectory</h3>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Revenue vs Collection protocol stream</p>
                      </div>
                      <div className="flex gap-10">
                          <div className="flex items-center gap-4">
                              <div className="w-4 h-4 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
                              <span className="text-xs font-black uppercase text-slate-500 tracking-[0.3em]">Sales</span>
                          </div>
                          <div className="flex items-center gap-4">
                              <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
                              <span className="text-xs font-black uppercase text-slate-500 tracking-[0.3em]">Liquid</span>
                          </div>
                      </div>
                  </div>
                  
                  <div className="h-[360px] w-full relative z-10">
                      {analytics?.salesTrend?.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={analytics?.salesTrend}>
                                  <defs>
                                      <linearGradient id="colorR" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                      </linearGradient>
                                      <linearGradient id="colorL" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#94a3b8' }} dy={15} />
                                  <YAxis hide />
                                  <Tooltip 
                                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.98)', backdropFilter: 'blur(20px)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 35px 70px -15px rgba(0,0,0,0.6)', padding: '24px' }}
                                      itemStyle={{ fontWeight: 900, fontSize: '15px', color: '#fff' }}
                                      labelStyle={{ fontSize: '11px', color: '#6366f1', textTransform: 'uppercase', fontWeight: 900, marginBottom: '12px', letterSpacing: '0.3em' }}
                                  />
                                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={6} fill="url(#colorR)" />
                                  <Area type="monotone" dataKey="collection" stroke="#10b981" strokeWidth={6} fill="url(#colorL)" />
                              </AreaChart>
                          </ResponsiveContainer>
                      ) : <div className="h-full flex items-center justify-center text-slate-300 italic text-sm uppercase tracking-[0.5em] font-black">Awaiting protocol data...</div>}
                  </div>
              </div>

              <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl p-8 relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-6 relative z-10">
                      <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Thermal Load</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Hourly operation intensity</p>
                      </div>
                      <Clock className="text-slate-300 group-hover:rotate-12 transition-transform duration-500" size={24} />
                  </div>
                  <div className="h-[180px] w-full relative z-10">
                        {(analytics?.hourlyDist || analytics?.hourly_dist || analytics?.hourly_distribution)?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics?.hourlyDist || analytics?.hourly_dist || analytics?.hourly_distribution}>
                                      <defs>
                                          <linearGradient id="colorT" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                                              <stop offset="100%" stopColor="#a855f7" stopOpacity={0.7}/>
                                          </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                      <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#94a3b8' }} interval={2} />
                                      <YAxis hide />
                                      <Bar dataKey="count" fill="url(#colorT)" radius={[8, 8, 0, 0]} maxBarSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-300 italic text-sm uppercase tracking-[0.5em] font-black">Scanning active nodes...</div>}
                  </div>
              </div>
          </div>

          {/* Right Bento Column */}
          <div className="lg:col-span-4 space-y-6 flex flex-col">
              <div className="bg-slate-900 rounded-[48px] p-10 shadow-2xl shadow-indigo-900/60 text-white relative overflow-hidden flex-1 min-h-[560px] group/segment">
                  <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[140px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
                  <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[500px] h-[500px] bg-purple-600 rounded-full blur-[140px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>

                  <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-12">
                          <div>
                              <h3 className="text-3xl font-black tracking-tighter uppercase leading-none text-indigo-300">Segment Split</h3>
                              <p className="text-[11px] font-black text-indigo-400/40 uppercase tracking-[0.5em] mt-4">Revenue distribution vector</p>
                          </div>
                          <div className="w-16 h-16 bg-white/5 rounded-[24px] flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shadow-2xl">
                              <Layers size={28} className="text-indigo-400" />
                          </div>
                      </div>

                      <div className="flex-1 min-h-0 relative">
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                              <span className="text-[12px] font-black text-indigo-400/30 uppercase tracking-[0.5em] mb-3">Total magnitude</span>
                              <span className="text-4xl font-black text-white tracking-tighter shadow-indigo-900/60 drop-shadow-2xl">
                                  {formatCurrency(analytics?.categoryDist?.reduce((acc, curr) => acc + curr.value, 0))}
                              </span>
                          </div>

                          {analytics?.categoryDist?.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                      <Pie 
                                          data={analytics?.categoryDist} 
                                          innerRadius={95} 
                                          outerRadius={125} 
                                          paddingAngle={10} 
                                          cornerRadius={20}
                                          dataKey="value" 
                                          stroke="none"
                                          cx="50%"
                                          cy="50%"
                                      >
                                          {analytics?.categoryDist?.map((_, i) => (
                                              <Cell 
                                                  key={i} 
                                                  fill={COLORS[i % COLORS.length]} 
                                                  className="hover:opacity-80 transition-opacity duration-300 cursor-pointer outline-none drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                                              />
                                          ))}
                                      </Pie>
                                      <Tooltip 
                                          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 1)', backdropFilter: 'blur(20px)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.7)' }}
                                          itemStyle={{ fontWeight: 900, fontSize: '15px', color: '#fff' }}
                                          formatter={(value) => formatCurrency(value)}
                                      />
                                  </PieChart>
                              </ResponsiveContainer>
                          ) : <div className="h-full flex items-center justify-center text-white/10 italic text-sm uppercase tracking-[0.6em] font-black">No telemetry nodes found</div>}
                      </div>

                      <div className="grid grid-cols-1 gap-4 mt-12">
                          {analytics?.categoryDist?.slice(0, 3).map((item, i) => (
                              <div key={i} className="bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] rounded-[32px] p-6 transition-all duration-300 group/item cursor-default flex items-center justify-between shadow-lg">
                                  <div className="flex items-center gap-5">
                                      <div className="w-3.5 h-3.5 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.9)]" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                                      <div>
                                          <p className="text-[11px] font-black text-indigo-300/60 uppercase tracking-[0.3em] mb-1.5 group-hover/item:text-white transition-colors">{item.category}</p>
                                          <p className="text-xl font-black text-white">{formatCurrency(item.value)}</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-sm font-black text-indigo-400/40 group-hover/item:text-indigo-400 transition-colors">
                                          {((item.value / analytics?.categoryDist?.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(1)}%
                                      </p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              <div className={cn(
                "rounded-[48px] p-10 shadow-2xl relative overflow-hidden border flex flex-col min-h-[420px] group",
                stats?.lowStockItems?.length > 0 ? "bg-rose-50 border-rose-100 shadow-rose-900/10" : "bg-emerald-50 border-emerald-100 shadow-emerald-900/10"
              )}>
                  <div className="flex items-center justify-between mb-10 relative z-10">
                      <div>
                          <h3 className={cn("text-3xl font-black tracking-tighter uppercase leading-none", stats?.lowStockItems?.length > 0 ? "text-rose-900" : "text-emerald-900")}>
                            Inventory
                          </h3>
                          <p className={cn("text-[11px] font-black uppercase tracking-[0.4em] mt-4", stats?.lowStockItems?.length > 0 ? "text-rose-600/50" : "text-emerald-600/50")}>
                            {stats?.lowStockItems?.length > 0 ? "Critical sync protocol required" : "Asset optimization nominal"}
                          </p>
                      </div>
                      <div className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center border shadow-xl group-hover:scale-110 transition-transform", stats?.lowStockItems?.length > 0 ? "bg-white border-rose-200 text-rose-500" : "bg-white border-emerald-200 text-emerald-500")}>
                        {stats?.lowStockItems?.length > 0 ? <AlertTriangle className="animate-pulse" size={32} /> : <CheckCircle2 size={32} />}
                      </div>
                  </div>

                  <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 relative z-10">
                      {stats?.lowStockItems?.length > 0 ? stats.lowStockItems.slice(0, 5).map(item => (
                          <div key={item.id} onClick={() => openRefill(item)} className="flex items-center justify-between p-6 bg-white/80 rounded-[32px] border border-rose-100 shadow-md cursor-pointer hover:bg-white hover:scale-[1.04] transition-all group/item">
                              <div className="flex flex-col">
                                  <span className="text-base font-black text-slate-800 truncate max-w-[180px] group-hover/item:text-rose-600 transition-colors">{item.name}</span>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Protocol Injection Required</span>
                              </div>
                              <div className="flex items-center gap-5">
                                  <span className="text-sm font-black text-rose-600 bg-rose-50 px-5 py-2 rounded-full border border-rose-100 tabular-nums shadow-sm">{item.stock_qty}</span>
                                  <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-[18px] flex items-center justify-center group-hover/item:bg-rose-600 group-hover/item:text-white transition-all shadow-md">
                                      <Plus size={20} />
                                  </div>
                              </div>
                          </div>
                      )) : (
                          <div className="h-full flex items-center justify-center text-emerald-800/20 text-sm font-black uppercase tracking-[0.6em] italic text-center">All Systems Nominal</div>
                      )}
                  </div>
                  
                  <button onClick={() => navigate('/items')} className={cn("w-full mt-10 py-5 rounded-[28px] text-[12px] font-black uppercase tracking-[0.5em] shadow-2xl transition-all relative z-10", stats?.lowStockItems?.length > 0 ? "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/30" : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/30")}>
                      Asset Audit Registry
                  </button>
              </div>
          </div>
      </div>

      {/* 04. FINANCIAL STREAM TABLE */}
      <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden mt-10 group">
          <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between bg-slate-50/40 gap-8">
              <div className="flex items-center gap-8">
                  <div className="w-20 h-20 bg-white text-indigo-600 rounded-[28px] flex items-center justify-center shadow-2xl border border-slate-100 group-hover:rotate-6 transition-transform duration-500">
                      <Activity size={40} />
                  </div>
                  <div>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Financial Stream</h3>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.4em] mt-3">Live ledger synchronization protocol active</p>
                  </div>
              </div>
              <AppButton variant="secondary" onClick={() => navigate('/invoices')} className="text-[12px] font-black uppercase tracking-[0.4em] rounded-[24px] h-16 px-12 border-slate-200 text-slate-500 hover:text-slate-900 bg-white shadow-xl hover:shadow-2xl transition-all">Archive protocol access</AppButton>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                      <tr className="bg-slate-50/70">
                          <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Ref ID</th>
                          <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Counterparty</th>
                          <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] text-right">Magnitude</th>
                          <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] text-right">Protocol</th>
                          <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] text-right">State</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {stats?.recentInvoices?.length > 0 ? stats.recentInvoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50/100 transition-all cursor-default group/row">
                              <td className="px-12 py-8">
                                  <p className="text-lg font-black text-slate-900 group-hover/row:text-indigo-600 transition-colors tracking-tight">{inv.invoice_no}</p>
                                  <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">{new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • SYNC_PROTO_LVE</p>
                              </td>
                              <td className="px-12 py-8">
                                  <p className="text-lg font-black text-slate-700 uppercase tracking-tighter">{inv.customer_name || 'Anonymous Guest'}</p>
                              </td>
                              <td className="px-12 py-8 text-right font-black text-slate-900 tabular-nums text-lg">
                                  {formatCurrency(inv.grand_total)}
                              </td>
                              <td className="px-12 py-8 text-right">
                                  <span className="text-[11px] font-black uppercase text-indigo-500 bg-indigo-50/100 px-5 py-2.5 rounded-[18px] border border-indigo-100 shadow-md">{inv.payment_method}</span>
                              </td>
                              <td className="px-12 py-8 text-right">
                                  <span className={cn("px-8 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.3em] border shadow-md", inv.payment_status === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200")}>
                                      {inv.payment_status}
                                  </span>
                              </td>
                          </tr>
                      )) : (
                        <tr>
                            <td colSpan="5" className="px-12 py-32 text-center">
                                <div className="flex flex-col items-center opacity-20">
                                    <Activity size={64} className="mb-4 text-slate-400" />
                                    <p className="text-xl font-black uppercase tracking-[0.4em] text-slate-500">No stream detected</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">Awaiting new ledger entries</p>
                                </div>
                            </td>
                        </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* REFILL MODAL */}
      <AppModal isOpen={showRefillModal} onClose={() => setShowRefillModal(false)} title="Intelligence Protocol: Stock Sync" size="md">
        <form onSubmit={handleRefillSubmit} className="space-y-10 p-6">
            <div className="bg-slate-900 p-10 rounded-[44px] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-indigo-500/30 rounded-full blur-[80px]"></div>
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.5em]">Target Asset</span>
                    <span className="text-2xl font-black text-white tracking-tight">{refillItem?.name}</span>
                </div>
                <div className="flex justify-between items-center relative z-10">
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.5em]">Current Magnitude</span>
                    <span className="text-3xl font-black text-rose-500 tabular-nums">{refillItem?.stock_qty} Units</span>
                </div>
            </div>
            
            <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.5em] ml-4">Injection Magnitude protocol</label>
                <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[32px] blur opacity-10 group-focus-within:opacity-40 transition duration-700"></div>
                    <input 
                        type="number" 
                        value={refillQty} 
                        onChange={(e) => setRefillQty(e.target.value)} 
                        placeholder="0.00" 
                        required 
                        autoFocus
                        className="relative w-full bg-white border-2 border-slate-100 rounded-[30px] py-8 px-12 text-5xl font-black text-slate-900 outline-none focus:border-indigo-500 transition-all tabular-nums shadow-2xl"
                    />
                    <div className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-300 font-black uppercase text-sm tracking-[0.5em]">Units</div>
                </div>
            </div>

            <div className="flex gap-8 pt-8">
                <AppButton variant="secondary" className="flex-1 py-8 rounded-[30px] font-black uppercase text-sm tracking-[0.5em] h-20 border-slate-200 bg-white hover:bg-slate-50" type="button" onClick={() => setShowRefillModal(false)}>Abort protocol</AppButton>
                <AppButton variant="primary" className="flex-[2] py-8 rounded-[30px] font-black uppercase text-sm tracking-[0.5em] h-20 bg-indigo-600 hover:bg-indigo-700 border-none shadow-2xl shadow-indigo-600/40" type="submit" loading={refillSubmitting}>Execute Injection</AppButton>
            </div>
        </form>
      </AppModal>
    </div>
  );
};

export default DashboardPage;
