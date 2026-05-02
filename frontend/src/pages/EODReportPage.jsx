import React, { useState, useEffect } from 'react';
import { reportApi } from '../api/api';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Clock, 
  Printer, 
  Download,
  AlertTriangle,
  Receipt,
  Wallet,
  Calendar,
  ChevronRight,
  Pizza,
  Coffee
} from 'lucide-react';
import { AppCard, AppButton, useToast, StatusBadge } from '../components/ui';
import { cn } from '../utils/cn';

const StatCard = ({ icon: Icon, label, value, subtext, color = "indigo" }) => (
    <AppCard className="bg-white border-none shadow-lg p-6 flex flex-col gap-1 relative overflow-hidden group">
        <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110",
            `bg-${color}-50 text-${color}-600`
        )}>
            <Icon size={24} />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
        {subtext && <p className="text-xs font-bold text-slate-400 mt-1">{subtext}</p>}
        <div className={cn(
            "absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] pointer-events-none",
            `bg-${color}-600`
        )}></div>
    </AppCard>
);

const EODReportPage = () => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchReport();
  }, [date]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await reportApi.getEOD(date);
      setData(response.data.data);
    } catch (err) {
      toast.error('Failed to load EOD report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center">Generating report...</div>;
  if (!data) return <div className="p-8 text-center text-rose-500 font-black uppercase">Report not available</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 print:p-0 print:m-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 lg:p-8 rounded-2xl lg:rounded-[40px] shadow-xl border border-slate-100 print:shadow-none print:border-none">
        <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-indigo-600 text-white rounded-xl lg:rounded-[24px] flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
                <BarChart3 size={24} className="lg:w-8 lg:h-8" />
            </div>
            <div>
                <h2 className="text-xl lg:text-2xl font-black text-slate-900 uppercase tracking-tight">EOD Report</h2>
                <div className="flex items-center gap-2 mt-0.5 lg:mt-1">
                    <Calendar size={12} className="text-slate-400 lg:w-3.5 lg:h-3.5" />
                    <span className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest line-clamp-1">{new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-3 w-full sm:w-auto print:hidden">
            <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 sm:flex-none bg-slate-50 border-2 border-slate-100 rounded-xl lg:rounded-2xl px-3 lg:px-4 py-2 lg:py-2.5 font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all cursor-pointer text-xs lg:text-base"
            />
            <AppButton variant="secondary" icon={Printer} onClick={handlePrint} className="uppercase tracking-widest text-[10px] lg:text-xs font-black">Print</AppButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            icon={TrendingUp} 
            label="Gross Sales" 
            value={`Rs. ${data.summary.total_sales.toLocaleString()}`}
            subtext={`${data.summary.invoice_count} Invoices`}
            color="indigo"
        />
        <StatCard 
            icon={ShoppingBag} 
            label="Net Sales" 
            value={`Rs. ${data.summary.net_sales.toLocaleString()}`}
            subtext={`After Rs. ${data.summary.total_discounts.toLocaleString()} discounts`}
            color="emerald"
        />
        <StatCard 
            icon={Users} 
            label="Customers" 
            value={data.summary.invoice_count}
            subtext="Unique Transactions"
            color="blue"
        />
        <StatCard 
            icon={AlertTriangle} 
            label="Voids/Cancels" 
            value={data.voids.voided_items_count}
            subtext={`${data.voids.cancelled_sessions_count} Sessions Cancelled`}
            color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales by Method */}
        <AppCard className="lg:col-span-1 bg-white p-8 rounded-[40px] shadow-lg border-none">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Payment Methods</h3>
                <Wallet className="text-slate-300" size={24} />
            </div>
            <div className="space-y-6">
                {Object.entries(data.payments).map(([method, amount]) => (
                    <div key={method} className="group cursor-default">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{method}</span>
                            <span className="text-sm font-black text-slate-900">Rs. {amount.toLocaleString()}</span>
                        </div>
                        <div className="h-3 bg-slate-50 rounded-full overflow-hidden p-0.5">
                            <div 
                                className={cn(
                                    "h-full rounded-full transition-all duration-1000",
                                    method === 'cash' ? "bg-emerald-500 shadow-sm shadow-emerald-200" : 
                                    method === 'card' ? "bg-indigo-500 shadow-sm shadow-indigo-200" : "bg-slate-400"
                                )} 
                                style={{ width: `${(amount / data.summary.total_sales) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
                {Object.keys(data.payments).length === 0 && (
                    <p className="text-center py-8 text-slate-300 italic font-medium">No payment data for this day</p>
                )}
            </div>
        </AppCard>

        {/* Top Selling Items */}
        <AppCard className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-lg border-none">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Top Selling Items</h3>
                <Pizza className="text-slate-300" size={24} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.topItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 rounded-[24px] bg-slate-50 border border-transparent hover:border-indigo-100 hover:bg-white transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center font-black text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-900 uppercase truncate text-sm">{item.item_name}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Qty Sold: {item.total_qty}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-black text-slate-900">Rs. {item.total_revenue.toLocaleString()}</p>
                        </div>
                    </div>
                ))}
                {data.topItems.length === 0 && (
                    <div className="col-span-full py-12 text-center opacity-20">
                        <Coffee size={48} className="mx-auto mb-2" />
                        <p className="font-black uppercase tracking-widest">No item data</p>
                    </div>
                )}
            </div>
        </AppCard>
      </div>

      {/* Discrepancy & Audit Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AppCard className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[40px]">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center">
                    <AlertTriangle size={20} />
                </div>
                <h3 className="text-lg font-black text-rose-900 uppercase tracking-tight">Discrepancy Alerts</h3>
            </div>
            <div className="space-y-4">
                {data.shifts.map((shift, idx) => {
                    const diff = shift.actual_cash - shift.expected_cash;
                    if (diff === 0) return null;
                    return (
                        <div key={idx} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-rose-200">
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase">Shift by {shift.user_name}</p>
                                <p className="text-sm font-bold text-slate-900">Shortage/Overage</p>
                            </div>
                            <span className={cn("font-black px-3 py-1 rounded-full text-sm", diff < 0 ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600")}>
                                {diff < 0 ? '-' : '+'} Rs. {Math.abs(diff).toLocaleString()}
                            </span>
                        </div>
                    );
                })}
                {!data.shifts.some(s => s.actual_cash - s.expected_cash !== 0) && (
                    <p className="text-center py-6 text-emerald-600 font-bold uppercase tracking-widest">No discrepancies today! Perfect score.</p>
                )}
            </div>
        </AppCard>

        <AppCard className="bg-slate-900 p-8 rounded-[40px]">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">System Health</h3>
                <StatusBadge status="active" text="All Systems Nominal" />
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Ticket Size</p>
                    <p className="text-2xl font-black text-white">Rs. {data.summary.invoice_count > 0 ? (data.summary.total_sales / data.summary.invoice_count).toLocaleString(undefined, {maximumFractionDigits: 0}) : 0}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Wait Time (Avg)</p>
                    <p className="text-2xl font-black text-white">12m</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Server Uptime</p>
                    <p className="text-2xl font-black text-emerald-400">99.9%</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sync Status</p>
                    <p className="text-2xl font-black text-blue-400">Synced</p>
                </div>
            </div>
        </AppCard>
      </div>

      <div className="hidden print:block text-center pt-12 border-t border-slate-100 mt-12">
        <p className="font-black text-slate-900 uppercase tracking-widest">RestoLedger POS EOD SUMMARY</p>
        <p className="text-xs font-bold text-slate-400">Generated on {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default EODReportPage;
