import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '../api/api';
import { 
  Receipt, 
  Search, 
  Filter, 
  Printer, 
  Eye, 
  Calendar, 
  User, 
  Wallet, 
  ArrowRight, 
  Sparkles,
  RefreshCw,
  TrendingUp,
  Activity,
  History,
  FileText,
  ChevronRight,
  MoreHorizontal,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { 
  AppButton, 
  useToast, 
  FormInput,
  Skeleton 
} from '../components/ui';
import { cn } from '../utils/cn';

const GlassCard = ({ title, value, icon: Icon, variant = 'primary', className }) => {
    const variants = {
        primary: "bg-indigo-50 border-indigo-100",
        success: "bg-emerald-50 border-emerald-100",
        danger: "bg-rose-50 border-rose-100",
        warning: "bg-amber-50 border-amber-100",
    };

    const iconColors = {
        primary: "text-indigo-600",
        success: "text-emerald-600",
        danger: "text-rose-600",
        warning: "text-amber-600",
    };

    return (
        <div className={cn(
            "relative group overflow-hidden bg-white border rounded-[40px] p-8 shadow-xl shadow-slate-200/40 transition-all duration-500 hover:scale-[1.02]",
            variants[variant],
            className
        )}>
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/50 rounded-full blur-3xl group-hover:bg-white/80 transition-colors"></div>
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className={cn("w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm", iconColors[variant])}>
                        <Icon size={28} />
                    </div>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
                <h4 className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter">
                    {value}
                </h4>
            </div>
        </div>
    );
};

const InvoicePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await invoiceApi.getAll();
      setInvoices(data.data);
    } catch (err) {
      toast.error('Ledger synchronization failed');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices, date]);

  const handlePrint = (inv) => {
    navigate(`/invoices/${inv.uuid || inv.id}?print=true`);
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoice_no.toLowerCase().includes(search.toLowerCase()) || 
                          (inv.customer_name && inv.customer_name.toLowerCase().includes(search.toLowerCase()));
    
    const invDate = new Date(inv.created_at).toISOString().split('T')[0];
    const matchesDate = invDate === date;
    
    return matchesSearch && matchesDate;
  });

  const totalSales = filteredInvoices.reduce((s, i) => s + (parseFloat(i.grand_total) || 0), 0);

  const formatCurrency = (val) => {
    return `Rs. ${parseFloat(val || 0).toLocaleString()}`;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 p-2 sm:p-6 lg:p-8 selection:bg-indigo-500/30 max-h-screen overflow-hidden flex flex-col">
      {/* Premium Neural Header - White Design */}
      <header className="relative group shrink-0">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-500 rounded-[48px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white p-10 rounded-[44px] border border-slate-100 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 group-hover:scale-110 transition-transform duration-500">
                    <Receipt size={32} />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={14} className="text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Ledger Intelligence</span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-1 uppercase">Invoice History</h2>
                    <p className="text-sm font-medium text-slate-400">Track and reprint all sales transactions and quantum collections</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto relative z-10">
                <div className="flex bg-slate-50 p-2 rounded-[24px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 px-6 py-4">
                        <Calendar size={18} className="text-indigo-600" />
                        <input 
                            type="date" 
                            className="bg-transparent font-black text-xs outline-none text-slate-900 cursor-pointer"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </div>
                <AppButton 
                    variant="secondary" 
                    icon={RefreshCw} 
                    size="lg" 
                    className="rounded-[24px] bg-white border-slate-100 text-slate-600 hover:text-indigo-600" 
                    onClick={fetchInvoices} 
                    loading={loading}
                />
            </div>
        </div>
      </header>

      {/* Analytics & Search Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 shrink-0">
          <div className="lg:col-span-4 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <input 
                  type="text" 
                  placeholder="Search invoice or customer identifier..." 
                  className="w-full bg-white border border-slate-100 rounded-[32px] py-6 pl-16 pr-8 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-600 transition-all shadow-xl shadow-slate-200/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
              />
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <GlassCard 
                title="Timeline Revenue" 
                value={formatCurrency(totalSales)} 
                icon={TrendingUp} 
                variant="success" 
                className="p-6"
              />
              <GlassCard 
                title="Transaction Events" 
                value={`${filteredInvoices.length} Protocols`} 
                icon={Activity} 
                variant="primary" 
                className="p-6"
              />
          </div>
      </div>

      <div className="flex-1 overflow-hidden bg-white rounded-[44px] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col">
          <div className="p-10 border-b border-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4 text-slate-900">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <History size={24} />
                  </div>
                  <div>
                      <h3 className="font-black uppercase tracking-tight text-lg">Historical Ledger</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Audited Transaction Records</p>
                  </div>
              </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-20 border-b border-slate-50">
                <tr>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocol ID</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timeline</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Type</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Entity</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quantum</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                        <td colSpan="6" className="px-10 py-8"><Skeleton className="h-10 w-full rounded-xl" /></td>
                    </tr>
                  ))
                ) : filteredInvoices.length === 0 ? (
                  <tr><td colSpan="6" className="py-40 text-center opacity-20"><FileText size={64} className="mx-auto mb-6" /><p className="text-xl font-black uppercase tracking-widest text-slate-400">No ledger telemetry</p></td></tr>
                ) : filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="group hover:bg-slate-50 transition-all">
                    <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform"></span>
                            <span className="text-sm font-black text-slate-900 tabular-nums tracking-tighter">{inv.invoice_no}</span>
                        </div>
                    </td>
                    <td className="px-10 py-8">
                        <p className="text-sm font-black text-slate-900">{new Date(inv.created_at).toLocaleDateString()}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-10 py-8">
                        <span className={cn(
                            "px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                            inv.type === 'cash' ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-purple-50 border-purple-100 text-purple-600"
                        )}>
                            {inv.type} Protocol
                        </span>
                    </td>
                    <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                {inv.customer_name ? <User size={16} /> : <Wallet size={16} />}
                            </div>
                            <span className="text-sm font-bold text-slate-600 uppercase truncate max-w-[150px]">
                                {inv.customer_name || (inv.table_no ? `Terminal ${inv.table_no}` : 'Walk-in Member')}
                            </span>
                        </div>
                    </td>
                    <td className="px-10 py-8">
                        <p className="text-xl font-black text-slate-900 tabular-nums tracking-tighter">{formatCurrency(inv.grand_total)}</p>
                    </td>
                    <td className="px-10 py-8 text-right">
                        <div className="flex gap-4 justify-end">
                            <button 
                                onClick={() => navigate(`/invoices/${inv.uuid || inv.id}`)}
                                className="w-12 h-12 bg-slate-100 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all flex items-center justify-center border border-slate-200 group-hover:scale-105 shadow-sm"
                            >
                                <Eye size={20} />
                            </button>
                            <button 
                                onClick={() => handlePrint(inv)}
                                className="w-12 h-12 bg-slate-100 text-slate-400 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all flex items-center justify-center border border-slate-200 group-hover:scale-105 shadow-sm"
                            >
                                <Printer size={20} />
                            </button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};

export default InvoicePage;
