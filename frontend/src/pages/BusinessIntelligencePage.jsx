import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  ShoppingCart, 
  BarChart2, 
  PieChart as PieChartIcon, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Calendar,
  RefreshCw,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Truck,
  Package,
  TrendingDown,
  ChefHat,
  Wallet
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
  Legend,
  LineChart,
  Line
} from 'recharts';
import { reportApi } from '../api/api';
import { 
  AppCard, 
  StatCard, 
  AppButton, 
  FormSelect, 
  Badge,
  Skeleton
} from '../components/ui';
import { cn } from '../utils/cn';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f472b6'];

const BusinessIntelligencePage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [range, setRange] = useState('7d');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const fetchBI = useCallback(async () => {
    setLoading(true);
    try {
      const params = range === 'custom' ? { from: dateRange.from, to: dateRange.to } : { range };
      const { data: response } = await reportApi.getBI(params);
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch BI data:', err);
    } finally {
      setLoading(false);
    }
  }, [range, dateRange]);

  useEffect(() => {
    fetchBI();
  }, [fetchBI]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(val || 0).replace('LKR', 'Rs.');
  };

  if (loading && !data) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <header className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
           <Skeleton className="h-10 w-48" />
           <Skeleton className="h-10 w-64" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
           {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-[32px]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <Skeleton className="h-[400px] w-full rounded-[32px]" />
           <Skeleton className="h-[400px] w-full rounded-[32px]" />
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const salesTrend = data?.sales_trend || [];
  const orderTypeData = data?.order_type_breakdown || [];
  const topItems = data?.top_items || [];
  const worstItems = data?.worst_items || [];
  const categoryData = data?.category_performance || [];
  const hourlyData = data?.hourly_sales || [];
  const nayaRisk = data?.naya_risk || {};
  const kitchen = data?.kitchen_performance || {};
  const quickRetail = data?.quick_retail || {};
  const suppliers = data?.suppliers || {};
  const stock = data?.stock || {};
  const insights = data?.insights || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header & Filters */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <TrendingUp size={24} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Business Intelligence</h2>
              <p className="text-xs font-bold text-slate-400">Advanced analytical insights for your restaurant</p>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto custom-scrollbar-hide">
                {['today', '7d', '30d', 'month', 'custom'].map((r) => (
                    <button 
                        key={r}
                        onClick={() => setRange(r)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                            range === r ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r}
                    </button>
                ))}
            </div>
            
            {range === 'custom' && (
                <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-300">
                    <input 
                        type="date" 
                        className="bg-slate-50 border-2 border-transparent rounded-xl px-3 py-2 text-xs font-bold focus:border-indigo-600 transition-all"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                    />
                    <span className="text-slate-400 font-bold text-xs">to</span>
                    <input 
                        type="date" 
                        className="bg-slate-50 border-2 border-transparent rounded-xl px-3 py-2 text-xs font-bold focus:border-indigo-600 transition-all"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                    />
                </div>
            )}

            <AppButton 
                variant="secondary" 
                size="md" 
                icon={RefreshCw} 
                onClick={fetchBI} 
                loading={loading}
                className="w-full lg:w-auto"
            >
                Refresh
            </AppButton>
        </div>
      </header>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Gross Sales" value={formatCurrency(kpis.sales_revenue)} icon={DollarSign} variant="primary" />
          <StatCard title="Cash Collected" value={formatCurrency(kpis.cash_collected)} icon={Activity} variant="success" />
          <StatCard title="Expenses" value={formatCurrency(kpis.expenses)} icon={Wallet} variant="warning" />
          <StatCard title="Est. Net Profit" value={formatCurrency(kpis.net_profit)} icon={ArrowUpRight} variant="success" />
          <StatCard title="Naya Owed" value={formatCurrency(kpis.credit_outstanding)} icon={CreditCard} variant="credit" />
          <StatCard title="Avg Bill" value={formatCurrency(kpis.average_bill_value)} icon={Zap} />
      </div>

      {/* Primary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Trend Chart */}
          <AppCard title="Revenue vs Collection Trend" icon={TrendingUp} subtitle="Daily performance monitoring">
             <div className="h-[350px] w-full mt-4">
                {salesTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorCollection" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => `Rs.${val/1000}k`} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                            />
                            <Area type="monotone" dataKey="revenue" name="Sales Revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                            <Area type="monotone" dataKey="collected" name="Cash Collected" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorCollection)" />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">No trend data for this period</div>
                )}
             </div>
          </AppCard>

          {/* Top Items Bar Chart */}
          <AppCard title="Top Performing Items" icon={Target} subtitle="By generated revenue">
              <div className="h-[350px] w-full mt-4">
                  {topItems.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#475569' }} width={120} />
                              <Tooltip 
                                  cursor={{ fill: '#f8fafc' }}
                                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                  formatter={(value) => formatCurrency(value)}
                              />
                              <Bar dataKey="revenue" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={20} />
                          </BarChart>
                      </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">No sales recorded</div>
                  )}
              </div>
          </AppCard>
      </div>

      {/* Insights Panel */}
      {insights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
             {insights.map((insight, idx) => (
                 <div key={idx} className={cn(
                     "p-5 rounded-[28px] border-2 flex items-start gap-4 transition-all hover:scale-[1.02]",
                     insight.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-900" :
                     insight.type === 'warning' ? "bg-amber-50 border-amber-100 text-amber-900" :
                     insight.type === 'danger' ? "bg-rose-50 border-rose-100 text-rose-900" :
                     "bg-indigo-50 border-indigo-100 text-indigo-900"
                 )}>
                    <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                        insight.type === 'success' ? "bg-emerald-500 text-white" :
                        insight.type === 'warning' ? "bg-amber-500 text-white" :
                        insight.type === 'danger' ? "bg-rose-500 text-white" :
                        "bg-indigo-500 text-white"
                    )}>
                        {insight.type === 'success' ? <CheckCircle size={16} /> :
                         insight.type === 'warning' ? <AlertTriangle size={16} /> :
                         insight.type === 'danger' ? <Zap size={16} /> :
                         <Info size={16} />}
                    </div>
                    <p className="text-xs font-bold leading-relaxed">{insight.text}</p>
                 </div>
             ))}
          </div>
      )}

      {/* Secondary Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Order Type Distribution */}
          <AppCard title="Revenue by Order Type" icon={PieChartIcon}>
              <div className="h-[280px] w-full mt-2">
                  {orderTypeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={orderTypeData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                              >
                                  {orderTypeData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                              </Pie>
                              <Tooltip 
                                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                  formatter={(value) => formatCurrency(value)}
                              />
                              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 800 }} />
                          </PieChart>
                      </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-sm">No distribution data</div>
                  )}
              </div>
          </AppCard>

          {/* Hourly Distribution */}
          <AppCard title="Hourly Sales Heatmap" icon={Clock} subtitle="Peak time identification">
              <div className="h-[280px] w-full mt-2">
                  {hourlyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={hourlyData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                              <defs>
                                  <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0.7}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis
                                  dataKey="hour"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                                  interval={2}
                                  label={{ value: 'Hour (24h)', position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 800 }}
                              />
                              <YAxis hide />
                              <Tooltip
                                  cursor={{ fill: '#f8fafc', radius: 8 }}
                                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px 14px' }}
                                  labelStyle={{ fontWeight: 800, fontSize: '12px', marginBottom: '4px', color: '#1e293b' }}
                                  itemStyle={{ fontSize: '11px', fontWeight: 700, color: '#6366f1' }}
                                  formatter={(val) => [formatCurrency(val), 'Revenue']}
                              />
                              <Bar dataKey="revenue" name="Revenue" fill="url(#colorHourly)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                          </BarChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-sm">No hourly data for this period</div>
                  )}
              </div>
          </AppCard>

          {/* Category Performance */}
          <AppCard title="Category Revenue" icon={PieChartIcon}>
              <div className="h-[280px] w-full mt-2">
                  {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={categoryData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={0}
                                  outerRadius={80}
                                  dataKey="value"
                              >
                                  {categoryData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                              </Pie>
                              <Tooltip 
                                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                  formatter={(value) => formatCurrency(value)}
                              />
                              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 800 }} />
                          </PieChart>
                      </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-sm">No category data</div>
                  )}
              </div>
          </AppCard>
      </div>

      {/* Bottom Row - Worst Items & Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Worst Selling Items */}
          <AppCard title="Worst Selling Items" icon={TrendingDown} subtitle="Lowest sales performance" className="lg:col-span-1">
              <div className="space-y-3 mt-4">
                  {worstItems.length > 0 ? worstItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                          <div className="overflow-hidden">
                              <p className="text-xs font-black text-slate-900 truncate">{item.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">{item.qty} units sold</p>
                          </div>
                          <span className="text-xs font-black text-rose-500 whitespace-nowrap">{formatCurrency(item.revenue)}</span>
                      </div>
                  )) : <div className="text-center py-8 text-slate-400 italic text-xs">All items are performing well</div>}
              </div>
          </AppCard>

          {/* Kitchen & Stock Grid */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Kitchen Performance */}
              <AppCard title="Kitchen Pulse" icon={ChefHat} bodyClassName="p-0">
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
                           <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Avg Prep</p>
                           <h4 className="text-lg font-black text-indigo-900">{Math.round(kitchen.average_prep_minutes)}m</h4>
                        </div>
                        <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100">
                           <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Delayed</p>
                           <h4 className="text-lg font-black text-rose-900">{kitchen.delayed_kots}</h4>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="px-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">Slowest active orders</p>
                        {kitchen.slowest_orders?.length > 0 ? kitchen.slowest_orders.map((o, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                               <span className="text-xs font-bold text-slate-700">#{o.kot_no}</span>
                               <Badge variant={o.mins_old > 30 ? 'danger' : 'warning'}>{o.mins_old} mins</Badge>
                            </div>
                        )) : <div className="p-8 text-center text-xs text-slate-400 italic">No pending orders</div>}
                    </div>
                  </div>
              </AppCard>

              {/* Naya Risk */}
              <AppCard title="Naya Book Risk" icon={AlertTriangle} bodyClassName="p-0">
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Top Debtors</span>
                       <Badge variant="danger">High Risk</Badge>
                    </div>
                    <div className="space-y-2">
                       {nayaRisk.top_debtors?.length > 0 ? nayaRisk.top_debtors.map((d, i) => (
                           <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 group">
                              <div>
                                 <p className="text-xs font-black text-slate-900 truncate max-w-[120px]">{d.name}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase">Balance Owed</p>
                              </div>
                              <span className="text-sm font-black text-rose-600 tracking-tight">{formatCurrency(d.balance)}</span>
                           </div>
                       )) : <div className="p-8 text-center text-xs text-slate-400 italic">No active debtors</div>}
                    </div>
                 </div>
              </AppCard>

              {/* Inventory Watch */}
              <AppCard title="Inventory Watch" icon={Package} bodyClassName="p-0">
                <div className="p-4 space-y-4">
                    <div className="flex items-center gap-2 px-2">
                       <Badge variant="danger">{stock.sold_out_items?.length || 0} Sold Out</Badge>
                       <Badge variant="warning">{stock.low_stock_items?.length || 0} Low Stock</Badge>
                    </div>
                    <div className="space-y-2">
                       {stock.low_stock_items?.length > 0 ? stock.low_stock_items.map((item, i) => (
                           <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                              <div>
                                 <p className="text-xs font-black text-slate-900 truncate max-w-[120px]">{item.name}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase">Stock: {item.stock_qty}</p>
                              </div>
                              {item.stock_qty <= 0 ? <Badge variant="danger">OUT</Badge> : <Badge variant="warning">LOW</Badge>}
                           </div>
                       )) : <div className="p-8 text-center text-xs text-slate-400 italic">Inventory is healthy</div>}
                    </div>
                 </div>
              </AppCard>
          </div>
      </div>
    </div>
  );
};

export default BusinessIntelligencePage;
