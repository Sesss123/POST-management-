import React, { useState, useEffect } from 'react';
import { itemApi, invoiceApi } from '../api/api';
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
  Banknote
} from 'lucide-react';
import { AppButton, AppCard, FormInput, AppModal, useToast } from '../components/ui';
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
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);

  useEffect(() => {
    fetchItems();
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

  const calculateSubtotal = () => cart.reduce((sum, i) => sum + (parseFloat(i.price) * i.qty), 0);
  const subtotal = calculateSubtotal();
  const grandTotal = subtotal - discount;

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    setProcessing(true);
    try {
      const payload = {
        items: cart.map(i => ({ id: i.id, qty: i.qty })),
        subtotal,
        discount,
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
            {filteredItems.length === 0 && (
                <div className="col-span-full py-20 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                        <Search size={40} />
                    </div>
                    <p className="text-slate-400 font-bold">No items found matching "{search}"</p>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Cart Panel */}
      <div className="w-[420px] shrink-0 flex flex-col bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <ShoppingCart size={20} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Current Bill</h3>
          </div>
          <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-500 uppercase">{cart.length} ITEMS</span>
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
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-bold text-slate-500 uppercase tracking-widest">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-slate-500 uppercase tracking-widest">
              <span>Discount</span>
              <div className="relative w-24">
                <input 
                    type="number" 
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-rose-500 font-black outline-none focus:border-rose-400"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>
            </div>
            <div className="flex justify-between items-end pt-4 border-t border-slate-200">
                <span className="text-lg font-black text-slate-900 uppercase tracking-tight">Grand Total</span>
                <span className="text-4xl font-black text-indigo-600 tracking-tighter">Rs. {grandTotal.toLocaleString()}</span>
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
            <AppButton 
                variant="secondary" 
                className="flex-1 py-4 uppercase tracking-widest text-[10px]" 
                onClick={() => setCart([])}
                disabled={cart.length === 0}
            >
                Clear
            </AppButton>
            <AppButton 
                variant="success" 
                className="flex-[2] py-4 uppercase tracking-widest text-xs" 
                onClick={handleCheckout}
                loading={processing}
                disabled={cart.length === 0}
            >
                Generate Invoice
            </AppButton>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      <AppModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title="Success"
        description="Invoice generated successfully"
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
            <h4 className="text-xl font-black text-slate-900 mb-2">Transaction Completed</h4>
            <p className="text-slate-500 mb-8 font-medium">Invoice No: <span className="text-indigo-600 font-bold">#{lastInvoice?.invoice_no}</span></p>
            <div className="w-full p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                <div className="flex justify-between text-sm font-bold text-slate-500">
                    <span>Total Amount</span>
                    <span className="text-slate-900">Rs. {lastInvoice?.grand_total?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-500">
                    <span>Payment Method</span>
                    <span className="text-emerald-600 uppercase">{lastInvoice?.payment_method}</span>
                </div>
            </div>
        </div>
      </AppModal>
    </div>
  );
};

export default CashSalePage;
