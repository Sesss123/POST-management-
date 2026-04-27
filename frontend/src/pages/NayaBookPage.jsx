import React, { useState, useEffect } from 'react';
import { customerApi, paymentApi } from '../api/api';
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
  Clock
} from 'lucide-react';
import { AppButton, AppCard, AppModal, StatCard, useToast, FormInput, FormSelect } from '../components/ui';
import { cn } from '../utils/cn';

const NayaBookPage = () => {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
      amount: '',
      method: 'cash',
      note: ''
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
        const { data } = await customerApi.getAll();
        // Show all or only those with balance? Usually Naya book is for those who owe.
        const withBalance = data.data.filter(c => parseFloat(c.current_balance) > 0);
        setCustomers(withBalance);
    } catch (err) {
        toast.error('Failed to load credit customers');
    }
  };

  const fetchLedger = async (customerId) => {
    try {
        const { data } = await customerApi.getLedger(customerId);
        setLedger(data.data);
    } catch (err) {
        toast.error('Failed to load ledger history');
    }
  };

  const handleSelectCustomer = (c) => {
      setSelectedCustomer(c);
      fetchLedger(c.id);
  };

  const handlePayment = async (e) => {
      e.preventDefault();
      if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) return toast.error('Enter a valid amount');
      
      setProcessing(true);
      try {
          await paymentApi.recordCustomerPayment({
              customer_id: selectedCustomer.id,
              amount: paymentData.amount,
              payment_method: paymentData.method,
              note: paymentData.note
          });
          toast.success('Payment recorded successfully!');
          setShowPaymentModal(false);
          setPaymentData({ amount: '', method: 'cash', note: '' });
          
          // Refresh data
          const updatedCustomerRes = await customerApi.getAll();
          const found = updatedCustomerRes.data.data.find(c => c.id === selectedCustomer.id);
          setSelectedCustomer(found);
          fetchLedger(selectedCustomer.id);
          fetchCustomers();
      } catch (err) {
          toast.error(err.response?.data?.message || 'Payment failed');
      } finally {
          setProcessing(false);
      }
  };

  const totalOutstanding = customers.reduce((sum, c) => sum + parseFloat(c.current_balance), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            variant="dark"
            title="Total Outstanding" 
            value={`Rs. ${totalOutstanding.toLocaleString()}`} 
            icon={BookOpen} 
          />
          <StatCard 
            title="Credit Customers" 
            value={customers.length} 
            icon={User} 
          />
          <StatCard 
            variant="success"
            title="Payments Today" 
            value="Rs. 0" // This would come from a specific report API
            icon={Wallet} 
          />
          <StatCard 
            variant="credit"
            title="Naya Status" 
            value="Healthy" 
            icon={CheckCircle2} 
          />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-320px)]">
        {/* Left: Debtor List */}
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Search debtors..." 
                    className="w-full bg-white border-2 border-transparent rounded-[24px] py-4 pl-12 pr-4 text-slate-900 font-bold shadow-lg shadow-slate-200/50 outline-none focus:border-purple-600 transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(c => (
                    <button 
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        className={cn(
                            "w-full text-left p-6 rounded-[32px] border-2 transition-all group relative overflow-hidden",
                            selectedCustomer?.id === c.id 
                                ? "bg-purple-600 border-purple-600 shadow-xl shadow-purple-900/30" 
                                : "bg-white border-transparent hover:border-purple-200 shadow-lg shadow-slate-100"
                        )}
                    >
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <h4 className={cn("font-black text-lg mb-1 tracking-tight", selectedCustomer?.id === c.id ? "text-white" : "text-slate-900")}>{c.name}</h4>
                                <p className={cn("text-xs font-bold mb-4 uppercase tracking-widest", selectedCustomer?.id === c.id ? "text-purple-200" : "text-slate-400")}>{c.phone}</p>
                                <div>
                                    <p className={cn("text-[8px] font-black uppercase tracking-[0.2em] mb-1", selectedCustomer?.id === c.id ? "text-purple-300" : "text-slate-400")}>Outstanding Balance</p>
                                    <p className={cn("text-2xl font-black tracking-tighter", selectedCustomer?.id === c.id ? "text-white" : "text-rose-600")}>Rs. {parseFloat(c.current_balance).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                                selectedCustomer?.id === c.id ? "bg-white/20 text-white" : "bg-purple-50 text-purple-600"
                            )}>
                                <Plus size={20} />
                            </div>
                        </div>
                        {selectedCustomer?.id === c.id && (
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                        )}
                    </button>
                ))}
                {customers.length === 0 && (
                    <div className="py-20 text-center opacity-40">
                        <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500" />
                        <p className="font-bold">All credits cleared!</p>
                    </div>
                )}
            </div>
        </div>

        {/* Right: Ledger Detail */}
        <div className="lg:col-span-8 flex flex-col overflow-hidden">
            {selectedCustomer ? (
                <div className="flex flex-col h-full space-y-8 animate-in slide-in-from-right-8 duration-500">
                    <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/40">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-purple-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-purple-900/50">
                                    <User size={40} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight mb-1">{selectedCustomer.name}</h2>
                                    <div className="flex gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        <span>{selectedCustomer.phone}</span>
                                        <span>|</span>
                                        <span className="text-emerald-400">Limit: Rs. {parseFloat(selectedCustomer.credit_limit).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Current Owed</p>
                                <p className="text-5xl font-black text-rose-500 tracking-tighter">Rs. {parseFloat(selectedCustomer.current_balance).toLocaleString()}</p>
                            </div>
                            <div>
                                <AppButton 
                                    variant="success" 
                                    size="lg" 
                                    className="px-10 py-5 rounded-[28px] uppercase tracking-widest"
                                    onClick={() => setShowPaymentModal(true)}
                                >
                                    Record Payment
                                </AppButton>
                            </div>
                        </div>
                        <div className="absolute -left-10 -top-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
                    </div>

                    <div className="flex-1 bg-white rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <History className="text-slate-400" size={20} />
                                <h3 className="font-black text-slate-900 uppercase tracking-tight">Ledger Timeline</h3>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <Clock size={12} /> Recent First
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {ledger.map((entry, idx) => (
                                <div key={entry.id} className="flex gap-6 relative">
                                    {idx !== ledger.length - 1 && (
                                        <div className="absolute left-[23px] top-12 bottom-[-32px] w-[2px] bg-slate-100" />
                                    )}
                                    <div className={cn(
                                        "w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0 z-10 shadow-lg",
                                        entry.type === 'debit' ? "bg-rose-50 text-rose-500 border-2 border-rose-100" : "bg-emerald-50 text-emerald-600 border-2 border-emerald-100"
                                    )}>
                                        {entry.type === 'debit' ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                                    </div>
                                    <div className="flex-1 pb-4 border-b border-slate-50 last:border-none">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h5 className="font-black text-slate-900 text-lg">{entry.type === 'debit' ? 'Credit Purchase' : 'Payment Received'}</h5>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(entry.created_at).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={cn(
                                                    "text-2xl font-black tracking-tighter block",
                                                    entry.type === 'debit' ? "text-rose-600" : "text-emerald-600"
                                                )}>
                                                    {entry.type === 'debit' ? '+' : '-'} Rs. {parseFloat(entry.amount).toLocaleString()}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Balance After: Rs. {parseFloat(entry.balance_after).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl">
                                            <p className="text-sm text-slate-600 font-medium leading-relaxed">{entry.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {ledger.length === 0 && (
                                <div className="py-20 text-center text-slate-300 italic">No ledger history available for this customer</div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-full bg-white rounded-[40px] shadow-xl shadow-slate-200/50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-12">
                    <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200 mb-8 shadow-inner">
                        <BookOpen size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tight mb-2">Select a Debtor</h3>
                    <p className="text-slate-400 max-w-xs font-medium">Select a customer from the left list to view their detailed credit ledger and record payments.</p>
                </div>
            )}
        </div>
      </div>

      {/* Payment Modal */}
      <AppModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
        description="Receive payment to reduce customer balance"
        size="md"
      >
        <div className="space-y-8 py-4">
            <div className="p-6 bg-slate-900 rounded-[32px] text-white flex justify-between items-center shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Owed by {selectedCustomer?.name}</p>
                    <p className="text-3xl font-black text-rose-500 tracking-tighter">Rs. {parseFloat(selectedCustomer?.current_balance).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white relative z-10">
                    <AlertCircle size={24} />
                </div>
                <div className="absolute right-0 bottom-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl" />
            </div>

            <form onSubmit={handlePayment} className="space-y-6">
                <FormInput 
                    label="Payment Amount"
                    type="number"
                    required
                    placeholder="0.00"
                    icon={Wallet}
                    value={paymentData.amount}
                    onChange={e => setPaymentData({...paymentData, amount: e.target.value})}
                    className="text-2xl font-black"
                />
                <FormSelect 
                    label="Payment Method"
                    value={paymentData.method}
                    onChange={e => setPaymentData({...paymentData, method: e.target.value})}
                    options={[
                        { value: 'cash', label: 'Cash Payment' },
                        { value: 'bank_transfer', label: 'Bank Transfer' },
                        { value: 'card', label: 'Card Payment' }
                    ]}
                />
                <FormInput 
                    label="Reference / Note"
                    placeholder="e.g. Paid for Jan bill"
                    icon={Clock}
                    value={paymentData.note}
                    onChange={e => setPaymentData({...paymentData, note: e.target.value})}
                />
                
                {paymentData.amount > 0 && (
                    <div className="p-6 bg-emerald-50 rounded-3xl border-2 border-emerald-100 flex justify-between items-center animate-in slide-in-from-top-4">
                        <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">New Balance</span>
                        <span className="font-black text-xl text-emerald-600">Rs. {(parseFloat(selectedCustomer.current_balance) - parseFloat(paymentData.amount)).toLocaleString()}</span>
                    </div>
                )}

                <div className="flex gap-4 pt-4">
                    <AppButton variant="secondary" className="flex-1" type="button" onClick={() => setShowPaymentModal(false)}>Cancel</AppButton>
                    <AppButton variant="success" className="flex-[2]" loading={processing} type="submit">Confirm Payment</AppButton>
                </div>
            </form>
        </div>
      </AppModal>
    </div>
  );
};

export default NayaBookPage;
