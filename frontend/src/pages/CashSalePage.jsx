import React, { useState, useEffect } from 'react';
import { itemApi, invoiceApi, heldBillApi, settingApi, shiftApi } from '../api/api';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  X, 
  CheckCircle2,
  Tag,
  CreditCard,
  Banknote,
  PauseCircle,
  History,
  AlertCircle
} from 'lucide-react';
import { AppButton, AppCard, FormInput, AppModal, useToast } from '../components/ui';
import InvoicePrintModal from '../components/invoice/InvoicePrintModal';
import { cn } from '../utils/cn';

const CashSalePage = () => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const [settings, setSettings] = useState({ tax_percentage: 0, service_charge_percentage: 0, shift_enforcement_enabled: false });
  const [currentShift, setCurrentShift] = useState(null);
  
  // Modals
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showHeldBillsModal, setShowHeldBillsModal] = useState(false);
  const [heldBills, setHeldBills] = useState([]);
  const [lastInvoice, setLastInvoice] = useState(null);

  useEffect(() => {
    fetchItems();
    fetchSettings();
    fetchShiftStatus();
  }, []);

  const fetchItems = async () => {
    try {
      const { data } = await itemApi.getAll();
      const activeItems = data.data.filter(i => i.status === 'active');
      setItems(activeItems);
      const cats = ['All', ...new Set(activeItems.map(i => i.category))];
      setCategories(cats);
    } catch (err) {
      toast.error('Failed to load items');
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

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }));
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const subtotal = cart.reduce((sum, i) => sum + (parseFloat(i.price) * i.qty), 0);
  const tax = (subtotal * parseFloat(settings.tax_percentage)) / 100;
  const sc = (subtotal * parseFloat(settings.service_charge_percentage)) / 100;
  const grandTotal = subtotal - discount + tax + sc;

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (settings.shift_enforcement_enabled && !currentShift) {
        return toast.error('SHIFT ENFORCEMENT: Please open a shift before billing.');
    }
    setProcessing(true);
    try {
      const payload = {
        items: cart.map(i => ({ id: i.id, qty: i.qty })),
        subtotal,
        discount,
        tax_amount: tax,
        service_charge_amount: sc,
        grand_total: grandTotal,
        payment_method: paymentMethod
      };
      const { data } = await invoiceApi.createCashSale(payload);
      setLastInvoice(data.data);
      setShowPrintModal(true);
      setCart([]);
      setDiscount(0);
      toast.success('Sale completed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleHoldBill = async () => {
      if (cart.length === 0) return;
      if (settings.shift_enforcement_enabled && !currentShift) {
          return toast.error('SHIFT ENFORCEMENT: Please open a shift before billing.');
      }
      const ref = window.prompt('Enter reference name for this bill (e.g. Customer Name)');
      if (ref === null) return;

      setProcessing(true);
      try {
          await heldBillApi.hold({
              reference_name: ref || `Bill-${Date.now().toString().slice(-4)}`,
              items: cart,
              subtotal
          });
          setCart([]);
          toast.success('Bill parked successfully');
      } catch (err) {
          toast.error('Failed to park bill');
      } finally {
          setProcessing(false);
      }
  };

  const fetchHeldBills = async () => {
      try {
          const { data } = await heldBillApi.getAll();
          setHeldBills(data.data);
          setShowHeldBillsModal(true);
      } catch (err) {
          toast.error('Failed to load parked bills');
      }
  };

  const restoreHeldBill = async (id) => {
      setProcessing(true);
      try {
          const { data } = await heldBillApi.getDetails(id);
          // Map items back to cart format
          const restoredItems = data.data.items.map(i => ({
              id: i.item_id,
              name: i.item_name,
              price: i.unit_price,
              qty: i.qty
          }));
          setCart(restoredItems);
          
          // Optionally cancel the held record now that it's in cart
          await heldBillApi.cancel(id, 'Resumed to cart');
          
          setShowHeldBillsModal(false);
          toast.success('Bill restored to cart');
      } catch (err) {
          toast.error('Failed to restore bill');
      } finally {
          setProcessing(false);
      }
  };

  const cancelHeldBill = async (id) => {
      const reason = window.prompt('Reason for cancellation?');
      if (!reason) return;
      
      try {
          await heldBillApi.cancel(id, reason);
          toast.success('Parked bill cancelled');
          fetchHeldBills(); // Refresh list
      } catch (err) {
          toast.error('Failed to cancel bill');
      }
  };

  const filteredItems = items.filter(i => 
    (selectedCategory === 'All' || i.category === selectedCategory) &&
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex gap-8 h-[calc(100vh-140px)] animate-in fade-in duration-500 overflow-hidden">
      {/* Left: Menu Area */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="flex flex-col md:flex-row gap-4 shrink-0">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search food or drinks..." 
              className="w-full bg-white border-2 border-transparent rounded-[24px] py-4 pl-12 pr-4 text-slate-900 font-bold shadow-lg shadow-slate-200/50 outline-none focus:border-indigo-600 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar shrink-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-md",
                  selectedCategory === cat ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-white text-slate-500 hover:bg-slate-50 shadow-slate-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-white p-6 rounded-[32px] text-left border-2 border-transparent hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-200/50 transition-all group flex flex-col items-center text-center shadow-lg shadow-slate-100"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <Tag size={28} />
                </div>
                <h4 className="font-black text-slate-900 mb-1 leading-tight">{item.name}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{item.category}</p>
                <p className="mt-auto text-lg font-black text-indigo-600">Rs. {parseFloat(item.price).toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart Panel */}
      <div className="w-[420px] shrink-0 flex flex-col bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center">
                <ShoppingCart size={20} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Quick Sale</h3>
          </div>
          <button 
            onClick={fetchHeldBills}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors relative"
          >
              <History size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {cart.map(item => (
            <div key={item.id} className="flex gap-4 group animate-in slide-in-from-right-4 duration-300">
              <div className="flex-1">
                <p className="font-black text-slate-900 leading-tight mb-1">{item.name}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rs. {parseFloat(item.price).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                  <button onClick={() => updateQty(item.id, -1)} className="p-2 hover:bg-slate-200 text-slate-400 transition-colors"><Minus size={14} /></button>
                  <span className="w-8 text-center text-sm font-black text-slate-900">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-2 hover:bg-slate-200 text-slate-400 transition-colors"><Plus size={14} /></button>
                </div>
                <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-40">
                <ShoppingCart size={64} className="mb-4 text-slate-300" />
                <p className="font-bold text-slate-400">Cart is empty</p>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Discount</span>
              <div className="relative w-20">
                <input 
                    type="number" 
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-rose-500 font-black outline-none focus:border-rose-400"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>
            </div>
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Tax ({settings.tax_percentage}%)</span>
                <span>Rs. {tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Service Charge ({settings.service_charge_percentage}%)</span>
                <span>Rs. {sc.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-end pt-4 border-t-2 border-dashed border-slate-200">
                <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Total Bill</span>
                <span className="text-3xl font-black text-indigo-600 tracking-tighter">Rs. {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={() => setPaymentMethod('cash')}
                className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest",
                    paymentMethod === 'cash' ? "bg-emerald-50 border-emerald-600 text-emerald-600 shadow-lg shadow-emerald-200" : "bg-white border-slate-100 text-slate-400"
                )}
            >
                <Banknote size={20} />
                Pay by Cash
            </button>
            <button 
                onClick={() => setPaymentMethod('card')}
                className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest",
                    paymentMethod === 'card' ? "bg-blue-50 border-blue-600 text-blue-600 shadow-lg shadow-blue-200" : "bg-white border-slate-100 text-slate-400"
                )}
            >
                <CreditCard size={20} />
                Pay by Card
            </button>
          </div>

          <div className="flex gap-3">
            <button 
                className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                    cart.length === 0 ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-amber-100 text-amber-700 hover:bg-amber-600 hover:text-white"
                )}
                disabled={cart.length === 0 || processing}
                onClick={handleHoldBill}
            >
                <PauseCircle size={18} />
                Park Bill
            </button>
            <AppButton 
                variant="success" 
                className="flex-[2] py-4 uppercase tracking-widest text-xs shadow-lg shadow-emerald-200" 
                onClick={handleCheckout}
                loading={processing}
                disabled={cart.length === 0}
            >
                Generate Invoice
            </AppButton>
          </div>
        </div>
      </div>

      {/* Held Bills Modal */}
      <AppModal
        isOpen={showHeldBillsModal}
        onClose={() => setShowHeldBillsModal(false)}
        title="Parked Bills"
        size="lg"
      >
        <div className="space-y-4 py-4">
            {heldBills.length === 0 ? (
                <div className="py-12 text-center opacity-30">
                    <History size={48} className="mx-auto mb-4" />
                    <p className="font-bold">No parked bills found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {heldBills.map(bill => (
                        <div key={bill.id} className="p-6 bg-slate-50 border-2 border-slate-100 rounded-[32px] hover:border-indigo-600 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-black text-slate-900 text-lg leading-tight">{bill.reference_name}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {new Date(bill.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black">
                                    Rs. {parseFloat(bill.subtotal).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <AppButton 
                                    variant="secondary" 
                                    size="sm" 
                                    className="flex-1 uppercase tracking-widest text-[10px]"
                                    onClick={() => restoreHeldBill(bill.id)}
                                >
                                    Restore
                                </AppButton>
                                <AppButton 
                                    variant="danger" 
                                    size="sm" 
                                    className="p-2 aspect-square flex items-center justify-center"
                                    onClick={() => cancelHeldBill(bill.id)}
                                    icon={Trash2}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </AppModal>

      <InvoicePrintModal 
        isOpen={showPrintModal} 
        onClose={() => setShowPrintModal(false)} 
        invoice={lastInvoice ? { ...lastInvoice, settings } : null} 
      />
    </div>
  );
};

export default CashSalePage;
