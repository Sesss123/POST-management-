import React, { useState, useEffect } from 'react';
import { purchaseApi, supplierApi, itemApi } from '../api/api';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  FileText, 
  Trash2, 
  Package, 
  ChevronRight,
  Info,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  History,
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

const PurchasesPage = () => {
  const toast = useToast();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter States
  const [filters, setFilters] = useState({
    supplier_id: '',
    payment_status: '',
    date_from: '',
    date_to: ''
  });

  // Add Purchase Form
  const [newPurchase, setNewPurchase] = useState({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    items: [{ item_name: '', item_id: '', qty: 1, unit_cost: 0, total: 0 }],
    discount: 0,
    paid_amount: 0,
    payment_method: 'cash',
    note: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, sRes, iRes] = await Promise.all([
        purchaseApi.getAll(filters),
        supplierApi.getAll({ status: 'active' }),
        itemApi.getAll()
      ]);
      setPurchases(pRes.data.data);
      setSuppliers(sRes.data.data);
      setInventoryItems(iRes.data.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItemRow = () => {
    setNewPurchase({
      ...newPurchase,
      items: [...newPurchase.items, { item_name: '', item_id: '', qty: 1, unit_cost: 0, total: 0 }]
    });
  };

  const handleRemoveItemRow = (index) => {
    if (newPurchase.items.length === 1) return;
    const updated = newPurchase.items.filter((_, i) => i !== index);
    setNewPurchase({ ...newPurchase, items: updated });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...newPurchase.items];
    const item = { ...updatedItems[index] };

    if (field === 'item_id') {
      const selected = inventoryItems.find(i => i.id === parseInt(value));
      item.item_id = value;
      item.item_name = selected ? selected.name : '';
      if (selected) item.unit_cost = selected.cost_price || 0;
    } else {
      item[field] = value;
    }

    if (field === 'qty' || field === 'unit_cost' || field === 'item_id') {
      item.total = (parseFloat(item.qty) || 0) * (parseFloat(item.unit_cost) || 0);
    }

    updatedItems[index] = item;
    setNewPurchase({ ...newPurchase, items: updatedItems });
  };

  const calculateSubtotal = () => {
    return newPurchase.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() - (parseFloat(newPurchase.discount) || 0);
  };

  const calculateBalance = () => {
    return Math.max(0, calculateGrandTotal() - (parseFloat(newPurchase.paid_amount) || 0));
  };

  const handleSubmitPurchase = async (e) => {
    e.preventDefault();
    if (!newPurchase.supplier_id) return toast.error('Please select a supplier');
    if (newPurchase.items.some(i => !i.item_name || i.qty <= 0)) return toast.error('Please complete all item details');

    setSubmitting(true);
    try {
      await purchaseApi.create(newPurchase);
      toast.success('Purchase recorded successfully');
      setShowAddModal(false);
      fetchData();
      // Reset form
      setNewPurchase({
        supplier_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        items: [{ item_name: '', item_id: '', qty: 1, unit_cost: 0, total: 0 }],
        discount: 0,
        paid_amount: 0,
        payment_method: 'cash',
        note: ''
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record purchase');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchPurchaseDetails = async (id) => {
    try {
      const { data } = await purchaseApi.getDetails(id);
      setSelectedPurchase(data.data);
      setShowDetailsModal(true);
    } catch (err) {
      toast.error('Failed to load purchase details');
    }
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amt).replace('LKR', 'Rs.');
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid': return <Badge variant="success" className="rounded-xl px-4 py-1 font-black text-[9px]">PAID</Badge>;
      case 'partial': return <Badge variant="warning" className="rounded-xl px-4 py-1 font-black text-[9px]">PARTIAL</Badge>;
      case 'unpaid': return <Badge variant="danger" className="rounded-xl px-4 py-1 font-black text-[9px]">UNPAID</Badge>;
      default: return <Badge className="rounded-xl px-4 py-1 font-black text-[9px]">{status.toUpperCase()}</Badge>;
    }
  };

  if (loading && purchases.length === 0) return (
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
                    <ShoppingCart size={32} />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={14} className="text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Inventory Operations</span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-1 uppercase">Stock Acquisitions</h2>
                    <p className="text-sm font-medium text-slate-400">Record and monitor vendor inventory entries and liability</p>
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
                    Record Acquisition
                </AppButton>
                <AppButton 
                    variant="secondary" 
                    icon={RefreshCw} 
                    size="lg" 
                    className="rounded-[24px] bg-white border-slate-100 text-slate-400 hover:text-indigo-600 shadow-sm" 
                    onClick={fetchData} 
                />
            </div>
        </div>
      </header>

      {/* Light Filters Bar */}
      <section className="bg-white p-6 rounded-[36px] border border-slate-100 shadow-2xl shadow-slate-200/20 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="relative group">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-slate-900 font-bold appearance-none outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      value={filters.supplier_id}
                      onChange={(e) => setFilters({...filters, supplier_id: e.target.value})}
                  >
                      <option value="">All Vendors</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
              </div>
              <div className="relative group">
                  <Activity className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-slate-900 font-bold appearance-none outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      value={filters.payment_status}
                      onChange={(e) => setFilters({...filters, payment_status: e.target.value})}
                  >
                      <option value="">All Statuses</option>
                      <option value="paid">Paid Protocols</option>
                      <option value="partial">Partial Settlements</option>
                      <option value="unpaid">Pending Liabilities</option>
                  </select>
              </div>
              <div className="md:col-span-2 flex gap-4">
                  <div className="relative flex-1 group">
                      <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                          type="date" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                          value={filters.date_from}
                          onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                      />
                  </div>
                  <div className="relative flex-1 group">
                      <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                          type="date" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                          value={filters.date_to}
                          onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                      />
                  </div>
                  <AppButton 
                    variant="secondary" 
                    icon={X} 
                    className="rounded-2xl bg-white border-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 shadow-sm" 
                    onClick={() => setFilters({ supplier_id: '', payment_status: '', date_from: '', date_to: '' })} 
                  />
              </div>
          </div>
      </section>

      {/* Acquisitions Ledger - White Theme */}
      <div className="flex-1 overflow-hidden bg-white rounded-[44px] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col">
          <div className="p-10 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/30">
              <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white text-indigo-600 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm">
                      <History size={28} />
                  </div>
                  <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Transmission Ledger</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Audited Stock acquisition telemetry</p>
                  </div>
              </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-20 border-b border-slate-50">
                      <tr>
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identification</th>
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</th>
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Magnitude</th>
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Settled</th>
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol</th>
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {purchases.length === 0 ? (
                          <tr>
                              <td colSpan="7" className="py-40 text-center opacity-20">
                                  <ShoppingCart size={64} className="mx-auto mb-6 text-slate-300" />
                                  <p className="text-2xl font-black uppercase tracking-widest text-slate-400">No acquisition records</p>
                              </td>
                          </tr>
                      ) : purchases.map((p) => (
                          <tr key={p.id} className="group hover:bg-slate-50/50 transition-all">
                              <td className="px-10 py-8">
                                  <p className="text-sm font-black text-slate-900 tabular-nums tracking-tight mb-1">
                                      {new Date(p.purchase_date).toLocaleDateString()}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verified Log</p>
                              </td>
                              <td className="px-10 py-8">
                                  <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm">
                                      {p.purchase_no}
                                  </span>
                              </td>
                              <td className="px-10 py-8">
                                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{p.supplier_name}</p>
                              </td>
                              <td className="px-10 py-8 font-black text-slate-900 tabular-nums tracking-tighter text-lg">
                                  {formatCurrency(p.grand_total)}
                              </td>
                              <td className="px-10 py-8 font-bold text-slate-400 tabular-nums">
                                  {formatCurrency(p.paid_amount)}
                              </td>
                              <td className="px-10 py-8">
                                  {getStatusBadge(p.payment_status)}
                              </td>
                              <td className="px-10 py-8 text-right">
                                  <button 
                                      onClick={() => fetchPurchaseDetails(p.id)}
                                      className="w-12 h-12 bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all flex items-center justify-center border border-slate-100 group-hover:scale-105 shadow-sm active:scale-95"
                                  >
                                      <ChevronRight size={20} />
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Add Purchase Modal - Updated accents */}
      <AppModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        title="Initialize Acquisition Protocol" 
        description="Establishing inventory entry into system core"
        size="lg"
      >
        <form onSubmit={handleSubmitPurchase} className="space-y-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <FormSelect 
                label="Authorized Vendor"
                required
                value={newPurchase.supplier_id}
                onChange={(e) => setNewPurchase({...newPurchase, supplier_id: e.target.value})}
                options={[
                  { value: '', label: 'IDENTIFY VENDOR...' },
                  ...suppliers.map(s => ({ value: s.id, label: s.name.toUpperCase() }))
                ]}
                className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600"
             />
             <FormInput 
                label="Acquisition Timestamp"
                type="date"
                required
                value={newPurchase.purchase_date}
                onChange={(e) => setNewPurchase({...newPurchase, purchase_date: e.target.value})}
                className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600"
             />
          </div>

          <div className="space-y-6">
             <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Inventory Payload</h4>
                <button type="button" onClick={handleAddItemRow} className="flex items-center gap-2 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-colors shadow-sm">
                    <Plus size={14} /> Add Protocol
                </button>
             </div>
             
             <div className="space-y-4">
                {newPurchase.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-6 p-8 bg-slate-50 rounded-[40px] border border-slate-100 relative group transition-all hover:bg-white hover:shadow-xl shadow-inner">
                     <div className="col-span-12 md:col-span-6 space-y-4">
                        <FormSelect 
                           value={item.item_id}
                           onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                           options={[
                             { value: '', label: 'IDENTIFY INVENTORY ITEM...' },
                             ...inventoryItems.map(i => ({ value: i.id, label: i.name.toUpperCase() }))
                           ]}
                           className="rounded-2xl h-14 bg-white border-2 border-slate-100 focus:border-indigo-600"
                        />
                        <FormInput 
                            placeholder="Manual Identification Label"
                            value={item.item_name}
                            onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                            className="rounded-2xl h-14 bg-white border-2 border-slate-100 focus:border-indigo-600"
                        />
                     </div>
                     <div className="col-span-4 md:col-span-2">
                        <FormInput 
                           type="number"
                           label="Magnitude"
                           value={item.qty}
                           onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                           className="rounded-2xl h-14 bg-white border-2 border-slate-100 focus:border-indigo-600"
                        />
                     </div>
                     <div className="col-span-4 md:col-span-2">
                        <FormInput 
                           type="number"
                           label="Unit Cost"
                           value={item.unit_cost}
                           onChange={(e) => handleItemChange(index, 'unit_cost', e.target.value)}
                           className="rounded-2xl h-14 bg-white border-2 border-slate-100 focus:border-indigo-600"
                        />
                     </div>
                     <div className="col-span-4 md:col-span-2 text-right flex flex-col justify-end pb-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Magnitude Total</p>
                        <p className="text-lg font-black text-slate-900 tabular-nums tracking-tighter">{formatCurrency(item.total)}</p>
                     </div>
                     
                     {newPurchase.items.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
                          className="absolute -right-3 -top-3 w-10 h-10 bg-rose-600 text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 active:scale-90"
                        >
                          <X size={18} />
                        </button>
                     )}
                  </div>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-slate-100">
             <div className="grid grid-cols-1 gap-6">
                <FormInput 
                  label="Protocol Discount"
                  type="number"
                  value={newPurchase.discount}
                  onChange={(e) => setNewPurchase({...newPurchase, discount: e.target.value})}
                  className="rounded-[24px] h-16 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600"
                />
                <FormInput 
                  label="Immediate Settlement (Paid)"
                  type="number"
                  value={newPurchase.paid_amount}
                  onChange={(e) => setNewPurchase({...newPurchase, paid_amount: e.target.value})}
                  className="rounded-[24px] h-16 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600"
                />
                <FormSelect 
                   label="Settlement Channel"
                   value={newPurchase.payment_method}
                   onChange={(e) => setNewPurchase({...newPurchase, payment_method: e.target.value})}
                   options={[
                     { value: 'cash', label: 'CASH LIQUIDITY' },
                     { value: 'bank_transfer', label: 'WIRE TRANSFER' },
                     { value: 'card', label: 'CREDIT PROTOCOL' }
                   ]}
                   className="rounded-[24px] h-16 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600"
                />
                <FormInput 
                  label="Transmission Metadata"
                  value={newPurchase.note}
                  onChange={(e) => setNewPurchase({...newPurchase, note: e.target.value})}
                  placeholder="Reference IDs / Logistics notes"
                  className="rounded-[24px] h-16 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600"
                />
             </div>

             <div className="bg-slate-900 rounded-[44px] p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-center opacity-40">
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Sub-magnitude</span>
                       <span className="font-black text-white tabular-nums tracking-tighter">{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-40">
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Magnitude Reduction</span>
                       <span className="font-black text-rose-400 tabular-nums tracking-tighter">-{formatCurrency(newPurchase.discount)}</span>
                    </div>
                    <div className="pt-6 border-t border-white/10">
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-black uppercase tracking-[0.3em] text-indigo-400">Grand Magnitude</span>
                          <span className="text-4xl font-black text-white tracking-tighter tabular-nums">{formatCurrency(calculateGrandTotal())}</span>
                       </div>
                       <div className="flex justify-between items-center pt-4">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">Remaining Liability</span>
                          <span className="text-xl font-black text-rose-500 tabular-nums tracking-tighter">{formatCurrency(calculateBalance())}</span>
                       </div>
                    </div>
                </div>
                
                <div className="pt-10 relative z-10">
                    {calculateBalance() === 0 ? (
                       <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                           <CheckCircle2 className="text-emerald-500" size={20} />
                           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Protocol Fully Settled</span>
                       </div>
                    ) : (
                       <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3">
                           <AlertCircle className="text-rose-500" size={20} />
                           <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Liability Authorized for Ledger</span>
                       </div>
                    )}
                </div>
                
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px]" />
             </div>
          </div>

          <div className="flex gap-6 pt-6">
            <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Abort</button>
            <AppButton type="submit" loading={submitting} className="flex-[2] py-6 rounded-[28px] font-black uppercase text-xs tracking-widest shadow-2xl shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-500 border-none active:scale-95">Authorize Acquisition</AppButton>
          </div>
        </form>
      </AppModal>

      {/* Details Modal - Updated accents */}
      <AppModal 
        isOpen={showDetailsModal} 
        onClose={() => setShowDetailsModal(false)} 
        title={`Acquisition Report: ${selectedPurchase?.purchase_no}`} 
        description="Detailed telemetry for inventory entry"
        size="lg"
      >
        {selectedPurchase && (
           <div className="space-y-10 py-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 bg-slate-50 rounded-[40px] border border-slate-100 shadow-inner">
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Vendor Identity</p>
                    <p className="font-black text-slate-900 text-lg tracking-tight leading-none uppercase">{selectedPurchase.supplier_name}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Transmission Date</p>
                    <p className="font-black text-slate-900 text-lg tracking-tight leading-none">{new Date(selectedPurchase.purchase_date).toLocaleDateString()}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Settlement Status</p>
                    {getStatusBadge(selectedPurchase.payment_status)}
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Authorized By</p>
                    <p className="font-black text-indigo-600 text-lg tracking-tight leading-none uppercase">{selectedPurchase.created_by_name}</p>
                 </div>
              </div>

              <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/40">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                       <tr className="text-slate-400 font-black uppercase tracking-widest text-[9px]">
                          <th className="px-8 py-4">Inventory Item</th>
                          <th className="px-8 py-4">Magnitude</th>
                          <th className="px-8 py-4">Unit Magnitude</th>
                          <th className="px-8 py-4 text-right">Magnitude Total</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {selectedPurchase.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-all">
                             <td className="px-8 py-6 font-black text-slate-900 uppercase tracking-tight leading-none">{item.item_name}</td>
                             <td className="px-8 py-6 font-bold text-slate-500 tabular-nums">{item.qty}</td>
                             <td className="px-8 py-6 font-bold text-slate-500 tabular-nums">{formatCurrency(item.unit_cost)}</td>
                             <td className="px-8 py-6 font-black text-slate-900 text-right tabular-nums tracking-tighter text-lg">{formatCurrency(item.total)}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              <div className="flex flex-col items-end gap-4 pr-10">
                 <div className="flex justify-between w-80 opacity-40">
                    <span className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-900">Net Payload</span>
                    <span className="font-black tabular-nums text-slate-900">{formatCurrency(selectedPurchase.subtotal)}</span>
                 </div>
                 <div className="flex justify-between w-80 opacity-40">
                    <span className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-900">Protocol Reduction</span>
                    <span className="font-black tabular-nums text-slate-900">-{formatCurrency(selectedPurchase.discount)}</span>
                 </div>
                 <div className="flex justify-between w-80 pt-6 border-t border-slate-100">
                    <span className="font-black uppercase tracking-[0.2em] text-xs text-indigo-600">Total Magnitude</span>
                    <span className="font-black text-3xl tabular-nums tracking-tighter text-slate-900">{formatCurrency(selectedPurchase.grand_total)}</span>
                 </div>
                 <div className="flex justify-between w-80 text-emerald-600 bg-emerald-50 p-6 rounded-[24px] border border-emerald-100 shadow-sm">
                    <span className="font-black uppercase tracking-[0.2em] text-[10px]">Authorized Payout</span>
                    <span className="font-black text-xl tabular-nums tracking-tighter">{formatCurrency(selectedPurchase.paid_amount)}</span>
                 </div>
                 <div className="flex justify-between w-80 text-rose-500 bg-rose-50 p-6 rounded-[24px] border border-rose-100 shadow-sm">
                    <span className="font-black uppercase tracking-[0.2em] text-[10px]">Outstanding Liability</span>
                    <span className="font-black text-xl tabular-nums tracking-tighter">{formatCurrency(selectedPurchase.balance_amount)}</span>
                 </div>
              </div>
              
              <div className="pt-10 flex gap-4">
                  <AppButton variant="secondary" className="flex-1 py-6 rounded-[28px] font-black uppercase text-xs tracking-widest bg-white border-slate-100 text-slate-400 hover:bg-slate-50 shadow-sm" onClick={() => setShowDetailsModal(false)}>Close Report</AppButton>
                  <AppButton variant="primary" className="flex-1 py-6 rounded-[28px] font-black uppercase text-xs tracking-widest bg-indigo-600 hover:bg-indigo-500 shadow-2xl shadow-indigo-600/20 border-none active:scale-95">Export Metadata</AppButton>
              </div>
           </div>
        )}
      </AppModal>
    </div>
  );
};

export default PurchasesPage;
