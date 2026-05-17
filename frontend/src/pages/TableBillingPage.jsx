import React, { useState, useEffect } from 'react';
import { tableApi, itemApi, invoiceApi, customerApi, sessionApi, kotApi, settingApi, shiftApi, userApi, comboApi, promotionApi } from '../api/api';
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
  MoreVertical,
  UserCircle,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  MoveHorizontal,
  GitMerge,
  LayoutGrid,
  List,
  Star,
  Clock,
  ArrowRight,
  Zap,
  CircleDollarSign,
  History,
  X
} from 'lucide-react';
import { AppButton, AppCard, AppModal, StatCard, useToast, FormInput, FormSelect } from '../components/ui';
import InvoicePrintModal from '../components/invoice/InvoicePrintModal';
import KOTPrintModal from '../components/invoice/KOTPrintModal';
import AddToCustomerAccountModal from '../components/naya/AddToCustomerAccountModal';
import ItemModifierModal from '../components/pos/ItemModifierModal';
import PaymentQRModal from '../components/PaymentQRModal';
import QuickCashModal from '../components/pos/QuickCashModal';
import { gatewayPaymentApi } from '../api/api';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';

const TableBillingPage = () => {
  const { user } = useAuth();
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
  
  // New Usability State
  const [mainCategories, setMainCategories] = useState([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState('All');
  const [portionFilter, setPortionFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [recentItems, setRecentItems] = useState([]);
  
  // Session Open State
  const [waiters, setWaiters] = useState([]);
  const [combos, setCombos] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [openOrderType, setOpenOrderType] = useState('dine_in');
  const [openWaiterId, setOpenWaiterId] = useState('');
  
  // Modals
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showKOTModal, setShowKOTModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [showKOTHistoryModal, setShowKOTHistoryModal] = useState(false);
  const [sessionKOTs, setSessionKOTs] = useState([]);
  const [voidingItem, setVoidingItem] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  
  // Table Action State (Transfer/Merge)
  const [showTableActionModal, setShowTableActionModal] = useState(false);
  const [tableActionType, setTableActionType] = useState('transfer'); // 'transfer' or 'merge'
  const [targetTableId, setTargetTableId] = useState('');
  
  // Split Bill State
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [selectedSplitItems, setSelectedSplitItems] = useState([]); // Array of order_item IDs
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitType, setSplitType] = useState('by_items'); // 'by_items', 'equal', 'custom'
  const [splitPeople, setSplitPeople] = useState(2);

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
  const [splitCustomAmount, setSplitCustomAmount] = useState(0);

  // Mobile state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [modifierTarget, setModifierTarget] = useState(null);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrTransactionData, setQrTransactionData] = useState(null);
  const [loyaltyPointsRedeem, setLoyaltyPointsRedeem] = useState(0);
  const [showQuickCashModal, setShowQuickCashModal] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableNo, setNewTableNo] = useState('');

  const toNumber = (val) => parseFloat(val) || 0;

  const fetchWaiters = async () => {
      try {
          const { data } = await userApi.getWaiters();
          setWaiters(data.data);
      } catch (err) {}
  };

  const fetchData = async () => {
    try {
      const [tRes, iRes, cRes] = await Promise.all([
        tableApi.getAll(), 
        itemApi.getAll(),
        comboApi.getAll()
      ]);
      setTables(tRes.data.data);
      const activeItems = iRes.data.data.filter(i => 
        i.status === 'active' && 
        (i.is_restaurant_item === 1 || i.is_restaurant_item === true)
      );
      setItems(activeItems);
      setCombos(cRes.data.data.map(c => ({ ...c, is_combo: true, category: 'Combos' })));
      
      const mainCats = [...new Set(activeItems.map(i => i.main_category).filter(Boolean))];
      setMainCategories(mainCats);

      // Handle Resumption from Parked Bills Page
      const resumeTableId = localStorage.getItem('resume_table_id');
      if (resumeTableId && tRes.data?.data?.length > 0) {
          const targetTable = tRes.data.data.find(t => t.id === parseInt(resumeTableId));
          if (targetTable) {
              handleSelectTable(targetTable);
              localStorage.removeItem('resume_table_id');
          }
      }
    } catch (err) {
      console.error('FetchData Error:', err);
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

  const fetchApplicablePromotions = async () => {
    const orderSubtotal = splitType === 'by_items' && showSplitModal 
        ? sessionItems.filter(i => selectedSplitItems.includes(i.id)).reduce((acc, i) => acc + parseFloat(i.total), 0)
        : sessionItems.reduce((acc, i) => acc + parseFloat(i.total), 0);
        
    try {
        const { data } = await promotionApi.getApplicable({ 
            order_type: selectedTable?.order_type || 'dine_in', 
            subtotal: orderSubtotal 
        });
        setPromotions(data.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchData();
    fetchSettings();
    fetchShiftStatus();
    fetchWaiters();
  }, []);

  const handleCreateNewTable = async (e) => {
      e.preventDefault();
      if (!newTableNo) return;
      try {
          setProcessing(true);
          await tableApi.create({ table_no: newTableNo });
          toast.success('New table added successfully');
          setNewTableNo('');
          setShowAddTableModal(false);
          fetchData(); // Refresh table list
      } catch (err) {
          toast.error('Failed to add table');
      } finally {
          setProcessing(false);
      }
  };

  useEffect(() => {
    if (showCheckoutModal || showSplitModal) {
        fetchApplicablePromotions();
    }
  }, [showCheckoutModal, showSplitModal]);

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
    setLoyaltyPointsRedeem(0);
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
            const sDetails = await sessionApi.getDetails(data.data.uuid || data.data.id);
            setSessionItems(sDetails.data.data.items || []);
        }
    } catch (err) {
        toast.error('Failed to load table session');
    }
  };

  const fetchSessionKOTs = async () => {
    if (!activeSession) return;
    try {
        const { data } = await kotApi.getBySession(activeSession.uuid || activeSession.id);
        setSessionKOTs(data.data);
    } catch (err) {}
  };

  const openNewSession = async () => {
      try {
          const { data } = await sessionApi.open({ 
              table_id: selectedTable.id,
              order_type: openOrderType,
              waiter_id: openWaiterId || null
          });
          setActiveSession(data.data);
          toast.success('Table session opened');
          fetchData(); 
      } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to open session');
      }
  };

  const handleCancelSession = async () => {
    if (!activeSession) return;
    if (sessionItems.length > 0 || cart.length > 0) {
        if (!window.confirm('This session has items. Are you sure you want to cancel and free this table?')) return;
    } else {
        if (!window.confirm('Free this table?')) return;
    }

    try {
        setProcessing(true);
        const { data } = await sessionApi.cancel(activeSession.uuid || activeSession.id);
        if (data.success) {
            toast.success('Table freed');
            setActiveSession(null);
            setSessionItems([]);
            setCart([]);
            fetchData();
        }
    } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to cancel session');
    } finally {
        setProcessing(false);
    }
  };

  const handleQuickCash = () => {
    if (!activeSession || currentTotals.subtotal === 0) return;
    setShowQuickCashModal(true);
  };

  const handleConfirmQuickCash = async (receivedAmount) => {
    try {
        setProcessing(true);
        if (cart.length > 0) {
            const formattedCart = cart.map(i => ({
                id: i.id,
                item_id: i.id,
                qty: i.qty,
                is_combo: i.is_combo || false,
                special_note: i.special_note || null,
                modifiers: i.modifiers || []
            }));
            await sessionApi.addItems(activeSession.uuid || activeSession.id, formattedCart);
            // Optionally trigger KOT to clear the unsent items state
            try { await kotApi.createFromSession(activeSession.id); } catch (e) { console.log("KOT auto-trigger skipped"); }
        }

        const payload = {
            payment_method: 'cash',
            cash_received: receivedAmount,
            discount_type: 'fixed',
            discount_value: 0
        };
        const { data } = await sessionApi.payNow(activeSession.uuid || activeSession.id, payload);
        if (data.success) {
            toast.success('Payment completed successfully!');
            setShowQuickCashModal(false);
            setActiveSession(null);
            setSessionItems([]);
            setCart([]);
            fetchData();
        }
    } catch (err) {
        toast.error(err.response?.data?.message || 'Quick checkout failed');
    } finally {
        setProcessing(false);
    }
  };

  const addToCart = (item) => {
    if (!selectedTable) return toast.info('Please select a table first');
    if (!activeSession) return toast.info('Please open the table session first');
    
    setModifierTarget(item);
    setEditingItemIndex(null);
    setShowModifierModal(true);
  };

  const confirmModifiers = (modifiedItem) => {
    // Normalize fields for consistency with sessionItems and billing UI
    const normalizedItem = {
        ...modifiedItem,
        item_id: modifiedItem.item_id || modifiedItem.id,
        item_name: modifiedItem.item_name || modifiedItem.name,
        unit_price: modifiedItem.unit_price || modifiedItem.price
    };

    setCart(prev => {
        if (editingItemIndex !== null) {
            return prev.map((item, idx) => idx === editingItemIndex ? normalizedItem : item);
        }
        return [...prev, normalizedItem];
    });

    setRecentItems(prev => {
        const filtered = prev.filter(i => i.id !== normalizedItem.id);
        return [{...normalizedItem}, ...filtered].slice(0, 5);
    });
    
    toast.success(`${modifiedItem.name} added`, { duration: 1000, position: 'bottom-center' });
    setModifierTarget(null);
    setEditingItemIndex(null);
  };

  const openEditModifiers = (item, index) => {
      setModifierTarget(item);
      setEditingItemIndex(index);
      setShowModifierModal(true);
  };

  const updateCartQty = (index, delta) => {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const sendToKitchen = async () => {
      if (cart.length === 0 && !sessionItems.some(i => !i.kot_sent && i.status !== 'voided')) return;
      setProcessing(true);
      try {
          // 1. Add items to session if cart is not empty
          if (cart.length > 0) {
              const formattedCart = cart.map(i => ({
                  item_id: i.item_id || i.id,
                  qty: i.qty,
                  is_combo: i.is_combo || false,
                  special_note: i.special_note || null,
                  modifiers: i.modifiers || []
              }));
              await sessionApi.addItems(activeSession.uuid || activeSession.id, formattedCart);
          }

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

  const handlePark = async () => {
    try {
        if (cart.length > 0) {
            setProcessing(true);
            const formattedCart = cart.map(i => ({
                item_id: i.item_id || i.id,
                qty: i.qty,
                is_combo: i.is_combo || false,
                special_note: i.special_note || null,
                modifiers: i.modifiers || []
            }));
            await sessionApi.addItems(activeSession.uuid || activeSession.id, formattedCart);
            setCart([]);
            toast.success('Items parked/saved to table');
        }
        setShowCheckoutModal(false);
        fetchData();
        refreshSession(selectedTable.id);
    } catch (err) {
        toast.error('Failed to park items');
    } finally {
        setProcessing(false);
    }
  };

  const handleVoidItem = async () => {
    if (!voidReason) return toast.info('Reason for void is required');
    setProcessing(true);
    try {
        await sessionApi.voidItem(activeSession.uuid || activeSession.id, { 
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

  const handleTableAction = async () => {
      if (!targetTableId) return toast.info('Please select a target table');
      setProcessing(true);
      try {
          if (tableActionType === 'transfer') {
              await sessionApi.transferTable(activeSession.uuid || activeSession.id, { target_table_id: targetTableId });
              toast.success('Table transferred successfully');
          } else {
              await sessionApi.mergeTable(activeSession.uuid || activeSession.id, { target_table_id: targetTableId });
              toast.success('Tables merged successfully');
          }
          setShowTableActionModal(false);
          setTargetTableId('');
          resetSale();
          fetchData();
      } catch (err) {
          toast.error(err.response?.data?.message || 'Operation failed');
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
    if (settings.shift_enforcement_enabled === 'true' && !currentShift) {
        return toast.error('SHIFT ENFORCEMENT: Please open a shift before billing.');
    }
    const totalPaid = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
    if (totalPaid < currentTotals.grandTotal) {
        return toast.info(`Total payments (Rs. ${totalPaid.toLocaleString()}) must cover the grand total (Rs. ${currentTotals.grandTotal.toLocaleString()})`);
    }

    setProcessing(true);
    try {
        // Save cart items if not empty
        if (cart.length > 0) {
            const formattedCart = cart.map(i => ({
                id: i.id,
                item_id: i.id,
                qty: i.qty,
                is_combo: i.is_combo || false,
                special_note: i.special_note || null,
                modifiers: i.modifiers || []
            }));
            await sessionApi.addItems(activeSession.uuid || activeSession.id, formattedCart);
            // Optionally trigger KOT
            try { await kotApi.createFromSession(activeSession.id); } catch (e) { console.log("KOT auto-trigger skipped"); }
        }

        const payload = {
            discount_type: discountType,
            discount_value: discountValue,
            promotion_id: selectedPromo?.id || null,
            service_charge_enabled: scEnabled,
            tax_enabled: taxEnabled,
            payments: payments,
            customer_id: selectedCustomer?.id || null,
            loyalty_points_redeem: loyaltyPointsRedeem || 0
        };
        const res = await sessionApi.payNow(activeSession.uuid || activeSession.id, payload);
        setLastInvoice(res.data.data);
        resetSale();
        fetchData();
        setShowCheckoutModal(false);
        setShowPrintModal(true);
        toast.success('Payment completed successfully');
    } catch (err) {
        toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
        setProcessing(false);
    }
  };

  const handleCheckoutCredit = () => {
    if (settings.shift_enforcement_enabled === 'true' && !currentShift) {
        return toast.error('SHIFT ENFORCEMENT: Please open a shift before billing.');
    }
    setShowAccountModal(true);
  };

  const handleAccountConfirm = async (customerId) => {
    setProcessing(true);
    try {
        // Save cart items if not empty
        if (cart.length > 0) {
            const formattedCart = cart.map(i => ({
                id: i.item_id || i.id,
                item_id: i.item_id || i.id,
                qty: i.qty,
                is_combo: i.is_combo || false,
                special_note: i.special_note || null,
                modifiers: i.modifiers || []
            }));
            await sessionApi.addItems(activeSession.uuid || activeSession.id, formattedCart);
        }

        const payload = {
            customer_id: customerId,
            discount_type: discountType,
            discount_value: discountValue,
            promotion_id: selectedPromo?.id || null,
            service_charge_enabled: scEnabled,
            tax_enabled: taxEnabled,
            loyalty_points_redeem: loyaltyPointsRedeem || 0
        };
        const res = await sessionApi.addToCredit(activeSession.uuid || activeSession.id, payload);
        setLastInvoice(res.data.data);
        resetSale();
        fetchData();
        setShowAccountModal(false);
        setShowCheckoutModal(false);
        setShowPrintModal(true);
        toast.success('Credit sale recorded in customer account');
    } catch (err) {
        toast.error(err.response?.data?.message || 'Credit checkout failed');
    } finally {
        setProcessing(false);
    }
  };

  const handleQRCheckout = async () => {
    if (settings.shift_enforcement_enabled === 'true' && !currentShift) {
        return toast.error('SHIFT ENFORCEMENT: Please open a shift before billing.');
    }
    
    setProcessing(true);
    try {
        // Save cart items if not empty
        if (cart.length > 0) {
            const formattedCart = cart.map(i => ({
                id: i.item_id || i.id,
                item_id: i.item_id || i.id,
                qty: i.qty,
                is_combo: i.is_combo || false,
                special_note: i.special_note || null,
                modifiers: i.modifiers || []
            }));
            await sessionApi.addItems(activeSession.uuid || activeSession.id, formattedCart);
            // Optionally trigger KOT
            try { await kotApi.createFromSession(activeSession.id); } catch (e) { console.log("KOT auto-trigger skipped"); }
        }

        const payload = {
            session_id: activeSession.id || activeSession.uuid,
            items: [...sessionItems.filter(i => i.status !== 'voided' && !i.billed), ...cart].map(i => {
                const itemId = i.item_id || i.id || i.item?.id;
                return { 
                    id: itemId, 
                    qty: i.qty,
                    price: i.unit_price || i.price || i.item?.price,
                    modifier_total: i.modifier_total || 0,
                    is_combo: i.is_combo || false,
                    modifiers: i.modifiers || []
                };
            }),
            discount_type: discountType,
            discount_value: discountValue,
            promotion_id: selectedPromo?.id || null,
            order_type: selectedTable?.order_type || 'dine_in',
            customer_id: selectedCustomer?.id || null,
            loyalty_points_redeem: loyaltyPointsRedeem || 0,
            source: 'table_billing'
        };

        // Validation: Ensure all items have a valid ID
        const invalidItems = payload.items.filter(item => !item.id);
        if (invalidItems.length > 0) {
            console.error('Invalid items detected in QR payload:', invalidItems);
            return toast.error('One or more items are invalid. Please refresh the table session.');
        }

        console.log('Final QR Payload:', payload);

        const res = await gatewayPaymentApi.createQR(payload);
        setQrTransactionData(res.data.data);
        setShowQRModal(true);
        // We don't close the checkout modal yet, or maybe we should?
        // Let's close it so the QR modal is the main focus.
        setShowCheckoutModal(false);
    } catch (err) {
        toast.error(err.response?.data?.message || 'QR creation failed');
    } finally {
        setProcessing(false);
    }
  };

  const calculateTotals = (itemsToBill) => {
    const subtotal = itemsToBill.filter(i => i.status !== 'voided').reduce((sum, i) => {
        const base = parseFloat(i.unit_price || i.price || 0);
        const mods = parseFloat(i.modifier_total || 0);
        return sum + ((base + mods) * i.qty);
    }, 0);
    
    let discountAmount = 0;
    if (discountType === 'percentage') {
        discountAmount = (subtotal * (parseFloat(discountValue) || 0)) / 100;
    } else {
        discountAmount = parseFloat(discountValue) || 0;
    }

    const discountedSubtotal = subtotal - discountAmount;
    
    let promoDiscount = 0;
    if (selectedPromo) {
        if (selectedPromo.type === 'percentage_discount') promoDiscount = (discountedSubtotal * selectedPromo.value) / 100;
        else promoDiscount = parseFloat(selectedPromo.value);
    }

    const finalSubtotal = Math.max(0, discountedSubtotal - promoDiscount);

    // Loyalty Discount
    const loyaltyRedeemPoints = parseFloat(settings.loyalty_redeem_points || 100);
    const loyaltyRedeemAmount = parseFloat(settings.loyalty_redeem_amount || 100);
    const loyaltyDiscountAmount = (parseFloat(loyaltyPointsRedeem) / loyaltyRedeemPoints) * loyaltyRedeemAmount;
    
    const taxableSubtotal = Math.max(0, finalSubtotal - loyaltyDiscountAmount);
    
    const tax = taxEnabled ? (taxableSubtotal * parseFloat(settings.tax_percentage || 0)) / 100 : 0;
    const sc = scEnabled ? (taxableSubtotal * parseFloat(settings.service_charge_percentage || 10)) / 100 : 0;
    const grandTotal = taxableSubtotal + tax + sc;

    return { subtotal, discountAmount, promoDiscount, loyaltyDiscountAmount, tax, sc, grandTotal };
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
    if (settings.shift_enforcement_enabled === 'true' && !currentShift) {
        return toast.error('SHIFT ENFORCEMENT: Please open a shift before billing.');
    }
    setProcessing(true);
    try {
        if (cart.length > 0) {
            const formattedCart = cart.map(i => ({
                id: i.id,
                item_id: i.id,
                qty: i.qty,
                is_combo: i.is_combo || false,
                special_note: i.special_note || null,
                modifiers: i.modifiers || []
            }));
            await sessionApi.addItems(activeSession.uuid || activeSession.id, formattedCart);
            try { await kotApi.createFromSession(activeSession.id); } catch (e) { console.log("KOT auto-trigger skipped"); }
        }

        const payload = {
            split_type: splitType,
            payment_method: payments[0].payment_method || 'cash', // For equal/custom, we use primary payment method
            promotion_id: selectedPromo?.id || null
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

        const res = await sessionApi.splitBill(activeSession.uuid || activeSession.id, payload);
        
        toast.success('Split payment recorded');
        setShowSplitModal(false);
        setIsSplitMode(false);
        setSelectedSplitItems([]);
        
        // If session closed, reset. Otherwise refresh.
        // If session closed or split processed, we show the invoice
        if (res.data.data.shouldClose || res.data.data.invoice) {
            if (res.data.data.shouldClose) toast.info('Session fully closed');
            setLastInvoice(res.data.data.invoice);
            setShowPrintModal(true);
            if (res.data.data.shouldClose) {
                resetSale();
                fetchData();
            } else {
                refreshSession(selectedTable.id);
            }
        } else {
            refreshSession(selectedTable.id);
        }
    } catch (err) {
        toast.error(err.response?.data?.message || 'Split failed');
    } finally {
        setProcessing(false);
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

  // Handle Keyboard Shortcut for Search
  useEffect(() => {
    const handleKeyDown = (e) => {
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            document.getElementById('pos-search-input')?.focus();
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
                {user?.role === 'admin' && (
                    <button 
                        onClick={() => setShowAddTableModal(true)}
                        className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 active:scale-95 ml-2"
                        title="Add Table"
                    >
                        <Plus size={18} strokeWidth={3} />
                    </button>
                )}
            </div>
            <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Available</span>
                </div>
                <div className="w-px h-4 bg-slate-200 self-center mx-1"></div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-lg shadow-amber-200"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Occupied</span>
                </div>
            </div>
        </div>

        {/* Parked Bills Quick List (RestoLedger Standard) */}
        {tables.some(t => t.status === 'occupied') && (
            <div className="mb-10 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 mb-4">
                    <History size={16} className="text-amber-500" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Parked Bills</h4>
                </div>
                <div className="flex flex-wrap gap-3">
                    {tables.filter(t => t.status === 'occupied').map(t => (
                        <button 
                            key={`parked-${t.id}`}
                            onClick={() => handleSelectTable(t)}
                            className="bg-amber-50 border border-amber-100 px-4 py-3 rounded-2xl flex items-center gap-3 hover:bg-amber-100 transition-all group"
                        >
                            <div className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center font-black text-xs group-hover:scale-110 transition-transform">
                                {t.table_no}
                            </div>
                            <div className="text-left">
                                <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Parked Bill</p>
                                <p className="text-xs font-black text-amber-900 leading-none">Table {t.table_no}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
            {tables.map(table => (
                <button
                    key={table.id}
                    onClick={() => handleSelectTable(table)}
                    className={cn(
                        "p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border-2 transition-all flex flex-col items-center group relative overflow-hidden",
                        selectedTable?.id === table.id 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-900/30" 
                            : table.status === 'available' 
                                ? "bg-emerald-50 border-emerald-100 text-emerald-700 hover:border-emerald-500" 
                                : "bg-amber-50 border-amber-200 text-amber-700 shadow-sm"
                    )}
                >
                    <Utensils 
                        size={selectedTable?.id === table.id ? 24 : 20} 
                        className={cn(
                            "mb-2 sm:mb-3 transition-transform group-hover:scale-110", 
                            selectedTable?.id === table.id ? "text-white" : table.status === 'available' ? "text-emerald-400" : "text-amber-400"
                        )} 
                    />
                    <span className="font-black text-sm sm:text-lg">{table.table_no}</span>
                    <span className={cn(
                        "text-[7px] sm:text-[8px] font-black uppercase tracking-widest mt-1",
                        selectedTable?.id === table.id ? "text-indigo-200" : table.status === 'available' ? "text-emerald-500" : "text-amber-600"
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
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 relative">
                {/* Items Grid */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {!activeSession ? (
                        <div className="bg-indigo-50/50 p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] text-center border-2 border-dashed border-indigo-100 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px]">
                            <Utensils size={40} className="text-indigo-300 mb-4 sm:mb-6" />
                            <h3 className="text-xl sm:text-2xl font-black text-indigo-900 mb-1 sm:mb-2 uppercase tracking-tight">Table {selectedTable.table_no} is Available</h3>
                            <p className="text-indigo-600 font-bold mb-6 sm:mb-8 uppercase text-[9px] sm:text-[10px] tracking-widest">Select a waiter and start the session</p>
                            
                            <div className="w-full max-w-sm mb-6 sm:mb-8 space-y-4">
                                
                                <div className="bg-white border border-indigo-100 rounded-2xl flex items-center px-4 py-1 shadow-sm">
                                    <UserCircle size={18} className="text-indigo-300 mr-2" />
                                    <select 
                                        className="w-full text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest outline-none bg-transparent py-3 cursor-pointer"
                                        value={openWaiterId}
                                        onChange={(e) => setOpenWaiterId(e.target.value)}
                                    >
                                        <option value="">Select Waiter (Optional)</option>
                                        {waiters.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <AppButton size="lg" onClick={openNewSession} className="px-8 sm:px-12 py-3 sm:py-4 uppercase tracking-widest text-[10px] sm:text-xs font-black shadow-xl shadow-indigo-100 w-full sm:w-auto">START ORDER</AppButton>
                        </div>
                    ) : (
                        <div className="pos-layout gap-4 overflow-hidden h-full">
                            {/* Sidebar - Responsive */}
                            <div className="w-full lg:w-20 flex lg:flex-col gap-2 shrink-0 overflow-x-auto lg:overflow-y-auto custom-scrollbar-hide pb-2 lg:pb-10 p-1">
                                <button 
                                    onClick={() => setSelectedMainCategory('All')}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all group",
                                        selectedMainCategory === 'All' ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-slate-400 hover:bg-slate-50"
                                    )}
                                >
                                    <LayoutGrid size={20} />
                                    <span className="text-[8px] font-black uppercase">All</span>
                                </button>
                                <button 
                                    onClick={() => setSelectedMainCategory('Popular')}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all group",
                                        selectedMainCategory === 'Popular' ? "bg-amber-500 text-white shadow-lg" : "bg-white text-slate-400 hover:bg-slate-50"
                                    )}
                                >
                                    <Star size={20} />
                                    <span className="text-[8px] font-black uppercase">Fav</span>
                                </button>
                                <div className="h-px bg-slate-200 mx-3 my-1" />
                                {mainCategories.map(cat => (
                                    <button 
                                        key={cat}
                                        onClick={() => setSelectedMainCategory(cat)}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all group",
                                            selectedMainCategory === cat ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-slate-400 hover:bg-slate-50"
                                        )}
                                    >
                                        <span className="text-xs font-black uppercase">{cat.charAt(0)}</span>
                                        <span className="text-[7px] font-black uppercase text-center leading-tight line-clamp-2">{cat}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Item Grid/List */}
                            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                                <div className="bg-white p-4 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600" size={18} />
                                            <input 
                                                id="pos-search-input"
                                                type="text" 
                                                placeholder="Search menu... [/]" 
                                                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition-all"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                onKeyDown={handleSearchKeyDown}
                                            />
                                        </div>
                                        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                                            <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}><LayoutGrid size={18} /></button>
                                            <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}><List size={18} /></button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex gap-2">
                                            {['all', 'single', 'double', '250g'].map(p => (
                                                <button 
                                                    key={p} 
                                                    onClick={() => setPortionFilter(p)}
                                                    className={cn("px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border-2", portionFilter === p ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-50 text-slate-400")}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                        {recentItems.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                {recentItems.map(ri => (
                                                    <button key={`recent-${ri.id}`} onClick={() => addToCart(ri)} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[7px] font-black text-slate-400 hover:text-indigo-600">{ri.name}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
                                    {viewMode === 'grid' ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                                            {filteredItems.map(item => {
                                                const isAvailable = (item.availability_status === 'available' || item.is_combo) && (!item.track_stock || item.stock_qty > 0);
                                                const isSoldOut = (item.availability_status === 'sold_out' || (item.track_stock && item.stock_qty <= 0)) && !item.is_combo;
                                                return (
                                                    <button
                                                        key={`${item.is_combo ? 'c' : 'i'}-${item.id}`}
                                                        onClick={() => isAvailable && addToCart(item)}
                                                        disabled={!isAvailable}
                                                        className={cn(
                                                            "p-4 rounded-3xl text-left border transition-all flex flex-col shadow-sm relative overflow-hidden h-[130px]",
                                                            isAvailable ? "bg-white border-slate-100 hover:border-indigo-600 hover:shadow-md active:scale-95" : "bg-slate-50 opacity-60 grayscale cursor-not-allowed"
                                                        )}
                                                    >
                                                        {!!item.is_popular && !isSoldOut && <Star size={10} className="absolute top-2 right-2 text-amber-500 fill-amber-500" />}
                                                        {isSoldOut && <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10"><span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase rotate-[-5deg]">Sold Out</span></div>}
                                                        
                                                        <div className="flex-1">
                                                            <h4 className="font-black text-slate-800 text-[11px] leading-tight line-clamp-2 uppercase mb-1">{item.name}</h4>
                                                            <div className="flex flex-wrap gap-1">
                                                                <span className="text-[7px] font-black text-slate-400 uppercase">{item.category}</span>
                                                                {item.portion_type && item.portion_type !== 'regular' && <span className="text-[7px] font-black text-indigo-500 uppercase bg-indigo-50 px-1 rounded">{item.portion_type}</span>}
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
                                                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                                                            <p className="text-xs font-black text-indigo-600">Rs. {parseFloat(item?.price || 0).toLocaleString()}</p>
                                                            <Plus size={14} className="text-slate-300" />
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {filteredItems.map(item => (
                                                <button key={`list-${item.id}`} onClick={() => addToCart(item)} className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-slate-100 hover:border-indigo-600 transition-all group">
                                                    <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">{item.is_popular ? <Star size={14} className="text-amber-500 fill-amber-500" /> : <Tag size={14} />}</div>
                                                    <div className="flex-1 text-left">
                                                        <h4 className="font-black text-slate-800 text-xs uppercase">{item.name}</h4>
                                                        <p className="text-[8px] font-black text-slate-400 uppercase">{item.category} • {item.portion_type}</p>
                                                    </div>
                                                    <p className="text-sm font-black text-indigo-600">Rs. {parseFloat(item?.price || 0).toLocaleString()}</p>
                                                    <Plus size={16} className="text-slate-300 group-hover:text-indigo-600" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            {/* Cart Panel - Responsive Wrapper */}
            <div className={cn(
                "fixed inset-0 lg:relative z-[60] lg:z-10 lg:w-full lg:col-span-4 transition-all duration-300 pointer-events-none lg:pointer-events-auto",
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
                    "absolute bottom-0 left-0 right-0 top-20 lg:static lg:h-full lg:max-h-[850px] bg-white lg:rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col transition-transform duration-300 lg:translate-y-0",
                    isCartOpen ? "translate-y-0" : "translate-y-full"
                )}>
                    {/* Mobile Close Handle */}
                    <div className="lg:hidden h-8 flex items-center justify-center shrink-0 border-b border-slate-50">
                        <div className="w-12 h-1 bg-slate-200 rounded-full" onClick={() => setIsCartOpen(false)} />
                    </div>
                <div className="p-6 sm:p-8 border-b border-slate-50 flex items-center justify-between bg-slate-900 text-white">
                    <div className="flex items-center gap-3">
                        <Utensils size={20} />
                        <h3 className="text-xl font-black uppercase tracking-tight">Table {selectedTable.table_no}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => { fetchSessionKOTs(); setShowKOTHistoryModal(true); }}
                            className="p-2 hover:bg-white/20 rounded-xl transition-all"
                            title="KOT History"
                        >
                            <ChefHat size={18} />
                        </button>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {sessionItems.length + cart.length} ITEMS
                        </span>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Active Items in Session */}
                    {sessionItems.length > 0 && (
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex justify-between">
                                <span>Active Orders</span>
                                <span>Bill Summary</span>
                            </p>
                            {sessionItems.map(item => (
                                <div key={item.id} className={cn(
                                    "flex items-center gap-4 p-3 rounded-2xl transition-all",
                                    isSplitMode ? "cursor-pointer hover:bg-indigo-50" : "bg-slate-50 border border-slate-100",
                                    selectedSplitItems.includes(item.id) && "bg-indigo-50 border-indigo-200 shadow-sm"
                                )} onClick={() => isSplitMode && toggleSplitItem(item.id)}>
                                    {isSplitMode && (
                                        <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors", selectedSplitItems.includes(item.id) ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200")}>
                                            {selectedSplitItems.includes(item.id) && <CheckCircle2 size={12} />}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                           <p className={cn("font-black text-sm uppercase", item.status === 'voided' ? 'line-through text-slate-400' : 'text-slate-700')}>{item.item_name} x {item.qty}</p>
                                           <p className="text-xs font-black text-slate-900">Rs. {parseFloat(item.total).toLocaleString()}</p>
                                        </div>
                                        
                                        {/* Modifiers Display */}
                                        {item.modifiers && item.modifiers.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {item.modifiers.map(m => (
                                              <span key={m.id} className="text-[7px] font-black uppercase px-1 py-0.5 bg-slate-200 text-slate-600 rounded">
                                                {m.name}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                        
                                        {item.special_note && (
                                           <p className="text-[10px] font-bold text-amber-600 italic">“{item.special_note}”</p>
                                        )}

                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full", 
                                                item.status === 'active' ? 'bg-amber-100 text-amber-700' : 
                                                item.status === 'served' ? 'bg-emerald-100 text-emerald-700' : 
                                                item.status === 'billed' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                                            )}>{item.status}</span>
                                            {!!item.kot_sent && <span className="text-[8px] font-black text-indigo-600 uppercase flex items-center gap-1"><ChefHat size={10} /> KOT SENT</span>}
                                        </div>
                                    </div>
                                    {item.status !== 'voided' && item.status !== 'billed' && !isSplitMode && (
                                        <button onClick={(e) => { e.stopPropagation(); setVoidingItem(item); setShowVoidModal(true); }} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* New Items (Cart) */}
                    {cart.length > 0 && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4">
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2">New Items (Draft)</p>
                            <div className="space-y-4">
                                {cart.map((item, index) => (
                                    <div key={`${item.item_id}-${index}`} className="flex gap-4 group animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                               <p className="font-black text-slate-900 text-[13px] leading-tight mb-1">{item.item_name}</p>
                                               <p className="text-xs font-black text-slate-900">Rs. {((toNumber(item.unit_price) + toNumber(item.modifier_total)) * item.qty).toLocaleString()}</p>
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
                                                 Rs. {(toNumber(item.unit_price) + toNumber(item.modifier_total)).toLocaleString()} x {item.qty}
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
                                            <div className="flex items-center bg-slate-100 rounded-lg overflow-hidden">
                                                <button onClick={() => updateCartQty(index, -1)} className="p-1.5 hover:bg-slate-200 text-slate-500"><Minus size={10} /></button>
                                                <span className="w-5 text-center text-xs font-black">{item.qty}</span>
                                                <button onClick={() => updateCartQty(index, 1)} className="p-1.5 hover:bg-slate-200 text-slate-500"><Plus size={10} /></button>
                                            </div>
                                            <button onClick={() => removeFromCart(index)} className="p-1 text-slate-300 hover:text-rose-600"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                        <AppButton 
                            variant="warning"
                            size="lg"
                            className="h-16 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-600 hover:text-white"
                            disabled={(cart.length === 0 && !sessionItems.some(i => !i.kot_sent && i.status !== 'voided')) || processing}
                            onClick={sendToKitchen}
                            icon={ChefHat}
                        >
                            KOT
                        </AppButton>
                        <AppButton 
                            variant="primary"
                            size="lg"
                            className="h-16 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700"
                            disabled={currentTotals.subtotal === 0 || processing}
                            onClick={() => {setShowCheckoutModal(true); fetchCustomers();}}
                            icon={Receipt}
                        >
                            BILL
                        </AppButton>
                    </div>
                    {activeSession && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                             <AppButton 
                                variant="secondary"
                                size="sm"
                                className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white"
                                disabled={currentTotals.subtotal === 0 || processing}
                                onClick={handleQuickCash}
                                icon={CircleDollarSign}
                            >
                                QUICK CASH
                            </AppButton>
                            <AppButton 
                                variant="danger"
                                size="sm"
                                className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white"
                                disabled={processing}
                                onClick={handleCancelSession}
                                icon={XCircle}
                            >
                                FREE TABLE
                            </AppButton>
                        </div>
                    )}
                    {activeSession && sessionItems.some(i => i.kot_sent && !i.billed) && (
                        <div className="flex gap-2">
                            <button 
                                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-slate-200 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 transition-all"
                                onClick={() => {
                                    setIsSplitMode(true);
                                    setShowSplitModal(true);
                                }}
                            >
                                <Split size={16} />
                                Split
                            </button>
                            <button 
                                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-slate-200 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 transition-all"
                                onClick={() => {
                                    setTableActionType('transfer');
                                    setShowTableActionModal(true);
                                }}
                            >
                                <MoveHorizontal size={16} />
                                Transfer
                            </button>
                            <button 
                                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-slate-200 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 transition-all"
                                onClick={() => {
                                    setTableActionType('merge');
                                    setShowTableActionModal(true);
                                }}
                            >
                                <GitMerge size={16} />
                                Merge
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

            {/* Mobile Floating Action Button */}
            <div className="fixed bottom-6 right-6 lg:hidden z-50 flex flex-col gap-3">
                {(sessionItems.length + cart.length) > 0 && !isCartOpen && (
                    <div className="bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-black absolute -top-2 -right-2 shadow-lg animate-bounce">
                        {sessionItems.length + cart.length}
                    </div>
                )}
                <button 
                    onClick={() => setIsCartOpen(!isCartOpen)}
                    className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95",
                        isCartOpen ? "bg-slate-800 text-white" : "bg-indigo-600 text-white"
                    )}
                >
                    {isCartOpen ? <XCircle size={28} /> : <ShoppingBag size={28} />}
                </button>
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
                
                {/* Quick Reasons */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {['Wrong Entry', 'Out of Stock', 'Customer Cancelled', 'Billing Error'].map(reason => (
                        <button
                            key={reason}
                            onClick={() => setVoidReason(reason)}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                voidReason === reason 
                                    ? "bg-rose-600 border-rose-600 text-white shadow-md" 
                                    : "bg-white border-slate-100 text-slate-400 hover:border-rose-200"
                            )}
                        >
                            {reason}
                        </button>
                    ))}
                </div>

                <textarea 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:border-rose-500 transition-all h-32 resize-none"
                    placeholder="Or type a custom reason here..."
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

      {/* Checkout Modal (Redesigned for Premium UI) */}
      <AppModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        title="Finalize Table Checkout"
        size="xl"
      >
        <div className="max-w-md mx-auto py-4 space-y-6">
            {/* Itemized Summary Section (Restored for Table Billing) */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 max-h-[180px] overflow-y-auto custom-scrollbar">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Order Summary</p>
                <div className="space-y-3">
                    {[...sessionItems.filter(i => i.status !== 'voided' && !i.billed), ...cart].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start">
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-slate-700 uppercase leading-tight">{item.item_name}</p>
                                <p className="text-[8px] font-bold text-slate-400">QTY: {item.qty} × Rs. {(item.unit_price || item.price || 0).toLocaleString()}</p>
                            </div>
                            <span className="text-[10px] font-black text-slate-900">
                                Rs. {(toNumber(item.qty) * toNumber(item.unit_price || item.price || 0)).toLocaleString()}
                            </span>
                        </div>
                    ))}
                    {sessionItems.length === 0 && cart.length === 0 && (
                        <p className="text-[10px] font-bold text-slate-300 text-center py-4 uppercase italic">No items to bill</p>
                    )}
                </div>
            </div>

            {/* Totals Section (Quick Sale Style) */}
            <div className="space-y-1 border-b border-slate-100 pb-4">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>Rs. {currentTotals.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Tax & S.Charge</span>
                    <span>Rs. {(currentTotals.tax + currentTotals.sc).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-4">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Payable Amount</span>
                    <span className="text-4xl font-black text-indigo-600">Rs. {currentTotals.grandTotal.toLocaleString()}</span>
                </div>
            </div>

            {/* Payment Methods (Large Blocks) */}
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => handleUpdatePayment(0, 'payment_method', 'cash')}
                        className={cn(
                            "flex items-center justify-center gap-3 py-5 rounded-xl border-2 transition-all font-black text-xs tracking-widest shadow-sm",
                            payments[0]?.payment_method === 'cash' 
                                ? "bg-emerald-600 border-emerald-600 text-white" 
                                : "bg-white border-slate-100 text-slate-600 hover:border-emerald-200"
                        )}
                    >
                        <Wallet size={18} />
                        CASH
                    </button>
                    <button
                        onClick={() => handleUpdatePayment(0, 'payment_method', 'card')}
                        className={cn(
                            "flex items-center justify-center gap-3 py-5 rounded-xl border-2 transition-all font-black text-xs tracking-widest shadow-sm",
                            payments[0]?.payment_method === 'card' 
                                ? "bg-white border-indigo-600 text-indigo-600" 
                                : "bg-white border-slate-100 text-slate-600 hover:border-indigo-200"
                        )}
                    >
                        <CircleDollarSign size={18} />
                        CARD
                    </button>
                </div>
                
                <button
                    onClick={handleQRCheckout}
                    className="w-full flex items-center justify-center gap-3 py-5 rounded-xl bg-slate-50 border-2 border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all hover:border-indigo-600 hover:text-indigo-600"
                >
                    <Zap size={16} />
                    QR PAY — TAP TO START
                </button>
            </div>

            {/* Input Pad (The Gray Box) */}
            <div className="bg-emerald-50/30 border border-emerald-100 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                        <span className="text-slate-300 font-black text-sm">Rs.</span>
                        <input 
                            type="number" 
                            value={payments[0]?.amount}
                            onChange={(e) => handleUpdatePayment(0, 'amount', e.target.value)}
                            className="bg-transparent text-3xl font-black text-slate-900 outline-none w-32"
                            placeholder="0.00"
                            autoFocus
                        />
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Change</p>
                        <p className={cn("text-xl font-black", (parseFloat(payments[0]?.amount) >= currentTotals.grandTotal) ? "text-emerald-600" : "text-slate-300")}>
                            Rs. {Math.max(0, (parseFloat(payments[0]?.amount) || 0) - currentTotals.grandTotal).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                    <button onClick={() => handleUpdatePayment(0, 'amount', currentTotals.grandTotal.toString())} className="py-2 bg-indigo-50/50 rounded-lg text-[8px] font-black uppercase text-indigo-600 hover:bg-indigo-100 transition-all">EXACT</button>
                    {[100, 500, 1000].map(v => (
                        <button key={v} onClick={() => handleUpdatePayment(0, 'amount', ((parseFloat(payments[0]?.amount) || 0) + v).toString())} className="py-2 bg-indigo-50/50 rounded-lg text-[8px] font-black uppercase text-indigo-600 hover:bg-indigo-100 transition-all">+{v}</button>
                    ))}
                    <button onClick={() => handleUpdatePayment(0, 'amount', '0')} className="py-2 bg-indigo-50/50 rounded-lg text-[8px] font-black uppercase text-indigo-600 hover:bg-indigo-100 transition-all">CLR</button>
                </div>
            </div>

            {/* Final Bottom Grid (4 Blocks - Color Matched) */}
            <div className="grid grid-cols-4 gap-2">
                <button 
                    onClick={handlePark}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-amber-100 rounded-2xl border border-amber-200 hover:bg-amber-200 transition-all shadow-sm"
                >
                    <div className="w-8 h-8 rounded-full border-2 border-amber-600 flex items-center justify-center text-amber-600">
                        <History size={14} />
                    </div>
                    <span className="text-[8px] font-black text-amber-900 uppercase tracking-widest">Park</span>
                </button>
                <button 
                    onClick={handleCheckoutCredit}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all"
                >
                    <span className="text-[8px] font-black text-purple-600 uppercase tracking-widest leading-tight text-center">Add to<br/>Account</span>
                </button>
                <button 
                    onClick={handleCheckoutPayNow}
                    disabled={processing}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-100 rounded-2xl border border-slate-200 hover:bg-slate-200 transition-all"
                >
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-tight text-center">Complete<br/>& Print</span>
                </button>
                <button 
                    onClick={() => {
                        // Quick Cash logic: Just finalize without extra receipt steps if needed
                        handleCheckoutPayNow();
                    }}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-emerald-500 rounded-2xl border border-emerald-600 shadow-lg hover:bg-emerald-600 transition-all"
                >
                    <span className="text-[8px] font-black text-white uppercase tracking-widest leading-tight text-center">Quick<br/>Cash<br/><span className="text-[6px] opacity-80">(No Receipt)</span></span>
                </button>
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
                                    <span className="font-black">Rs. {(toNumber(item?.qty) * toNumber(item?.unit_price)).toLocaleString()}</span>
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
            {promotions.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                        <Tag size={14} className="text-indigo-600" />
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Available Promotion</span>
                    </div>
                    <select 
                        className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-xs font-bold text-indigo-900 outline-none focus:border-indigo-400 shadow-sm"
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
        invoice={lastInvoice ? (lastInvoice.settings ? lastInvoice : { ...lastInvoice, settings }) : null} 
      />

      <PaymentQRModal 
            isOpen={showQRModal}
            onClose={() => setShowQRModal(false)}
            transactionData={qrTransactionData}
            onSuccess={(data) => {
                setShowQRModal(false);
                setLastInvoice({ id: qrTransactionData.invoice_id, invoice_no: qrTransactionData.invoice_no });
                setShowPrintModal(true);
                resetSale();
                fetchData();
                toast.success('QR Payment Successful!');
            }}
            onCancel={() => {
                setProcessing(false);
            }}
        />

      <AddToCustomerAccountModal 
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        billAmount={currentTotals.grandTotal}
        onConfirm={handleAccountConfirm}
        processing={processing}
      />

      <ItemModifierModal 
        isOpen={showModifierModal}
        onClose={() => setShowModifierModal(false)}
        item={modifierTarget}
        onConfirm={confirmModifiers}
        initialData={editingItemIndex !== null ? cart[editingItemIndex] : null}
      />

      {/* Table Action Modal (Transfer/Merge) */}
      <AppModal
        isOpen={showTableActionModal}
        onClose={() => {setShowTableActionModal(false); setTargetTableId('');}}
        title={tableActionType === 'transfer' ? 'Transfer Table' : 'Merge Tables'}
      >
        <div className="space-y-6 py-4">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Source Table</p>
                <p className="text-lg font-black text-slate-900">Table {selectedTable?.table_no}</p>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Select Target Table {tableActionType === 'transfer' ? '(Available Only)' : '(Occupied Only)'}
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                    {tables
                        .filter(t => t.id !== selectedTable?.id)
                        .filter(t => tableActionType === 'transfer' ? t.status === 'available' : t.status === 'occupied')
                        .map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTargetTableId(t.id)}
                                className={cn(
                                    "p-3 rounded-xl border-2 transition-all font-black text-xs",
                                    targetTableId === t.id 
                                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" 
                                        : "bg-white border-slate-100 text-slate-600 hover:border-indigo-200"
                                )}
                            >
                                {t.table_no}
                            </button>
                        ))}
                </div>
                {tables.filter(t => t.id !== selectedTable?.id).filter(t => tableActionType === 'transfer' ? t.status === 'available' : t.status === 'occupied').length === 0 && (
                    <p className="text-xs font-bold text-rose-500 text-center py-4 bg-rose-50 rounded-xl">
                        No {tableActionType === 'transfer' ? 'available' : 'occupied'} tables found for {tableActionType}.
                    </p>
                )}
            </div>

            <div className="flex gap-4">
                <AppButton variant="secondary" className="flex-1" onClick={() => setShowTableActionModal(false)}>Cancel</AppButton>
                <AppButton 
                    variant="primary" 
                    className="flex-[2]" 
                    loading={processing}
                    disabled={!targetTableId}
                    onClick={handleTableAction}
                >
                    CONFIRM {tableActionType.toUpperCase()}
                </AppButton>
            </div>
        </div>
      </AppModal>

      <QuickCashModal 
        isOpen={showQuickCashModal}
        onClose={() => setShowQuickCashModal(false)}
        amount={currentTotals.grandTotal}
        onConfirm={handleConfirmQuickCash}
        processing={processing}
      />

      <KOTPrintModal
        isOpen={showKOTModal}
        onClose={() => setShowKOTModal(false)}
        kot={lastKOT}
      />

      {/* KOT History Modal */}
      <AppModal
        isOpen={showKOTHistoryModal}
        onClose={() => setShowKOTHistoryModal(false)}
        title={`KOT History - Table ${selectedTable?.table_no}`}
        size="lg"
      >
        <div className="space-y-4 py-4">
            {sessionKOTs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 italic">No KOTs generated for this session yet.</div>
            ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {sessionKOTs.map(kot => (
                        <div key={kot.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between group">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-black text-slate-900 uppercase">{kot.kot_no}</span>
                                    <span className={cn(
                                        "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                                        kot.status === 'pending' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                                    )}>{kot.status}</span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">
                                    {new Date(kot.created_at).toLocaleTimeString()} • {kot.items?.length || 0} Items
                                </p>
                            </div>
                            <AppButton 
                                variant="secondary" 
                                size="sm" 
                                className="h-10 px-4 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" 
                                icon={Printer}
                                onClick={() => {
                                    setLastKOT(kot);
                                    setShowKOTModal(true);
                                }}
                            >
                                REPRINT
                            </AppButton>
                        </div>
                    ))}
                </div>
            )}
            <div className="pt-4">
                <AppButton variant="secondary" className="w-full" onClick={() => setShowKOTHistoryModal(false)}>Close</AppButton>
            </div>
        </div>
      </AppModal>

      <PaymentQRModal 
            isOpen={showQRModal}
            onClose={() => setShowQRModal(false)}
            transactionData={qrTransactionData}
            onSuccess={(data) => {
                setShowQRModal(false);
                handleSelectTable(selectedTable.id);
                toast.success('Payment completed successfully');
            }}
      />
      <AppModal
        isOpen={showAddTableModal}
        onClose={() => setShowAddTableModal(false)}
        title="Add Restaurant Table"
      >
        <form onSubmit={handleCreateNewTable} className="space-y-6">
            <FormInput 
                label="Table Number / Name" 
                placeholder="e.g. 05 or Balcony-1" 
                required 
                value={newTableNo} 
                onChange={e => setNewTableNo(e.target.value)} 
            />
            <div className="flex gap-4 pt-4">
                <AppButton variant="secondary" className="flex-1" type="button" onClick={() => setShowAddTableModal(false)}>Cancel</AppButton>
                <AppButton variant="primary" className="flex-1" type="submit" loading={processing}>Create Table</AppButton>
            </div>
        </form>
      </AppModal>
    </div>
  );
};

export default TableBillingPage;
