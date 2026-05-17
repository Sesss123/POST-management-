import React, { useState, useEffect } from 'react';
import { supplierApi } from '../api/api';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  MapPin, 
  Mail, 
  User, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Calendar,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Filter,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Save,
  Sparkles,
  RefreshCw,
  Activity,
  ArrowRight
} from 'lucide-react';
import { 
  AppButton, 
  AppCard, 
  AppModal, 
  FormInput, 
  FormSelect, 
  useToast,
  Badge
} from '../components/ui';
import { cn } from '../utils/cn';

const SuppliersPage = () => {
  const toast = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accountLoading, setAccountLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    contact_person: '',
    opening_balance: 0,
    notes: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'cash',
    note: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data } = await supplierApi.getAll();
      setSuppliers(data.data);
    } catch (err) {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccount = async (id) => {
    try {
      setAccountLoading(true);
      const { data } = await supplierApi.getAccount(id);
      setSelectedSupplier(data.data.supplier);
      setAccountData(data.data);
    } catch (err) {
      toast.error('Failed to load supplier account');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await supplierApi.create(newSupplier);
      toast.success('Supplier added successfully');
      setShowAddModal(false);
      fetchSuppliers();
      setNewSupplier({ name: '', phone: '', address: '', email: '', contact_person: '', opening_balance: 0, notes: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    setSubmitting(true);
    try {
      await supplierApi.paySupplier(selectedSupplier.id, paymentForm);
      toast.success('Payment recorded successfully');
      setShowPayModal(false);
      fetchAccount(selectedSupplier.id);
      fetchSuppliers();
      setPaymentForm({ amount: '', payment_method: 'cash', note: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async () => {
    if (!selectedSupplier) return;
    const newStatus = selectedSupplier.status === 'active' ? 'inactive' : 'active';
    try {
      await supplierApi.updateStatus(selectedSupplier.id, newStatus);
      toast.success(`Supplier ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchAccount(selectedSupplier.id);
      fetchSuppliers();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.phone?.includes(searchTerm)
  );

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amt).replace('LKR', 'Rs.');
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center p-20 bg-slate-50/50">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] space-y-4 animate-in fade-in duration-700 p-1 selection:bg-indigo-500/30 overflow-hidden bg-slate-50/50">
      {/* Premium Neural Header - White Theme */}
      <header className="relative group shrink-0">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 rounded-[32px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
            <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 group-hover:scale-110 transition-transform duration-500">
                    <Users size={32} />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={14} className="text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Supply Chain Hub</span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-1 uppercase">Supplier Network</h2>
                    <p className="text-sm font-medium text-slate-400">Inventory acquisition and liability management system</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto relative z-10">
                <AppButton 
                    variant="primary" 
                    icon={Plus} 
                    size="lg" 
                    className="w-full sm:w-auto rounded-[24px] px-10 py-6 bg-indigo-600 hover:bg-indigo-500 shadow-2xl shadow-indigo-500/20 font-black uppercase tracking-widest text-xs border-none" 
                    onClick={() => setShowAddModal(true)}
                >
                    Onboard Vendor
                </AppButton>
                <AppButton 
                    variant="secondary" 
                    icon={RefreshCw} 
                    size="lg" 
                    className="rounded-[24px] bg-white border-slate-100 text-slate-400 hover:text-indigo-600 shadow-sm" 
                    onClick={fetchSuppliers} 
                />
            </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 gap-10 overflow-hidden">
        {/* Left Panel: Search & List */}
        <aside className="lg:w-[400px] flex flex-col gap-8 shrink-0">
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Search vendor identification..." 
                    className="w-full bg-white border border-slate-100 rounded-[32px] py-6 pl-16 pr-8 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-xl shadow-slate-200/40"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {filteredSuppliers.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => fetchAccount(s.id)}
                        className={cn(
                            "w-full text-left p-6 rounded-[36px] border transition-all duration-500 group relative overflow-hidden",
                            selectedSupplier?.id === s.id 
                                ? "bg-gradient-to-br from-indigo-600 to-purple-700 border-transparent shadow-2xl shadow-indigo-500/20 scale-[1.02]" 
                                : "bg-white border-slate-100 hover:border-indigo-400 hover:bg-slate-50 shadow-sm"
                        )}
                    >
                        {selectedSupplier?.id === s.id && (
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
                        )}
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className={cn(
                                "p-3 rounded-2xl transition-colors shadow-sm",
                                selectedSupplier?.id === s.id ? "bg-white/20 text-white" : "bg-white border border-slate-100 text-slate-400 group-hover:text-indigo-600"
                            )}>
                                <Users size={24} />
                            </div>
                            <Badge variant={s.status === 'active' ? 'success' : 'danger'} className="rounded-xl px-4 py-1 font-black text-[9px] uppercase shadow-sm">
                                {s.status.toUpperCase()}
                            </Badge>
                        </div>
                        <h4 className={cn("font-black text-lg tracking-tight mb-1 truncate", selectedSupplier?.id === s.id ? "text-white" : "text-slate-900")}>
                            {s.name}
                        </h4>
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <Phone size={14} className={selectedSupplier?.id === s.id ? "text-white/60" : "text-slate-400"} />
                            <span className={cn("text-[11px] font-bold tracking-wider", selectedSupplier?.id === s.id ? "text-white/80" : "text-slate-500")}>
                                {s.phone || 'NO PROTOCOL'}
                            </span>
                        </div>
                        <div className={cn(
                            "p-5 rounded-[24px] flex justify-between items-center transition-all shadow-inner",
                            selectedSupplier?.id === s.id ? "bg-white/10" : "bg-slate-50/50"
                        )}>
                            <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", selectedSupplier?.id === s.id ? "text-white/60" : "text-slate-400")}>
                                Current Debt
                            </span>
                            <span className={cn("text-lg font-black tabular-nums tracking-tighter", selectedSupplier?.id === s.id ? "text-white" : "text-rose-600")}>
                                {formatCurrency(s.current_balance)}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </aside>

        {/* Right Panel: Account Details - White Theme */}
        <main className="flex-1 overflow-hidden bg-white rounded-[44px] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col relative">
            {!selectedSupplier ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-20 group">
                    <div className="w-32 h-32 bg-slate-50 rounded-[44px] flex items-center justify-center text-slate-300 mb-10 group-hover:scale-110 transition-transform duration-700 shadow-inner">
                        <Users size={64} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-400 uppercase tracking-tighter mb-4">Initialize Vendor Protocol</h3>
                    <p className="text-slate-400 max-w-sm font-medium leading-relaxed">Select a supplier from the directory to view transaction history and authorize settlements.</p>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <header className="p-10 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-10 bg-slate-50/30">
                        <div className="flex items-center gap-8">
                            <div className="w-24 h-24 bg-white text-indigo-600 rounded-[32px] flex items-center justify-center border-2 border-indigo-100 shadow-xl group-hover:scale-105 transition-transform">
                                <Users size={40} />
                            </div>
                            <div>
                                <div className="flex items-center gap-4 mb-2">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">{selectedSupplier.name}</h2>
                                    <Badge variant={selectedSupplier.status === 'active' ? 'success' : 'danger'} className="px-6 py-1 rounded-xl font-black text-[9px] uppercase shadow-sm">
                                        {selectedSupplier.status.toUpperCase()}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-8">
                                    <div className="flex items-center gap-3 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                                        <Phone size={14} className="text-indigo-600" /> {selectedSupplier.phone || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                                        <MapPin size={14} className="text-indigo-600" /> {selectedSupplier.address || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                                        <User size={14} className="text-indigo-600" /> {selectedSupplier.contact_person || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <AppButton variant="secondary" className="rounded-[24px] bg-white border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-widest py-6 px-10 hover:bg-slate-50 shadow-sm" onClick={toggleStatus}>
                                {selectedSupplier.status === 'active' ? 'Decommission' : 'Activate'}
                            </AppButton>
                            <AppButton variant="primary" className="rounded-[24px] bg-indigo-600 hover:bg-indigo-500 border-none font-black uppercase text-[10px] tracking-widest py-6 px-10 shadow-2xl shadow-indigo-500/20 active:scale-95" icon={CreditCard} onClick={() => setShowPayModal(true)}>
                                Record Payout
                            </AppButton>
                        </div>
                    </header>

                    {/* Stats Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10 bg-slate-50/50 border-b border-slate-50">
                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:border-indigo-400 transition-all">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Net Liability</p>
                            <h3 className="text-4xl font-black text-rose-600 tracking-tighter tabular-nums">{formatCurrency(selectedSupplier.current_balance)}</h3>
                        </div>
                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:border-indigo-400 transition-all">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Acquisition Count</p>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">{accountData?.summary.unpaid_purchase_count}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Total Exposure: {formatCurrency(accountData?.summary.unpaid_purchase_total)}</p>
                        </div>
                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:border-indigo-400 transition-all">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Recent Payout</p>
                            <h3 className="text-2xl font-black text-indigo-600 tracking-tighter uppercase leading-none">
                                {accountData?.summary.last_payment_date ? new Date(accountData.summary.last_payment_date).toLocaleDateString() : 'NO HISTORY'}
                            </h3>
                        </div>
                    </div>

                    {/* Ledger */}
                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar pb-20">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                                <History size={20} />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Transmission Ledger</h4>
                        </div>
                        
                        <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/40">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metadata</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {accountData?.ledger.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-10 py-8">
                                                <p className="text-sm font-black text-slate-900 tabular-nums tracking-tight leading-none mb-1">
                                                    {new Date(row.created_at).toLocaleDateString()}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </td>
                                            <td className="px-10 py-8 max-w-xs">
                                                <p className="text-xs font-bold text-slate-500 uppercase leading-relaxed tracking-tight line-clamp-2">{row.description}</p>
                                            </td>
                                            <td className="px-10 py-8">
                                                <Badge variant={row.type === 'debit' ? 'warning' : 'success'} className="rounded-xl px-5 py-1 font-black text-[9px] uppercase shadow-sm">
                                                    {row.type === 'debit' ? 'ACQUISITION' : 'SETTLEMENT'}
                                                </Badge>
                                            </td>
                                            <td className={cn(
                                                "px-10 py-8 text-lg font-black tabular-nums tracking-tighter",
                                                row.type === 'debit' ? "text-rose-600" : "text-emerald-600"
                                            )}>
                                                {row.type === 'debit' ? '+' : '-'}{formatCurrency(row.amount)}
                                            </td>
                                            <td className="px-10 py-8 text-right font-black text-slate-900 tabular-nums tracking-tighter text-lg">
                                                {formatCurrency(row.balance_after)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {accountLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-20 flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
        </main>
      </div>

      {/* Modals - Remain white but updated with premium light accents */}
      <AppModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        title="Initialize Vendor Record" 
        description="Establishing new supply chain identification protocol"
        size="lg"
      >
        <form onSubmit={handleAddSupplier} className="space-y-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <FormInput 
                label="Legal Entity Name" 
                required 
                value={newSupplier.name} 
                onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} 
                placeholder="Vender Identification Name"
                className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600"
              />
            </div>
            <FormInput 
              label="Transmission Channel (Phone)" 
              value={newSupplier.phone} 
              onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} 
              placeholder="Primary contact number"
              className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600"
            />
            <FormInput 
              label="Intelligence Log (Email)" 
              type="email" 
              value={newSupplier.email} 
              onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} 
              placeholder="Communication address"
              className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600"
            />
            <FormInput 
              label="Principal Liaison" 
              value={newSupplier.contact_person} 
              onChange={e => setNewSupplier({...newSupplier, contact_person: e.target.value})} 
              placeholder="Contact person name"
              className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600"
            />
            <FormInput 
              label="Opening Magnitude (Balance)" 
              type="number" 
              value={newSupplier.opening_balance} 
              onChange={e => setNewSupplier({...newSupplier, opening_balance: e.target.value})} 
              className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600"
            />
            <div className="md:col-span-2">
              <FormInput 
                label="Physical Logistics Base (Address)" 
                value={newSupplier.address} 
                onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} 
                placeholder="Headquarters / Warehouse location"
                className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600"
              />
            </div>
          </div>
          <div className="flex gap-6 pt-6">
            <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Abort</button>
            <AppButton type="submit" loading={submitting} className="flex-[2] py-6 rounded-[28px] font-black uppercase text-xs tracking-widest shadow-2xl shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-500 border-none active:scale-95">Authorize Registration</AppButton>
          </div>
        </form>
      </AppModal>

      <AppModal 
        isOpen={showPayModal} 
        onClose={() => setShowPayModal(false)} 
        title="Authorize Settlement" 
        description="Executing financial liability payout protocol"
      >
        <form onSubmit={handlePayment} className="space-y-8 py-6">
          <div className="p-8 bg-rose-50 border-2 border-rose-100 rounded-[44px] relative overflow-hidden group shadow-inner">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 mb-2 relative z-10">Total Exposure</p>
             <h3 className="text-4xl font-black text-rose-600 tracking-tighter tabular-nums relative z-10">{formatCurrency(selectedSupplier?.current_balance)}</h3>
             <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/50 rounded-full blur-3xl" />
          </div>

          <FormInput 
            label="Payout Magnitude (Amount)" 
            required 
            type="number" 
            value={paymentForm.amount} 
            onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} 
            placeholder="0.00"
            className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-rose-600"
          />

          <FormSelect 
            label="Settlement Channel" 
            value={paymentForm.payment_method} 
            onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}
            options={[
              { value: 'cash', label: 'CASH LIQUIDITY' },
              { value: 'bank_transfer', label: 'WIRE TRANSFER' },
              { value: 'cheque', label: 'COMMERCIAL CHEQUE' },
              { value: 'card', label: 'CREDIT / DEBIT PROTOCOL' }
            ]}
            className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-rose-600"
          />

          <FormInput 
            label="Transmission Metadata (Note)" 
            value={paymentForm.note} 
            onChange={e => setPaymentForm({...paymentForm, note: e.target.value})} 
            placeholder="Reference identification / Cheque details"
            className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-rose-600"
          />

          <div className="p-8 bg-slate-900 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group">
             <div className="flex justify-between items-center relative z-10">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Post-Protocol Liquidity</span>
               <span className="text-xl font-black text-indigo-400 tabular-nums">
                 {formatCurrency(Math.max(0, (selectedSupplier?.current_balance || 0) - (parseFloat(paymentForm.amount) || 0)))}
               </span>
             </div>
             <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
          </div>

          <div className="flex gap-6 pt-6">
            <button type="button" onClick={() => setShowPayModal(false)} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Abort</button>
            <AppButton type="submit" loading={submitting} className="flex-[2] py-6 rounded-[28px] font-black uppercase text-xs tracking-widest bg-emerald-600 hover:bg-emerald-500 shadow-2xl shadow-emerald-600/20 border-none active:scale-95">Authorize Settlement</AppButton>
          </div>
        </form>
      </AppModal>
    </div>
  );
};

export default SuppliersPage;
