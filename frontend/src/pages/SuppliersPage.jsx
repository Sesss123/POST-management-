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
  Save
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
      if (data.data.length > 0 && !selectedSupplier) {
        // Automatically select first supplier if none selected
        // fetchAccount(data.data[0].id);
      }
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
    <div className="h-full flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500">
      {/* Left Panel: Supplier List */}
      <aside className="lg:w-96 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Suppliers</h2>
          <AppButton size="sm" icon={Plus} onClick={() => setShowAddModal(true)}>Add New</AppButton>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search suppliers..." 
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {filteredSuppliers.map((s) => (
            <button
              key={s.id}
              onClick={() => fetchAccount(s.id)}
              className={cn(
                "w-full text-left p-4 rounded-3xl border transition-all duration-300 group",
                selectedSupplier?.id === s.id 
                  ? "bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100" 
                  : "bg-white border-slate-50 hover:border-indigo-200 hover:shadow-md"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div className={cn(
                  "p-2 rounded-xl",
                  selectedSupplier?.id === s.id ? "bg-white/20 text-white" : "bg-slate-50 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50"
                )}>
                  <Users size={20} />
                </div>
                <Badge variant={s.status === 'active' ? 'success' : 'danger'}>{s.status}</Badge>
              </div>
              <h4 className={cn("font-black text-sm truncate mb-1", selectedSupplier?.id === s.id ? "text-white" : "text-slate-900")}>
                {s.name}
              </h4>
              <div className="flex items-center gap-2 mb-3">
                 <Phone size={12} className={selectedSupplier?.id === s.id ? "text-white/60" : "text-slate-400"} />
                 <span className={cn("text-[10px] font-bold", selectedSupplier?.id === s.id ? "text-white/80" : "text-slate-500")}>
                    {s.phone || 'No phone'}
                 </span>
              </div>
              <div className={cn(
                "p-3 rounded-2xl flex justify-between items-center",
                selectedSupplier?.id === s.id ? "bg-white/10" : "bg-slate-50"
              )}>
                <span className={cn("text-[9px] font-black uppercase tracking-widest", selectedSupplier?.id === s.id ? "text-white/60" : "text-slate-400")}>
                  Balance
                </span>
                <span className={cn("text-xs font-black", selectedSupplier?.id === s.id ? "text-white" : "text-slate-900")}>
                  {formatCurrency(s.current_balance)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Right Panel: Account Details */}
      <main className="flex-1 overflow-hidden bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col relative">
        {!selectedSupplier ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
              <Users size={48} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Select a Supplier</h3>
            <p className="text-slate-400 max-w-xs text-sm">Select a supplier from the list to view their transaction history and manage payments.</p>
          </div>
        ) : (
          <>
            {/* Account Header */}
            <header className="p-6 lg:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center border-2 border-indigo-100 shadow-inner">
                  <Users size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedSupplier.name}</h2>
                    <Badge variant={selectedSupplier.status === 'active' ? 'success' : 'danger'}>{selectedSupplier.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-400">
                    <div className="flex items-center gap-1.5"><Phone size={14} /> {selectedSupplier.phone || 'N/A'}</div>
                    <div className="flex items-center gap-1.5"><MapPin size={14} /> {selectedSupplier.address || 'N/A'}</div>
                    <div className="flex items-center gap-1.5"><User size={14} /> {selectedSupplier.contact_person || 'N/A'}</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <AppButton variant="secondary" size="sm" onClick={toggleStatus}>
                  {selectedSupplier.status === 'active' ? 'Deactivate' : 'Activate'}
                </AppButton>
                <AppButton variant="primary" size="sm" icon={CreditCard} onClick={() => setShowPayModal(true)}>Record Payment</AppButton>
              </div>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 lg:p-8 bg-slate-50/50 border-b border-slate-100">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Current Balance</p>
                <h3 className="text-2xl font-black text-rose-500">{formatCurrency(selectedSupplier.current_balance)}</h3>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Unpaid Purchases</p>
                <h3 className="text-2xl font-black text-slate-900">{accountData?.summary.unpaid_purchase_count}</h3>
                <p className="text-[10px] font-bold text-slate-400">Total: {formatCurrency(accountData?.summary.unpaid_purchase_total)}</p>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Last Payment</p>
                <h3 className="text-lg font-black text-slate-900">
                  {accountData?.summary.last_payment_date ? new Date(accountData.summary.last_payment_date).toLocaleDateString() : 'Never'}
                </h3>
              </div>
            </div>

            {/* Account Tabs & List */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-6 lg:px-8 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-8">
                  {/* Ledger Section */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="text-indigo-600" size={18} />
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Supplier Ledger</h4>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Date</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Description</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Type</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Amount</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {accountData?.ledger.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-500 whitespace-nowrap">
                                {new Date(row.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-600">{row.description}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant={row.type === 'debit' ? 'warning' : 'success'}>
                                  {row.type === 'debit' ? 'PURCHASE' : 'PAYMENT'}
                                </Badge>
                              </td>
                              <td className={cn(
                                "px-6 py-4 font-black",
                                row.type === 'debit' ? "text-rose-500" : "text-emerald-500"
                              )}>
                                {row.type === 'debit' ? '+' : '-'}{formatCurrency(row.amount)}
                              </td>
                              <td className="px-6 py-4 font-black text-slate-900">{formatCurrency(row.balance_after)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </>
        )}

        {accountLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </main>

      {/* Add Supplier Modal */}
      <AppModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        title="Register New Supplier" 
        icon={Users}
      >
        <form onSubmit={handleAddSupplier} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormInput 
                label="Supplier Name" 
                required 
                value={newSupplier.name} 
                onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} 
                placeholder="e.g. ABC Chicken Farm"
              />
            </div>
            <FormInput 
              label="Phone Number" 
              value={newSupplier.phone} 
              onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} 
              placeholder="07x xxxxxxx"
            />
            <FormInput 
              label="Email Address" 
              type="email" 
              value={newSupplier.email} 
              onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} 
              placeholder="supplier@example.com"
            />
            <FormInput 
              label="Contact Person" 
              value={newSupplier.contact_person} 
              onChange={e => setNewSupplier({...newSupplier, contact_person: e.target.value})} 
              placeholder="Mr. Kamal"
            />
            <FormInput 
              label="Opening Balance" 
              type="number" 
              value={newSupplier.opening_balance} 
              onChange={e => setNewSupplier({...newSupplier, opening_balance: e.target.value})} 
            />
            <div className="col-span-2">
              <FormInput 
                label="Physical Address" 
                value={newSupplier.address} 
                onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} 
                placeholder="Supplier warehouse address"
              />
            </div>
          </div>
          <AppButton type="submit" loading={submitting} block>Register Supplier</AppButton>
        </form>
      </AppModal>

      {/* Payment Modal */}
      <AppModal 
        isOpen={showPayModal} 
        onClose={() => setShowPayModal(false)} 
        title="Record Supplier Payment" 
        icon={CreditCard}
      >
        <form onSubmit={handlePayment} className="space-y-6">
          <div className="p-4 bg-slate-50 rounded-2xl mb-4">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Outstanding</p>
             <h3 className="text-xl font-black text-rose-500">{formatCurrency(selectedSupplier?.current_balance)}</h3>
          </div>

          <FormInput 
            label="Payment Amount" 
            required 
            type="number" 
            value={paymentForm.amount} 
            onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} 
            placeholder="0.00"
          />

          <FormSelect 
            label="Payment Method" 
            value={paymentForm.payment_method} 
            onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'cheque', label: 'Cheque' },
              { value: 'card', label: 'Card' }
            ]}
          />

          <FormInput 
            label="Reference Note" 
            value={paymentForm.note} 
            onChange={e => setPaymentForm({...paymentForm, note: e.target.value})} 
            placeholder="Reference no, cheque no, etc."
          />

          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
             <div className="flex justify-between items-center text-xs font-bold text-indigo-600">
               <span>Remaining Balance</span>
               <span>{formatCurrency(Math.max(0, (selectedSupplier?.current_balance || 0) - (parseFloat(paymentForm.amount) || 0)))}</span>
             </div>
          </div>

          <AppButton type="submit" loading={submitting} block>Confirm Payment</AppButton>
        </form>
      </AppModal>
    </div>
  );
};

export default SuppliersPage;
