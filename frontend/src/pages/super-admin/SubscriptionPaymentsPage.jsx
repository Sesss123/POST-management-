import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar, 
  Download,
  CreditCard,
  Building2,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Wallet,
  Clock,
  ArrowDownRight,
  ShieldCheck,
  RefreshCw,
  SearchCode,
  LayoutGrid,
  FileSpreadsheet,
  Banknote,
  Globe,
  Loader2,
  ChevronRight,
  PieChart,
  CheckCircle2
} from 'lucide-react';
import api from '../../api/apiClient';
import { useToast } from '../../components/ui/Feedback';
import { cn } from '../../utils/cn';

const SubscriptionPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (dateFrom) query.append('date_from', dateFrom);
      if (dateTo) query.append('date_to', dateTo);
      
      const res = await api.get(`/super-admin/subscription-payments?${query.toString()}`);
      if (res.data.success) {
        setPayments(res.data.data);
      }
    } catch (error) {
      showToast('Failed to fetch payment history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => 
    p.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.reference_no?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const monthlyRevenue = payments.filter(p => {
      const pDate = new Date(p.created_at);
      const now = new Date();
      return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  const getMethodIcon = (method) => {
      switch(method?.toLowerCase()) {
          case 'cash': return <Banknote size={16} />;
          case 'card': return <CreditCard size={16} />;
          case 'bank transfer': return <Globe size={16} />;
          default: return <Wallet size={16} />;
      }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Cyber Header & Financial Pulse */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 relative overflow-hidden bg-slate-900/40 border border-white/5 p-12 rounded-[4rem] backdrop-blur-3xl">
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full -mr-40 -mt-40 animate-pulse"></div>
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 h-full">
                  <div>
                      <div className="flex items-center gap-4 mb-3">
                          <PieChart className="text-emerald-500 animate-pulse" size={24} />
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">SaaS Capital Ledger</p>
                      </div>
                      <h1 className="text-5xl font-black text-white tracking-tighter">Payments</h1>
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-3 leading-relaxed">
                          Audit Registry for {payments.length} transactions <span className="mx-2 text-slate-800">|</span> 
                          <span className="text-white"> MTD Revenue: Rs. {monthlyRevenue.toLocaleString()}</span>
                      </p>
                  </div>
                  <div className="flex items-center gap-4">
                      <button className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[2rem] text-slate-400 hover:text-white transition-all text-xs font-black uppercase tracking-[0.2em]">
                          <Download size={18} />
                          Export Ledger
                      </button>
                      <button 
                        onClick={fetchPayments}
                        className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all shadow-xl shadow-indigo-900/40"
                      >
                          <RefreshCw size={20} className={cn(loading && "animate-spin")} />
                      </button>
                  </div>
              </div>
          </div>

          <div className="relative overflow-hidden bg-emerald-600 border border-emerald-500 p-12 rounded-[4rem] shadow-2xl shadow-emerald-900/20 group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[60px] rounded-full -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-1000"></div>
              <div className="relative h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                      <div className="w-16 h-16 rounded-[2rem] bg-white/20 flex items-center justify-center text-white backdrop-blur-xl">
                          <DollarSign size={32} />
                      </div>
                      <div className="flex flex-col items-end">
                          <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">Total Capital</p>
                          <div className="flex items-center gap-1 text-white font-black">
                              <TrendingUp size={16} />
                              <span>LIFETIME</span>
                          </div>
                      </div>
                  </div>
                  <div>
                      <p className="text-[11px] font-black text-emerald-200 uppercase tracking-[0.3em] mb-2">Total Gross Stream</p>
                      <h2 className="text-4xl font-black text-white tracking-tighter tabular-nums">
                          Rs. {totalRevenue.toLocaleString()}
                      </h2>
                  </div>
              </div>
          </div>
      </div>

      {/* Premium Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-8 bg-slate-900/50 border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
          <CreditCard className="text-indigo-400 mb-6" size={32} />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Digital Volume</p>
          <h3 className="text-3xl font-black text-white mt-2 tabular-nums">
            {payments.filter(p => p.payment_method?.toLowerCase() === 'card').length}
          </h3>
          <p className="text-[10px] font-bold text-slate-700 uppercase mt-2">Card Transactions</p>
        </div>

        <div className="p-8 bg-slate-900/50 border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
          <Banknote className="text-emerald-400 mb-6" size={32} />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Liquid Assets</p>
          <h3 className="text-3xl font-black text-white mt-2 tabular-nums">
            {payments.filter(p => p.payment_method?.toLowerCase() === 'cash' || !p.payment_method).length}
          </h3>
          <p className="text-[10px] font-bold text-slate-700 uppercase mt-2">Cash Collections</p>
        </div>

        <div className="p-8 bg-slate-900/50 border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
          <Globe className="text-sky-400 mb-6" size={32} />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Wire Transfers</p>
          <h3 className="text-3xl font-black text-white mt-2 tabular-nums">
            {payments.filter(p => p.payment_method?.toLowerCase() === 'bank transfer').length}
          </h3>
          <p className="text-[10px] font-bold text-slate-700 uppercase mt-2">Neural Wire Flows</p>
        </div>

        <div className="p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-[2.5rem] relative overflow-hidden group">
          <Activity className="text-indigo-500 mb-6" size={32} />
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Avg. Ticket</p>
          <h3 className="text-3xl font-black text-white mt-2 tabular-nums">
            Rs. {payments.length > 0 ? Math.round(totalRevenue / payments.length).toLocaleString() : 0}
          </h3>
          <p className="text-[10px] font-bold text-indigo-900/50 uppercase mt-2">Per Node Ingress</p>
        </div>
      </div>

      {/* Advanced Filter Matrix */}
      <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[3rem] backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-indigo-400" size={20} />
            <input 
              type="text" 
              placeholder="Query by shop name or reference hash..." 
              className="w-full pl-16 pr-6 py-5 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-4 bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-2">
              <Calendar size={18} className="text-slate-500" />
              <input 
                type="date" 
                className="bg-transparent text-white focus:outline-none text-[10px] font-black uppercase py-3"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <div className="w-[1px] h-6 bg-white/5" />
              <input 
                type="date" 
                className="bg-transparent text-white focus:outline-none text-[10px] font-black uppercase py-3"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <button 
              onClick={fetchPayments}
              className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-indigo-900/40 active:scale-95"
            >
              Update Filter
            </button>
          </div>
        </div>
      </div>

      {/* Neural Ledger Table */}
      <div className="bg-slate-900/50 border border-white/5 rounded-[4rem] overflow-hidden backdrop-blur-sm relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Source Identity</th>
                <th className="px-8 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Temporal Stamp</th>
                <th className="px-8 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Capital Volume</th>
                <th className="px-8 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Protocol / Ref</th>
                <th className="px-8 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Record Integrity</th>
                <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                      <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Accessing Capital Registry...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-10 py-32 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                        <Wallet size={48} />
                        <p className="text-xl font-black uppercase tracking-tighter">No capital flows matched query</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="group hover:bg-white/[0.03] transition-all duration-300">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black border border-indigo-500/10 group-hover:scale-110 transition-transform duration-500">
                          {p.shop_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-white text-lg tracking-tight group-hover:text-indigo-400 transition-colors">{p.shop_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">ID: {p.shop_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-3">
                          <Clock size={16} className="text-slate-600" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-300">{new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            <span className="text-[10px] text-slate-500 font-black uppercase mt-0.5">{new Date(p.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                          </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex flex-col">
                          <span className="text-2xl font-black text-emerald-400 tabular-nums">Rs. {parseFloat(p.amount).toLocaleString()}</span>
                          <span className="text-[10px] text-slate-700 font-black uppercase">Net Ingress</span>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/5 rounded-xl text-slate-400">
                              {getMethodIcon(p.payment_method)}
                          </div>
                          <div>
                            <span className="text-sm font-black text-white uppercase tracking-tighter leading-none">{p.payment_method || 'Cash'}</span>
                            <p className="text-[10px] text-slate-500 font-mono mt-1">{p.reference_no || 'SYSTEM_GEN'}</p>
                          </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                        <div className="flex items-center gap-3">
                            <ShieldCheck size={16} className="text-indigo-500" />
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{p.performed_by_name || 'System Auth'}</span>
                        </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20 shadow-xl shadow-emerald-900/10">
                        <CheckCircle2 size={12} />
                        Confirmed
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPaymentsPage;
