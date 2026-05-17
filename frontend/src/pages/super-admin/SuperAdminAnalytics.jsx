import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, 
    Users, 
    Activity,
    DollarSign,
    RefreshCw,
    Store,
    PieChart as PieChartIcon,
    ArrowUpRight,
    TrendingDown,
    ShieldCheck,
    AlertCircle,
    CheckCircle,
    Plus,
    Layers,
    RefreshCcw
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell, 
    BarChart, 
    Bar, 
    Legend
} from 'recharts';
import { superAdminApi } from '../../api/api';
import { 
    AppCard, 
    StatCard, 
    AppButton, 
    Badge, 
    Skeleton 
} from '../../components/ui';
import { cn } from '../../utils/cn';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#f472b6'];

const SuperAdminAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await superAdminApi.getAnalytics();
            if (res.data.success) {
                setData(res.data.data);
            } else {
                setError(res.data.message || 'Failed to fetch data');
            }
        } catch (error) {
            console.error('Failed to fetch platform analytics:', error);
            const msg = error.response?.data?.message || error.message || 'Could not connect to the server';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] animate-pulse">Syncing Platform Intelligence...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] p-8 text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center text-rose-500 mb-6 border border-rose-500/20">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">Analytics Offline</h2>
                <p className="text-slate-400 mb-8 font-medium text-sm">{error}</p>
                <AppButton variant="primary" size="lg" onClick={fetchAnalytics} icon={RefreshCcw}>
                    Re-Establish Connection
                </AppButton>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-12">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="text-indigo-500" size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Live Infrastructure Analytics</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">System Insights</h1>
                </div>
                <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-[2rem] border border-white/5">
                    <div className="flex flex-col px-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Score</span>
                        <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full animate-pulse", data?.health_score > 70 ? "bg-emerald-500" : "bg-amber-500")} />
                            <span className="text-xl font-black text-white">{data?.health_score}%</span>
                        </div>
                    </div>
                    <div className="h-10 w-px bg-white/5" />
                    <button 
                        onClick={fetchAnalytics}
                        className="p-4 hover:bg-white/5 rounded-full text-slate-400 transition-all hover:rotate-180"
                        title="Sync Data"
                    >
                        <RefreshCcw size={20} />
                    </button>
                </div>
            </div>

            {/* Top Grid: Key SaaS Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-indigo-600 rounded-full opacity-[0.08] blur-3xl" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Platform MRR</p>
                        <h3 className="text-3xl font-black text-white tracking-tighter">Rs. {Number(data?.mrr || 0).toLocaleString()}</h3>
                        <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-400/10 px-3 py-1.5 rounded-full w-fit">
                            <TrendingUp size={12} />
                            Recurring Revenue
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-violet-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-violet-600 rounded-full opacity-[0.08] blur-3xl" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Tenants</p>
                        <h3 className="text-3xl font-black text-white tracking-tighter">{data?.total_shops || 0}</h3>
                        <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-violet-400 uppercase tracking-widest bg-violet-400/10 px-3 py-1.5 rounded-full w-fit">
                            <Store size={12} />
                            Platform Scale
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-emerald-600 rounded-full opacity-[0.08] blur-3xl" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Live Shops</p>
                        <h3 className="text-3xl font-black text-white tracking-tighter">{data?.active_shops || 0}</h3>
                        <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-3 py-1.5 rounded-full w-fit">
                            <CheckCircle size={12} />
                            Active Capacity
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-amber-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-amber-600 rounded-full opacity-[0.08] blur-3xl" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Retention Index</p>
                        <h3 className="text-3xl font-black text-white tracking-tighter">{data?.total_shops > 0 ? Math.round((data.active_shops / data.total_shops) * 100) : 0}%</h3>
                        <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 px-3 py-1.5 rounded-full w-fit">
                            <Layers size={12} />
                            Subscription Health
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Payment Trend Chart */}
                <div className="lg:col-span-8 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[3rem] p-8 flex flex-col min-h-[480px] shadow-2xl">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight uppercase">Revenue Trajectory</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aggregate platform collection (6M)</p>
                        </div>
                        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/10 px-4 py-2 rounded-2xl">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Growth Vector</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.payment_trend}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 900, fill: '#475569'}} 
                                    dy={15}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 900, fill: '#475569'}}
                                    tickFormatter={(value) => `Rs.${value >= 1000 ? (value/1000) + 'k' : value}`}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#020617', 
                                        borderRadius: '24px', 
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                        padding: '20px'
                                    }}
                                    itemStyle={{ fontSize: '16px', fontWeight: '900', color: '#fff' }}
                                    labelStyle={{ fontSize: '10px', fontWeight: '900', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.15em' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#6366f1" 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#colorRev)" 
                                    name="Revenue Index"
                                    animationDuration={2500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[3rem] p-8 flex flex-col h-full min-h-[480px] shadow-2xl">
                    <h3 className="text-xl font-black text-white tracking-tight uppercase mb-2">Tenant Mix</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10">Subscription Lifecycle Map</p>
                    <div className="flex-1 min-h-[280px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.status_distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={75}
                                    outerRadius={95}
                                    paddingAngle={10}
                                    dataKey="value"
                                    animationDuration={2000}
                                >
                                    {data?.status_distribution?.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={COLORS[index % COLORS.length]} 
                                            stroke="rgba(0,0,0,0.3)"
                                            strokeWidth={6}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#020617', 
                                        borderRadius: '20px', 
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        padding: '12px'
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: '900', color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        {data?.status_distribution?.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}} />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.name}</span>
                                    <span className="text-sm font-black text-white">{item.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row: High-Value Targets & Velocity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Shops by Revenue */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute -left-12 -top-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight uppercase">High-Yield Tenants</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global revenue leaders</p>
                        </div>
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-300 border border-white/5">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <div className="space-y-7 relative z-10">
                        {data?.top_shops?.map((shop, idx) => (
                            <div key={idx} className="group cursor-default">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-4">
                                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black text-slate-500 border border-white/5 group-hover:border-indigo-500/50 transition-all">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <span className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors">{shop.name}</span>
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">IDENTIFIER: {shop.slug}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-black text-white">Rs. {Number(shop.total_revenue).toLocaleString()}</span>
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest opacity-60">{shop.invoice_count} VOL</p>
                                    </div>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-800 rounded-full transition-all duration-[2s] ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                                        style={{ width: `${(shop.total_revenue / data.top_shops[0].total_revenue) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Growth Trend */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[3rem] p-8 flex flex-col shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight uppercase">Network Expansion</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">New node activation velocity</p>
                        </div>
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-300 border border-white/5">
                            <Plus size={24} />
                        </div>
                    </div>
                    <div className="flex-1 min-h-[320px] relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.shop_trend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 900, fill: '#475569'}}
                                    dy={15}
                                />
                                <YAxis hide />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                    contentStyle={{ 
                                        backgroundColor: '#020617', 
                                        borderRadius: '20px', 
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        padding: '12px'
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: '900', color: '#10b981' }}
                                />
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                                        <stop offset="100%" stopColor="#059669" stopOpacity={0.2}/>
                                    </linearGradient>
                                </defs>
                                <Bar 
                                    dataKey="count" 
                                    fill="url(#barGradient)" 
                                    radius={[10, 10, 0, 0]} 
                                    name="Node Activation" 
                                    animationDuration={2500}
                                    maxBarSize={60}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] font-black text-center text-slate-700 uppercase tracking-[0.4em] mt-8 relative z-10">Global Tenant Proliferation</p>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminAnalytics;
