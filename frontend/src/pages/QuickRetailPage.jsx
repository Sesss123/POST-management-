import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2,
  Tag,
  AlertCircle,
  LayoutGrid,
  List,
  Star,
  Clock,
  ArrowLeft,
  RefreshCcw,
  Zap,
  ShoppingBag,
  History,
  UserCircle,
  ChevronDown,
  Banknote,
  CreditCard,
  Printer
} from 'lucide-react';
import { quickRetailApi, shiftApi, userApi } from '../api/api';
import { AppButton, useToast, AppModal, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { cn } from '../utils/cn';

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const QuickRetailPage = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { user } = useAuth();
    const { settings: globalSettings } = useSettings();
    
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentShift, setCurrentShift] = useState(null);
    const [cashReceived, setCashReceived] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' or 'card'
    const [orderType, setOrderType] = useState('takeaway'); // 'takeaway', 'delivery', 'dine-in'
    
    // UI State
    const [mainCategories, setMainCategories] = useState([]);
    const [selectedMainCategory, setSelectedMainCategory] = useState('All');
    const [portionFilter, setPortionFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [recentItems, setRecentItems] = useState([]);
    
    // Age Confirmation Modal
    const [showAgeModal, setShowAgeModal] = useState(false);
    const [pendingItem, setPendingItem] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await quickRetailApi.getQuickItems();
            const activeItems = data.data || [];
            setItems(activeItems);
            
            const mainCats = [...new Set(activeItems.map(i => i.main_category).filter(Boolean))];
            setMainCategories(mainCats);
        } catch (err) {
            addToast('Unable to load items', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const fetchShiftStatus = async () => {
        try {
            const { data } = await shiftApi.getCurrent();
            setCurrentShift(data.data);
        } catch (err) {
            setCurrentShift(null);
        }
    };

    useEffect(() => {
        fetchData();
        fetchShiftStatus();
    }, []);

    const addToCart = (item) => {
        if (item.availability_status === 'sold_out' || (item.track_stock && item.stock_qty <= 0)) {
            addToast('Item is sold out', 'warning');
            return;
        }

        if (item.requires_age_confirmation || item.age_restricted) {
            setPendingItem(item);
            setShowAgeModal(true);
            return;
        }

        performAddToCart(item);
    };

    const performAddToCart = (item, ageConfirmed = false) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...item, qty: 1, age_confirmed: ageConfirmed }];
        });
        
        setRecentItems(prev => {
            const filtered = prev.filter(i => i.id !== item.id);
            return [{...item}, ...filtered].slice(0, 5);
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

    const subtotal = cart.reduce((sum, i) => sum + (toNumber(i.price) * i.qty), 0);
    const taxAndService = 0; // Quick Retail usually flat
    const total = subtotal + taxAndService;
    const change = cashReceived ? parseFloat(cashReceived) - total : 0;

    const handleQuickCash = (amount) => {
        if (amount === 'EXACT') setCashReceived(total.toString());
        else if (amount === 'CLR') setCashReceived('');
        else setCashReceived((parseFloat(cashReceived || 0) + amount).toString());
    };

    const handleSubmit = async (noReceipt = true) => {
        if (cart.length === 0) return;
        if (paymentMethod === 'cash' && parseFloat(cashReceived || 0) < total) {
            addToast('Insufficient cash received', 'warning');
            return;
        }

        setProcessing(true);
        try {
            const payload = {
                items: cart.map(i => ({
                    item_id: i.id,
                    qty: i.qty,
                    age_confirmed: i.age_confirmed || false
                })),
                payment_method: paymentMethod,
                order_type: orderType,
                cash_received: paymentMethod === 'cash' ? parseFloat(cashReceived) : total
            };

            const { data } = await quickRetailApi.createQuickSale(payload);
            
            addToast(`Sale successful. Change: Rs. ${data.data.change_amount.toLocaleString()}`, 'success');
            
            setCart([]);
            setCashReceived('');
            fetchData(); 
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to process sale', 'danger');
        } finally {
            setProcessing(false);
        }
    };

    const filteredItems = items.filter(i => {
        const matchesSearch = 
            i.name.toLowerCase().includes(search.toLowerCase()) || 
            (i.short_code && i.short_code.toLowerCase().includes(search.toLowerCase()));
        
        const matchesMainCategory = selectedMainCategory === 'All' || 
                                   (selectedMainCategory === 'Popular' && i.is_popular) ||
                                   i.main_category === selectedMainCategory;
        
        const matchesPortion = portionFilter === 'all' || i.portion_type === portionFilter;
        
        return matchesSearch && matchesMainCategory && matchesPortion;
    }).sort((a, b) => (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0) || (a.display_order || 0) - (b.display_order || 0));

    return (
        <div className="pos-layout gap-4 animate-in fade-in duration-500 relative bg-[#F8FAFC]">
            {/* 1. Rail Sidebar */}
            <div className="w-full lg:w-24 flex lg:flex-col gap-2 shrink-0 overflow-x-auto lg:overflow-y-auto custom-scrollbar-hide pb-2 lg:pb-10 p-1">
                <button 
                    onClick={() => setSelectedMainCategory('All')}
                    className={cn(
                        "flex flex-col items-center justify-center gap-2 p-4 rounded-3xl transition-all",
                        selectedMainCategory === 'All' ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-slate-400"
                    )}
                >
                    <LayoutGrid size={24} />
                    <span className="text-[9px] font-black uppercase tracking-tighter">All</span>
                </button>
                
                <button 
                    onClick={() => setSelectedMainCategory('Popular')}
                    className={cn(
                        "flex flex-col items-center justify-center gap-2 p-4 rounded-3xl transition-all",
                        selectedMainCategory === 'Popular' ? "bg-amber-500 text-white shadow-lg" : "bg-white text-slate-400"
                    )}
                >
                    <Star size={24} />
                    <span className="text-[9px] font-black uppercase tracking-tighter">Popular</span>
                </button>

                <div className="h-px bg-slate-200 mx-4 my-2" />

                {mainCategories.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setSelectedMainCategory(cat)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 p-4 rounded-3xl transition-all",
                            selectedMainCategory === cat ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-slate-400"
                        )}
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <span className="text-xs font-black">{cat.charAt(0)}</span>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-tighter text-center line-clamp-2 leading-tight">{cat}</span>
                    </button>
                ))}
            </div>

            {/* 2. Middle Panel: Item Search & Selection */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 min-h-0">
                <div className="flex flex-col gap-3 lg:gap-4 shrink-0 bg-white p-3 lg:p-4 rounded-[32px] shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Select Items</h1>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fast Quick Retail Mode</p>
                        </div>
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase border border-rose-100">
                           <AlertCircle size={12} />
                           <span>No KOT / No Formal Bill</span>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search item or code... [/]" 
                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex gap-2 items-center overflow-x-auto custom-scrollbar-hide">
                            {['all', 'single', 'double', '250g'].map(p => (
                                <button 
                                    key={p}
                                    onClick={() => setPortionFilter(p)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border-2",
                                        portionFilter === p ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-100 text-slate-400"
                                    )}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button onClick={() => setViewMode('grid')} className={cn("p-1.5 rounded-lg", viewMode === 'grid' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}><LayoutGrid size={16} /></button>
                            <button onClick={() => setViewMode('list')} className={cn("p-1.5 rounded-lg", viewMode === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}><List size={16} /></button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10 mt-4">
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                        </div>
                    ) : (
                        <div className={cn(
                            viewMode === 'grid' 
                                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
                                : "flex flex-col gap-2"
                        )}>
                            {filteredItems.map(item => {
                                const isSoldOut = item.availability_status === 'sold_out' || (item.track_stock && item.stock_qty <= 0);
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => addToCart(item)}
                                        disabled={isSoldOut}
                                        className={cn(
                                            "p-3 rounded-2xl text-left border transition-all flex flex-col shadow-sm relative overflow-hidden h-[120px]",
                                            isSoldOut ? "bg-slate-50 opacity-60 grayscale cursor-not-allowed" : "bg-white border-slate-100 hover:border-indigo-600 hover:shadow-md active:scale-95 group"
                                        )}
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-black text-slate-800 text-[11px] leading-tight line-clamp-2 uppercase mb-1">{item.name}</h4>
                                            <div className="flex flex-wrap gap-1">
                                                <span className="text-[7px] font-black text-slate-400 uppercase">{item.category}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                                            <p className="text-sm font-black text-indigo-600">Rs. {toNumber(item.price).toLocaleString()}</p>
                                            <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <Plus size={14} />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Right Panel: Cart & Payment (Redesigned based on User Image) */}
            <div className="w-full lg:w-[450px] shrink-0 pointer-events-auto">
                <div className="bg-white h-full rounded-[40px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
                    {/* Header: Quick Sale Style */}
                    <div className="p-6 bg-[#0F172A] text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                <ShoppingCart size={20} />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Quick Sale</h3>
                        </div>
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <History size={20} />
                        </button>
                    </div>

                    {/* Order Type & Waiter Selectors */}
                    <div className="p-4 space-y-4 border-b border-slate-100">
                        <div className="flex gap-2">
                            {['takeaway', 'delivery', 'dine-in'].map(type => (
                                <button 
                                    key={type}
                                    onClick={() => setOrderType(type)}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                                        orderType === type ? "bg-[#4F46E5] text-white shadow-lg" : "bg-white border border-slate-200 text-slate-400"
                                    )}
                                >
                                    {type === 'takeaway' && <ShoppingBag size={14} />}
                                    {type}
                                </button>
                            ))}
                        </div>
                        <button className="w-full py-3 px-4 rounded-xl border border-slate-100 flex items-center justify-between text-slate-400">
                            <div className="flex items-center gap-2">
                                <UserCircle size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Select Waiter (Optional)</span>
                            </div>
                            <ChevronDown size={14} />
                        </button>
                    </div>

                    {/* Cart Items Area */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                                <ShoppingCart size={64} className="text-slate-300" />
                                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Cart is empty</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cart.map(item => (
                                    <div key={item.id} className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-2">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-xs font-black text-slate-800 uppercase line-clamp-1">{item.name}</h4>
                                            <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center bg-white rounded-lg border border-slate-100 p-0.5">
                                                <button onClick={() => updateQty(item.id, -1)} className="p-1.5 text-slate-400 hover:text-indigo-600"><Minus size={12} /></button>
                                                <span className="w-8 text-center text-xs font-black">{item.qty}</span>
                                                <button onClick={() => updateQty(item.id, 1)} className="p-1.5 text-slate-400 hover:text-indigo-600"><Plus size={12} /></button>
                                            </div>
                                            <p className="text-sm font-black text-slate-900">Rs. {(toNumber(item.price) * item.qty).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Totals Summary */}
                    <div className="p-6 border-t border-slate-100 bg-white space-y-4">
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span>Subtotal</span>
                                <span>Rs. {subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span>Tax & S.Charge</span>
                                <span>Rs. 0.00</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">Payable Amount</span>
                            <span className="text-3xl font-black text-[#4F46E5]">Rs. {total.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Payment & Actions */}
                    <div className="p-6 pt-0 bg-white space-y-4">
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setPaymentMethod('cash')}
                                className={cn(
                                    "flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all border-2",
                                    paymentMethod === 'cash' ? "bg-[#10B981] border-[#10B981] text-white shadow-lg" : "bg-white border-slate-100 text-slate-400"
                                )}
                            >
                                <Banknote size={20} />
                                <span className="font-black uppercase tracking-widest text-sm">Cash</span>
                            </button>
                            <button 
                                onClick={() => setPaymentMethod('card')}
                                className={cn(
                                    "flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all border-2",
                                    paymentMethod === 'card' ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400"
                                )}
                            >
                                <CreditCard size={20} />
                                <span className="font-black uppercase tracking-widest text-sm">Card</span>
                            </button>
                        </div>

                        {paymentMethod === 'cash' && (
                            <div className="p-4 rounded-[24px] bg-white border-2 border-[#10B981]/10 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">Rs.</span>
                                        <input 
                                            type="number"
                                            className="w-full text-2xl font-black text-slate-900 outline-none bg-transparent"
                                            placeholder="0.00"
                                            value={cashReceived}
                                            onChange={e => setCashReceived(e.target.value)}
                                        />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Change</p>
                                        <p className={cn("text-lg font-black", change >= 0 ? "text-[#10B981]" : "text-rose-500")}>Rs. {change.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {['EXACT', 100, 500, 1000, 'CLR'].map(amt => (
                                        <button 
                                            key={amt}
                                            onClick={() => handleQuickCash(amt)}
                                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[9px] font-black text-slate-600 transition-colors"
                                        >
                                            {amt === 'EXACT' ? 'EXACT' : amt === 'CLR' ? 'CLR' : `+${amt}`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-4 gap-2">
                            <button className="aspect-square rounded-2xl bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400 opacity-50 cursor-not-allowed">
                                <Clock size={18} />
                                <span className="text-[7px] font-black uppercase">Park</span>
                            </button>
                            <button className="aspect-square rounded-2xl bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400 opacity-50 cursor-not-allowed">
                                <UserCircle size={18} />
                                <span className="text-[7px] font-black uppercase text-center leading-tight">Add to<br/>Account</span>
                            </button>
                            <button className="aspect-square rounded-2xl bg-slate-100 flex flex-col items-center justify-center gap-2 text-slate-400 opacity-50 cursor-not-allowed">
                                <Printer size={18} />
                                <span className="text-[7px] font-black uppercase text-center leading-tight">Complete<br/>& Print</span>
                            </button>
                            <button 
                                onClick={() => handleSubmit(true)}
                                disabled={processing || cart.length === 0}
                                className={cn(
                                    "aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all",
                                    processing || cart.length === 0 ? "bg-slate-50 text-slate-300" : "bg-[#F8FAFC] text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100"
                                )}
                            >
                                <Zap size={20} />
                                <span className="text-[7px] font-black uppercase text-center leading-tight">Quick<br/>Cash<br/>(No Receipt)</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Age Verification Modal */}
            <AppModal isOpen={showAgeModal} onClose={() => setShowAgeModal(false)} title="Age Verification">
                <div className="p-6 text-center space-y-6">
                    <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto"><AlertCircle size={40} /></div>
                    <div>
                        <h4 className="text-lg font-black text-slate-900 uppercase mb-2">Age-Restricted Item</h4>
                        <p className="text-sm text-slate-500">Please verify customer eligibility before selling <strong>{pendingItem?.name}</strong>.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <AppButton variant="secondary" fullWidth onClick={() => setShowAgeModal(false)}>Cancel</AppButton>
                        <AppButton variant="primary" fullWidth onClick={() => { performAddToCart(pendingItem, true); setShowAgeModal(false); }}>Verified, Add</AppButton>
                    </div>
                </div>
            </AppModal>
        </div>
    );
};

export default QuickRetailPage;
