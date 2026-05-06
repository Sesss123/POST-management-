import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportApi } from '../api/api';
import { 
  ShoppingCart, 
  Utensils, 
  UserPlus, 
  Banknote, 
  CreditCard, 
  Users, 
  ArrowUpRight,
  TrendingUp,
  Clock,
  Activity,
  Package,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCcw,
  Filter,
  AlertTriangle,
  Bell,
  ArrowRight,
  Info,
  CheckCircle2,
  Zap
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
  Pie
} from 'recharts';
import { StatCard, AppButton, Skeleton, useToast } from '../components/ui';
import { cn } from '../utils/cn';

const AlertItem = ({ alert }) => {
    const severityStyles = {
        critical: 'bg-rose-50 border-rose-100 text-rose-700',
        warning: 'bg-amber-50 border-amber-100 text-amber-700',
        info: 'bg-blue-50 border-blue-100 text-blue-700',
        success: 'bg-emerald-50 border-emerald-100 text-emerald-700'
    };

    const iconStyles = {
        critical: 'text-rose-600',
        warning: 'text-amber-600',
        info: 'text-blue-600',
        success: 'text-emerald-600'
    };

    const Icon = alert.severity === 'critical' ? AlertTriangle : 
                 alert.severity === 'warning' ? AlertTriangle : 
                 alert.severity === 'success' ? CheckCircle2 : Info;

    return (
        <a 
            href={alert.link}
            className={cn(
                "flex items-start gap-4 p-4 rounded-[24px] border transition-all hover:scale-[1.02] active:scale-95 group mb-3",
                severityStyles[alert.severity] || severityStyles.info
            )}
        >
            <div className={cn("mt-1 shrink-0", iconStyles[alert.severity])}>
                <Icon size={18} />
            </div>
            <div className="flex-1">
                <h5 className="text-[11px] font-black uppercase tracking-tight mb-0.5">{alert.title}</h5>
                <p className="text-xs font-medium opacity-80 leading-relaxed">{alert.description}</p>
            </div>
            <ArrowRight size={14} className="mt-1 opacity-40 group-hover:opacity-100 transition-opacity" />
        </a>
    );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [dateRange, setDateRange] = useState({
      from: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
  });

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const [statsRes, analyticsRes, alertsRes] = await Promise.all([
        reportApi.getDashboard(),
        reportApi.getAnalytics(dateRange.from, dateRange.to),
        reportApi.getAlerts()
      ]);
      setStats(statsRes.data.data);
      setAnalytics(analyticsRes.data.data);
      setAlerts(alertsRes.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch dashboard data', 'danger');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const actionCards = [
    { label: 'Cash Sale', icon: ShoppingCart, path: '/cash-sale', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Table Billing', icon: Utensils, path: '/table-billing', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'New Customer', icon: UserPlus, path: '/customers', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Inventory', icon: Package, path: '/items', color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const handleDateChange = (e) => {
      setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const renderSkeleton = (count = 4) => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(count)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-[32px]" />
          ))}
      </div>
  );

  const totalAlertCount = alerts ? Object.values(alerts).reduce((acc, curr) => acc + curr.length, 0) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Activity className="text-indigo-600" size={20} />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Executive Dashboard</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Performance</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
                <Filter size={16} className="text-slate-400 mr-1" />
                <input 
                    type="date" 
                    name="from"
                    value={dateRange.from}
                    onChange={handleDateChange}
                    className="text-[10px] font-black uppercase tracking-tight text-slate-600 outline-none border-none bg-transparent"
                />
                <span className="text-slate-300 font-bold">to</span>
                <input 
                    type="date" 
                    name="to"
                    value={dateRange.to}
                    onChange={handleDateChange}
                    className="text-[10px] font-black uppercase tracking-tight text-slate-600 outline-none border-none bg-transparent"
                />
            </div>
            
            <AppButton 
                variant="secondary" 
                size="md" 
                onClick={() => fetchData(true)} 
                loading={refreshing}
                icon={RefreshCcw}
                className="bg-white"
            >
                Refresh
            </AppButton>
        </div>
      </header>

      {/* Analytics Highlights */}
      {loading ? renderSkeleton() : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard 
                title="Today's Total Revenue" 
                value={`Rs. ${parseFloat(stats?.summary?.todaySales || 0).toLocaleString()}`} 
                icon={Banknote} 
                variant="dark"
            />
            <StatCard 
                title="Quick Retail (No-Bill)" 
                value={`Rs. ${parseFloat(stats?.summary?.todayQuick || 0).toLocaleString()}`} 
                icon={Zap} 
                variant="primary"
            />
            <StatCard 
                title="Restaurant Sales" 
                value={`Rs. ${parseFloat(stats?.summary?.todayRestaurant || 0).toLocaleString()}`} 
                icon={Utensils} 
                variant="default"
            />
            <StatCard 
                title="Total Cash Collected" 
                value={`Rs. ${parseFloat(stats?.summary?.todayCash || 0).toLocaleString()}`} 
                icon={TrendingUp} 
                variant="success"
            />
            <StatCard 
                title="Active Sessions" 
                value={stats?.summary?.openTables || 0} 
                icon={Layers} 
                variant="default"
            />
            <StatCard 
                title="Total Outstanding" 
                value={`Rs. ${parseFloat(stats?.summary?.totalNaya || 0).toLocaleString()}`} 
                icon={Users} 
                variant="credit"
            />
          </section>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sales Trend Chart */}
          <div className="lg:col-span-8 bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                  <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Revenue vs Collection</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Growth Performance</p>
                  </div>
                  <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-indigo-600" />
                          <span className="text-[10px] font-black uppercase text-slate-400">Total Sales</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-black uppercase text-slate-400">Cash Collected</span>
                      </div>
                  </div>
              </div>
              <div className="flex-1 h-[350px]">
                  {loading ? <Skeleton className="w-full h-full" /> : analytics?.salesTrend?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analytics?.salesTrend}>
                              <defs>
                                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} 
                                dy={10}
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
                                tickFormatter={(value) => `Rs.${value >= 1000 ? (value/1000) + 'k' : value}`}
                              />
                              <Tooltip 
                                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }}
                                itemStyle={{ fontSize: '12px', fontWeight: '900' }}
                                labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px', textTransform: 'uppercase' }}
                              />
                              <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" name="Sales Revenue" />
                              <Area type="monotone" dataKey="collection" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorColl)" name="Cash Collected" />
                          </AreaChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">No trend data available for this range</div>
                  )}
              </div>
          </div>

          <div className="lg:col-span-4 space-y-8 flex flex-col">
              <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20">
                  <h3 className="text-lg font-black tracking-tight mb-6 relative z-10">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                      {actionCards.map(action => (
                          <button 
                            key={action.path}
                            onClick={() => navigate(action.path)}
                            className="bg-white/10 hover:bg-white/20 p-4 rounded-3xl transition-all flex flex-col items-center gap-3 group border border-white/5"
                          >
                              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", action.bg, action.color)}>
                                  <action.icon size={20} />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest">{action.label}</span>
                          </button>
                      ))}
                  </div>
                  <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-600/30 rounded-full blur-3xl" />
              </div>

              <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex-1 flex flex-col">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6">Sales by Category</h3>
                  <div className="flex-1 min-h-[250px]">
                      {loading ? <Skeleton className="w-full h-full rounded-full" /> : analytics?.categoryDist?.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                    data={analytics?.categoryDist}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="category"
                                  >
                                    {analytics?.categoryDist?.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip 
                                    contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: '900' }}
                                    formatter={(value) => `Rs. ${parseFloat(value).toLocaleString()}`}
                                  />
                              </PieChart>
                          </ResponsiveContainer>
                      ) : (
                          <div className="h-full flex items-center justify-center text-slate-400 italic text-sm text-center px-4">No category sales recorded</div>
                      )}
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 mt-4">
                      {analytics?.categoryDist?.slice(0, 4).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}} />
                              <span className="text-[10px] font-black text-slate-500 uppercase truncate">{item.category}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>

      {/* Operational Alerts Section */}
      <section className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                      <Bell size={20} />
                  </div>
                  <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Operational Alerts</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{totalAlertCount} Actionable items detected</p>
                  </div>
              </div>
              <AppButton variant="ghost" size="sm" onClick={() => fetchData(true)} loading={refreshing}>
                  <RefreshCcw size={14} className={refreshing ? 'animate-spin' : ''} />
              </AppButton>
          </div>

          {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
              </div>
          ) : totalAlertCount === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-50 rounded-[32px]">
                  <CheckCircle2 size={48} className="text-emerald-500 mb-4 opacity-20" />
                  <p className="font-bold text-sm italic">System clear. No critical alerts today.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Naya & Suppliers */}
                  <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                          <CreditCard size={12} /> Financial Risks
                      </h4>
                      {[...alerts.naya, ...alerts.suppliers].slice(0, 4).map((alert, i) => (
                          <AlertItem key={i} alert={alert} />
                      ))}
                      {[...alerts.naya, ...alerts.suppliers].length === 0 && <p className="text-xs text-slate-300 italic py-4">No financial alerts</p>}
                  </div>

                  {/* Stock & Held Bills */}
                  <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                          <Package size={12} /> Inventory & Parked Bills
                      </h4>
                      {[...alerts.stock, ...alerts.held_bills].slice(0, 4).map((alert, i) => (
                          <AlertItem key={i} alert={alert} />
                      ))}
                      {[...alerts.stock, ...alerts.held_bills].length === 0 && <p className="text-xs text-slate-300 italic py-4">No inventory alerts</p>}
                  </div>

                  {/* Kitchen & Cash */}
                  <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                          <Activity size={12} /> Operations & Cash
                      </h4>
                      {[...alerts.kitchen, ...alerts.cash].slice(0, 4).map((alert, i) => (
                          <AlertItem key={i} alert={alert} />
                      ))}
                      {[...alerts.kitchen, ...alerts.cash].length === 0 && <p className="text-xs text-slate-300 italic py-4">No operational alerts</p>}
                  </div>
              </div>
          )}
      </section>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Top Sellers</h3>
                  <Layers size={18} className="text-slate-300" />
              </div>
              <div className="space-y-6">
                  {loading ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />) : analytics?.topItems?.map((item, idx) => (
                      <div key={idx} className="group">
                          <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-black text-slate-700 uppercase">{item.name}</span>
                              <div className="flex flex-col items-end">
                                  <span className="text-xs font-black text-indigo-600">{item.value} Sold</span>
                                  <span className="text-[10px] font-bold text-slate-400">Rs. {parseFloat(item.revenue).toLocaleString()}</span>
                              </div>
                          </div>
                          <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-600 rounded-full transition-all duration-1000" 
                                style={{ width: `${(item.value / (analytics.topItems[0]?.value || 1)) * 100}%` }}
                              />
                          </div>
                      </div>
                  ))}
                  {(!loading && (!analytics?.topItems || analytics.topItems.length === 0)) && (
                      <div className="py-10 text-center text-slate-400 italic text-xs">No sales data yet</div>
                  )}
              </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Busy Hours</h3>
                  <Clock size={18} className="text-slate-300" />
              </div>
              <div className="h-[250px]">
                  {loading ? <Skeleton className="w-full h-full" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics?.hourlyDist}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                dataKey="hour" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}}
                                interval={2}
                              />
                              <YAxis hide />
                              <Tooltip 
                                cursor={{fill: '#f8fafc'}}
                                contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontSize: '11px', fontWeight: '900' }}
                              />
                              <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Orders" />
                          </BarChart>
                      </ResponsiveContainer>
                  )}
              </div>
              <p className="text-[10px] font-black text-center text-slate-400 uppercase tracking-[0.2em] mt-4">Transaction count by hour (Today)</p>
          </div>
      </div>

      {/* Final Row: Recent Transactions */}
      <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                      <ShoppingCart size={20} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Live Feed</h3>
              </div>
              <AppButton variant="ghost" size="sm" className="text-xs uppercase font-black tracking-widest text-indigo-600" onClick={() => navigate('/invoices')}>
                  Manage Bills <ChevronRight size={14} className="ml-1" />
              </AppButton>
          </div>
          <div className="p-0 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                  <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Method</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {loading ? [...Array(3)].map((_, i) => <tr key={i}><td colSpan={5} className="p-4"><Skeleton className="h-10" /></td></tr>) : stats?.recentInvoices?.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-8 py-5">
                                  <p className="text-sm font-black text-slate-900">{inv.invoice_no}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </td>
                              <td className="px-8 py-5">
                                  <p className="text-sm font-bold text-slate-700">{inv.customer_name || 'Walk-in Guest'}</p>
                              </td>
                              <td className="px-8 py-5 text-right font-black text-slate-900 text-sm">
                                  Rs. {parseFloat(inv.grand_total).toLocaleString()}
                              </td>
                              <td className="px-8 py-5 text-right">
                                  <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{inv.payment_method}</span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                  <span className={cn(
                                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight",
                                      inv.payment_status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                  )}>
                                      {inv.payment_status}
                                  </span>
                              </td>
                          </tr>
                      ))}
                      {(!loading && (!stats?.recentInvoices || stats.recentInvoices.length === 0)) && (
                          <tr><td colSpan={5} className="py-12 text-center text-slate-400 italic text-xs">No recent transactions today</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default DashboardPage;
