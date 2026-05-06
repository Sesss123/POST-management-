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
    ShieldCheck
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

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f472b6'];

const SuperAdminAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await superAdminApi.getAnalytics();
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch platform analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(val || 0).replace('LKR', 'Rs.');
    };

    if (loading && !data) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <header className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-100">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                </header>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-[32px]" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-[400px] w-full rounded-[32px]" />
                    <Skeleton className="h-[400px] w-full rounded-[32px]" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Platform Analytics</h2>
                        <p className="text-slate-400 text-sm font-medium">Global SaaS performance and growth metrics</p>
                    </div>
                </div>
                <AppButton icon={RefreshCw} variant="secondary" onClick={fetchAnalytics} loading={loading}>
                    Refresh Data
                </AppButton>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Platform MRR" value={formatCurrency(data.mrr)} icon={DollarSign} variant="primary" />
                <StatCard title="Total Shops" value={data.total_shops} icon={Store} variant="default" />
                <StatCard title="Active Shops" value={data.active_shops} icon={ShieldCheck} variant="success" />
                <StatCard title="Platform Health" value={`${data.health_score}%`} icon={Activity} variant={data.health_score > 80 ? 'success' : 'warning'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Subscription Revenue Trend */}
                <AppCard title="Subscription Revenue Trend" icon={TrendingUp} subtitle="Last 6 months monthly collection">
                    <div className="h-[350px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.payment_trend}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => `Rs.${val/1000}k`} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                />
                                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </AppCard>

                {/* Shop Growth Trend */}
                <AppCard title="Shop Acquisition" icon={Store} subtitle="New shop signups by month">
                    <div className="h-[350px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.shop_trend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" name="New Shops" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </AppCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Subscription Status Distribution */}
                <AppCard title="Subscription Mix" icon={PieChartIcon} className="lg:col-span-1">
                    <div className="h-[300px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.status_distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.status_distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </AppCard>

                {/* Top Shops by Revenue */}
                <AppCard title="Top Performing Shops" icon={ArrowUpRight} subtitle="By total invoice revenue generated" className="lg:col-span-2">
                    <div className="space-y-4 mt-4">
                        {data.top_shops.map((shop, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-[24px] border border-slate-100 group transition-all hover:bg-white hover:shadow-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 tracking-tight">{shop.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{shop.invoice_count} Invoices Generated</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-indigo-600">{formatCurrency(shop.total_revenue)}</p>
                                    <Badge variant="primary">{shop.slug}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </AppCard>
            </div>
        </div>
    );
};

export default SuperAdminAnalytics;
