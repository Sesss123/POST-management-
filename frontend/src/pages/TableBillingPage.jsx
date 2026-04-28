import React, { useState, useEffect } from 'react';
import { tableApi, itemApi, invoiceApi, customerApi, sessionApi, kotApi, settingApi, shiftApi } from '../api/api';
import { 
  Grid3X3, 
  Utensils, 
  ShoppingCart, 
  Wallet, 
  BookOpen, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  CheckCircle2,
  Tag,
  Users,
  ChefHat,
  Receipt,
  AlertCircle,
  Split,
  ChevronRight,
  MessageSquare,
  XCircle,
  MoreVertical
} from 'lucide-react';
import { AppButton, AppCard, AppModal, StatCard, useToast, FormInput, FormSelect } from '../components/ui';
import InvoicePrintModal from '../components/invoice/InvoicePrintModal';
import KOTPrintModal from '../components/invoice/KOTPrintModal';
import { cn } from '../utils/cn';

const TableBillingPage = () => {
  const toast = useToast();
  const [tables, setTables] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionItems, setSessionItems] = useState([]); 
  const [cart, setCart] = useState([]); // { item_id, item_name, unit_price, qty, note }
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ tax_percentage: 0, service_charge_percentage: 0, shift_enforcement_enabled: false });
  const [currentShift, setCurrentShift] = useState(null);
  
  // Modals
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showNayaModal, setShowNayaModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showKOTModal, setShowKOTModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidingItem, setVoidingItem] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  
  // Split Bill State
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [selectedSplitItems, setSelectedSplitItems] = useState([]); // Array of order_item IDs

  // Checkout data
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [lastKOT, setLastKOT] = useState(null);
  const [processing, setProcessing] = useState(false);

  // New Checkout State (Phase 3)
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState(0);
  const [scEnabled, setScEnabled] = useState(true);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [payments, setPayments] = useState([{ payment_method: 'cash', amount: 0, reference_no: '' }]);

  // Split State
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitType, setSplitType] = useState('by_items'); // 'by_items', 'equal', 'custom'
  const [splitPeople, setSplitPeople] = useState(2);
  const [splitCustomAmount, setSplitCustomAmount] = useState(0);

  useEffect(() => {
    fetchData();
    fetchSettings();
    fetchShiftStatus();
  }, []);

  const fetchData = async () => {
    try {
      const [tRes, iRes] = await Promise.all([tableApi.getAll(), itemApi.getAll()]);
      setTables(tRes.data.data);
      setItems(iRes.data.data.filter(i => i.status === 'active'));
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
      try {
          const { data } = await settingApi.getAll();
          setSettings(data.data);
      } catch (err) {}
  };

  const fetchShiftStatus = async () => {
    try {
        const { data } = await shiftApi.getCurrent();
        setCurrentShift(data.data);
    } catch (err) {
        setCurrentShift(null);
    }
  };

  const resetSale = () => {
    setSelectedTable(null);
    setCart([]);
    setSessionItems([]);
    setActiveSession(null);
    setIsSplitMode(false);
    setSelectedSplitItems([]);
    setPayments([{ payment_method: 'cash', amount: 0, reference_no: '' }]);
    setDiscountType('fixed');
    setDiscountValue(0);
    setScEnabled(true);
    setTaxEnabled(false);
    setSelectedCustomer(null);
  };

  const handleSelectTable = async (table) => {
    setSelectedTable(table);
    setCart([]);
    setSessionItems([]);
    setActiveSession(null);
    setIsSplitMode(false);
    setSelectedSplitItems([]);

    if (table.status === 'occupied') {
        refreshSession(table.id);
    }
  };

  const refreshSession = async (tableId) => {
    try {
        const { data } = await sessionApi.getActiveByTable(tableId);
        if (data.data) {
            setActiveSession(data.data);
            const sDetails = await sessionApi.getDetails(data.data.id);
            setSessionItems(sDetails.data.data.items || []);
        }
    } catch (err) {
        toast.error('Failed to load table session');
    }
  };

  const openNewSession = async () => {
      try {
          const { data } = await sessionApi.open({ table_id: selectedTable.id });
          setActiveSession(data.data);
          toast.success('Table session opened');
          fetchData(); 
      } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to open session');
      }
  };

  const addToCart = (item) => {
    if (!selectedTable) return toast.info('Please select a table first');
    if (!activeSession) return toast.info('Please open the table session first');
    
    setCart(prev => {
      const existing = prev.find(i => i.item_id === item.id);
      if (existing) return prev.map(i => i.item_id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { item_id: item.id, item_name: item.name, unit_price: item.price, qty: 1, note: '' }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart(prev => prev.map(i => i.item_id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const updateCartNote = (id, note) => {
    setCart(prev => prev.map(i => i.item_id === id ? { ...i, note } : i));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.item_id !== id));

  const sendToKitchen = async () => {
      if (cart.length === 0) return;
      setProcessing(true);
      try {
          // 1. Add items to session first
          await sessionApi.addItems(activeSession.id, cart);
          // 2. Trigger KOT for all unsent items in session
          const { data } = await kotApi.createFromSession(activeSession.id);
          toast.success('Sent to kitchen successfully');
          
          // 3. Fetch full KOT details for printing
          const kotRes = await kotApi.getById(data.data.id);
          setLastKOT(kotRes.data.data);
          setShowKOTModal(true);
          
          setCart([]);
          refreshSession(selectedTable.id);
      } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to send to kitchen');
      } finally {
          setProcessing(false);
      }
  };

  const handleVoidItem = async () => {
    if (!voidReason) return toast.info('Reason for void is required');
    setProcessing(true);
    try {
        await sessionApi.voidItem(activeSession.id, { 
            order_item_id: voidingItem.id, 
            reason: voidReason 
        });
        toast.success('Item voided successfully');
        setShowVoidModal(false);
        setVoidingItem(null);
        setVoidReason('');
        refreshSession(selectedTable.id);
    } catch (err) {
        toast.error('Failed to void item');
    } finally {
        setProcessing(false);
    }
  };

  const handleAddPaymentRow = () => {
    const remaining = currentTotals.grandTotal - payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
    setPayments([...payments, { payment_method: 'cash', amount: Math.max(0, remaining), reference_no: '' }]);
  };

  const handleRemovePaymentRow = (index) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const handleUpdatePayment = (index, field, value) => {
    const updated = [...payments];
    updated[index][field] = value;
    setPayments(updated);
  };

  const handleCheckoutPayNow = async () => {
    if (settings.shift_enforcement_enabled && !currentShift) {
        return toast.error('SHIFT ENFORCEMENT: Please open a shift before billing.');
    }
    const totalPaid = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
    if (totalPaid < currentTotals.grandTotal) {
        return toast.info(`Total payments (Rs. ${totalPaid.toLocaleString()}) must cover the grand total (Rs. ${currentTotals.grandTotal.toLocaleString()})`);
    }

    setProcessing(true);
    try {
        const payload = {
            discount_type: discountType,
            discount_value: discountValue,
            service_charge_enabled: scEnabled,
            tax_enabled: taxEnabled,
            payments: payments
        };
        const res = await sessionApi.payNow(activeSession.id, payload);
        setLastInvoice(res.data.data);
        resetSale();
        setShowCheckoutModal(false);
        setShowPrintModal(true);
        toast.success('Payment completed successfully');
    } catch (err) {
        toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
        setProcessing(false);
    }
  };

  const handleCheckoutCredit = async () => {
    if (settings.shift_enforcement_enabled && !currentShift) {
        return toast.error('SHIFT ENFORCEMENT: Please open a shift before billing.');
    }
    if (!selectedCustomer) return toast.info('Please select a customer for credit sale');
    setProcessing(true);
    try {
        const payload = {
            customer_id: selectedCustomer.id,
            discount_type: discountType,
            discount_value: discountValue,
            service_charge_enabled: scEnabled,
            tax_enabled: taxEnabled
        };
        const res = await sessionApi.addToCredit(activeSession.id, payload);
        setLastInvoice(res.data.data);
        resetSale();
        setShowNayaModal(false);
        setShowCheckoutModal(false);
        setShowPrintModal(true);
        toast.success('Credit sale completed');
    } catch (err) {
        toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
        setProcessing(false);
    }
  };

  const calculateTotals = (itemsToBill) => {
    const subtotal = itemsToBill.filter(i => i.status !== 'voided').reduce((sum, i) => sum + (parseFloat(i.unit_price) * i.qty), 0);
    
    let discountAmount = 0;
    if (discountType === 'percentage') {
        discountAmount = (subtotal * (parseFloat(discountValue) || 0)) / 100;
    } else {
        discountAmount = parseFloat(discountValue) || 0;
    }

    const discountedSubtotal = subtotal - discountAmount;
    const tax = taxEnabled ? (discountedSubtotal * parseFloat(settings.tax_percentage || 0)) / 100 : 0;
    const sc = scEnabled ? (discountedSubtotal * parseFloat(settings.service_charge_percentage || 10)) / 100 : 0;
    const grandTotal = discountedSubtotal + tax + sc;

    return { subtotal, discountAmount, tax, sc, grandTotal };
  };

  const allBillItems = [...sessionItems, ...cart];
  const currentTotals = calculateTotals(allBillItems);

  const fetchCustomers = async () => {
      try {
          const { data } = await customerApi.getAll();
          setCustomers(data.data);
      } catch (err) {
          toast.error('Failed to load customers');
      }
  };

  const toggleSplitItem = (id) => {
      setSelectedSplitItems(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
  };


  const handleSplitBill = async () => {
    if (settings.shift_enforcement_enabled && !currentShift) {
        return toast.error('SHIFT ENFORCEMENT: Please open a shift before billing.');
    }
    setProcessing(true);
    try {
        const payload = {
            split_type: splitType,
            payment_method: payments[0].payment_method || 'cash' // For equal/custom, we use primary payment method
        };

        if (splitType === 'by_items') {
            if (selectedSplitItems.length === 0) return toast.info('Please select items to split');
            payload.item_ids = selectedSplitItems;
            payload.payments = payments; // Pass multiple payments for items if needed
        } else if (splitType === 'equal') {
            payload.split_count = splitPeople;
        } else if (splitType === 'custom') {
            payload.custom_amount = splitCustomAmount;
        }

        const res = await sessionApi.splitBill(activeSession.id, payload);
        
        toast.success('Split payment recorded');
        setShowSplitModal(false);
        setIsSplitMode(false);
        setSelectedSplitItems([]);
        
        // If session closed, reset. Otherwise refresh.
        if (res.data.data.session_closed) {
            toast.info('Session fully closed');
            setLastInvoice(res.data.data.invoice);
            setShowPrintModal(true);
            resetSale();
        } else {
            refreshSession(selectedTable.id);
        }
    } catch (err) {
        toast.error(err.response?.data?.message || 'Split failed');
    } finally {
        setProcessing(false);
    }
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const filteredCustomers = customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      (c.phone && c.phone.includes(customerSearch))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Table Grid Section */}
      <section className="bg-white p-8 rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Grid3X3 size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Restaurant Tables</h3>
            </div>
            <div className="flex gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Occupied</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {tables.map(table => (
                <button
                    key={table.id}
                    onClick={() => handleSelectTable(table)}
                    className={cn(
                        "p-6 rounded-[24px] border-2 transition-all flex flex-col items-center group relative overflow-hidden",
                        selectedTable?.id === table.id 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-900/30" 
                            : table.status === 'available' 
                                ? "bg-white border-slate-100 text-slate-600 hover:border-emerald-500" 
                                : "bg-amber-50 border-amber-200 text-amber-700 shadow-sm"
                    )}
                >
                    <Utensils size={selectedTable?.id === table.id ? 28 : 24} className={cn("mb-3 transition-transform group-hover:scale-110", selectedTable?.id === table.id ? "text-white" : "text-slate-300")} />
                    <span className="font-black text-lg">{table.table_no}</span>
                    <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest mt-1",
                        selectedTable?.id === table.id ? "text-indigo-200" : "text-slate-400"
                    )}>{table.status}</span>
                </button>
            ))}
        </div>
      </section>

      {/* POS Area */}
      {!selectedTable ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <AlertCircle size={64} className="mb-4" />
              <h2 className="text-2xl font-black uppercase">Select a table to start</h2>
          </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Items Grid */}
            <div className="lg:col-span-8 flex flex-col gap-6">
                {!activeSession ? (
                    <div className="bg-indigo-50 p-12 rounded-[40px] text-center border-2 border-dashed border-indigo-200">
                        <Utensils size={48} className="mx-auto text-indigo-300 mb-6" />
                        <h3 className="text-2xl font-black text-indigo-900 mb-2">Table {selectedTable.table_no} is Available</h3>
                        <p className="text-indigo-600 font-medium mb-8">Open a new session to start taking orders.</p>
                        <AppButton size="lg" onClick={openNewSession} className="px-12 py-4">Open Table</AppButton>
                    </div>
                ) : (
                    <>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                            <input 
                                type="text" 
                                placeholder="Search menu for table orders..." 
                                className="w-full bg-white border-2 border-transparent rounded-[24px] py-4 pl-12 pr-4 text-slate-900 font-bold shadow-lg shadow-slate-200/50 outline-none focus:border-indigo-600 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => addToCart(item)}
                                    className="bg-white p-6 rounded-[32px] text-left border-2 border-transparent hover:border-indigo-600 hover:shadow-2xl transition-all group flex flex-col items-center text-center shadow-lg shadow-slate-100"
                                >
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                        <Tag size={24} />
                                    </div>
                                    <h4 className="font-black text-slate-900 mb-1 leading-tight text-sm uppercase tracking-tight">{item.name}</h4>
                                    <p className="mt-auto text-base font-black text-indigo-600">Rs. {parseFloat(item.price).toLocaleString()}</p>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Cart Panel */}
            <div className="lg:col-span-4 flex flex-col bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden h-full max-h-[850px]">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-900 text-white">
                    <div className="flex items-center gap-3">
                        <Utensils size={20} />
                        <h3 className="text-xl font-black uppercase tracking-tight">Table {selectedTable.table_no}</h3>
                    </div>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {sessionItems.length + cart.length} ITEMS
                    </span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Active Items in Session */}
                    {sessionItems.length > 0 && (
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex justify-between">
                                <span>Active Orders</span>
                                <span>Bill Summary</span>
                            </p>
                            {sessionItems.map((item, idx) => (
                                <div key={idx} className={cn("flex flex-col gap-1 p-3 rounded-2xl transition-all", item.status === 'voided' ? 'bg-rose-50 opacity-60 grayscale' : 'bg-slate-50')}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className={cn("font-black text-slate-900 leading-tight", item.status === 'voided' && 'line-through')}>{item.item_name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black bg-white px-1.5 py-0.5 rounded border border-slate-100">QTY: {item.qty}</span>
                                                {item.kot_sent ? (
                                                    <span className="text-[8px] font-black text-indigo-600 uppercase flex items-center gap-1"><ChefHat size={10}/> KOT SENT</span>
                                                ) : (
                                                    <span className="text-[8px] font-black text-amber-600 uppercase flex items-center gap-1"><Clock size={10}/> PENDING KOT</span>
                                                )}
                                                {item.status === 'voided' && <span className="text-[8px] font-black text-rose-600 uppercase">VOIDED</span>}
                                            </div>
                                            {item.note && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1 italic">Note: {item.note}</p>}
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <p className="text-xs font-black text-slate-900">Rs. {(item.qty * item.unit_price).toLocaleString()}</p>
                                            {item.status !== 'voided' && !item.billed && (
                                                <button 
                                                    onClick={() => { setVoidingItem(item); setShowVoidModal(true); }}
                                                    className="p-1 hover:bg-rose-100 text-rose-400 rounded-lg transition-colors"
                                                    title="Void Item"
                                                >
                                                    <XCircle size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* New Items (Cart) */}
                    {cart.length > 0 && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4">
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2">New Items (Draft)</p>
                            {cart.map(item => (
                                <div key={item.item_id} className="bg-indigo-50/50 p-4 rounded-2xl space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="font-black text-slate-900 leading-tight">{item.item_name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rs. {parseFloat(item.unit_price).toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center bg-white rounded-xl overflow-hidden border border-indigo-100 shadow-sm">
                                                <button onClick={() => updateCartQty(item.item_id, -1)} className="p-1.5 hover:bg-indigo-50 text-indigo-600"><Minus size={12} /></button>
                                                <span className="w-6 text-center text-xs font-black text-indigo-900">{item.qty}</span>
                                                <button onClick={() => updateCartQty(item.item_id, 1)} className="p-1.5 hover:bg-indigo-50 text-indigo-600"><Plus size={12} /></button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.item_id)} className="p-1.5 text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 relative">
                                        <MessageSquare size={12} className="text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Add kitchen note..." 
                                            className="bg-transparent text-[10px] font-bold text-slate-600 outline-none w-full border-b border-transparent focus:border-indigo-200 py-1"
                                            value={item.note}
                                            onChange={(e) => updateCartNote(item.item_id, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Subtotal</span>
                            <span>Rs. {currentTotals.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Tax ({settings.tax_percentage}%)</span>
                            <span>Rs. {currentTotals.tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Service Charge ({settings.service_charge_percentage}%)</span>
                            <span>Rs. {currentTotals.sc.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-end pt-2">
                            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Grand Total</span>
                            <span className="text-3xl font-black text-indigo-600">Rs. {currentTotals.grandTotal.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            className={cn(
                                "flex items-center justify-center gap-2 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                                cart.length === 0 ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-amber-100 text-amber-700 hover:bg-amber-600 hover:text-white"
                            )}
                            disabled={cart.length === 0 || processing}
                            onClick={sendToKitchen}
                        >
                            <ChefHat size={18} />
                            Send to Kitchen
                        </button>
                        <button 
                            className={cn(
                                "flex items-center justify-center gap-2 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                                currentTotals.subtotal === 0 ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
                            )}
                            disabled={currentTotals.subtotal === 0 || processing}
                            onClick={() => {setShowCheckoutModal(true); fetchCustomers();}}
                        >
                            <Receipt size={18} />
                            Final Bill
                        </button>
                    </div>
                    {activeSession && sessionItems.some(i => i.kot_sent && !i.billed) && (
                        <button 
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-slate-200 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 transition-all"
                            onClick={() => {
                                setIsSplitMode(true);
                                setShowSplitModal(true);
                            }}
                        >
                            <Split size={16} />
                            Split / Partial Payment
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Void Reason Modal */}
      <AppModal
        isOpen={showVoidModal}
        onClose={() => {setShowVoidModal(false); setVoidingItem(null); setVoidReason('');}}
        title="Void Item Confirmation"
      >
        <div className="space-y-6 py-4">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <p className="text-xs font-black text-rose-900 uppercase mb-1">Item to Void</p>
                <p className="text-lg font-black text-slate-900">{voidingItem?.item_name}</p>
                <p className="text-[10px] font-bold text-slate-400">QTY: {voidingItem?.qty} | Rs. {voidingItem?.total?.toLocaleString()}</p>
            </div>
            
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Void</label>
                <textarea 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:border-rose-500 transition-all h-32 resize-none"
                    placeholder="Enter reason (e.g. Mistake, Customer cancelled, Out of stock)..."
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                />
            </div>

            <div className="flex gap-4">
                <AppButton variant="secondary" className="flex-1" onClick={() => setShowVoidModal(false)}>Cancel</AppButton>
                <AppButton 
                    variant="danger" 
                    className="flex-[2]" 
                    loading={processing}
                    onClick={handleVoidItem}
                >
                    CONFIRM VOID
                </AppButton>
            </div>
        </div>
      </AppModal>

      {/* Checkout Modal (Phase 3 Overhaul) */}
      <AppModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        title="Finalize Table Checkout"
        size="lg"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-4">
            {/* Left Column: Bill Summary & Adjustments */}
            <div className="space-y-6 border-r border-slate-100 pr-8">
                <div className="bg-slate-50 p-6 rounded-[32px] space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Bill Summary</h4>
                    <div className="flex justify-between text-sm font-bold text-slate-600">
                        <span>Items Subtotal</span>
                        <span>Rs. {currentTotals.subtotal.toLocaleString()}</span>
                    </div>
                    
                    {/* Discount Section */}
                    <div className="space-y-2 pt-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discount</label>
                        <div className="flex gap-2">
                            <select 
                                value={discountType} 
                                onChange={(e) => setDiscountType(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-indigo-600"
                            >
                                <option value="fixed">Fixed (Rs)</option>
                                <option value="percentage">Percent (%)</option>
                            </select>
                            <input 
                                type="number" 
                                value={discountValue}
                                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-indigo-600"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Tax & SC Toggles */}
                    <div className="grid grid-cols-2 gap-3 pt-4">
                        <button 
                            onClick={() => setScEnabled(!scEnabled)}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-xl border-2 transition-all",
                                scEnabled ? "bg-indigo-50 border-indigo-600 text-indigo-900" : "bg-white border-slate-100 text-slate-400"
                            )}
                        >
                            <span className="text-[10px] font-black uppercase">Service Charge</span>
                            <div className={cn("w-2 h-2 rounded-full", scEnabled ? "bg-indigo-600" : "bg-slate-300")}></div>
                        </button>
                        <button 
                            onClick={() => setTaxEnabled(!taxEnabled)}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-xl border-2 transition-all",
                                taxEnabled ? "bg-emerald-50 border-emerald-600 text-emerald-900" : "bg-white border-slate-100 text-slate-400"
                            )}
                        >
                            <span className="text-[10px] font-black uppercase">Government Tax</span>
                            <div className={cn("w-2 h-2 rounded-full", taxEnabled ? "bg-emerald-600" : "bg-slate-300")}></div>
                        </button>
                    </div>

                    <div className="pt-4 border-t border-slate-200 space-y-2">
                        {currentTotals.discountAmount > 0 && (
                            <div className="flex justify-between text-[10px] font-black text-rose-500 uppercase tracking-widest">
                                <span>Discount Applied</span>
                                <span>- Rs. {currentTotals.discountAmount.toLocaleString()}</span>
                            </div>
                        )}
                        {scEnabled && (
                            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <span>Service Charge ({settings.service_charge_percentage || 10}%)</span>
                                <span>+ Rs. {currentTotals.sc.toLocaleString()}</span>
                            </div>
                        )}
                        {taxEnabled && (
                            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <span>VAT/Tax ({settings.tax_percentage}%)</span>
                                <span>+ Rs. {currentTotals.tax.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-end pt-4">
                            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Grand Total</span>
                            <span className="text-3xl font-black text-slate-900">Rs. {currentTotals.grandTotal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Customer Section (for Naya or Loyalty) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer (Optional)</label>
                        {selectedCustomer && (
                            <button onClick={() => setSelectedCustomer(null)} className="text-[10px] font-black text-rose-500 uppercase hover:underline">Clear</button>
                        )}
                    </div>
                    {selectedCustomer ? (
                        <div className="p-4 bg-indigo-600 text-white rounded-2xl flex justify-between items-center shadow-lg shadow-indigo-100">
                            <div>
                                <p className="font-black text-sm uppercase">{selectedCustomer.name}</p>
                                <p className="text-[10px] text-indigo-200 font-bold">{selectedCustomer.phone}</p>
                            </div>
                            <Users size={20} />
                        </div>
                    ) : (
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search customer for credit/loyalty..." 
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-2 pl-10 pr-4 text-xs font-bold outline-none focus:border-indigo-600 transition-all"
                                value={customerSearch}
                                onChange={(e) => {
                                    setCustomerSearch(e.target.value);
                                    if (customers.length === 0) fetchCustomers();
                                }}
                            />
                            {customerSearch && (
                                <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                    {filteredCustomers.map(c => (
                                        <button 
                                            key={c.id} 
                                            onClick={() => {setSelectedCustomer(c); setCustomerSearch('');}}
                                            className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                                        >
                                            <p className="text-xs font-black text-slate-900 uppercase">{c.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400">{c.phone}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Payment Methods */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Details</h4>
                    <AppButton size="xs" variant="secondary" icon={Plus} onClick={handleAddPaymentRow}>Add Method</AppButton>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {payments.map((p, idx) => (
                        <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative group animate-in slide-in-from-right-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Method</label>
                                    <select 
                                        value={p.payment_method} 
                                        onChange={(e) => handleUpdatePayment(idx, 'payment_method', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-600"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="bank">Bank Transfer</option>
                                        <option value="qr">QR / Online</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Amount</label>
                                    <input 
                                        type="number" 
                                        value={p.amount}
                                        onChange={(e) => handleUpdatePayment(idx, 'amount', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-600"
                                    />
                                </div>
                            </div>
                            <div className="mt-2 space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Ref No / Note</label>
                                <input 
                                    type="text" 
                                    placeholder="Optional reference..."
                                    value={p.reference_no}
                                    onChange={(e) => handleUpdatePayment(idx, 'reference_no', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:border-indigo-600"
                                />
                            </div>
                            {payments.length > 1 && (
                                <button 
                                    onClick={() => handleRemovePaymentRow(idx)}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Minus size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="pt-6 space-y-4">
                    <div className="flex justify-between items-center p-4 bg-slate-900 rounded-2xl text-white">
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase">Balance Due</p>
                            <p className="text-xl font-black">
                                Rs. {Math.max(0, currentTotals.grandTotal - payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0)).toLocaleString()}
                            </p>
                        </div>
                        {currentTotals.grandTotal <= payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0) ? (
                            <div className="flex items-center gap-2 text-emerald-400">
                                <CheckCircle2 size={20} />
                                <span className="text-[10px] font-black uppercase">Covered</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-amber-400">
                                <AlertCircle size={20} />
                                <span className="text-[10px] font-black uppercase">Partial</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <AppButton 
                            variant="primary" 
                            size="lg" 
                            className="py-6" 
                            icon={Wallet} 
                            loading={processing}
                            onClick={handleCheckoutPayNow}
                        >
                            PAY NOW
                        </AppButton>
                        <AppButton 
                            variant="credit" 
                            size="lg" 
                            className="py-6" 
                            icon={BookOpen} 
                            loading={processing}
                            onClick={handleCheckoutCredit}
                        >
                            ADD TO NAYA
                        </AppButton>
                    </div>
                </div>
            </div>
        </div>
      </AppModal>

      {/* Split Bill Modal */}
      <AppModal
        isOpen={showSplitModal}
        onClose={() => {setShowSplitModal(false); setIsSplitMode(false);}}
        title="Split Payment / Partial Bill"
        size="lg"
      >
        <div className="space-y-6 py-4">
            <div className="grid grid-cols-3 gap-3">
                <button 
                    onClick={() => setSplitType('by_items')}
                    className={cn(
                        "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all",
                        splitType === 'by_items' ? "bg-indigo-50 border-indigo-600 text-indigo-700" : "bg-white border-slate-100 text-slate-400"
                    )}
                >
                    <ShoppingCart size={20} />
                    By Items
                </button>
                <button 
                    onClick={() => setSplitType('equal')}
                    className={cn(
                        "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all",
                        splitType === 'equal' ? "bg-indigo-50 border-indigo-600 text-indigo-700" : "bg-white border-slate-100 text-slate-400"
                    )}
                >
                    <Users size={20} />
                    Equal Split
                </button>
                <button 
                    onClick={() => setSplitType('custom')}
                    className={cn(
                        "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all",
                        splitType === 'custom' ? "bg-indigo-50 border-indigo-600 text-indigo-700" : "bg-white border-slate-100 text-slate-400"
                    )}
                >
                    <Receipt size={20} />
                    Custom Amt
                </button>
            </div>

            {splitType === 'by_items' && (
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select items to pay now</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {sessionItems.filter(i => i.status !== 'voided' && !i.billed).map(item => (
                            <button 
                                key={item.id}
                                onClick={() => toggleSplitItem(item.id)}
                                className={cn(
                                    "p-4 rounded-2xl border-2 text-left transition-all",
                                    selectedSplitItems.includes(item.id) ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-50 border-slate-100"
                                )}
                            >
                                <p className="font-black text-xs uppercase">{item.item_name}</p>
                                <div className="flex justify-between items-end mt-2">
                                    <span className="text-[10px] font-bold opacity-60">QTY: {item.qty}</span>
                                    <span className="font-black">Rs. {(item.qty * item.unit_price).toLocaleString()}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {splitType === 'equal' && (
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Number of People</label>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSplitPeople(Math.max(2, splitPeople - 1))} className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center"><Minus/></button>
                        <span className="text-2xl font-black text-slate-900">{splitPeople}</span>
                        <button onClick={() => setSplitPeople(splitPeople + 1)} className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center"><Plus/></button>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-2xl">
                        <p className="text-[10px] font-black text-indigo-400 uppercase">Amount per person</p>
                        <p className="text-2xl font-black text-indigo-900">Rs. {(currentTotals.grandTotal / splitPeople).toLocaleString()}</p>
                    </div>
                </div>
            )}

            {splitType === 'custom' && (
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount to Pay Now</label>
                    <input 
                        type="number" 
                        value={splitCustomAmount}
                        onChange={(e) => setSplitCustomAmount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xl font-black text-slate-900 outline-none focus:border-indigo-600 transition-all"
                        placeholder="Enter amount..."
                    />
                </div>
            )}

            <div className="flex gap-4 pt-4">
                <AppButton variant="secondary" className="flex-1" onClick={() => {setShowSplitModal(false); setIsSplitMode(false);}}>Cancel</AppButton>
                <AppButton 
                    variant="primary" 
                    className="flex-[2]" 
                    loading={processing}
                    onClick={handleSplitBill}
                >
                    CONFIRM SPLIT PAYMENT
                </AppButton>
            </div>
        </div>
      </AppModal>


      <InvoicePrintModal 
        isOpen={showPrintModal} 
        onClose={() => setShowPrintModal(false)} 
        invoice={lastInvoice ? { ...lastInvoice, settings } : null} 
      />

      <KOTPrintModal
        isOpen={showKOTModal}
        onClose={() => setShowKOTModal(false)}
        kot={lastKOT}
      />
    </div>
  );
};

export default TableBillingPage;
