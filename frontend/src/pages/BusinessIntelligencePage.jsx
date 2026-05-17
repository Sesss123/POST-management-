import React, { useState, useEffect, useCallback } from 'react';
import { reportApi } from '../api/api';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Calendar, 
  RefreshCcw, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Layers,
  MousePointer2,
  PieChart as PieIcon,
  Sparkles,
  Search,
  ChevronDown,
  Brain,
  Clock,
  Users
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';
import { AppButton, AppCard, Skeleton, useToast } from '../components/ui';
import { cn } from '../utils/cn';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f472b6'];

const GlassCard = ({ title, subtitle, icon: Icon, children, className }) => (
    <div className={cn(
        "bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[44px] p-8 shadow-xl shadow-slate-200/40 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-100/40 group relative overflow-hidden",
        className
    )}>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors duration-700"></div>
        <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
                {Icon && (
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                        <Icon size={24} />
                    </div>
                )}
                <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight uppercase">{title}</h3>
                    {subtitle && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>}
                </div>
            </div>
            {children}
        </div>
    </div>
);

const BusinessIntelligencePage = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [range, setRange] = useState('7d');
  const [customRange, setCustomRange] = useState({
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
  });

  const fetchBI = useCallback(async () => {
    setLoading(true);
    try {
      const params = range === 'custom' ? customRange : { range };
      const { data: response } = await reportApi.getBI(params);
      if (response.success) {
        setData(response.data);
      }
    } catch (err) {
      toast.error('Intelligence synchronization failure');
    } finally {
      setLoading(false);
    }
  }, [range, customRange, toast]);

  useEffect(() => {
    fetchBI();
  }, [fetchBI]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(val || 0).replace('LKR', 'Rs.');
  };

  const salesTrend = data?.sales_trend || [];
  const categoryData = data?.category_performance || [];
  const hourlyData = data?.hourly_distribution || [];
  const topCustomers = data?.top_customers || [];
  const metrics = data?.metrics || {};

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 selection:bg-indigo-500/30">
      {/* Premium Neural Header - White Design */}
      <header className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 rounded-[48px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white p-10 rounded-[44px] border border-slate-100 shadow-2xl overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
              
              <div className="flex items-center gap-8 relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 relative group-hover:scale-110 transition-transform duration-500">
                      <Brain size={36} />
                      <div className="absolute -top-1 -right-1">
                          <span className="flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 shadow-sm border border-white/20"></span>
                          </span>
                      </div>
                  </div>
                  <div>
                      <div className="flex items-center gap-2 mb-1">
                          <Sparkles size={14} className="text-indigo-600" />
                          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Strategic Intelligence</span>
                      </div>
                      <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-none mb-1 uppercase">Neural BI</h2>
                      <p className="text-sm font-medium text-slate-400">Advanced analytical telemetry and predictive growth metrics</p>
                  </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 relative z-10">
                  <div className="bg-slate-100 p-1.5 rounded-[24px] flex gap-1 border border-slate-200">
                      {['today', '7d', '30d', 'custom'].map((r) => (
                          <button 
                            key={r}
                            onClick={() => setRange(r)}
                            className={cn(
                                "px-5 py-2.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all",
                                range === r ? "bg-white text-indigo-600 shadow-lg shadow-indigo-100" : "text-slate-500 hover:text-slate-900"
                            )}
                          >
                              {r}
                          </button>
                      ))}
                  </div>

                  {range === 'custom' && (
                      <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
                          <input type="date" value={customRange.from} onChange={(e) => setCustomRange(p => ({...p, from: e.target.value}))} className="bg-transparent text-xs font-bold text-slate-900 outline-none" />
                          <span className="text-slate-300 font-black text-[10px]">TO</span>
                          <input type="date" value={customRange.to} onChange={(e) => setCustomRange(p => ({...p, to: e.target.value}))} className="bg-transparent text-xs font-bold text-slate-900 outline-none" />
                      </div>
                  )}

                  <AppButton variant="secondary" icon={RefreshCcw} onClick={fetchBI} loading={loading} className="bg-white border-slate-100">Sync</AppButton>
              </div>
          </div>
      </header>

      {/* KPI Cloud */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Gross Revenue</p>
              <h3 className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter leading-none mb-2">
                {formatCurrency(metrics.totalRevenue)}
              </h3>
              <div className="flex items-center gap-2 text-emerald-500">
                  <TrendingUp size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Active Growth</span>
              </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Orders Matrix</p>
              <h3 className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter leading-none mb-2">
                {metrics.orderCount} <span className="text-sm text-slate-400 uppercase tracking-widest ml-1">Protocols</span>
              </h3>
              <div className="flex items-center gap-2 text-indigo-500">
                  <Layers size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Volume Active</span>
              </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">AOV Intelligence</p>
              <h3 className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter leading-none mb-2">
                {formatCurrency(metrics.avgOrderValue)}
              </h3>
              <div className="flex items-center gap-2 text-purple-500">
                  <Activity size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Unit Magnitude</span>
              </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Unique Customers</p>
              <h3 className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter leading-none mb-2">
                {metrics.customerCount} <span className="text-sm text-slate-400 uppercase tracking-widest ml-1">Agents</span>
              </h3>
              <div className="flex items-center gap-2 text-amber-500">
                  <MousePointer2 size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Reach Expansion</span>
              </div>
          </div>
      </div>

      {/* Analytical Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <GlassCard title="Growth Trajectory" subtitle="Cumulative Revenue Magnitude" icon={TrendingUp} className="lg:col-span-8">
              <div className="h-[400px] w-full">
                  {loading ? <Skeleton className="w-full h-full rounded-[32px]" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={salesTrend}>
                              <defs>
                                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} tickFormatter={(val) => `Rs.${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', padding: '16px' }}
                                itemStyle={{ fontWeight: 900, fontSize: '13px' }}
                                labelStyle={{ fontSize: '10px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 800 }}
                              />
                              <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorValue)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  )}
              </div>
          </GlassCard>

          <GlassCard title="Segment Performance" subtitle="Revenue Distribution Matrix" icon={PieIcon} className="lg:col-span-4">
              <div className="h-[320px] w-full">
                  {loading ? <Skeleton className="w-full h-full rounded-full" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={categoryData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={70}
                                  outerRadius={95}
                                  paddingAngle={5}
                                  dataKey="value"
                                  nameKey="name"
                                  stroke="none"
                              >
                                  {categoryData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ fontSize: '12px', fontWeight: '900' }}
                                formatter={(val) => formatCurrency(val)}
                              />
                          </PieChart>
                      </ResponsiveContainer>
                  )}
              </div>
              <div className="space-y-3 mt-8">
                  {categoryData.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}} />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                          </div>
                          <span className="text-xs font-black text-slate-900">{formatCurrency(item.value)}</span>
                      </div>
                  ))}
              </div>
          </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Busy Hours Heatmap */}
          <GlassCard title="Operational Intensity" subtitle="Hourly Transaction Velocity" icon={Clock} className="lg:col-span-7">
              <div className="h-[350px] w-full">
                  {loading ? <Skeleton className="w-full h-full rounded-[32px]" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={hourlyData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} />
                              <YAxis hide />
                              <Tooltip cursor={{fill: '#f8fafc', radius: 8}} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                              <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={24} />
                          </BarChart>
                      </ResponsiveContainer>
                  )}
              </div>
          </GlassCard>

          {/* Top Agents List */}
          <GlassCard title="Alpha Agents" subtitle="Highest Volume Consumers" icon={Users} className="lg:col-span-5">
              <div className="space-y-6 mt-4">
                  {loading ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-[24px]" />) : topCustomers.map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 rounded-[28px] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-indigo-600 border border-slate-200 group-hover:scale-110 transition-transform">
                                  {idx + 1}
                              </div>
                              <div>
                                  <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">{c.name}</h5>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.count} Transactions</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="text-sm font-black text-indigo-600">{formatCurrency(c.revenue)}</p>
                              <div className="flex items-center gap-1 justify-end text-emerald-500">
                                  <TrendingUp size={10} />
                                  <span className="text-[8px] font-black uppercase">Top Tier</span>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </GlassCard>
      </div>
    </div>
  );
};

export default BusinessIntelligencePage;
