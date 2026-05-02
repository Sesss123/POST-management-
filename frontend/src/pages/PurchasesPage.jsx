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
  History
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
      case 'paid': return <Badge variant="success">Paid</Badge>;
      case 'partial': return <Badge variant="warning">Partial</Badge>;
      case 'unpaid': return <Badge variant="danger">Unpaid</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Stock Purchases</h2>
          <p className="text-slate-400 text-sm font-medium">Record and track inventory stock entries</p>
        </div>
        <AppButton icon={Plus} onClick={() => setShowAddModal(true)}>Add New Purchase</AppButton>
      </header>

      {/* Filters */}
      <AppCard className="p-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-2">
          <FormSelect 
            placeholder="Filter by Supplier"
            value={filters.supplier_id}
            onChange={(e) => setFilters({...filters, supplier_id: e.target.value})}
            options={[
              { value: '', label: 'All Suppliers' },
              ...suppliers.map(s => ({ value: s.id, label: s.name }))
            ]}
          />
          <FormSelect 
            placeholder="Payment Status"
            value={filters.payment_status}
            onChange={(e) => setFilters({...filters, payment_status: e.target.value})}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'paid', label: 'Paid' },
              { value: 'partial', label: 'Partial' },
              { value: 'unpaid', label: 'Unpaid' }
            ]}
          />
          <div className="flex gap-2 col-span-1 md:col-span-2">
             <FormInput 
               type="date" 
               value={filters.date_from} 
               onChange={(e) => setFilters({...filters, date_from: e.target.value})} 
             />
             <FormInput 
               type="date" 
               value={filters.date_to} 
               onChange={(e) => setFilters({...filters, date_to: e.target.value})} 
             />
             <AppButton variant="secondary" icon={X} onClick={() => setFilters({ supplier_id: '', payment_status: '', date_from: '', date_to: '' })} />
          </div>
        </div>
      </AppCard>

      {/* Purchases List */}
      <AppCard title="Purchase History" icon={History}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Date</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Purchase No</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Supplier</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Total Amount</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Paid</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Status</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="7" className="p-12 text-center text-slate-400">Loading purchases...</td></tr>
              ) : purchases.length === 0 ? (
                <tr><td colSpan="7" className="p-12 text-center text-slate-400">No purchases found.</td></tr>
              ) : purchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-600 whitespace-nowrap">
                    {new Date(p.purchase_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-black text-indigo-600">{p.purchase_no}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{p.supplier_name}</td>
                  <td className="px-6 py-4 font-black text-slate-900">{formatCurrency(p.grand_total)}</td>
                  <td className="px-6 py-4 font-bold text-slate-600">{formatCurrency(p.paid_amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(p.payment_status)}</td>
                  <td className="px-6 py-4 text-right">
                    <AppButton size="sm" variant="secondary" icon={ChevronRight} onClick={() => fetchPurchaseDetails(p.id)}>View</AppButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AppCard>

      {/* Add Purchase Modal */}
      <AppModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        title="Record New Purchase" 
        icon={ShoppingCart}
        size="lg"
      >
        <form onSubmit={handleSubmitPurchase} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormSelect 
                label="Select Supplier"
                required
                value={newPurchase.supplier_id}
                onChange={(e) => setNewPurchase({...newPurchase, supplier_id: e.target.value})}
                options={[
                  { value: '', label: 'Choose a supplier...' },
                  ...suppliers.map(s => ({ value: s.id, label: s.name }))
                ]}
             />
             <FormInput 
                label="Purchase Date"
                type="date"
                required
                value={newPurchase.purchase_date}
                onChange={(e) => setNewPurchase({...newPurchase, purchase_date: e.target.value})}
             />
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Items List</h4>
                <AppButton type="button" size="xs" variant="secondary" icon={Plus} onClick={handleAddItemRow}>Add Item</AppButton>
             </div>
             
             <div className="space-y-3">
                {newPurchase.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                     <div className="col-span-12 md:col-span-5">
                        <FormSelect 
                           value={item.item_id}
                           onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                           options={[
                             { value: '', label: 'Select inventory item (Optional)' },
                             ...inventoryItems.map(i => ({ value: i.id, label: i.name }))
                           ]}
                        />
                        <div className="mt-2">
                           <FormInput 
                              placeholder="Item name (Manual entry)"
                              value={item.item_name}
                              onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                           />
                        </div>
                     </div>
                     <div className="col-span-4 md:col-span-2">
                        <FormInput 
                           type="number"
                           label="Qty"
                           value={item.qty}
                           onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                        />
                     </div>
                     <div className="col-span-4 md:col-span-3">
                        <FormInput 
                           type="number"
                           label="Unit Cost"
                           value={item.unit_cost}
                           onChange={(e) => handleItemChange(index, 'unit_cost', e.target.value)}
                        />
                     </div>
                     <div className="col-span-4 md:col-span-2 text-right flex flex-col justify-end">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                        <p className="text-sm font-black text-slate-900">{formatCurrency(item.total)}</p>
                     </div>
                     
                     {newPurchase.items.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
                          className="absolute -right-2 -top-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X size={14} />
                        </button>
                     )}
                  </div>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
             <div className="space-y-4">
                <FormInput 
                  label="Discount"
                  type="number"
                  value={newPurchase.discount}
                  onChange={(e) => setNewPurchase({...newPurchase, discount: e.target.value})}
                />
                <FormInput 
                  label="Paid Amount"
                  type="number"
                  value={newPurchase.paid_amount}
                  onChange={(e) => setNewPurchase({...newPurchase, paid_amount: e.target.value})}
                />
                <FormSelect 
                   label="Payment Method"
                   value={newPurchase.payment_method}
                   onChange={(e) => setNewPurchase({...newPurchase, payment_method: e.target.value})}
                   options={[
                     { value: 'cash', label: 'Cash' },
                     { value: 'bank_transfer', label: 'Bank Transfer' },
                     { value: 'card', label: 'Card' }
                   ]}
                />
                <FormInput 
                  label="Note"
                  value={newPurchase.note}
                  onChange={(e) => setNewPurchase({...newPurchase, note: e.target.value})}
                  placeholder="Reference, invoice no, etc."
                />
             </div>

             <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-xl">
                <div className="flex justify-between items-center opacity-60">
                   <span className="text-xs font-black uppercase tracking-widest">Subtotal</span>
                   <span className="font-bold">{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between items-center opacity-60">
                   <span className="text-xs font-black uppercase tracking-widest">Discount</span>
                   <span className="font-bold">-{formatCurrency(newPurchase.discount)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                   <span className="text-sm font-black uppercase tracking-widest text-indigo-400">Grand Total</span>
                   <span className="text-2xl font-black">{formatCurrency(calculateGrandTotal())}</span>
                </div>
                <div className="flex justify-between items-center pt-2 text-rose-400">
                   <span className="text-[10px] font-black uppercase tracking-widest">Balance Payable</span>
                   <span className="text-lg font-black">{formatCurrency(calculateBalance())}</span>
                </div>
                <div className="pt-4 flex items-center gap-2">
                   {calculateBalance() === 0 ? (
                      <Badge variant="success" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">PAID FULL</Badge>
                   ) : parseFloat(newPurchase.paid_amount) > 0 ? (
                      <Badge variant="warning" className="bg-amber-500/20 text-amber-400 border-amber-500/30">PARTIAL PAYMENT</Badge>
                   ) : (
                      <Badge variant="danger" className="bg-rose-500/20 text-rose-400 border-rose-500/30">UNPAID / CREDIT</Badge>
                   )}
                   <span className="text-[9px] font-bold text-white/40 italic">Balance will be added to supplier account</span>
                </div>
             </div>
          </div>

          <AppButton type="submit" loading={submitting} block size="lg" className="rounded-2xl h-14">Record Stock Purchase</AppButton>
        </form>
      </AppModal>

      {/* Details Modal */}
      <AppModal 
        isOpen={showDetailsModal} 
        onClose={() => setShowDetailsModal(false)} 
        title={`Purchase Details: ${selectedPurchase?.purchase_no}`} 
        icon={Info}
        size="lg"
      >
        {selectedPurchase && (
           <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl">
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Supplier</p>
                    <p className="font-bold text-slate-900">{selectedPurchase.supplier_name}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Date</p>
                    <p className="font-bold text-slate-900">{new Date(selectedPurchase.purchase_date).toLocaleDateString()}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</p>
                    {getStatusBadge(selectedPurchase.payment_status)}
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Created By</p>
                    <p className="font-bold text-slate-900">{selectedPurchase.created_by_name}</p>
                 </div>
              </div>

              <div className="border border-slate-100 rounded-3xl overflow-hidden">
                 <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50">
                       <tr className="text-slate-400 font-black uppercase tracking-widest text-[9px]">
                          <th className="px-4 py-3">Item Name</th>
                          <th className="px-4 py-3">Qty</th>
                          <th className="px-4 py-3">Unit Cost</th>
                          <th className="px-4 py-3 text-right">Total</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {selectedPurchase.items.map((item, idx) => (
                          <tr key={idx}>
                             <td className="px-4 py-3 font-bold text-slate-700">{item.item_name}</td>
                             <td className="px-4 py-3 font-medium text-slate-500">{item.qty}</td>
                             <td className="px-4 py-3 font-medium text-slate-500">{formatCurrency(item.unit_cost)}</td>
                             <td className="px-4 py-3 font-black text-slate-900 text-right">{formatCurrency(item.total)}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              <div className="flex flex-col items-end gap-2 text-sm pr-4">
                 <div className="flex justify-between w-64 opacity-60">
                    <span className="font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                    <span className="font-bold">{formatCurrency(selectedPurchase.subtotal)}</span>
                 </div>
                 <div className="flex justify-between w-64 opacity-60">
                    <span className="font-bold uppercase tracking-widest text-[10px]">Discount</span>
                    <span className="font-bold">-{formatCurrency(selectedPurchase.discount)}</span>
                 </div>
                 <div className="flex justify-between w-64 pt-2 border-t border-slate-100">
                    <span className="font-black uppercase tracking-widest text-xs">Grand Total</span>
                    <span className="font-black text-lg">{formatCurrency(selectedPurchase.grand_total)}</span>
                 </div>
                 <div className="flex justify-between w-64 text-indigo-600">
                    <span className="font-black uppercase tracking-widest text-[10px]">Paid Amount</span>
                    <span className="font-black">{formatCurrency(selectedPurchase.paid_amount)}</span>
                 </div>
                 <div className="flex justify-between w-64 text-rose-500 bg-rose-50 p-2 rounded-xl mt-2">
                    <span className="font-black uppercase tracking-widest text-[10px]">Balance Payable</span>
                    <span className="font-black">{formatCurrency(selectedPurchase.balance_amount)}</span>
                 </div>
              </div>
           </div>
        )}
      </AppModal>
    </div>
  );
};

export default PurchasesPage;
