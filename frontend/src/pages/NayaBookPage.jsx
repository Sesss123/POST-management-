import React, { useState, useEffect, useCallback } from 'react';
import { customerApi, paymentApi, reportApi, settingApi, invoiceApi } from '../api/api';
import { 
  BookOpen, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet,
  Calendar,
  User,
  Plus,
  CheckCircle2,
  X,
  History,
  AlertCircle,
  Clock,
  Receipt,
  Printer,
  Eye,
  ChevronRight,
  Filter,
  RefreshCcw,
  CreditCard,
  UserCheck,
  UserMinus,
  FileText,
  Sparkles,
  TrendingUp,
  Activity,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import { AppButton, AppCard, AppModal, useToast, FormInput, FormSelect, Badge } from '../components/ui';
import InvoicePrintModal from '../components/invoice/InvoicePrintModal';
import PaymentPrintModal from '../components/invoice/PaymentPrintModal';
import { cn } from '../utils/cn';

const GlassCard = ({ title, value, icon: Icon, variant = 'primary', className }) => {
    const variants = {
        primary: "bg-indigo-50 border-indigo-100",
        success: "bg-emerald-50 border-emerald-100",
        danger: "bg-rose-50 border-rose-100",
        warning: "bg-amber-50 border-amber-100",
    };

    const iconBg = {
        primary: "bg-white text-indigo-600",
        success: "bg-white text-emerald-600",
        danger: "bg-white text-rose-600",
        warning: "bg-white text-amber-600",
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
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm", iconBg[variant])}>
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

const NayaBookPage = () => {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    total_outstanding: 0,
    credit_customers: 0,
    payments_today: 0,
    over_limit_customers: 0,
    naya_status: 'Healthy'
  });
  const [search, setSearch] = useState('');
  const [includeZero, setIncludeZero] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [accountData, setAccountData] = useState({
    customer: null,
    summary: {
        current_balance: 0,
        unpaid_invoice_total: 0,
        unpaid_invoice_count: 0,
        last_payment_date: null
    },
    ledger: [],
    unpaid_invoices: [],
    payments: []
  });
  const [loading, setLoading] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPaymentPrintModal, setShowPaymentPrintModal] = useState(false);
  const [lastPayment, setLastPayment] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [paymentData, setPaymentData] = useState({
      amount: '',
      method: 'cash',
      note: ''
  });
  const [processing, setProcessing] = useState(false);

  // Mobile state
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, includeZero]);

  useEffect(() => {
    fetchSummary();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
        const { data } = await settingApi.getAll();
        setSettings(data.data);
    } catch (err) {
        console.error('Failed to fetch settings');
    }
  };

  const fetchSummary = async () => {
    try {
        const { data } = await reportApi.getCreditSummary();
        if (data.success) {
            setSummary(data.data);
        }
    } catch (err) {
        console.error('Failed to fetch credit summary');
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
        const { data } = await customerApi.getDebtors({
            search,
            include_zero: includeZero
        });
        if (data.success) {
            setCustomers(data.data);
        }
    } catch (err) {
        toast.error('Failed to load customers');
    } finally {
        setLoading(false);
    }
  };

  const fetchAccountDetails = async (customerId) => {
    setLoadingAccount(true);
    try {
        const { data } = await customerApi.getAccount(customerId);
        if (data.success) {
            setAccountData(data.data);
            setSelectedCustomer(data.data.customer);
        }
    } catch (err) {
        toast.error('Failed to load account details');
    } finally {
        setLoadingAccount(false);
    }
  };

  const handleSelectCustomer = (c) => {
      setSelectedCustomer(c);
      fetchAccountDetails(c.id);
      setViewMode('detail');
  };

  const handleRefresh = () => {
    fetchSummary();
    fetchCustomers();
    if (selectedCustomer) {
        fetchAccountDetails(selectedCustomer.id);
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    try {
        const { data } = await invoiceApi.getDetails(invoiceId);
        setSelectedInvoice({ ...data.data, settings });
        setShowPrintModal(true);
    } catch (err) {
        toast.error('Failed to load invoice');
    }
  };

  const handlePayment = async (e) => {
      e.preventDefault();
      const amountNum = parseFloat(paymentData.amount);
      if (!amountNum || amountNum <= 0) return toast.error('Enter a valid amount');
      
      setProcessing(true);
      try {
          const { data } = await paymentApi.recordCustomerPayment({
              customer_id: selectedCustomer.id,
              amount: amountNum,
              payment_method: paymentData.method,
              note: paymentData.note
          });
          
          if (data.success) {
            setLastPayment({
                ...data.data,
                customer_name: selectedCustomer.name,
                payment_method: paymentData.method,
                note: paymentData.note
            });
            
            toast.success('Payment recorded and allocated successfully!');
            setShowPaymentModal(false);
            setPaymentData({ amount: '', method: 'cash', note: '' });
            
            handleRefresh();
            
            // Show the print receipt modal
            setShowPaymentPrintModal(true);
          }
      } catch (err) {
          toast.error(err.response?.data?.message || 'Payment failed');
      } finally {
          setProcessing(false);
      }
  };

  const isOverLimit = selectedCustomer && parseFloat(selectedCustomer.current_balance) > parseFloat(selectedCustomer.credit_limit) && parseFloat(selectedCustomer.credit_limit) > 0;

  const formatCurrency = (val) => {
    return `Rs. ${parseFloat(val || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] space-y-4 animate-in fade-in duration-700 p-1 selection:bg-purple-500/30 overflow-hidden bg-slate-50/50">
      {/* Premium White Neural Header */}
      <header className="relative group shrink-0">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 rounded-[48px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
            <div className="flex items-center gap-6 relative z-10">
                {viewMode === 'detail' && (
                    <button 
                        onClick={() => setViewMode('list')}
                        className="lg:hidden w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-purple-600 transition-all border border-slate-100"
                    >
                        <ChevronLeft size={24} />
                    </button>
                )}
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-purple-500/40 group-hover:scale-110 transition-transform duration-500">
                    <BookOpen size={32} />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={14} className="text-purple-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-600">Ledger Intelligence</span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-1 uppercase">
                        {viewMode === 'detail' ? selectedCustomer?.name : 'Naya Book'}
                    </h2>
                    <p className="text-sm font-medium text-slate-400">Credit exposure monitoring and account reconciliation</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto relative z-10">
                <AppButton 
                    variant="secondary" 
                    icon={RefreshCcw} 
                    size="lg" 
                    className="rounded-[24px] bg-white border-slate-100 text-slate-400 hover:text-purple-600 shadow-sm" 
                    onClick={handleRefresh} 
                    loading={loading}
                >
                    Sync Hub
                </AppButton>
            </div>
        </div>
      </header>

      {/* Global Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
          <GlassCard 
            title="Total Outstanding" 
            value={formatCurrency(summary.total_outstanding)} 
            icon={TrendingUp} 
            variant="danger" 
          />
          <GlassCard 
            title="Active Debtors" 
            value={summary.credit_customers} 
            icon={User} 
            variant="primary" 
          />
          <GlassCard 
            title="Payments Today" 
            value={formatCurrency(summary.payments_today)} 
            icon={CheckCircle2} 
            variant="success" 
          />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 min-h-0 overflow-hidden relative">
        {/* Left: Customer List - White Theme */}
        <div className={cn(
            "lg:col-span-4 flex flex-col gap-6 min-h-0 transition-all duration-300",
            viewMode === 'detail' ? "hidden lg:flex" : "flex"
        )}>
            <div className="space-y-4 shrink-0 px-1">
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search identification..." 
                        className="w-full bg-white border border-slate-100 rounded-[32px] py-6 pl-16 pr-8 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-600 transition-all shadow-xl shadow-slate-200/40"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center justify-between px-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={cn(
                            "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                            includeZero ? "bg-purple-600 border-purple-600" : "bg-white border-slate-200 group-hover:border-purple-400 shadow-inner"
                        )}>
                            <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={includeZero}
                                onChange={() => setIncludeZero(!includeZero)}
                            />
                            {includeZero && <Plus className="text-white w-4 h-4 rotate-45" />}
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Show cleared accounts</span>
                    </label>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-20 px-1">
                {customers.map(c => (
                    <button 
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        className={cn(
                            "w-full text-left p-8 rounded-[40px] border transition-all duration-500 group relative overflow-hidden",
                            selectedCustomer?.id === c.id 
                                ? "bg-gradient-to-br from-purple-600 to-indigo-700 border-transparent shadow-2xl shadow-purple-900/20 scale-[1.02]" 
                                : "bg-white border-slate-100 hover:border-purple-400 hover:bg-slate-50 shadow-sm"
                        )}
                    >
                        {selectedCustomer?.id === c.id && (
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
                        )}
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                                <h4 className={cn("font-black text-xl tracking-tight truncate mb-1 uppercase", selectedCustomer?.id === c.id ? "text-white" : "text-slate-900")}>{c.name}</h4>
                                <p className={cn("text-[10px] font-bold mb-6 uppercase tracking-widest", selectedCustomer?.id === c.id ? "text-purple-200" : "text-slate-400")}>{c.phone}</p>
                                <div className="flex justify-between items-end">
                                    <div className={cn(
                                        "p-5 rounded-[28px] transition-all flex flex-col",
                                        selectedCustomer?.id === c.id ? "bg-white/10" : "bg-slate-50"
                                    )}>
                                        <p className={cn("text-[8px] font-black uppercase tracking-[0.2em] mb-1", selectedCustomer?.id === c.id ? "text-purple-200" : "text-slate-400")}>Total Arrears</p>
                                        <p className={cn("text-2xl font-black tabular-nums tracking-tighter", selectedCustomer?.id === c.id ? "text-white" : "text-rose-600")}>{formatCurrency(c.current_balance)}</p>
                                    </div>
                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:translate-x-1 shadow-sm", selectedCustomer?.id === c.id ? "bg-white/20 text-white" : "bg-white border border-slate-100 text-slate-300")}>
                                        <ArrowRight size={20} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
                {customers.length === 0 && !loading && (
                    <div className="py-20 text-center opacity-20"><BookOpen size={48} className="mx-auto mb-4 text-slate-300" /><p className="text-sm font-black uppercase tracking-widest text-slate-400">No records found</p></div>
                )}
            </div>
        </div>

        {/* Right: Account Statement - White Theme */}
        <div className={cn(
            "lg:col-span-8 flex flex-col min-h-0 bg-white rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden",
            viewMode === 'list' ? "hidden lg:flex" : "flex"
        )}>
            {selectedCustomer ? (
                <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-700 overflow-hidden">
                    {/* Header Strip */}
                    <header className={cn(
                        "p-10 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-10 bg-slate-50/30 shrink-0",
                        isOverLimit ? "border-rose-100" : "border-slate-50"
                    )}>
                        <div className="flex items-center gap-8">
                            <div className={cn(
                                "w-24 h-24 rounded-[32px] flex items-center justify-center shadow-xl shrink-0 transition-transform hover:scale-105 border-2",
                                isOverLimit ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-indigo-50 border-indigo-100 text-indigo-600"
                            )}>
                                <User size={40} />
                            </div>
                            <div>
                                <div className="flex items-center gap-4 mb-2">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">{selectedCustomer.name}</h2>
                                    <Badge variant={selectedCustomer.status === 'active' ? 'success' : 'danger'} className="px-6 py-1 rounded-xl font-black text-[9px] uppercase shadow-sm">
                                        {selectedCustomer.status === 'active' ? 'PROTOCOL HEALTHY' : 'SUSPENDED'}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-8 gap-y-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    <span className="flex items-center gap-2"><Phone size={14} className="text-indigo-600" /> {selectedCustomer.phone}</span>
                                    <span className="flex items-center gap-2"><CreditCard size={14} className="text-indigo-600" /> Limit: {formatCurrency(selectedCustomer.credit_limit)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <AppButton 
                                variant="primary" 
                                size="lg" 
                                className="w-full sm:w-auto px-10 py-6 rounded-[24px] uppercase tracking-[0.2em] font-black shadow-2xl shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-500 border-none active:scale-95 text-[10px]"
                                onClick={() => setShowPaymentModal(true)}
                                disabled={parseFloat(selectedCustomer.current_balance) <= 0 || processing}
                                icon={Wallet}
                            >
                                Settle Exposure
                            </AppButton>
                        </div>
                    </header>

                    {/* Stats Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10 bg-slate-50/50 border-b border-slate-100 shrink-0">
                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:border-indigo-400 transition-all">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Net Exposure</p>
                            <h3 className={cn("text-4xl font-black tracking-tighter tabular-nums", isOverLimit ? "text-rose-600" : "text-slate-900")}>{formatCurrency(selectedCustomer.current_balance)}</h3>
                        </div>
                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:border-indigo-400 transition-all">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Pending Invoices</p>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">{accountData.summary.unpaid_invoice_count}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Value: {formatCurrency(accountData.summary.unpaid_invoice_total)}</p>
                        </div>
                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:border-indigo-400 transition-all">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Last Settlement</p>
                            <h3 className="text-2xl font-black text-indigo-600 tracking-tighter uppercase leading-none">
                                {accountData.summary.last_payment_date ? new Date(accountData.summary.last_payment_date).toLocaleDateString() : 'NO HISTORY'}
                            </h3>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
                        {/* Outstanding Invoices */}
                        <div className="lg:col-span-7 flex flex-col min-h-0 border-r border-slate-50">
                            <div className="p-10 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white">
                                <div className="flex items-center gap-4 text-slate-900">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                                        <Receipt size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-black uppercase tracking-tight text-lg">Liability Ledger</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Pending Protocol Settlement</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                                <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/40">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol ID</th>
                                                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                                                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Arrears</th>
                                                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {[...accountData.unpaid_invoices].reverse().map(inv => (
                                                <tr key={inv.id} className="group hover:bg-slate-50 transition-all">
                                                    <td className="px-8 py-8">
                                                        <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm">{inv.invoice_no}</span>
                                                    </td>
                                                    <td className="px-8 py-8">
                                                        <p className="text-sm font-black text-slate-900 tabular-nums mb-1">{new Date(inv.created_at).toLocaleDateString()}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </td>
                                                    <td className="px-8 py-8">
                                                        <p className="text-lg font-black text-rose-600 tabular-nums tracking-tighter">{formatCurrency(inv.balance_amount)}</p>
                                                    </td>
                                                    <td className="px-8 py-8 text-right">
                                                        <button 
                                                            onClick={() => handleViewInvoice(inv.id)}
                                                            className="w-12 h-12 bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all flex items-center justify-center border border-slate-100 shadow-sm"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {accountData.unpaid_invoices.length === 0 && (
                                        <div className="py-40 text-center opacity-20 flex flex-col items-center bg-slate-50/50">
                                            <CheckCircle2 size={64} className="mb-6 text-slate-300" />
                                            <p className="text-2xl font-black uppercase tracking-widest text-slate-400">LEDGER FULLY SETTLED</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Audit Trail */}
                        <div className="lg:col-span-5 flex flex-col min-h-0 bg-slate-50/50">
                            <div className="p-10 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                                <div className="flex items-center gap-4 text-slate-900">
                                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                                        <History size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-black uppercase tracking-tight text-lg">Audit Trail</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Telemetry History</p>
                                    </div>
                                </div>
                                {loadingAccount && <RefreshCcw size={18} className="text-indigo-600 animate-spin" />}
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                                {accountData.ledger.map((entry, idx) => (
                                    <div key={entry.id} className="flex gap-6 relative group">
                                        {idx !== accountData.ledger.length - 1 && (
                                            <div className="absolute left-[23px] top-12 bottom-[-40px] w-[2px] bg-slate-200" />
                                        )}
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 z-10 shadow-lg border-2 transition-all group-hover:scale-110",
                                            entry.type === 'debit' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                        )}>
                                            {entry.type === 'debit' ? <ArrowUpRight size={22} /> : <ArrowDownLeft size={22} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h5 className="font-black text-slate-900 text-base truncate uppercase tracking-tighter mb-1">
                                                        {entry.type === 'debit' ? 'Credit Issuance' : 'Settlement Log'}
                                                    </h5>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                        {new Date(entry.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={cn(
                                                        "text-lg font-black tracking-tighter tabular-nums",
                                                        entry.type === 'debit' ? "text-rose-600" : "text-emerald-600"
                                                    )}>
                                                        {entry.type === 'debit' ? '+' : '-'} {formatCurrency(entry.amount)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all group-hover:border-indigo-200">
                                                <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{entry.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {accountData.ledger.length === 0 && (
                                    <div className="py-40 text-center opacity-20 flex flex-col items-center">
                                        <Activity size={48} className="mb-6 text-slate-300" />
                                        <p className="text-sm font-black uppercase tracking-widest text-slate-400">NO TELEMETRY RECORDED</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-20 group">
                    <div className="w-32 h-32 bg-slate-50 rounded-[44px] flex items-center justify-center text-slate-300 mb-10 shadow-inner group-hover:scale-110 transition-transform duration-700">
                        <BookOpen size={64} className="opacity-20" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-400 uppercase tracking-tighter mb-4">Initialize Account Identification</h3>
                    <p className="text-slate-400 max-w-sm font-medium leading-relaxed">Select a terminal identifier from the directory to decrypt full account statements and execute payment protocols.</p>
                </div>
            )}
        </div>
      </div>

      {/* Payment Execution Modal - White Theme */}
      <AppModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Payment Execution Protocol"
        description={`Initiating settlement for ${selectedCustomer?.name}`}
        size="md"
      >
        <div className="space-y-10 py-6">
            <div className="p-10 bg-rose-50 border-2 border-rose-100 rounded-[44px] relative overflow-hidden group shadow-inner">
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Activity size={14} className="text-rose-500" />
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Total Outstanding</p>
                        </div>
                        <p className="text-5xl font-black text-rose-600 tracking-tighter tabular-nums">{formatCurrency(selectedCustomer?.current_balance)}</p>
                    </div>
                    <div className="w-20 h-20 bg-white rounded-[28px] flex items-center justify-center text-rose-600 shadow-xl border border-rose-100">
                        <Wallet size={36} />
                    </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/50 rounded-full blur-3xl" />
            </div>

            <form onSubmit={handlePayment} className="space-y-8">
                <FormInput 
                    label="Settlement Magnitude (Amount)"
                    type="number"
                    required
                    placeholder="0.00"
                    icon={Wallet}
                    value={paymentData.amount}
                    onChange={e => setPaymentData({...paymentData, amount: e.target.value})}
                    className="text-4xl font-black tabular-nums bg-slate-50 py-10 px-8 rounded-[32px] border-2 border-slate-100 focus:border-indigo-600 transition-all text-center"
                    autoFocus
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormSelect 
                        label="Settlement Protocol"
                        value={paymentData.method}
                        onChange={e => setPaymentData({...paymentData, method: e.target.value})}
                        options={[
                            { value: 'cash', label: 'CASH SETTLEMENT' },
                            { value: 'bank_transfer', label: 'WIRE TRANSFER' },
                            { value: 'card', label: 'CARD PROTOCOL' },
                            { value: 'qr', label: 'QR SCAN' }
                        ]}
                        className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600"
                    />
                    <FormInput 
                        label="Reference Identifier"
                        placeholder="Metadata / Notes..."
                        icon={FileText}
                        value={paymentData.note}
                        onChange={e => setPaymentData({...paymentData, note: e.target.value})}
                        className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600"
                    />
                </div>
                
                {parseFloat(paymentData.amount) > 0 && (
                    <div className="p-8 bg-slate-900 rounded-[36px] flex justify-between items-center animate-in zoom-in-95 duration-500 shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                <CheckCircle2 size={28} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Projected Balance</p>
                                <span className="font-black text-3xl text-emerald-400 tabular-nums tracking-tighter">{formatCurrency(parseFloat(selectedCustomer?.current_balance || 0) - parseFloat(paymentData.amount))}</span>
                            </div>
                        </div>
                        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]" />
                    </div>
                )}

                <div className="flex gap-6 pt-6">
                    <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Abort Protocol</button>
                    <AppButton variant="success" className="flex-[2] py-6 rounded-[28px] font-black uppercase tracking-widest text-xs shadow-2xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 border-none active:scale-95" loading={processing} type="submit">Authorize Settlement</AppButton>
                </div>
            </form>
        </div>
      </AppModal>

      <InvoicePrintModal 
        isOpen={showPrintModal} 
        onClose={() => setShowPrintModal(false)} 
        invoice={selectedInvoice} 
      />

      <PaymentPrintModal
        isOpen={showPaymentPrintModal}
        onClose={() => setShowPaymentPrintModal(false)}
        payment={lastPayment}
        settings={settings}
      />
    </div>
  );
};

export default NayaBookPage;
