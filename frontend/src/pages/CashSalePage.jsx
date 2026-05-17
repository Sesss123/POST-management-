import React, { useState, useEffect } from 'react';
import { itemApi, invoiceApi, heldBillApi, settingApi, shiftApi, userApi, promotionApi, comboApi } from '../api/api';
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
  AlertCircle,
  Bike,
  ShoppingBag,
  UtensilsCrossed,
  UserCircle,
  LayoutGrid,
  List,
  Star,
  Clock,
  ArrowRight,
  Zap,
  User
} from 'lucide-react';
import { AppButton, AppCard, FormInput, AppModal, useToast } from '../components/ui';
import InvoicePrintModal from '../components/invoice/InvoicePrintModal';
import AddToCustomerAccountModal from '../components/naya/AddToCustomerAccountModal';
import ItemModifierModal from '../components/pos/ItemModifierModal';
import PaymentQRModal from '../components/PaymentQRModal';
import QuickCashModal from '../components/pos/QuickCashModal';
import { gatewayPaymentApi } from '../api/api';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../hooks/useNetwork';
import { saveOfflineDraft, getCachedMenu, cacheMenuData } from '../offline/offlineDb';

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

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
  const [settings, setSettings] = useState({ tax_rate: 0, service_charge_rate: 0, shift_enforcement_enabled: 'false' });
  const [currentShift, setCurrentShift] = useState(null);
  const [cashReceived, setCashReceived] = useState(0);
  
  const { user } = useAuth();
  const isOnline = useNetwork();

  // Loyalty State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loyaltyPointsRedeem, setLoyaltyPointsRedeem] = useState(0);
  
  const [promotions, setPromotions] = useState([]);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [combos, setCombos] = useState([]);
  
  // New Usability State
  const [mainCategories, setMainCategories] = useState([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState('All');
  const [portionFilter, setPortionFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [recentItems, setRecentItems] = useState([]);
  
  const [orderType, setOrderType] = useState('takeaway');
  const [waiters, setWaiters] = useState([]);
  const [selectedWaiter, setSelectedWaiter] = useState('');
  
  // Modals
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showHeldBillsModal, setShowHeldBillsModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCustomerSelectModal, setShowCustomerSelectModal] = useState(false);
  const [showAddToNayaModal, setShowAddToNayaModal] = useState(false);
  const [heldBills, setHeldBills] = useState([]);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [showQuickCashModal, setShowQuickCashModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrTransactionData, setQrTransactionData] = useState(null);
  
  // Held Bill Pro State
  const [resumedBill, setResumedBill] = useState(null);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdDetails, setHoldDetails] = useState({ customer_name: '', customer_phone: '', note: '' });
  
  // Mobile UI state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modifierTarget, setModifierTarget] = useState(null);

  const fetchWaiters = async () => {
      try {
          const { data } = await userApi.getWaiters();
          setWaiters(data.data);
      } catch (err) {}
  };

  const fetchItems = async () => {
    try {
      let activeItems = [];
      if (isOnline) {
          const { data } = await itemApi.getAll();
          activeItems = data.data.filter(i => 
            i.status === 'active' && 
            (i.is_restaurant_item === 1 || i.is_restaurant_item === true)
          );
          if (user?.shop_id) {
              await cacheMenuData(user.shop_id, activeItems);
          }
      } else {
          if (user?.shop_id) {
              activeItems = await getCachedMenu(user.shop_id) || [];
          }
      }
      setItems(activeItems);
      
      // Extract unique categories and main categories
      const categoryPriority = {
        'rice & curry': 1,
        'rice and curry': 1,
        'fried rice': 2,
        'kottu': 3,
        'noodles': 4,
        'devilled / stew / fried': 5,
        'eggs & extras': 6,
        'seafood specials': 7,
        'beverages': 8,
        'beverage': 8,
        'retail': 9,
        'small retail': 10,
        'dessert': 11,
        'packing / extras': 12
      };

      const sortCats = (a, b) => {
        const pA = categoryPriority[a.toLowerCase()] || 99;
        const pB = categoryPriority[b.toLowerCase()] || 99;
        if (pA !== pB) return pA - pB;
        return a.localeCompare(b);
      };

      const cats = ['All', 'Combos', ...new Set(activeItems.map(i => i.category))].sort(sortCats);
      setCategories(cats);
      
      const mainCats = [...new Set(activeItems.map(i => i.main_category).filter(Boolean))].sort(sortCats);
      setMainCategories(mainCats);
    } catch (err) {
      toast.error('Failed to load items');
    }
  };

  const fetchCombos = async () => {
      try {
          const { data } = await comboApi.getAll();
          setCombos(data.data.map(c => ({ ...c, is_combo: true, category: 'Combos' })));
      } catch (err) {}
  };

  const fetchApplicablePromotions = async () => {
      try {
          const { data } = await promotionApi.getApplicable({ order_type: orderType, subtotal });
          setPromotions(data.data);
      } catch (err) {}
  };

  const fetchSettings = async () => {
      try {
          const { data } = await settingApi.getAll();
          setSettings(data.flat || {});
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

  const subtotal = cart.reduce((sum, i) => sum + (toNumber(i.unit_price || i.price) * i.qty) + (toNumber(i.modifier_total) * i.qty), 0);
  const discountedSubtotal = subtotal - toNumber(discount);
  
  const getPromoDiscount = () => {
      if (!selectedPromo) return 0;
      if (selectedPromo.type === 'percentage_discount') return (discountedSubtotal * selectedPromo.value) / 100;
      if (selectedPromo.type === 'fixed_discount') return toNumber(selectedPromo.value);
      return 0;
  };
  const promoDiscount = getPromoDiscount();
  const preLoyaltySubtotal = Math.max(0, discountedSubtotal - promoDiscount);
  const loyaltyRate = parseFloat(settings.loyalty_redeem_points || 1);
  const loyaltyValue = parseFloat(settings.loyalty_redeem_amount || 1);
  const loyaltyDiscountAmount = Math.min(preLoyaltySubtotal, (toNumber(loyaltyPointsRedeem) / loyaltyRate) * loyaltyValue);
  const finalSubtotal = Math.max(0, preLoyaltySubtotal - loyaltyDiscountAmount);

  const tax = (finalSubtotal * toNumber(settings.tax_rate)) / 100;
  const sc = (finalSubtotal * toNumber(settings.service_charge_rate)) / 100;
  const grandTotal = finalSubtotal + tax + sc;

  useEffect(() => {
    fetchItems();
    if (isOnline) fetchCombos();
    if (isOnline) fetchSettings();
    if (isOnline) fetchShiftStatus();
    if (isOnline) fetchWaiters();

    if (!isOnline && paymentMethod !== 'cash') {
        setPaymentMethod('cash');
    }

    // Check for bill resumption request from HeldBillsPage
    const resumeId = localStorage.getItem('resume_held_bill_id');
    if (resumeId) {
        localStorage.removeItem('resume_held_bill_id');
        restoreHeldBill(resumeId);
    }
  }, []);

  useEffect(() => {
    if (subtotal > 0) {
        fetchApplicablePromotions();
    } else {
        setPromotions([]);
        setSelectedPromo(null);
    }
  }, [subtotal, orderType]);

  const addToCart = (item) => {
    setModifierTarget(item);
    setEditingItem(null);
    setShowModifierModal(true);
  };

  const confirmModifiers = (modifiedItem) => {
    setCart(prev => {
      // Check if we are editing an existing cart item (by temporary unique ID or index)
      if (editingItem !== null) {
        return prev.map((item, idx) => idx === editingItem ? modifiedItem : item);
      }
      
      // For new additions, we always add as a new line if it has modifiers
      // Or if no modifiers, we can try to merge (optional, but requested modifiers usually mean unique lines)
      return [...prev, modifiedItem];
    });

    // Update Recent Items
    setRecentItems(prev => {
        const filtered = prev.filter(i => i.id !== modifiedItem.id);
        return [{...modifiedItem}, ...filtered].slice(0, 5);
    });
    
    toast.success(`${modifiedItem.name} added`, { duration: 1000, position: 'bottom-center' });
    setModifierTarget(null);
    setEditingItem(null);
  };

  const openEditModifiers = (item, index) => {
    setModifierTarget(item);
    setEditingItem(index);
    setShowModifierModal(true);
  };

  const handleRestoreCart = (data) => {
      setCart(data.items);
      setDiscount(data.discount);
      if (data.promotion_id) {
          // You might need to find the promo object from the list
          const promo = promotions.find(p => p.id === data.promotion_id);
          if (promo) setSelectedPromo(promo);
      }
      toast.success('Cart restored for editing');
  };

  const updateQty = (id, delta, is_combo = false, index = null) => {
    setCart(prev => prev.map((i, idx) => {
      // If index is provided, use it for exact match
      if (index !== null) {
        if (idx === index) {
          const newQty = Math.max(1, i.qty + delta);
          return { ...i, qty: newQty };
        }
        return i;
      }
      
      // Fallback to ID match (legacy/safety)
      if (i.id === id && i.is_combo === is_combo) {
        const newQty = Math.max(1, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }));
  };

  const removeItem = (id, is_combo = false, index = null) => {
    setCart(prev => prev.filter((i, idx) => {
      if (index !== null) return idx !== index;
      return !(i.id === id && i.is_combo === is_combo);
    }));
  };



  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (settings.shift_enforcement_enabled === 'true' && !currentShift) {
        return toast.error('SHIFT ENFORCEMENT: Please open a shift before billing.');
    }
    setProcessing(true);
    try {
      const payload = {
        items: cart.map(i => ({ 
            id: i.id, 
            item_id: i.id, 
            qty: i.qty, 
            is_combo: i.is_combo || false, 
            name: i.name, 
            price: i.unit_price || i.price,
            modifier_total: i.modifier_total || 0,
            special_note: i.special_note || null,
            modifiers: i.modifiers || []
        })),
        subtotal,
        discount_value: toNumber(discount),
        discount_type: 'fixed',
        promotion_id: selectedPromo?.id || null,
        tax_amount: tax,
        service_charge_amount: sc,
        grand_total: grandTotal,
        payment_method: paymentMethod,
        order_type: orderType,
        waiter_id: selectedWaiter || null,
        cash_received: paymentMethod === 'cash' ? toNumber(cashReceived) : grandTotal,
        customer_id: selectedCustomer?.id || null,
        loyalty_points_redeem: loyaltyPointsRedeem,
        session_id: resumedBill?.session_id || null, // If it's a table session bill
        held_bill_id: resumedBill?.id || null
      };

      if (!isOnline) {
          if (settings.offline_mode_enabled !== 'true') {
              setProcessing(false);
              return toast.error('Offline Mode is disabled in settings.');
          }
          await saveOfflineDraft({
              type: 'cash_sale',
              shop_id: user.shop_id,
              user_id: user.id,
              items: payload.items,
              payment_method: payload.payment_method,
              cash_received: payload.cash_received,
              estimated_subtotal: subtotal,
              estimated_total: grandTotal,
              discount_value: payload.discount_value,
              customer_id: payload.customer_id
          });
          toast.success('Offline Draft Saved Successfully. Please sync when online.');
          setCart([]);
          setDiscount(0);
          setCashReceived(0);
          setSelectedCustomer(null);
          setProcessing(false);
          return;
      }

      if (paymentMethod === 'qr') {
          console.log('Initiating Cash Sale QR Payment Payload:', payload);
          const res = await gatewayPaymentApi.createQR(payload);
          setQrTransactionData(res.data.data);
          setShowQRModal(true);
          setProcessing(false);
          return;
      }

      let res;
      if (resumedBill) {
          // Complete the resumed held bill
          res = await heldBillApi.complete(resumedBill.id, payload);
      } else {
          // Standard cash sale
          res = await invoiceApi.createCashSale(payload);
      }

      setLastInvoice(res.data.data);
      setShowPrintModal(true);
      setCart([]);
      setDiscount(0);
      setCashReceived(0);
      setSelectedCustomer(null);
      setLoyaltyPointsRedeem(0);
      setResumedBill(null); // Clear resumed state
      toast.success(resumedBill ? `Held bill ${resumedBill.hold_no} completed!` : 'Sale completed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleHoldBill = async () => {
      if (cart.length === 0) return;
      if (settings.shift_enforcement_enabled === 'true' && !currentShift) {
          return toast.error('SHIFT ENFORCEMENT: Please open a shift before billing.');
      }
      
      // Pre-fill customer details if already selected in loyalty
      if (selectedCustomer) {
          setHoldDetails(prev => ({
              ...prev,
              customer_name: selectedCustomer.name || '',
              customer_phone: selectedCustomer.phone || ''
          }));
      }

      setShowHoldModal(true);
  };

  const confirmHoldBill = async () => {
      setProcessing(true);
      try {
          const res = await heldBillApi.hold({
              ...holdDetails,
              items: cart,
              subtotal,
              discount_value: discount
          });
          setCart([]);
          setDiscount(0);
          setShowHoldModal(false);
          setHoldDetails({ customer_name: '', customer_phone: '', note: '' });
          toast.success(res.data.message);
      } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to park bill');
      } finally {
          setProcessing(false);
      }
  };

  const handleCreditCheckout = () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    setShowAccountModal(true);
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerSelectModal(false);
    toast.success(`Customer ${customer.name} selected`);
  };

  const handleAccountConfirm = async (customer) => {
    const customerId = customer.id;
    setProcessing(true);
    try {
        const payload = {
            items: cart.map(item => ({ 
                id: item.id, 
                qty: item.qty, 
                is_combo: item.is_combo, 
                name: item.name, 
                price: item.unit_price || item.price,
                modifier_total: item.modifier_total || 0,
                special_note: item.special_note || null,
                modifiers: item.modifiers || []
            })),
            customer_id: customerId,
            discount_type: 'fixed',
            discount_value: discount,
            order_type: orderType,
            payment_method: 'credit',
            loyalty_points_redeem: loyaltyPointsRedeem
        };

        let res;
        if (resumedBill) {
            res = await heldBillApi.complete(resumedBill.uuid || resumedBill.id, payload);
        } else {
            res = await invoiceApi.createCashSaleCredit(payload);
        }
        
        if (res.data.success) {
            toast.success(`Bill added to customer account. New balance: Rs. ${res.data.data.new_customer_balance?.toLocaleString() || ''}`);
            setLastInvoice(res.data.data);
            setShowPrintModal(true);
            setCart([]);
            setDiscount(0);
            setShowAccountModal(false);
            setResumedBill(null);
        }
    } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to process credit sale');
    } finally {
        setProcessing(false);
    }
  };

  const fetchHeldBills = async () => {
      try {
          const { data } = await heldBillApi.getAll({ status: 'held' });
          setHeldBills(data.data);
          setShowHeldBillsModal(true);
      } catch (err) {
          toast.error('Failed to load parked bills');
      }
  };

  const restoreHeldBill = async (id) => {
      setProcessing(true);
      try {
          const { data } = await heldBillApi.resume(id);
          const held = data.data;
          
          // Map items back to cart format
          const restoredItems = held.items.map(i => ({
              id: i.item_id || i.combo_id,
              name: i.item_name,
              price: i.unit_price,
              qty: i.qty,
              is_combo: i.item_type === 'combo',
              portion_type: i.portion_type,
              note: i.note
          }));
          
          setCart(restoredItems);
          setDiscount(parseFloat(held.discount));
          setResumedBill(held);
          
          setShowHeldBillsModal(false);
          toast.success(`Bill ${held.hold_no} restored to cart`);
      } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to restore bill');
      } finally {
          setProcessing(false);
      }
  };

  const cancelHeldBill = async (bill) => {
      const reason = window.prompt('Reason for cancellation?');
      if (!reason) return;
      
      try {
          await heldBillApi.cancel(bill.uuid || bill.id, reason);
          toast.success('Parked bill cancelled');
          fetchHeldBills(); // Refresh list
      } catch (err) {
          toast.error('Failed to cancel bill');
      }
  };

  const filteredItems = [
    ...items.filter(i => {
      const matchesSearch = 
        i.name.toLowerCase().includes(search.toLowerCase()) || 
        (i.short_code && i.short_code.toLowerCase().includes(search.toLowerCase())) ||
        i.category.toLowerCase().includes(search.toLowerCase());
      
      const matchesMainCategory = selectedMainCategory === 'All' || 
                                 (selectedMainCategory === 'Popular' && i.is_popular) ||
                                 i.main_category === selectedMainCategory;
      
      const matchesPortion = portionFilter === 'all' || i.portion_type === portionFilter;
      
      return matchesSearch && matchesMainCategory && matchesPortion;
    }),
    ...combos.filter(i => {
      if (selectedMainCategory !== 'All' && selectedMainCategory !== 'Combos') return false;
      return i.name.toLowerCase().includes(search.toLowerCase());
    })
  ].sort((a, b) => (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0) || (a.display_order || 0) - (b.display_order || 0));

  const quickItems = items.filter(i => (i.quick_sale_enabled === 1 || i.quick_sale_enabled === true) && (i.show_in_quick_bar === 1 || i.show_in_quick_bar === true));

  // Handle Keyboard Shortcut for Search
  useEffect(() => {
    const handleKeyDown = (e) => {
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            document.getElementById('pos-search-input')?.focus();
        }
        if (e.key === 'F4') {
            e.preventDefault();
            handleHoldBill();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-add if exactly one search result and Enter pressed
  const handleSearchKeyDown = (e) => {
      if (e.key === 'Enter' && filteredItems.length === 1 && search.length > 1) {
          addToCart(filteredItems[0]);
          setSearch('');
      }
  };

  return (
    <div className="pos-layout gap-4 animate-in fade-in duration-500 relative">
      {/* 1. Category Sidebar (Rail) - Responsive */}
      <div className="w-full lg:w-24 flex lg:flex-col gap-2 shrink-0 overflow-x-auto lg:overflow-y-auto custom-scrollbar-hide pb-2 lg:pb-10 p-1">
          <button 
            onClick={() => setSelectedMainCategory('All')}
            className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-3xl transition-all group",
                selectedMainCategory === 'All' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white text-slate-400 hover:bg-white/80"
            )}
          >
              <LayoutGrid size={24} />
              <span className="text-[9px] font-black uppercase tracking-tighter">All</span>
          </button>
          
          <button 
            onClick={() => setSelectedMainCategory('Popular')}
            className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-3xl transition-all group",
                selectedMainCategory === 'Popular' ? "bg-amber-500 text-white shadow-lg shadow-amber-200" : "bg-white text-slate-400 hover:bg-white/80"
            )}
          >
              <Star size={24} />
              <span className="text-[9px] font-black uppercase tracking-tighter text-center">Popular</span>
          </button>

          <div className="h-px bg-slate-200 mx-4 my-2" />

          {mainCategories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedMainCategory(cat)}
                className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-3xl transition-all group",
                    selectedMainCategory === cat ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white text-slate-400 hover:bg-white/80"
                )}
              >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors text-slate-500">
                    <span className="text-xs font-black">{cat.charAt(0)}</span>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-tighter text-center line-clamp-2 leading-tight">{cat}</span>
              </button>
          ))}

          <button 
            onClick={() => setSelectedMainCategory('Combos')}
            className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-3xl transition-all group",
                selectedMainCategory === 'Combos' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white text-slate-400 hover:bg-white/80"
            )}
          >
              <Tag size={24} />
              <span className="text-[9px] font-black uppercase tracking-tighter">Combos</span>
          </button>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 min-h-0">
        {/* Header: Search & View Toggle */}
        <div className="flex flex-col gap-3 lg:gap-4 shrink-0 bg-white p-3 lg:p-4 rounded-[24px] lg:rounded-[32px] shadow-sm border border-slate-100">
            {resumedBill && (
                <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500 shadow-lg shadow-indigo-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <PauseCircle size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Resumed Transaction</p>
                            <h4 className="font-black text-sm tracking-tight">{resumedBill.hold_no} • {resumedBill.customer_name}</h4>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            setResumedBill(null);
                            setCart([]);
                            setDiscount(0);
                            toast.info('Resumed bill dismissed');
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            <div className="flex items-center gap-2 lg:gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input 
                        id="pos-search-input"
                        type="text" 
                        placeholder="Search item or code (e.g. CFR, CK)... [/]" 
                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex gap-1.5 lg:gap-2 items-center overflow-x-auto custom-scrollbar-hide py-1">
                    <span className="hidden sm:inline text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2 shrink-0">Portion:</span>
                    {['all', 'single', 'double', '250g'].map(p => (
                        <button 
                            key={p}
                            onClick={() => setPortionFilter(p)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[8px] lg:text-[9px] font-black uppercase tracking-widest transition-all border-2 shrink-0",
                                portionFilter === p ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                            )}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                {recentItems.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Clock size={12} className="text-slate-300" />
                        <div className="flex gap-1">
                            {recentItems.map(ri => (
                                <button 
                                    key={`recent-${ri.id}`}
                                    onClick={() => addToCart(ri)}
                                    className="px-2 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-[8px] font-black text-slate-500 hover:text-indigo-600 transition-all"
                                >
                                    {ri.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Quick Items Bar */}
        {quickItems.length > 0 && settings.show_quick_bar && (
            <div className="flex flex-col gap-2 bg-emerald-50/50 p-3 lg:p-4 border-b border-emerald-100 shrink-0">
                <div className="flex items-center gap-2">
                    <Tag size={14} className="text-emerald-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900">Quick Retail Items</span>
                </div>
                <div className="flex gap-2 overflow-x-auto custom-scrollbar-hide pb-1">
                    {quickItems.map(item => {
                        const isAvailable = item.availability_status === 'available';
                        return (
                            <button
                                key={`quick-${item.id}`}
                                onClick={() => isAvailable && addToCart(item)}
                                disabled={!isAvailable}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 bg-white rounded-xl border transition-all shrink-0 group",
                                    isAvailable ? "border-emerald-100 hover:border-emerald-600 hover:shadow-md" : "opacity-50 border-slate-100 cursor-not-allowed"
                                )}
                            >
                                <div className="flex flex-col text-left">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-slate-800 leading-tight">{item.name}</span>
                                        {item.no_receipt_default === 1 && (
                                            <span className="text-[7px] bg-slate-900 text-white px-1 py-0.5 rounded font-black uppercase tracking-tighter">No Rec.</span>
                                        )}
                                    </div>
                                    <span className="text-[9px] font-black text-emerald-600">Rs. {toNumber(item.price).toLocaleString()}</span>
                                </div>
                                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors ml-2">
                                    <Plus size={12} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Item Area */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10 mt-3">
            <div className="mb-4 px-1">
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-tight">
                    {selectedMainCategory}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {filteredItems.length} Items found
                </p>
                <div className="w-12 h-1 bg-indigo-600 rounded-full mt-2" />
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredItems.map(item => {
                  const isAvailable = !!((item.availability_status === 'available' || item.is_combo) && (!item.track_stock || item.stock_qty > 0));
                  const isSoldOut = !!((item.availability_status === 'sold_out' || (item.track_stock && item.stock_qty <= 0)) && !item.is_combo);
    
                  return (
                    <button
                      key={`${item.is_combo ? 'c' : 'i'}-${item.id}`}
                      onClick={() => isAvailable && addToCart(item)}
                      disabled={!isAvailable}
                      className={cn(
                          "p-3 rounded-2xl text-left border transition-all group flex flex-col shadow-sm relative overflow-hidden h-[120px]",
                          isAvailable
                              ? "bg-white border-slate-100 hover:border-indigo-600 hover:shadow-md active:scale-95" 
                              : "bg-slate-50 border-slate-100 opacity-60 grayscale cursor-not-allowed"
                      )}
                    >
                      {!!item.is_popular && !isSoldOut && (
                          <div className="absolute top-0 right-0 p-1">
                              <Star size={10} className="text-amber-500 fill-amber-500" />
                          </div>
                      )}
                      {isSoldOut && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
                              <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest rotate-[-5deg]">Sold Out</span>
                          </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-1 mb-1">
                            <h4 className="font-black text-slate-800 text-[11px] leading-tight line-clamp-2 uppercase">{item.name}</h4>
                            {!!item.short_code && item.short_code !== "0" && (
                                <span className="bg-slate-100 text-slate-500 px-1 py-0.5 rounded text-[7px] font-black shrink-0">{item.short_code}</span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1 items-center">
                            <span className="text-[7px] font-black text-slate-400 uppercase">{item.category}</span>
                            {item.portion_type && item.portion_type !== 'regular' && (
                                <span className="text-[7px] font-black text-indigo-500 uppercase px-1 bg-indigo-50 rounded">{item.portion_type}</span>
                            )}
                            {!!item.track_stock && (
                                <span className={cn(
                                    "text-[7px] font-black px-1 rounded uppercase",
                                    item.stock_qty <= 0 ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-600"
                                )}>
                                    Stock: {item.stock_qty}
                                </span>
                            )}
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
            ) : (
                <div className="flex flex-col gap-2">
                    {filteredItems.map(item => {
                        const isAvailable = item.availability_status === 'available' || item.is_combo;
                        return (
                            <button 
                                key={`list-${item.id}`}
                                onClick={() => isAvailable && addToCart(item)}
                                disabled={!isAvailable}
                                className={cn(
                                    "flex items-center gap-4 p-3 bg-white rounded-2xl border border-slate-100 hover:border-indigo-600 hover:shadow-sm transition-all group",
                                    !isAvailable && "opacity-50 grayscale cursor-not-allowed"
                                )}
                            >
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                                    {item.is_popular ? <Star size={16} className="text-amber-500 fill-amber-500" /> : <Tag size={16} />}
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-black text-slate-800 text-xs uppercase">{item.name}</h4>
                                        {!!item.short_code && item.short_code !== "0" && <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-1 rounded">{item.short_code}</span>}
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.category} • {item.portion_type}</p>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <p className="text-sm font-black text-indigo-600">Rs. {toNumber(item.price).toLocaleString()}</p>
                                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <Plus size={18} />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
            
            {filteredItems.length === 0 && (
                <div className="py-20 text-center opacity-40">
                    <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No items found matching your filters</p>
                </div>
            )}
        </div>
      </div>

      {/* Right: Cart Panel - Responsive Wrapper */}
      <div className={cn(
          "fixed inset-0 lg:relative z-[60] lg:z-10 lg:w-[420px] transition-all duration-300 pointer-events-none lg:pointer-events-auto",
          isCartOpen ? "pointer-events-auto" : ""
      )}>
        {/* Mobile Backdrop */}
        <div 
            className={cn(
                "absolute inset-0 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-300",
                isCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setIsCartOpen(false)}
        />
        
        <div className={cn(
            "absolute bottom-0 left-0 right-0 top-20 lg:static lg:h-full bg-white lg:rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col transition-transform duration-300 lg:translate-y-0",
            isCartOpen ? "translate-y-0" : "translate-y-full"
        )}>
            {/* Mobile Close Handle */}
            <div className="lg:hidden h-8 flex items-center justify-center shrink-0 border-b border-slate-50">
                <div className="w-12 h-1 bg-slate-200 rounded-full" onClick={() => setIsCartOpen(false)} />
            </div>
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

        {/* Order Type & Waiter */}
        <div className="p-4 border-b border-slate-50 flex gap-2 overflow-x-auto custom-scrollbar shrink-0 bg-slate-50">
           <button 
                onClick={() => setOrderType('takeaway')} 
                className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 whitespace-nowrap transition-all", orderType === 'takeaway' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200')}
            >
                <ShoppingBag size={14} /> Takeaway
            </button>
            <button 
                onClick={() => setOrderType('delivery')} 
                className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 whitespace-nowrap transition-all", orderType === 'delivery' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200')}
            >
                <Bike size={14} /> Delivery
            </button>
            <button 
                onClick={() => setOrderType('dine_in')} 
                className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 whitespace-nowrap transition-all", orderType === 'dine_in' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200')}
            >
                <UtensilsCrossed size={14} /> Dine-In
            </button>
        </div>
        <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center justify-center shrink-0">
            <button 
                onClick={() => setShowCustomerSelectModal(true)}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all shrink-0",
                    selectedCustomer ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "text-slate-400 hover:bg-slate-50"
                )}
            >
                <User size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                    {selectedCustomer ? selectedCustomer.name : "Select Customer"}
                </span>
                {selectedCustomer && (
                    <X 
                        size={12} 
                        className="ml-1 hover:text-rose-500" 
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(null);
                            setLoyaltyPointsRedeem(0);
                        }} 
                    />
                )}
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {cart.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex gap-4 group animate-in slide-in-from-right-4 duration-300">
              <div className="flex-1">
                <div className="flex justify-between items-start">
                   <p className="font-black text-slate-900 text-sm leading-tight mb-1">{item.name}</p>
                   <p className="text-xs font-black text-slate-900">Rs. {((toNumber(item.unit_price || item.price) + toNumber(item.modifier_total)) * item.qty).toLocaleString()}</p>
                </div>
                
                {/* Modifiers Summary */}
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {item.modifiers.map(m => (
                      <span key={m.modifier_id} className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded">
                        {m.type === 'add_on' ? '+' : m.type === 'remove' ? '-' : ''}{m.name}
                      </span>
                    ))}
                  </div>
                )}
                
                {item.special_note && (
                   <p className="text-[10px] font-bold text-amber-600 italic mb-1">“{item.special_note}”</p>
                )}

                <div className="flex items-center gap-3">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                     Rs. {(toNumber(item.unit_price || item.price) + toNumber(item.modifier_total)).toLocaleString()} x {item.qty}
                   </p>
                   <button 
                     onClick={() => openEditModifiers(item, index)}
                     className="text-[9px] font-black text-indigo-600 uppercase hover:underline"
                   >
                     Edit
                   </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                  <button onClick={() => updateQty(item.id, -1, item.is_combo, index)} className="p-1.5 hover:bg-slate-200 text-slate-500 transition-colors"><Minus size={12} /></button>
                  <span className="w-6 text-center text-xs font-black text-slate-900">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1, item.is_combo, index)} className="p-1.5 hover:bg-slate-200 text-slate-500 transition-colors"><Plus size={12} /></button>
                </div>
                <button onClick={() => removeItem(item.id, item.is_combo, index)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-40">
                <ShoppingCart size={48} className="mb-4 text-slate-300" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Cart is empty</p>
            </div>
          )}
        </div>

        {/* Totals & Payment Section - Compact & Organized */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-4 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] relative z-20">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-slate-600">Rs. {subtotal.toLocaleString()}</span>
            </div>
            
            {(promotions.length > 0 || selectedPromo) && (
                <div className="bg-indigo-600 rounded-xl p-1.5 mb-1.5 shadow-lg shadow-indigo-100">
                    <select 
                        className="w-full bg-indigo-700 border-none rounded-lg px-2 py-1 text-[9px] font-black text-white outline-none cursor-pointer"
                        value={selectedPromo?.id || ''}
                        onChange={(e) => {
                            const promo = promotions.find(p => p.id === parseInt(e.target.value));
                            setSelectedPromo(promo || null);
                        }}
                    >
                        <option value="">Apply Promotion...</option>
                        {promotions.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.type === 'percentage_discount' ? `${p.value}%` : `Rs. ${p.value}`})</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <span>Tax & S.Charge</span>
                <span className="text-slate-600">Rs. {(tax + sc).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            {(toNumber(discount) > 0 || promoDiscount > 0 || loyaltyDiscountAmount > 0) && (
                <div className="flex flex-col gap-1 bg-rose-50/50 p-1.5 rounded-lg border border-rose-100">
                    {(toNumber(discount) > 0 || promoDiscount > 0) && (
                        <div className="flex justify-between text-[9px] font-black text-rose-500 uppercase tracking-widest">
                            <span>Discounts & Promos</span>
                            <span>- Rs. {(toNumber(discount) + promoDiscount).toLocaleString()}</span>
                        </div>
                    )}
                    {loyaltyDiscountAmount > 0 && (
                        <div className="flex justify-between text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                            <span>Loyalty Redemption</span>
                            <span>- Rs. {loyaltyDiscountAmount.toLocaleString()}</span>
                        </div>
                    )}
                </div>
            )}

            {selectedCustomer && (
                <div className="p-2.5 bg-indigo-600 rounded-2xl text-white space-y-2 shadow-lg shadow-indigo-100 animate-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Loyalty Points</span>
                        </div>
                        <span className="text-sm font-black">{parseFloat(selectedCustomer.loyalty_points || 0).toFixed(0)} Pts</span>
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="number" 
                            placeholder="Points to redeem..."
                            className="flex-1 bg-white/20 border-none rounded-xl px-3 py-1.5 text-xs font-black placeholder:text-white/40 outline-none focus:bg-white/30"
                            value={loyaltyPointsRedeem || ''}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                if (val > parseFloat(selectedCustomer.loyalty_points)) return;
                                setLoyaltyPointsRedeem(val);
                            }}
                        />
                        <button 
                            onClick={() => setLoyaltyPointsRedeem(parseFloat(selectedCustomer.loyalty_points))}
                            className="px-3 py-1.5 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                            Max
                        </button>
                    </div>
                    {loyaltyDiscountAmount > 0 && (
                        <p className="text-[9px] font-bold text-center text-white/80 uppercase">
                            Discount: Rs. {loyaltyDiscountAmount.toLocaleString()}
                        </p>
                    )}
                </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Payable Amount</span>
                <span className="text-2xl font-black text-indigo-600 tracking-tighter">Rs. {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
                onClick={() => setPaymentMethod('cash')}
                className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-black text-[9px] uppercase tracking-widest",
                    paymentMethod === 'cash' ? "bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-100" : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                )}
            >
                <Banknote size={14} /> Cash
            </button>
            <button 
                onClick={() => isOnline && setPaymentMethod('card')}
                disabled={!isOnline}
                className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-black text-[9px] uppercase tracking-widest",
                    !isOnline ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400" : paymentMethod === 'card' ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100" : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                )}
            >
                <CreditCard size={14} /> Card
            </button>
            <button 
                onClick={() => {
                    if (cart.length === 0) return toast.error('Cart is empty');
                    if (isOnline) {
                        setPaymentMethod('qr');
                        handleCheckout();
                    }
                }}
                disabled={cart.length === 0 || processing || !isOnline}
                className={cn(
                    "col-span-2 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest",
                    cart.length === 0 || processing || !isOnline
                        ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400"
                        : "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98]"
                )}
            >
                {processing && paymentMethod === 'qr' 
                    ? <><span className="animate-spin inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full mr-1"></span> Processing...</>
                    : <><Zap size={14} /> QR Pay — Tap to Start</>
                }
            </button>
          </div>

          {paymentMethod === 'cash' && (
                <div className="bg-white border-2 border-emerald-100 rounded-2xl p-3 space-y-2.5 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-300 text-[10px]">Rs.</span>
                            <input 
                                type="number" 
                                className="w-full bg-slate-50 border-none rounded-xl py-2 pl-9 pr-3 text-lg font-black text-slate-900 outline-none placeholder:text-slate-200"
                                value={cashReceived || ''}
                                onChange={(e) => setCashReceived(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Change</p>
                            <p className={cn(
                                "text-sm font-black tracking-tighter leading-none",
                                toNumber(cashReceived) >= grandTotal ? "text-emerald-600" : "text-rose-500"
                            )}>
                                Rs. {Math.max(0, toNumber(cashReceived) - grandTotal).toFixed(0)}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1 overflow-x-auto custom-scrollbar-hide pb-0.5">
                        {['Exact', '+100', '+500', '+1000', 'CLR'].map(btn => (
                            <button 
                                key={btn}
                                onClick={() => {
                                    if (btn === 'Exact') setCashReceived(grandTotal);
                                    else if (btn === 'CLR') setCashReceived(0);
                                    else setCashReceived(prev => toNumber(prev) + parseInt(btn.replace('+', '')));
                                }}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[8px] font-black uppercase transition-colors shrink-0"
                            >
                                {btn}
                            </button>
                        ))}
                    </div>
                </div>
            )}

          <div className="flex gap-2 pt-1">
            <button 
                className={cn(
                    "px-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2",
                    cart.length === 0 || processing || !isOnline ? "bg-slate-100 text-slate-300 cursor-not-allowed" : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                )}
                disabled={cart.length === 0 || processing || !isOnline}
                onClick={handleHoldBill}
                title="Park Bill (F4)"
            >
                <PauseCircle size={14} />
                <span className="hidden sm:inline">Park</span>
            </button>
            <AppButton 
                variant="secondary"
                className={cn(
                    "px-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all",
                    cart.length === 0 || processing || !isOnline ? "bg-slate-100 text-slate-300 cursor-not-allowed" : "bg-white text-purple-600 border-purple-100 hover:bg-purple-50"
                )}
                disabled={cart.length === 0 || processing || !isOnline}
                onClick={() => setShowAccountModal(true)}
            >
                {resumedBill ? 'SETTLE HELD AS NAYA' : 'ADD TO ACCOUNT'}
            </AppButton>
            <AppButton 
                variant="success" 
                className={cn(
                    "flex-1 py-4 uppercase tracking-widest text-[10px] font-black transition-all", 
                    (cart.length === 0 || (paymentMethod === 'cash' && toNumber(cashReceived) < grandTotal)) 
                        ? "opacity-50 grayscale bg-slate-200" 
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 active:scale-[0.98]"
                )} 
                onClick={handleCheckout}
                loading={processing}
                disabled={cart.length === 0 || (paymentMethod === 'cash' && toNumber(cashReceived) < grandTotal)}
            >
                {!isOnline ? 'SAVE OFFLINE DRAFT' : resumedBill ? 'FINALIZE HELD BILL' : 'COMPLETE & PRINT'}
            </AppButton>

            {!resumedBill && paymentMethod === 'cash' && settings.quick_sale_enabled && (
                <button 
                    className={cn(
                        "flex-[0.5] py-4 rounded-xl uppercase tracking-widest text-[10px] font-black transition-all flex flex-col items-center justify-center", 
                        cart.length === 0
                            ? "opacity-50 grayscale bg-slate-100 text-slate-400 cursor-not-allowed" 
                            : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-100 active:scale-[0.98]"
                    )} 
                    onClick={() => cart.length > 0 && setShowQuickCashModal(true)}
                    disabled={cart.length === 0}
                >
                    <span className="text-[12px] leading-tight">QUICK CASH</span>
                    <span className="text-[8px] opacity-80 mt-0.5">(No Receipt)</span>
                </button>
            )}
          </div>
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
                <div className="py-20 text-center flex flex-col items-center justify-center space-y-6">
                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center border-2 border-slate-100/50 shadow-inner group transition-all">
                        <History size={40} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Parked Bills</h4>
                        <p className="text-slate-400 text-xs font-medium max-w-[200px] mx-auto italic">Your temporary waiting list is currently empty.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {heldBills.map(bill => (
                        <div key={bill.id} className="p-6 bg-slate-50 border-2 border-slate-100 rounded-[32px] hover:border-indigo-600 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-black text-slate-900 text-sm leading-tight uppercase tracking-tight truncate max-w-[150px]">{bill.customer_name || bill.reference_name}</h4>
                                    <p className="text-[10px] font-black text-indigo-600 tracking-widest uppercase">{bill.hold_no}</p>
                                    {bill.item_summary && (
                                        <p className="text-[9px] font-bold text-slate-500 mt-2 line-clamp-2 bg-white/50 p-2 rounded-xl border border-slate-100 italic">
                                            {bill.item_summary}
                                        </p>
                                    )}
                                    <p className="text-[9px] font-bold text-slate-400 mt-1">
                                        {new Date(bill.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                                    <p className="font-black text-slate-900">Rs. {parseFloat(bill.grand_total).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <AppButton 
                                    variant="primary" 
                                    size="sm" 
                                    className="flex-1 uppercase tracking-widest text-[10px] py-3 rounded-2xl"
                                    onClick={() => restoreHeldBill(bill.id)}
                                >
                                    Resume Bill
                                </AppButton>
                                <AppButton 
                                    variant="secondary" 
                                    size="sm" 
                                    className="px-4 aspect-square flex items-center justify-center rounded-2xl text-rose-500 hover:text-rose-600"
                                    onClick={() => {
                                        setSelectedBill(bill);
                                        setShowHeldBillsModal(false);
                                        setShowCancelModal(true);
                                    }}
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
          onClose={() => {
              setShowPrintModal(false);
              setLastInvoice(null);
          }}
          invoice={lastInvoice ? (lastInvoice.settings ? lastInvoice : { ...lastInvoice, settings }) : null} 
          onRestore={handleRestoreCart}
        />

        <PaymentQRModal 
            isOpen={showQRModal}
            onClose={() => setShowQRModal(false)}
            transactionData={qrTransactionData}
            onSuccess={async (data) => {
                setShowQRModal(false);
                // Fetch full invoice details (with items) after QR payment
                try {
                    const { invoiceApi: invApi } = await import('../api/api');
                    const invRes = await invApi.getDetails(qrTransactionData.invoice_id);
                    const fullInv = invRes.data.data || invRes.data;
                    setLastInvoice(fullInv.settings ? fullInv : { ...fullInv, settings });
                } catch (e) {
                    setLastInvoice({ id: qrTransactionData.invoice_id, invoice_no: qrTransactionData.invoice_no, settings });
                }
                setShowPrintModal(true);
                setCart([]);
                setDiscount(0);
                setCashReceived(0);
                setResumedBill(null);
                toast.success('QR Payment Successful!');
            }}
            onCancel={() => {
                setProcessing(false);
            }}
        />

        <AddToCustomerAccountModal 
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onConfirm={handleAccountConfirm}
        grandTotal={grandTotal}
        billAmount={grandTotal}
      />

      <AddToCustomerAccountModal 
        isOpen={showCustomerSelectModal}
        onClose={() => setShowCustomerSelectModal(false)}
        onConfirm={handleCustomerSelect}
        billAmount={grandTotal}
        title="Select Customer"
        description="Select a customer for loyalty points or history"
        confirmText="Select Customer"
      />

      <ItemModifierModal 
        isOpen={showModifierModal}
        onClose={() => setShowModifierModal(false)}
        item={modifierTarget}
        onConfirm={confirmModifiers}
        initialData={editingItem !== null ? cart[editingItem] : null}
      />

        <AppModal
            isOpen={showHoldModal}
            onClose={() => setShowHoldModal(false)}
            title="Park Current Bill"
            size="md"
        >
            <div className="space-y-6 py-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-center">
                    <PauseCircle className="text-amber-600" size={24} />
                    <p className="text-xs font-bold text-amber-900 leading-snug">This will save the current cart items. You can resume this bill anytime later from the History menu.</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Name (Optional)</label>
                        <FormInput 
                            placeholder="e.g. John Doe" 
                            value={holdDetails.customer_name}
                            onChange={(e) => setHoldDetails(prev => ({ ...prev, customer_name: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number (Optional)</label>
                        <FormInput 
                            placeholder="e.g. 0771234567" 
                            value={holdDetails.customer_phone}
                            onChange={(e) => setHoldDetails(prev => ({ ...prev, customer_phone: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Note / Description</label>
                        <textarea 
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 h-24 resize-none transition-all"
                            placeholder="e.g. Will return in 10 minutes..."
                            value={holdDetails.note}
                            onChange={(e) => setHoldDetails(prev => ({ ...prev, note: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cart Items</span>
                        <span className="text-xs font-black text-slate-900">{cart.length} Items</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Value</span>
                        <span className="text-lg font-black text-indigo-600">Rs. {grandTotal.toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <AppButton variant="secondary" className="flex-1" onClick={() => setShowHoldModal(false)}>Cancel</AppButton>
                    <AppButton variant="primary" className="flex-[2]" onClick={confirmHoldBill} loading={processing}>Confirm Hold</AppButton>
                </div>
            </div>
        </AppModal>

      <QuickCashModal 
        isOpen={showQuickCashModal}
        onClose={() => setShowQuickCashModal(false)}
        amount={grandTotal}
        onConfirm={async (receivedAmount) => {
            if (settings.shift_enforcement_enabled === 'true' && !currentShift) {
                return toast.error('SHIFT ENFORCEMENT: Please open a shift before billing.');
            }
            setProcessing(true);
            try {
                const payload = {
                    items: cart.map(i => ({ 
                        id: i.id, 
                        item_id: i.id, 
                        qty: i.qty, 
                        is_combo: i.is_combo || false, 
                        name: i.name, 
                        price: i.unit_price || i.price,
                        modifier_total: i.modifier_total || 0,
                        special_note: i.special_note || null,
                        modifiers: i.modifiers || [],
                        age_confirmed: cart.some(item => item.requires_age_confirmation) ? true : false
                    })),
                    subtotal,
                    discount_value: toNumber(discount),
                    discount_type: 'fixed',
                    promotion_id: selectedPromo?.id || null,
                    tax_amount: tax,
                    service_charge_amount: sc,
                    grand_total: grandTotal,
                    payment_method: 'cash',
                    order_type: orderType,
                    waiter_id: selectedWaiter || null,
                    cash_received: receivedAmount
                };

                await invoiceApi.createQuickSale(payload);
                
                toast.success('Quick Sale Completed!');
                setCart([]);
                setDiscount(0);
                setCashReceived(0);
                setShowQuickCashModal(false);
            } catch (err) {
                toast.error(err.response?.data?.message || 'Quick Sale failed');
            } finally {
                setProcessing(false);
            }
        }}
        processing={processing}
      />

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-6 lg:hidden z-50 flex flex-col gap-3">
          {cart.length > 0 && !isCartOpen && (
              <div className="bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-black absolute -top-2 -right-2 shadow-lg animate-bounce">
                  {cart.length}
              </div>
          )}
          <button 
            onClick={() => setIsCartOpen(!isCartOpen)}
            className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95",
                isCartOpen ? "bg-slate-800 text-white" : "bg-indigo-600 text-white"
            )}
          >
            {isCartOpen ? <X size={28} /> : <ShoppingCart size={28} />}
          </button>
      </div>

      <PaymentQRModal 
            isOpen={showQRModal}
            onClose={() => setShowQRModal(false)}
            transactionData={qrTransactionData}
            onSuccess={(data) => {
                setShowQRModal(false);
                setCart([]);
                setCustomerSearch('');
                setSelectedCustomer(null);
                setCashReceived('');
                setChangeAmount(0);
                setDiscountValue(0);
                setLastInvoice(data);
                setShowPrintModal(true);
                toast.success('QR Payment successful');
            }}
      />
    </div>
  );
};

export default CashSalePage;
