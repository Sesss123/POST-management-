import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportApi, kotApi } from '../api/api';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Package, 
  ChevronRight,
  PieChart as PieIcon,
  Activity,
  RefreshCcw,
  Clock,
  Zap,
  MousePointer2,
  Layers,
  ArrowUpRight,
  Sparkles,
  History,
  ChefHat,
  Eye,
  Printer,
  Table as TableIcon
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
import { AppButton, AppCard, AppTable, StatCard, useToast, Skeleton } from '../components/ui';
import { cn } from '../utils/cn';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const GlassCard = ({ title, subtitle, icon: Icon, children, className }) => (
    <div className={cn(
        "bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-100/50 group relative overflow-hidden",
        className
    )}>
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    {Icon && (
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                            <Icon size={24} />
                        </div>
                    )}
                    <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{title}</h3>
                        {subtitle && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>}
                    </div>
                </div>
            </div>
            {children}
        </div>
    </div>
);

const ReportsPage = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('financial'); 
  const [stats, setStats] = useState({ daily: [], balances: [], items: [] });
  const [kots, setKots] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, [date, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'financial') {
        const [dRes, bRes, iRes] = await Promise.all([
          reportApi.getDailySales(date),
          reportApi.getCustomerBalances(),
          reportApi.getItemSales()
        ]);
        setStats({
          daily: dRes.data.data || [],
          balances: bRes.data.data || [],
          items: iRes.data.data || []
        });
      } else {
        const res = await kotApi.getAll(date);
        setKots(res.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to synchronize telemetry data');
    } finally {
      setLoading(false);
    }
  };

  const dailyGrouped = React.useMemo(() => {
    const grouped = stats.daily.reduce((acc, curr) => {
        const method = curr.payment_method || 'Unknown';
        if (!acc[method]) {
            acc[method] = { payment_method: method, total_amount: 0 };
        }
        acc[method].total_amount += (parseFloat(curr.grand_total) || 0);
        return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => b.total_amount - a.total_amount);
  }, [stats.daily]);

  const totalDailyRevenue = dailyGrouped.reduce((acc, curr) => acc + curr.total_amount, 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 selection:bg-indigo-500/30">
      {/* Premium Neural Header */}
      <header className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 rounded-[48px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white p-10 rounded-[44px] border border-slate-100 shadow-2xl overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
              
              <div className="flex items-center gap-8 relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 relative group-hover:scale-110 transition-transform duration-500">
                      <BarChart3 size={36} />
                      <div className="absolute -top-1 -right-1">
                          <span className="flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 shadow-sm border border-white/20"></span>
                          </span>
                      </div>
                  </div>
                  <div>
                      <div className="flex items-center gap-2 mb-1">
                          <Activity size={14} className="text-indigo-600" />
                          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Financial Intelligence</span>
                      </div>
                      <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-none mb-1 uppercase">Insights</h2>
                      <p className="text-sm font-medium text-slate-400">Analyze real-time performance telemetry and revenue metrics</p>
                  </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
                  <div className="bg-slate-100 p-1.5 rounded-[24px] flex gap-1 border border-slate-200">
                      <button 
                        onClick={() => setActiveTab('financial')}
                        className={cn(
                            "px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'financial' ? "bg-white text-indigo-600 shadow-lg shadow-indigo-100" : "text-slate-500 hover:text-slate-900"
                        )}
                      >
                          Revenue
                      </button>
                      <button 
                        onClick={() => setActiveTab('kitchen')}
                        className={cn(
                            "px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'kitchen' ? "bg-white text-indigo-600 shadow-lg shadow-indigo-100" : "text-slate-500 hover:text-slate-900"
                        )}
                      >
                          Kitchen
                      </button>
                  </div>

                  <div className="relative group w-full lg:w-64">
                      <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                      <input 
                          type="date" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-[32px] py-5 pl-16 pr-8 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-600 transition-all shadow-xl shadow-slate-200/50"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                      />
                  </div>
              </div>
          </div>
      </header>

      {activeTab === 'financial' ? (
          <>
            {/* Hero Performance Matrix - All White / High Contrast */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Gross Inflow</p>
                    <h3 className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter leading-none mb-2">
                      Rs. {totalDailyRevenue.toLocaleString()}
                    </h3>
                    <div className="flex items-center gap-2 text-emerald-500">
                        <ArrowUpRight size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Target Active</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Daily Volume</p>
                    <h3 className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter leading-none mb-2">
                      {stats.daily.length} <span className="text-sm text-slate-400 uppercase tracking-widest ml-1">Orders</span>
                    </h3>
                    <div className="flex items-center gap-2 text-indigo-500">
                        <Activity size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Protocol Sync</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Average Ticket</p>
                    <h3 className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter leading-none mb-2">
                      Rs. {stats.daily.length > 0 ? (totalDailyRevenue / stats.daily.length).toLocaleString(undefined, {maximumFractionDigits: 0}) : '0'}
                    </h3>
                    <div className="flex items-center gap-2 text-purple-500">
                        <MousePointer2 size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Unit Value</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Item Velocity</p>
                    <h3 className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter leading-none mb-2">
                      {stats.items.reduce((acc, curr) => acc + (curr.total_qty || 0), 0)} <span className="text-sm text-slate-400 uppercase tracking-widest ml-1">Units</span>
                    </h3>
                    <div className="flex items-center gap-2 text-emerald-500">
                        <Layers size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Inventory Flow</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <GlassCard title="Revenue Stream distribution" subtitle="Collection Matrix by Method" icon={PieIcon} className="lg:col-span-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="h-[350px] w-full">
                            {loading ? <Skeleton className="w-full h-full rounded-full" /> : dailyGrouped.length > 0 && totalDailyRevenue > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                          data={dailyGrouped}
                                          cx="50%"
                                          cy="50%"
                                          innerRadius={80}
                                          outerRadius={110}
                                          paddingAngle={10}
                                          dataKey="total_amount"
                                          nameKey="payment_method"
                                          stroke="none"
                                        >
                                          {dailyGrouped.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                          ))}
                                        </Pie>
                                        <Tooltip 
                                          contentStyle={{ backgroundColor: '#fff', borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', padding: '20px' }}
                                          itemStyle={{ fontWeight: 900, fontSize: '14px' }}
                                          formatter={(val) => `Rs. ${parseFloat(val || 0).toLocaleString()}`}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                    <div className="w-32 h-32 rounded-full border-4 border-dashed border-slate-100 flex items-center justify-center mb-4">
                                        <PieIcon size={40} className="text-slate-200" />
                                    </div>
                                    <p className="italic text-sm font-bold">No sales telemetry recorded yet</p>
                                </div>
                            )}
                        </div>
                        <div className="space-y-5">
                            {dailyGrouped.map((row, idx) => {
                                const percentage = totalDailyRevenue > 0 
                                  ? ((row.total_amount / totalDailyRevenue) * 100).toFixed(1) 
                                  : "0.0";
                                
                                return (
                                    <div key={idx} className="flex flex-col gap-2 p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: COLORS[idx % COLORS.length]}} />
                                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{row.payment_method}</span>
                                            </div>
                                            <span className="text-xs font-black text-slate-400 tabular-nums">{percentage}%</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-xl font-black text-slate-900 tabular-nums">Rs. {(row.total_amount || 0).toLocaleString()}</span>
                                            <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full rounded-full transition-all duration-1000" 
                                                    style={{ 
                                                        backgroundColor: COLORS[idx % COLORS.length], 
                                                        width: `${totalDailyRevenue > 0 ? (row.total_amount / totalDailyRevenue) * 100 : 0}%` 
                                                    }} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </GlassCard>

                <div className="lg:col-span-4 space-y-8">
                    <GlassCard title="Operational Pulse" subtitle="Real-time Indicators" icon={Zap}>
                        <div className="space-y-6 mt-4">
                            <div className="group/insight relative p-6 bg-slate-50 rounded-[32px] border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-500 overflow-hidden">
                                <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl group-hover/insight:bg-emerald-500/10 transition-colors"></div>
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center">
                                            <Package size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Top Performer</p>
                                            <h5 className="text-lg font-black text-slate-900 group-hover/insight:text-emerald-600 transition-colors">
                                                {stats.items.length > 0 ? stats.items[0].item_name : 'No Sales'}
                                            </h5>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1">
                                                {stats.items.length > 0 ? `${stats.items[0].total_qty} units distributed today` : 'Awaiting data'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="group/insight relative p-9 bg-white border border-slate-100 rounded-[40px] shadow-xl hover:shadow-indigo-100/50 transition-all duration-500 overflow-hidden">
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl group-hover/insight:bg-indigo-500/10 transition-colors"></div>
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-inner">
                                            <Sparkles size={28} className="animate-pulse" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Matrix</p>
                                            <h5 className="text-xl font-black text-slate-900">Neural Secure</h5>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1">Operational protocol active</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <AppButton 
                        variant="primary" 
                        className="w-full py-6 rounded-[32px] shadow-2xl shadow-indigo-100 group relative overflow-hidden"
                        icon={RefreshCcw}
                        onClick={fetchData}
                        loading={loading}
                    >
                        <span className="relative z-10 uppercase tracking-[0.2em] font-black text-[10px]">Synchronize Matrix</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </AppButton>
                </div>
            </div>
          </>
      ) : (
          /* Kitchen Performance / KOT Manifest Tab */
          <div className="space-y-10 animate-in slide-in-from-bottom duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 relative overflow-hidden group">
                      <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl"></div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Total Production</p>
                      <h3 className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter leading-none mb-2">
                        {kots.length} <span className="text-sm text-slate-400 uppercase tracking-widest ml-1">KOTs</span>
                      </h3>
                      <div className="flex items-center gap-2 text-indigo-500">
                          <ChefHat size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Kitchen Load</span>
                      </div>
                  </div>

                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Service Velocity</p>
                      <h3 className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter leading-none mb-2">
                        {kots.filter(k => k.status === 'served').length} <span className="text-sm text-slate-400 uppercase tracking-widest ml-1">Served</span>
                      </h3>
                      <div className="flex items-center gap-2 text-emerald-500">
                          <TrendingUp size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Efficiency 100%</span>
                      </div>
                  </div>

                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Void Rate</p>
                      <h3 className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter leading-none mb-2">
                        {kots.filter(k => k.status === 'cancelled').length} <span className="text-sm text-slate-400 uppercase tracking-widest ml-1">Voids</span>
                      </h3>
                      <div className="flex items-center gap-2 text-rose-500">
                          <Zap size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Action Required</span>
                      </div>
                  </div>
              </div>

              <div className="bg-white rounded-[44px] shadow-2xl border border-slate-100 overflow-hidden">
                  <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                              <History size={24} />
                          </div>
                          <div>
                              <h3 className="text-2xl font-black text-slate-900 tracking-tight">KOT Manifest</h3>
                              <p className="text-sm font-medium text-slate-400">Full audit trail of kitchen order tickets</p>
                          </div>
                      </div>
                      <AppButton variant="ghost" size="sm" icon={RefreshCcw} onClick={fetchData} loading={loading}>
                          Refresh Manifest
                      </AppButton>
                  </div>
                  <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100">
                                  <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">KOT Protocol</th>
                                  <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</th>
                                  <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin Agent</th>
                                  <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                  <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Magnitude</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {kots.map(kot => (
                                  <tr key={kot.id} className="hover:bg-slate-50/50 transition-colors group">
                                      <td className="px-10 py-6">
                                          <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{kot.kot_no}</p>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                              {new Date(kot.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                      </td>
                                      <td className="px-10 py-6">
                                          <div className="flex items-center gap-2 text-slate-600">
                                              <TableIcon size={14} className="text-slate-300" />
                                              <span className="text-sm font-bold">{kot.table_no || 'Retail Floor'}</span>
                                              <span className="text-[10px] font-black uppercase text-slate-300 px-2 py-0.5 border border-slate-200 rounded-md ml-2">{kot.order_type}</span>
                                          </div>
                                      </td>
                                      <td className="px-10 py-6">
                                          <p className="text-sm font-bold text-slate-700">{kot.created_by_name || 'System'}</p>
                                      </td>
                                      <td className="px-10 py-6 text-center">
                                          <span className={cn(
                                              "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                              kot.status === 'served' ? "bg-emerald-50 text-emerald-600" : 
                                              kot.status === 'cancelled' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                                          )}>
                                              {kot.status}
                                          </span>
                                      </td>
                                      <td className="px-10 py-6 text-right">
                                          <div className="flex items-center justify-end gap-2">
                                              <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Eye size={18} /></button>
                                              <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Printer size={18} /></button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ReportsPage;
