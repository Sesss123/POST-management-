import React, { useState, useEffect } from 'react';
import { itemApi, invoiceApi, settingApi } from '../../api/api';
import { Search, Zap, UserCheck, AlertCircle, ShoppingBag, Banknote, Trash2, CheckCircle2 } from 'lucide-react';
import { AppModal, AppButton, FormInput, useToast } from '../ui';
import { cn } from '../../utils/cn';

const QuickRetailModal = ({ isOpen, onClose, onSuccess }) => {
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [cashReceived, setCashReceived] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAgeModal, setShowAgeModal] = useState(false);
    const [pendingItem, setPendingItem] = useState(null);
    const [settings, setSettings] = useState({});

    useEffect(() => {
        if (isOpen) {
            fetchItems();
            fetchSettings();
            setCart([]);
            setCashReceived('');
        }
    }, [isOpen]);

    const fetchItems = async () => {
        try {
            const { data } = await itemApi.getAll({ 
                is_quick_retail: true, 
                status: 'active'
            });
            setItems(data.data);
        } catch (err) {
            toast.error('Failed to load quick items');
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const { data } = await settingApi.getAll();
            const s = {};
            data.data.forEach(r => s[r.setting_key] = r.setting_value);
            setSettings(s);
        } catch (err) {}
    };

    const handleAddToCart = (item) => {
        if (item.requires_age_confirmation) {
            setPendingItem(item);
            setShowAgeModal(true);
            return;
        }
        addToCartInternal(item, false);
    };

    const addToCartInternal = (item, ageConfirmed) => {
        const existing = cart.find(i => i.id === item.id);
        if (existing) {
            setCart(cart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
        } else {
            setCart([...cart, { ...item, qty: 1, age_confirmed: ageConfirmed }]);
        }
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(i => i.id !== id));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const change = cashReceived ? parseFloat(cash_received) - subtotal : 0;

    const handleConfirmSale = async () => {
        if (cart.length === 0) return;
        if (parseFloat(cashReceived) < subtotal) {
            toast.error('Insufficient cash received');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                items: cart.map(i => ({
                    item_id: i.id,
                    qty: i.qty,
                    age_confirmed: i.age_confirmed
                })),
                cash_received: parseFloat(cashReceived)
            };

            const { data } = await invoiceApi.createQuickRetailSale(payload);
            toast.success(`Sale Successful! Change: Rs. ${data.data.change_amount}`);
            if (onSuccess) onSuccess(data.data);
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Sale failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredItems = items.filter(i => 
        i.name.toLowerCase().includes(search.toLowerCase()) || 
        (i.barcode && i.barcode.includes(search))
    );

    return (
        <>
        <AppModal
            isOpen={isOpen}
            onClose={onClose}
            title="Quick Retail (No-Bill) Sale"
            size="xl"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
                {/* Items Selection */}
                <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3 pl-12 pr-4 text-slate-900 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all"
                            placeholder="Search by name or barcode..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-2 custom-scrollbar pb-4">
                        {loading ? (
                            <div className="col-span-full py-20 text-center text-slate-400">Loading quick items...</div>
                        ) : filteredItems.length > 0 ? (
                            filteredItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleAddToCart(item)}
                                    className="p-4 bg-white border border-slate-100 rounded-2xl text-left hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-50 transition-all group relative overflow-hidden h-32 flex flex-col justify-between"
                                >
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <ShoppingBag size={40} className="text-indigo-600" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-start gap-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.category}</p>
                                            {item.track_stock === 1 && (
                                                <span className={cn(
                                                    "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                                                    parseFloat(item.stock_qty) <= parseFloat(item.low_stock_threshold) ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-600"
                                                )}>
                                                    QTY: {item.stock_qty}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm font-black text-slate-900 leading-tight line-clamp-2">{item.name}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-sm font-black text-indigo-600">Rs. {parseFloat(item.price).toLocaleString()}</p>
                                        {item.age_restricted === 1 && (
                                            <span className="bg-rose-50 text-rose-600 p-1 rounded-lg" title="Age Restricted">
                                                <UserCheck size={12} />
                                            </span>
                                        )}
                                    </div>
                                    {item.track_stock === 1 && (
                                        <div className={cn(
                                            "absolute bottom-0 left-0 right-0 h-1",
                                            parseFloat(item.stock_qty) <= parseFloat(item.low_stock_threshold) ? "bg-rose-500" : "bg-emerald-500"
                                        )} />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center text-slate-400">No quick items found</div>
                        )}
                    </div>
                </div>

                {/* Cart & Checkout */}
                <div className="bg-slate-50 rounded-3xl p-6 flex flex-col gap-6 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                            <Zap className="text-amber-500 fill-amber-500" size={18} />
                            Quick Cart
                        </h3>
                        <span className="px-2 py-1 bg-white rounded-lg text-[10px] font-black text-slate-500 border border-slate-200">
                            {cart.length} ITEMS
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3">
                        {cart.length > 0 ? cart.map(item => (
                            <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-slate-900 truncate">{item.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {item.qty} x Rs. {item.price}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="font-black text-slate-900 text-sm">Rs. {item.price * item.qty}</p>
                                    <button 
                                        onClick={() => removeFromCart(item.id)}
                                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-sm">
                                <ShoppingBag size={40} className="mb-2 opacity-20" />
                                Cart is empty
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <div className="flex justify-between items-center">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Grand Total</p>
                            <p className="text-2xl font-black text-slate-900">Rs. {subtotal.toLocaleString()}</p>
                        </div>

                        <div className="space-y-2">
                            <FormInput 
                                label="Cash Received" 
                                type="number" 
                                placeholder="0.00"
                                value={cashReceived}
                                onChange={(e) => setCashReceived(e.target.value)}
                                icon={Banknote}
                                className="text-xl font-black"
                            />
                            <div className="grid grid-cols-4 gap-2">
                                {[50, 100, 500, 1000].map(val => (
                                    <button 
                                        key={val}
                                        type="button"
                                        onClick={() => setCashReceived(prev => (parseFloat(prev || 0) + val).toString())}
                                        className="py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all"
                                    >
                                        +{val}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {cashReceived && parseFloat(cashReceived) >= subtotal && (
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex justify-between items-center">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Balance / Change</p>
                                <p className="text-lg font-black text-emerald-700">Rs. {change.toLocaleString()}</p>
                            </div>
                        )}

                        <AppButton 
                            className="w-full h-14 rounded-2xl text-lg font-black" 
                            variant="primary"
                            disabled={cart.length === 0 || !cashReceived || parseFloat(cashReceived) < subtotal || isSubmitting}
                            loading={isSubmitting}
                            onClick={handleConfirmSale}
                        >
                            CONFIRM QUICK SALE
                        </AppButton>
                    </div>
                </div>
            </div>
        </AppModal>

        {/* Age Confirmation Modal */}
        <AppModal
            show={showAgeModal}
            onClose={() => { setShowAgeModal(false); setPendingItem(null); }}
            title="Age Verification Required"
            size="sm"
        >
            <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                    <UserCheck size={32} />
                </div>
                <div>
                    <h4 className="text-lg font-black text-slate-900">Verify Customer Age</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                        This item ({pendingItem?.name}) is age-restricted. Please verify customer identity before proceeding.
                    </p>
                </div>
                <div className="flex flex-col gap-2">
                    <AppButton 
                        variant="primary" 
                        className="w-full py-4 h-auto flex flex-col gap-1"
                        onClick={() => {
                            addToCartInternal(pendingItem, true);
                            setShowAgeModal(false);
                            setPendingItem(null);
                        }}
                    >
                        <span className="text-base font-black">AGE VERIFIED</span>
                        <span className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Confirm customer is of legal age</span>
                    </AppButton>
                    <AppButton 
                        variant="ghost" 
                        onClick={() => { setShowAgeModal(false); setPendingItem(null); }}
                    >
                        CANCEL
                    </AppButton>
                </div>
            </div>
        </AppModal>
        </>
    );
};

export default QuickRetailModal;
