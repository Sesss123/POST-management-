import React, { useState, useEffect } from 'react';
import { tableApi, itemApi, invoiceApi, customerApi } from '../api/api';
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
  Users
} from 'lucide-react';
import { AppButton, AppCard, AppModal, StatusBadge, useToast, FormInput } from '../components/ui';
import { cn } from '../utils/cn';

const TableBillingPage = () => {
  const toast = useToast();
  const [tables, setTables] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showNayaModal, setShowNayaModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // Checkout data
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
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

  const handleSelectTable = (table) => {
    setSelectedTable(table);
    setCart([]); // In a real app, we might fetch existing orders for this table
  };

  const addToCart = (item) => {
    if (!selectedTable) return toast.info('Please select a table first');
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const subtotal = cart.reduce((sum, i) => sum + (parseFloat(i.price) * i.qty), 0);

  const fetchCustomers = async () => {
      try {
          const { data } = await customerApi.getAll();
          setCustomers(data.data);
      } catch (err) {
          toast.error('Failed to load customers');
      }
  };

  const handlePayNow = async () => {
      setProcessing(true);
      try {
          const payload = {
              table_id: selectedTable.id,
              items: cart.map(i => ({ id: i.id, qty: i.qty })),
              subtotal,
              discount: 0,
              grand_total: subtotal,
              payment_method: 'cash'
          };
          const { data } = await invoiceApi.createTablePayNow(payload);
          setLastInvoice(data.data);
          resetSale();
          setShowCheckoutModal(false);
          setShowPrintModal(true);
          toast.success('Table bill paid successfully');
      } catch (err) {
          toast.error('Payment failed');
      } finally {
          setProcessing(false);
      }
  };

  const handleNayaCheckout = async () => {
      if (!selectedCustomer) return toast.error('Please select a customer');
      setProcessing(true);
      try {
          const payload = {
              table_id: selectedTable.id,
              customer_id: selectedCustomer.id,
              items: cart.map(i => ({ id: i.id, qty: i.qty })),
              subtotal,
              discount: 0,
              grand_total: subtotal
          };
          const { data } = await invoiceApi.createTableCredit(payload);
          setLastInvoice(data.data);
          resetSale();
          setShowNayaModal(false);
          setShowCheckoutModal(false);
          setShowPrintModal(true);
          toast.success('Bill added to Naya Book');
      } catch (err) {
          toast.error('Credit transaction failed');
      } finally {
          setProcessing(false);
      }
  };

  const resetSale = () => {
      setCart([]);
      setSelectedTable(null);
      setSelectedCustomer(null);
      fetchData(); // Refresh table status
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const filteredCustomers = customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.phone.includes(customerSearch)
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
                        "p-6 rounded-[24px] border-2 transition-all flex flex-col items-center group",
                        selectedTable?.id === table.id 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-900/30" 
                            : table.status === 'available' 
                                ? "bg-white border-slate-100 text-slate-600 hover:border-emerald-500" 
                                : "bg-amber-50 border-amber-200 text-amber-700"
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
      <div className={cn(
          "grid grid-cols-1 lg:grid-cols-12 gap-8 transition-all duration-500",
          !selectedTable ? "opacity-30 pointer-events-none grayscale" : "opacity-100"
      )}>
          {/* Items Grid */}
          <div className="lg:col-span-8 flex flex-col gap-6">
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
                            <h4 className="font-black text-slate-900 mb-1 leading-tight text-sm">{item.name}</h4>
                            <p className="mt-auto text-base font-black text-indigo-600">Rs. {parseFloat(item.price).toLocaleString()}</p>
                        </button>
                    ))}
                </div>
          </div>

          {/* Cart Panel */}
          <div className="lg:col-span-4 flex flex-col bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden h-full max-h-[750px]">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-indigo-600 text-white">
                    <div className="flex items-center gap-3">
                        <Utensils size={20} />
                        <h3 className="text-xl font-black uppercase tracking-tight">Table {selectedTable?.table_no} Bill</h3>
                    </div>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{cart.length} ITEMS</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    {cart.map(item => (
                        <div key={item.id} className="flex gap-4 group">
                            <div className="flex-1 text-sm">
                                <p className="font-black text-slate-900 leading-tight mb-1">{item.name}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rs. {parseFloat(item.price).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                                    <button onClick={() => updateQty(item.id, -1)} className="p-1.5 hover:bg-slate-200 text-slate-400"><Minus size={12} /></button>
                                    <span className="w-6 text-center text-xs font-black text-slate-900">{item.qty}</span>
                                    <button onClick={() => updateQty(item.id, 1)} className="p-1.5 hover:bg-slate-200 text-slate-400"><Plus size={12} /></button>
                                </div>
                                <button onClick={() => removeItem(item.id)} className="p-1.5 text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                            <ShoppingCart size={48} className="mb-4" />
                            <p className="font-bold">Add items to table</p>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Total Bill</span>
                        <span className="text-4xl font-black text-indigo-600">Rs. {subtotal.toLocaleString()}</span>
                    </div>
                    <AppButton 
                        variant="success" 
                        size="lg" 
                        className="w-full uppercase tracking-widest"
                        disabled={cart.length === 0}
                        onClick={() => {setShowCheckoutModal(true); fetchCustomers();}}
                    >
                        PROCEED TO CHECKOUT
                    </AppButton>
                </div>
          </div>
      </div>

      {/* Checkout Selection Modal */}
      <AppModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        title="Checkout Options"
        description={`Total Bill: Rs. ${subtotal.toLocaleString()}`}
      >
        <div className="grid grid-cols-1 gap-6 py-4">
            <button 
                onClick={handlePayNow}
                disabled={processing}
                className="group flex items-center gap-6 p-8 bg-emerald-50 rounded-[32px] border-2 border-emerald-100 hover:border-emerald-500 hover:shadow-xl transition-all text-left"
            >
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-900/20 group-hover:scale-110 transition-transform">
                    <Wallet size={32} />
                </div>
                <div>
                    <h4 className="text-2xl font-black text-emerald-900 mb-1">Pay Now</h4>
                    <p className="text-emerald-600/60 text-sm font-medium">Customer pays immediately (Cash/Card)</p>
                </div>
            </button>

            <button 
                onClick={() => setShowNayaModal(true)}
                disabled={processing}
                className="group flex items-center gap-6 p-8 bg-purple-50 rounded-[32px] border-2 border-purple-100 hover:border-purple-500 hover:shadow-xl transition-all text-left"
            >
                <div className="w-16 h-16 bg-purple-600 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-purple-900/20 group-hover:scale-110 transition-transform">
                    <BookOpen size={32} />
                </div>
                <div>
                    <h4 className="text-2xl font-black text-purple-900 mb-1">Add to Naya Book</h4>
                    <p className="text-purple-600/60 text-sm font-medium">Add to customer credit ledger history</p>
                </div>
            </button>
        </div>
      </AppModal>

      {/* Naya Customer Search Modal */}
      <AppModal
        isOpen={showNayaModal}
        onClose={() => setShowNayaModal(false)}
        title="Select Credit Customer"
        size="lg"
        footer={
            <>
                <AppButton variant="secondary" className="flex-1" onClick={() => setShowNayaModal(false)}>Back</AppButton>
                <AppButton 
                    variant="credit" 
                    className="flex-[2]" 
                    disabled={!selectedCustomer || processing}
                    loading={processing}
                    onClick={handleNayaCheckout}
                >
                    CONFIRM CREDIT SALE
                </AppButton>
            </>
        }
      >
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by name or phone..." 
                    className="input-field pl-12"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredCustomers.map(c => (
                    <button
                        key={c.id}
                        onClick={() => setSelectedCustomer(c)}
                        className={cn(
                            "p-5 rounded-3xl border-2 text-left transition-all relative overflow-hidden",
                            selectedCustomer?.id === c.id ? "bg-purple-600 border-purple-600 text-white" : "bg-slate-50 border-transparent hover:border-slate-200"
                        )}
                    >
                        <p className="font-black text-lg mb-1">{c.name}</p>
                        <p className={cn("text-xs font-bold mb-3", selectedCustomer?.id === c.id ? "text-purple-200" : "text-slate-400")}>{c.phone}</p>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className={cn("text-[8px] font-black uppercase tracking-widest", selectedCustomer?.id === c.id ? "text-purple-300" : "text-slate-400")}>Balance</p>
                                <p className={cn("font-black text-xl", selectedCustomer?.id === c.id ? "text-white" : "text-rose-600")}>Rs. {parseFloat(c.current_balance).toLocaleString()}</p>
                            </div>
                            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", selectedCustomer?.id === c.id ? "bg-white/20" : "bg-white text-purple-600 shadow-sm")}>
                                <Users size={18} />
                            </div>
                        </div>
                    </button>
                ))}
            </div>
            {selectedCustomer && (
                <div className="p-6 bg-amber-50 border-2 border-amber-100 rounded-[28px] animate-in slide-in-from-bottom-4">
                    <p className="text-amber-800 font-bold text-sm mb-1 uppercase tracking-tight">Credit Check</p>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-amber-600">Remaining Limit</span>
                        <span className="font-black text-amber-700">Rs. {(parseFloat(selectedCustomer.credit_limit) - parseFloat(selectedCustomer.current_balance)).toLocaleString()}</span>
                    </div>
                    {parseFloat(selectedCustomer.current_balance) + subtotal > parseFloat(selectedCustomer.credit_limit) && (
                        <p className="mt-3 text-[10px] font-black text-rose-600 uppercase tracking-widest bg-white/50 p-2 rounded-lg text-center">
                            ⚠️ LIMIT EXCEEDED - ADMIN APPROVAL REQUIRED
                        </p>
                    )}
                </div>
            )}
        </div>
      </AppModal>

      {/* Invoice Modal */}
      <AppModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title="Success"
        footer={
            <>
                <AppButton variant="secondary" className="flex-1" onClick={() => setShowPrintModal(false)}>Close</AppButton>
                <AppButton variant="primary" className="flex-1" icon={Printer} onClick={() => window.print()}>Print Receipt</AppButton>
            </>
        }
      >
        <div className="flex flex-col items-center text-center py-8">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={48} />
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-2">Table {selectedTable?.table_no} Bill Cleared</h4>
            <p className="text-slate-500 mb-8 font-medium italic">Invoice No: <span className="text-indigo-600 font-bold">#{lastInvoice?.invoice_no}</span></p>
            <div className="w-full p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex justify-between text-sm font-bold text-slate-500">
                    <span>Total Amount</span>
                    <span className="text-slate-900">Rs. {lastInvoice?.grand_total?.toLocaleString()}</span>
                </div>
            </div>
        </div>
      </AppModal>
    </div>
  );
};

export default TableBillingPage;
