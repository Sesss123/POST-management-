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
  FileText
} from 'lucide-react';
import { AppButton, AppCard, AppModal, StatCard, useToast, FormInput, FormSelect } from '../components/ui';
import InvoicePrintModal from '../components/invoice/InvoicePrintModal';
import { cn } from '../utils/cn';

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
          await paymentApi.recordCustomerPayment({
              customer_id: selectedCustomer.id,
              amount: amountNum,
              payment_method: paymentData.method,
              note: paymentData.note
          });
          
          toast.success('Payment recorded and allocated successfully!');
          setShowPaymentModal(false);
          setPaymentData({ amount: '', method: 'cash', note: '' });
          
          handleRefresh();
      } catch (err) {
          toast.error(err.response?.data?.message || 'Payment failed');
      } finally {
          setProcessing(false);
      }
  };

  const isOverLimit = selectedCustomer && parseFloat(selectedCustomer.current_balance) > parseFloat(selectedCustomer.credit_limit) && parseFloat(selectedCustomer.credit_limit) > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-h-screen overflow-hidden flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
            {viewMode === 'detail' && (
                <button 
                    onClick={() => setViewMode('list')}
                    className="lg:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowUpRight className="rotate-[225deg]" size={24} />
                </button>
            )}
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 flex items-center gap-2 lg:gap-3 uppercase tracking-tight truncate">
                <BookOpen className="text-purple-600 hidden sm:block" />
                {viewMode === 'detail' ? selectedCustomer?.name : 'Customer Accounts'}
            </h1>
        </div>
        <div className="flex gap-2 lg:gap-4">
            <button 
                onClick={handleRefresh}
                className="p-2 lg:p-3 bg-white rounded-xl lg:rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-slate-600 shrink-0"
                title="Refresh All"
            >
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            </button>
        </div>
      </div>

      {/* Top Global Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-6 shrink-0">
          <StatCard 
            variant="credit"
            title="Outstanding" 
            value={`Rs. ${(summary.total_outstanding || 0).toLocaleString()}`} 
            icon={BookOpen} 
          />
          <StatCard 
            title="Debtors" 
            value={summary.credit_customers} 
            icon={User} 
          />
          <StatCard 
            variant="success"
            title="Settled" 
            value={`Rs. ${(summary.payments_today || 0).toLocaleString()}`}
            icon={CheckCircle2} 
          />
          <StatCard 
            variant={summary.naya_status === 'Healthy' ? 'success' : 'warning'}
            title="Status" 
            value={summary.naya_status} 
            icon={summary.naya_status === 'Healthy' ? UserCheck : AlertCircle} 
          />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 overflow-hidden relative">
        {/* Left: Customer List */}
        <div className={cn(
            "lg:col-span-4 flex flex-col gap-4 lg:gap-6 min-h-0 transition-all duration-300",
            viewMode === 'detail' ? "hidden lg:flex" : "flex"
        )}>
            <div className="space-y-4 shrink-0 px-1">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search name or phone..." 
                        className="w-full bg-white border-2 border-transparent rounded-[24px] py-4 pl-12 pr-4 text-slate-900 font-bold shadow-lg shadow-slate-200/50 outline-none focus:border-purple-600 transition-all text-sm lg:text-base"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center justify-between px-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={cn(
                            "w-4 h-4 lg:w-5 lg:h-5 rounded-md border-2 flex items-center justify-center transition-all",
                            includeZero ? "bg-purple-600 border-purple-600" : "bg-white border-slate-300 group-hover:border-purple-400"
                        )}>
                            <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={includeZero}
                                onChange={() => setIncludeZero(!includeZero)}
                            />
                            {includeZero && <Plus className="text-white w-2 h-2 lg:w-3 lg:h-3 rotate-45" />}
                        </div>
                        <span className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">Show zero balance</span>
                    </label>
                    {loading && <span className="text-[9px] lg:text-[10px] font-black text-purple-600 animate-pulse uppercase">Syncing...</span>}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-10 px-1">
                {customers.map(c => (
                    <button 
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        className={cn(
                            "w-full text-left p-5 lg:p-6 rounded-[28px] lg:rounded-[32px] border-2 transition-all group relative overflow-hidden",
                            selectedCustomer?.id === c.id 
                                ? "bg-purple-600 border-purple-600 shadow-xl shadow-purple-900/30" 
                                : "bg-white border-transparent hover:border-purple-200 shadow-lg shadow-slate-100"
                        )}
                    >
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                                <h4 className={cn("font-black text-base lg:text-lg tracking-tight truncate", selectedCustomer?.id === c.id ? "text-white" : "text-slate-900")}>{c.name}</h4>
                                <p className={cn("text-[9px] lg:text-[10px] font-bold mb-3 lg:mb-4 uppercase tracking-widest", selectedCustomer?.id === c.id ? "text-purple-200" : "text-slate-400")}>{c.phone}</p>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className={cn("text-[7px] lg:text-[8px] font-black uppercase tracking-[0.2em] mb-1", selectedCustomer?.id === c.id ? "text-purple-300" : "text-slate-400")}>Owed</p>
                                        <p className={cn("text-xl lg:text-2xl font-black tracking-tighter", selectedCustomer?.id === c.id ? "text-white" : "text-rose-600")}>Rs. {parseFloat(c.current_balance).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn("text-[7px] lg:text-[8px] font-black uppercase tracking-[0.2em] mb-1", selectedCustomer?.id === c.id ? "text-purple-300" : "text-slate-400")}>Left</p>
                                        <p className={cn("text-[10px] lg:text-xs font-black", selectedCustomer?.id === c.id ? "text-purple-100" : "text-emerald-600")}>Rs. {parseFloat(c.remaining_credit || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* Right: Account Statement */}
        <div className={cn(
            "lg:col-span-8 flex flex-col min-h-0",
            viewMode === 'list' ? "hidden lg:flex" : "flex"
        )}>
            {selectedCustomer ? (
                <div className="flex flex-col h-full space-y-6 animate-in slide-in-from-right-8 duration-500 overflow-hidden">
                    {/* Account Header */}
                    <div className={cn(
                        "rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl transition-all shrink-0",
                        isOverLimit ? "bg-rose-900 shadow-rose-900/40" : "bg-slate-900 shadow-slate-900/40"
                    )}>
                        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
                            <div className="flex items-center gap-4 lg:gap-6">
                                <div className={cn(
                                    "w-16 h-16 lg:w-20 lg:h-20 rounded-[28px] lg:rounded-[32px] flex items-center justify-center shadow-2xl shrink-0",
                                    isOverLimit ? "bg-rose-600 shadow-rose-900/50" : "bg-purple-600 shadow-purple-900/50"
                                )}>
                                    <User size={32} className="lg:w-10 lg:h-10" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 lg:gap-3 mb-1">
                                        <h2 className="text-xl lg:text-3xl font-black tracking-tight truncate">{selectedCustomer.name}</h2>
                                        {selectedCustomer.status === 'blocked' && (
                                            <span className="bg-rose-500 text-white text-[7px] lg:text-[8px] font-black px-1.5 lg:px-2 py-0.5 rounded uppercase shrink-0">Blocked</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-x-3 lg:gap-x-4 gap-y-1 text-[9px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        <span className="flex items-center gap-1"><User size={10} className="lg:w-3 lg:h-3" /> {selectedCustomer.phone}</span>
                                        <span className={cn("px-1.5 lg:px-2 py-0.5 rounded bg-white/5", isOverLimit ? "text-rose-400" : "text-emerald-400")}>
                                            Limit: Rs. {parseFloat(selectedCustomer.credit_limit).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-start lg:items-end">
                                <p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] lg:tracking-[0.3em] mb-0.5 lg:mb-1">Outstanding</p>
                                <p className="text-3xl lg:text-5xl font-black tracking-tighter text-white">Rs. {parseFloat(selectedCustomer.current_balance).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2 lg:gap-3 shrink-0">
                                <AppButton 
                                    variant="secondary" 
                                    size="sm" 
                                    className="flex-1 lg:flex-none lg:px-6 lg:py-5 rounded-xl lg:rounded-[28px] uppercase tracking-widest font-black bg-white/10 text-white border-transparent hover:bg-white/20 transition-all text-[8px] lg:text-base"
                                    onClick={() => toast.info('Statement generation coming soon')}
                                    icon={FileText}
                                >
                                    STMT
                                </AppButton>
                                <AppButton 
                                    variant="success" 
                                    size="lg" 
                                    className="flex-[2] lg:flex-none lg:px-8 lg:py-5 rounded-xl lg:rounded-[28px] uppercase tracking-widest font-black shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 text-[10px] lg:text-base"
                                    onClick={() => setShowPaymentModal(true)}
                                    disabled={parseFloat(selectedCustomer.current_balance) <= 0 || processing}
                                    icon={Wallet}
                                >
                                    PAY
                                </AppButton>
                            </div>
                        </div>
                        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px]" />
                    </div>

                    {/* Summary Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 shrink-0">
                        <div className="bg-white p-6 rounded-[32px] shadow-lg shadow-slate-100 border border-slate-50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unpaid Invoices</p>
                            <p className="text-2xl font-black text-slate-900">{accountData.summary.unpaid_invoice_count}</p>
                        </div>
                        <div className="bg-white p-6 rounded-[32px] shadow-lg shadow-slate-100 border border-slate-50 relative group">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Amount</p>
                            <div className="flex items-center gap-2">
                                <p className="text-2xl font-black text-rose-500">Rs. {parseFloat(accountData.summary.unpaid_invoice_total).toLocaleString()}</p>
                                {Math.abs(parseFloat(accountData.summary.current_balance) - parseFloat(accountData.summary.unpaid_invoice_total)) > 0.01 && (
                                    <div className="text-amber-500 hover:text-amber-600 transition-colors cursor-help" title={`Account balance mismatch! Current: Rs. ${parseFloat(accountData.summary.current_balance).toLocaleString()}`}>
                                        <AlertCircle size={16} />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-[32px] shadow-lg shadow-slate-100 border border-slate-50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Credit Limit Left</p>
                            <p className="text-2xl font-black text-emerald-500">Rs. {parseFloat(selectedCustomer.remaining_credit || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-6 rounded-[32px] shadow-lg shadow-slate-100 border border-slate-50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Payment</p>
                            <p className="text-lg font-black text-slate-700">
                                {accountData.summary.last_payment_date ? new Date(accountData.summary.last_payment_date).toLocaleDateString() : 'Never'}
                            </p>
                        </div>
                    </div>

                    {/* Tabbed Content */}
                    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden pb-4">
                        {/* Left Column: Unpaid Invoices & History */}
                        <div className="lg:col-span-7 flex flex-col gap-6 min-h-0 overflow-hidden">
                            {/* Unpaid Invoices Table */}
                            <div className="flex-1 bg-white rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col overflow-hidden">
                                <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3">
                                        <Receipt className="text-rose-500" size={20} />
                                        <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Outstanding Invoices</h3>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Oldest First</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    <table className="w-full text-left border-separate border-spacing-y-3">
                                        <thead className="sticky top-0 bg-white z-10">
                                            <tr>
                                                <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Invoice</th>
                                                <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] hidden sm:table-cell">Date</th>
                                                <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] hidden md:table-cell">Total</th>
                                                <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Balance</th>
                                                <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...accountData.unpaid_invoices].reverse().map(inv => (
                                                <tr key={inv.id} className="group hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-4 rounded-l-2xl border-y border-l border-slate-50">
                                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tighter truncate max-w-[100px]">{inv.invoice_no}</p>
                                                        <span className="text-[7px] font-bold text-slate-400 uppercase sm:hidden">{new Date(inv.created_at).toLocaleDateString()}</span>
                                                    </td>
                                                    <td className="px-4 py-4 border-y border-slate-50 hidden sm:table-cell">
                                                        <p className="text-[10px] font-bold text-slate-600">{new Date(inv.created_at).toLocaleDateString()}</p>
                                                    </td>
                                                    <td className="px-4 py-4 border-y border-slate-50 hidden md:table-cell">
                                                        <p className="text-[10px] font-bold text-slate-400 italic">Rs. {parseFloat(inv.grand_total).toLocaleString()}</p>
                                                    </td>
                                                    <td className="px-4 py-4 border-y border-slate-50">
                                                        <p className="text-xs lg:text-sm font-black text-rose-500">Rs. {parseFloat(inv.balance_amount).toLocaleString()}</p>
                                                    </td>
                                                    <td className="px-4 py-4 rounded-r-2xl border-y border-r border-slate-50 text-right">
                                                        <div className="flex justify-end gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => handleViewInvoice(inv.id)}
                                                                className="p-1.5 lg:p-2 bg-white rounded-lg lg:rounded-xl text-purple-600 hover:bg-purple-50 shadow-sm transition-all"
                                                                title="View"
                                                            >
                                                                <Eye size={12} className="lg:w-3.5 lg:h-3.5" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleViewInvoice(inv.id)}
                                                                className="p-1.5 lg:p-2 bg-white rounded-lg lg:rounded-xl text-purple-600 hover:bg-purple-50 shadow-sm transition-all hidden sm:block"
                                                                title="Print"
                                                            >
                                                                <Printer size={12} className="lg:w-3.5 lg:h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {accountData.unpaid_invoices.length === 0 && (
                                        <div className="py-12 lg:py-20 text-center opacity-30 flex flex-col items-center">
                                            <CheckCircle2 size={32} className="mb-3 lg:mb-4 text-emerald-500 lg:w-12 lg:h-12" />
                                            <p className="text-[10px] lg:text-sm font-black uppercase tracking-widest">No outstanding invoices</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Ledger History */}
                        <div className="lg:col-span-5 flex flex-col gap-6 min-h-0 overflow-hidden">
                            <div className="flex-1 bg-slate-900 rounded-[40px] shadow-2xl shadow-slate-900/20 flex flex-col overflow-hidden border border-white/5">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3 text-white">
                                        <History size={20} className="text-purple-400" />
                                        <h3 className="font-black uppercase tracking-tight text-sm">Account Ledger</h3>
                                    </div>
                                    {loadingAccount && <RefreshCcw size={14} className="text-purple-400 animate-spin" />}
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                    {accountData.ledger.map((entry, idx) => (
                                        <div key={entry.id} className="flex gap-4 relative">
                                            {idx !== accountData.ledger.length - 1 && (
                                                <div className="absolute left-[19px] top-10 bottom-[-24px] w-[2px] bg-white/5" />
                                            )}
                                            <div className={cn(
                                                "w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 z-10 shadow-lg border",
                                                entry.type === 'debit' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                            )}>
                                                {entry.type === 'debit' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div>
                                                        <h5 className="font-black text-white text-sm truncate uppercase tracking-tighter">
                                                            {entry.type === 'debit' ? 'Credit Bill' : 'Account Payment'}
                                                        </h5>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                            {new Date(entry.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={cn(
                                                            "text-sm font-black tracking-tighter",
                                                            entry.type === 'debit' ? "text-rose-400" : "text-emerald-400"
                                                        )}>
                                                            {entry.type === 'debit' ? '+' : '-'} Rs. {parseFloat(entry.amount).toLocaleString()}
                                                        </p>
                                                        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Bal: Rs. {parseFloat(entry.balance_after).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center group">
                                                    <p className="text-[10px] text-slate-400 font-medium italic truncate pr-2">{entry.description}</p>
                                                    {entry.invoice_id && (
                                                        <button 
                                                            onClick={() => handleViewInvoice(entry.invoice_id)}
                                                            className="p-1.5 bg-white/5 text-purple-400 hover:bg-white/10 rounded-lg transition-colors"
                                                            title="View Linked Invoice"
                                                        >
                                                            <FileText size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {accountData.ledger.length === 0 && (
                                        <div className="py-20 text-center text-slate-600 italic text-sm font-medium uppercase tracking-widest">No activity found</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-full bg-white rounded-[40px] shadow-xl shadow-slate-200/50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-12">
                    <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200 mb-8 shadow-inner">
                        <BookOpen size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tight mb-2">Select a Customer</h3>
                    <p className="text-slate-400 max-w-xs font-medium">Select a customer from the left list to view their full account statement and record payments.</p>
                </div>
            )}
        </div>
      </div>

      {/* Payment Modal */}
      <AppModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Account Payment"
        description={`Record a payment for ${selectedCustomer?.name}`}
        size="md"
      >
        <div className="space-y-8 py-4">
            <div className="p-8 bg-slate-900 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Outstanding Balance</p>
                        <p className="text-4xl font-black text-rose-500 tracking-tighter">Rs. {parseFloat(selectedCustomer?.current_balance || 0).toLocaleString()}</p>
                    </div>
                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-rose-500 border border-white/5">
                        <Wallet size={32} />
                    </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-purple-600/10 rounded-full blur-[60px]" />
            </div>

            <form onSubmit={handlePayment} className="space-y-6">
                <FormInput 
                    label="Payment Amount"
                    type="number"
                    required
                    placeholder="Enter amount to pay"
                    icon={Wallet}
                    value={paymentData.amount}
                    onChange={e => setPaymentData({...paymentData, amount: e.target.value})}
                    className="text-2xl font-black"
                    autoFocus
                />
                <FormSelect 
                    label="Payment Method"
                    value={paymentData.method}
                    onChange={e => setPaymentData({...paymentData, method: e.target.value})}
                    options={[
                        { value: 'cash', label: 'Cash Payment' },
                        { value: 'bank_transfer', label: 'Bank Transfer / Deposit' },
                        { value: 'card', label: 'Credit/Debit Card' },
                        { value: 'qr', label: 'QR Scan Payment' }
                    ]}
                />
                <FormInput 
                    label="Reference / Description"
                    placeholder="e.g. Paid by cash at counter"
                    icon={FileText}
                    value={paymentData.note}
                    onChange={e => setPaymentData({...paymentData, note: e.target.value})}
                />
                
                {parseFloat(paymentData.amount) > 0 && (
                    <div className="p-6 bg-emerald-50 rounded-[32px] border-2 border-emerald-100 flex justify-between items-center animate-in slide-in-from-top-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center">
                                <ArrowDownLeft size={20} />
                            </div>
                            <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">New Balance</span>
                        </div>
                        <span className="font-black text-2xl text-emerald-600 tracking-tighter">Rs. {(parseFloat(selectedCustomer?.current_balance || 0) - parseFloat(paymentData.amount)).toLocaleString()}</span>
                    </div>
                )}

                <div className="flex gap-4 pt-4">
                    <AppButton variant="secondary" className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest" type="button" onClick={() => setShowPaymentModal(false)}>Cancel</AppButton>
                    <AppButton variant="success" className="flex-[2] py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20" loading={processing} type="submit">Record Payment</AppButton>
                </div>
            </form>
        </div>
      </AppModal>

      <InvoicePrintModal 
        isOpen={showPrintModal} 
        onClose={() => setShowPrintModal(false)} 
        invoice={selectedInvoice} 
      />
    </div>
  );
};

export default NayaBookPage;
