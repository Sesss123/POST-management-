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
  DollarSign
} from 'lucide-react';
import api from '../../api/apiClient';
import { useToast } from '../../components/ui/Feedback';


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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Subscription Payments</h1>
          <p className="text-slate-400 mt-1">Global revenue and payment history tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold text-white transition-all">
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign size={80} className="text-indigo-500" />
          </div>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Total Revenue</p>
          <h3 className="text-4xl font-black text-white mt-2">Rs. {totalRevenue.toLocaleString()}</h3>
          <div className="flex items-center gap-2 mt-4 text-emerald-400 text-sm font-bold">
            <TrendingUp size={16} />
            <span>+12.5% from last month</span>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <CreditCard size={80} className="text-indigo-500" />
          </div>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Total Payments</p>
          <h3 className="text-4xl font-black text-white mt-2">{payments.length}</h3>
          <p className="text-slate-500 text-sm mt-4 font-medium">Recorded across all shops</p>
        </div>
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Activity size={80} className="text-indigo-500" />
          </div>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Avg. Payment</p>
          <h3 className="text-4xl font-black text-white mt-2">
            Rs. {payments.length > 0 ? Math.round(totalRevenue / payments.length).toLocaleString() : 0}
          </h3>
          <p className="text-slate-500 text-sm mt-4 font-medium">Per successful transaction</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="text" 
              placeholder="Search by shop or reference..." 
              className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-950 border border-white/10 rounded-2xl px-4 py-2">
              <Calendar size={18} className="text-slate-500" />
              <input 
                type="date" 
                className="bg-transparent text-white focus:outline-none text-sm font-bold py-2"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span className="text-slate-600 font-bold">to</span>
              <input 
                type="date" 
                className="bg-transparent text-white focus:outline-none text-sm font-bold py-2"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <button 
              onClick={fetchPayments}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-indigo-900/20"
            >
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Shop / Entity</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Date & Time</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Method / Ref</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Recorded By</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading transactions...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center text-slate-500 font-bold">
                    No payment records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{p.shop_name}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-tight font-black mt-0.5">ID: {p.shop_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{new Date(p.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-indigo-400">Rs. {parseFloat(p.amount).toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white capitalize">{p.payment_method || 'Cash'}</span>
                        <span className="text-[10px] text-slate-500 font-bold">{p.reference_no || 'No Reference'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-400">
                      {p.performed_by_name || 'System'}
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                        Successful
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
