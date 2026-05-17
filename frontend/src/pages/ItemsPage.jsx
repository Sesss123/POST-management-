import React, { useState, useEffect } from 'react';
import { itemApi } from '../api/api';
import { 
    Package, 
    Plus, 
    Search, 
    Tag, 
    DollarSign, 
    Filter, 
    Edit, 
    Trash2, 
    Eye, 
    EyeOff, 
    AlertTriangle, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Sparkles, 
    RefreshCw,
    TrendingUp,
    Layers,
    ArrowRight,
    ChevronRight,
    Activity
} from 'lucide-react';
import { AppButton, AppCard, AppTable, StatusBadge, AppModal, FormInput, FormSelect, useToast, ResponsiveDataList } from '../components/ui';
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

const ItemsPage = () => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categories, setCategories] = useState(['All']);
  
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [availabilityItem, setAvailabilityItem] = useState(null);
  const [availabilityReason, setAvailabilityReason] = useState('');
  
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceItem, setPriceItem] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: 'Rice & Curry',
    price: '',
    portion_label: 'Single',
    description: '',
    status: 'active',
    availability_status: 'available',
    track_stock: false,
    stock_qty: 0,
    low_stock_threshold: 0,
    short_code: '',
    main_category: '',
    portion_type: 'regular',
    is_popular: false,
    display_order: 0,
    item_type: 'food',
    send_to_kitchen: true,
    quick_sale_enabled: false,
    age_restricted: false,
    requires_age_confirmation: false,
    barcode: '',
    unit_type: 'item',
    no_receipt_default: false,
    show_in_quick_bar: false,
    purchase_unit_type: 'item',
    units_per_purchase_unit: 1,
    is_quick_retail: false,
    is_restaurant_item: true,
    pack_size: 20,
    show_on_public_menu: true,
    public_description: '',
    image_url: '',
    spice_level: 'none',
    is_veg: false,
    is_featured: false,
    public_display_order: 0
  });

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveItem, setReceiveItem] = useState(null);
  const [receiveData, setReceiveData] = useState({
    purchase_unit_type: 'pack',
    purchase_unit_qty: '',
    units_per_purchase_unit: 1,
    cost_per_purchase_unit: '',
    note: ''
  });

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await itemApi.getAll({ include_inactive: 'true' });
      setItems(data.data);
    } catch (err) {
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
      try {
          const { data } = await itemApi.getCategories();
          if (data && data.success && Array.isArray(data.data)) {
              setCategories(['All', ...data.data]);
          }
      } catch (err) {
          console.error('Failed to fetch categories:', err);
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await itemApi.update(editingItem.uuid || editingItem.id, formData);
        toast.success('Item updated successfully');
      } else {
        await itemApi.create(formData);
        toast.success('New item added to menu');
      }
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchItems();
      fetchCategories();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const resetForm = () => {
    setFormData({
        name: '',
        category: 'Rice & Curry',
        price: '',
        portion_label: 'Single',
        description: '',
        status: 'active',
        availability_status: 'available',
        track_stock: false,
        stock_qty: 0,
        low_stock_threshold: 0,
        short_code: '',
        main_category: '',
        portion_type: 'regular',
        is_popular: false,
        display_order: 0,
        item_type: 'food',
        send_to_kitchen: true,
        quick_sale_enabled: false,
        age_restricted: false,
        requires_age_confirmation: false,
        barcode: '',
        unit_type: 'item',
        no_receipt_default: false,
        show_in_quick_bar: false,
        purchase_unit_type: 'item',
        units_per_purchase_unit: 1,
        is_quick_retail: false,
        is_restaurant_item: true,
        pack_size: 20,
        show_on_public_menu: true,
        public_description: '',
        image_url: '',
        spice_level: 'none',
        is_veg: false,
        is_featured: false,
        public_display_order: 0
      });
  };

    const handleDelete = async (item) => {
        const identifier = item.uuid || item.id;
        if (window.confirm('Are you sure you want to PERMANENTLY delete this item? This action cannot be undone.')) {
            try {
                await itemApi.delete(identifier);
                toast.success('Item deleted successfully');
                fetchItems();
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to delete item. It might be linked to existing sales.');
            }
        }
    };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      portion_label: item.portion_label || 'Single',
      description: item.description || '',
      status: item.status,
      availability_status: item.availability_status || 'available',
      track_stock: item.track_stock === 1 || item.track_stock === true,
      stock_qty: item.stock_qty || 0,
      low_stock_threshold: item.low_stock_threshold || 0,
      short_code: item.short_code || '',
      main_category: item.main_category || '',
      portion_type: item.portion_type || 'regular',
      is_popular: item.is_popular === 1 || item.is_popular === true,
      display_order: item.display_order || 0,
      item_type: item.item_type || 'food',
      send_to_kitchen: item.send_to_kitchen === 1 || item.send_to_kitchen === true,
      quick_sale_enabled: item.quick_sale_enabled === 1 || item.quick_sale_enabled === true,
      age_restricted: item.age_restricted === 1 || item.age_restricted === true,
      requires_age_confirmation: item.requires_age_confirmation === 1 || item.requires_age_confirmation === true,
      barcode: item.barcode || '',
      purchase_unit_type: item.purchase_unit_type || 'item',
      units_per_purchase_unit: item.units_per_purchase_unit || 1,
      is_quick_retail: item.is_quick_retail === 1 || item.is_quick_retail === true,
      is_restaurant_item: item.is_restaurant_item === 1 || item.is_restaurant_item === true,
      pack_size: item.pack_size || 20,
      unit_type: item.unit_type || 'item',
      no_receipt_default: item.no_receipt_default === 1 || item.no_receipt_default === true,
      show_in_quick_bar: item.show_in_quick_bar === 1 || item.show_in_quick_bar === true,
      show_on_public_menu: item.show_on_public_menu === 1 || item.show_on_public_menu === true,
      public_description: item.public_description || '',
      image_url: item.image_url || '',
      spice_level: item.spice_level || 'none',
      is_veg: item.is_veg === 1 || item.is_veg === true,
      is_featured: item.is_featured === 1 || item.is_featured === true,
      public_display_order: item.public_display_order || 0
    });
    setShowModal(true);
  };

  const handleUpdatePrice = async (e) => {
      e.preventDefault();
      try {
          await itemApi.updatePrice(priceItem.uuid || priceItem.id, newPrice);
          toast.success('Price updated successfully');
          setShowPriceModal(false);
          fetchItems();
      } catch (err) {
          toast.error('Failed to update price');
      }
  };

  const handleReceiveStock = (item) => {
    setReceiveItem(item);
    setReceiveData({
        purchase_unit_type: item.purchase_unit_type || 'pack',
        purchase_unit_qty: '',
        units_per_purchase_unit: item.units_per_purchase_unit || (item.unit_type === 'stick' ? item.pack_size : 1),
        cost_per_purchase_unit: '',
        note: ''
    });
    setShowReceiveModal(true);
  };

  const submitReceiveStock = async (e) => {
    e.preventDefault();
    try {
        const payload = {
            purchase_unit_type: receiveData.purchase_unit_type,
            purchase_unit_qty: parseFloat(receiveData.purchase_unit_qty),
            units_per_purchase_unit: parseInt(receiveData.units_per_purchase_unit),
            cost_per_purchase_unit: receiveData.cost_per_purchase_unit ? parseFloat(receiveData.cost_per_purchase_unit) : null,
            note: receiveData.note
        };
        await itemApi.receiveStock(receiveItem.uuid || receiveItem.id, payload);
        toast.success('Stock updated successfully');
        setShowReceiveModal(false);
        fetchItems();
    } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update stock');
    }
  };

  const handleUpdateAvailability = async (e) => {
      e.preventDefault();
      try {
          await itemApi.updateAvailability(availabilityItem.uuid || availabilityItem.id, availabilityItem.nextStatus, availabilityReason);
          toast.success(`Item marked as ${availabilityItem.nextStatus.replace('_', ' ')}`);
          setShowAvailabilityModal(false);
          setAvailabilityReason('');
          fetchItems();
      } catch (err) {
          toast.error('Failed to update availability');
      }
  };

  const toggleStatus = async (item) => {
      const nextStatus = item.status === 'active' ? 'inactive' : 'active';
      if (!window.confirm(`Are you sure you want to ${nextStatus === 'active' ? 'reactivate' : 'deactivate'} this item?`)) return;
      
      try {
          await itemApi.updateStatus(item.uuid || item.id, nextStatus);
          toast.success(`Item ${nextStatus === 'active' ? 'reactivated' : 'deactivated'}`);
          fetchItems();
      } catch (err) {
          toast.error('Failed to update status');
      }
  };

  const filteredItems = items.filter(i => {
    const matchesSearch = (i.name?.toLowerCase() || "").includes(search.toLowerCase()) || 
                         (i.category?.toLowerCase() || "").includes(search.toLowerCase()) ||
                         (i.short_code?.toLowerCase() || "").includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || i.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || i.availability_status === statusFilter || (statusFilter === 'inactive' && i.status === 'inactive');
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getAvailabilityBadge = (status) => {
      switch(status) {
          case 'available': return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[8px] font-black uppercase">Available</span>;
          case 'sold_out': return <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[8px] font-black uppercase">Sold Out</span>;
          case 'temporarily_unavailable': return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-black uppercase">Unavailable</span>;
          default: return null;
      }
  };

  const lowStockCount = items.filter(i => i.track_stock && parseFloat(i.stock_qty) <= parseFloat(i.low_stock_threshold)).length;

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] space-y-4 animate-in fade-in duration-700 p-1 selection:bg-indigo-500/30 overflow-hidden bg-slate-50/50">
      {/* Premium White Neural Header */}
      <header className="relative group shrink-0">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 rounded-[32px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
            <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 group-hover:scale-110 transition-transform duration-500">
                    <Package size={32} />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={14} className="text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Inventory Nexus</span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-1 uppercase">Menu Assets</h2>
                    <p className="text-sm font-medium text-slate-400">Manage digital menu offerings and stock synchronization</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto relative z-10">
                <AppButton 
                    variant="primary" 
                    icon={Plus} 
                    size="lg" 
                    className="w-full sm:w-auto rounded-[24px] px-10 py-6 bg-indigo-600 hover:bg-indigo-500 shadow-2xl shadow-indigo-500/20 font-black uppercase tracking-widest text-xs border-none" 
                    onClick={() => { resetForm(); setEditingItem(null); setShowModal(true); }}
                >
                    Enroll Asset
                </AppButton>
                <AppButton 
                    variant="secondary" 
                    icon={RefreshCw} 
                    size="lg" 
                    className="rounded-[24px] bg-white border-slate-100 text-slate-400 hover:text-indigo-600 shadow-sm" 
                    onClick={fetchItems} 
                    loading={loading}
                />
            </div>
        </div>
      </header>

      {/* Stats Quick Matrix */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8 shrink-0">
          <GlassCard 
            title="Total Assets" 
            value={items.length} 
            icon={Layers} 
            variant="primary" 
          />
          <GlassCard 
            title="Active Menu" 
            value={items.filter(i => i.status === 'active').length} 
            icon={CheckCircle2} 
            variant="success" 
          />
          <GlassCard 
            title="Low Stock" 
            value={lowStockCount} 
            icon={AlertTriangle} 
            variant={lowStockCount > 0 ? "danger" : "success"} 
          />
          <GlassCard 
            title="Sold Out" 
            value={items.filter(i => i.availability_status === 'sold_out').length} 
            icon={XCircle} 
            variant="warning" 
          />
      </section>

      {/* Filter & Search Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 shrink-0">
          <div className="lg:col-span-6 relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                  <Search className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              </div>
              <input 
                  type="text" 
                  placeholder="Identify asset by name, category or protocol..." 
                  className="w-full bg-white border border-slate-100 rounded-[32px] py-6 pl-16 pr-8 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-xl shadow-slate-200/40"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
              />
          </div>
          <div className="lg:col-span-3">
              <select 
                  className="w-full bg-white border border-slate-100 rounded-[32px] py-6 px-8 text-xs font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-xl shadow-slate-200/40 appearance-none"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
              >
                  {categories.map(cat => <option key={cat} value={cat}>{cat === 'All' ? 'ALL CATEGORIES' : cat.toUpperCase()}</option>)}
              </select>
          </div>
          <div className="lg:col-span-3">
              <select 
                  className="w-full bg-white border border-slate-100 rounded-[32px] py-6 px-8 text-xs font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-xl shadow-slate-200/40 appearance-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
              >
                  <option value="All">ALL STATUS</option>
                  <option value="available">AVAILABLE</option>
                  <option value="sold_out">SOLD OUT</option>
                  <option value="temporarily_unavailable">UNAVAILABLE</option>
                  <option value="inactive">INACTIVE</option>
              </select>
          </div>
      </div>

      {/* Main Asset Table - Fixed Height & Scrollable */}
      <div className="flex-1 min-h-0 relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-transparent rounded-[44px] blur opacity-10"></div>
        <div className="relative bg-white border border-slate-100 rounded-[44px] h-full overflow-hidden shadow-2xl shadow-slate-200/40 flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <ResponsiveDataList 
                    loading={loading}
                    data={filteredItems}
                    headers={[
                        { label: 'Asset Identification' },
                        { label: 'Category' },
                        { label: 'Valuation', className: 'text-right' },
                        { label: 'Telemetry', className: 'text-center' },
                        { label: 'Availability', className: 'text-center' },
                        { label: 'Protocols', className: 'text-right' }
                    ]}
                    renderRow={(item) => (
                        <tr key={item.id} className={cn("hover:bg-slate-50 transition-all group border-b border-slate-50 last:border-0", item.status === 'inactive' && "opacity-60 grayscale bg-slate-50/30")}>
                            <td className="py-8 px-10">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 text-lg leading-tight uppercase tracking-tighter">{item.name}</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">
                                                {!!item.short_code && item.short_code !== "0" && <span className="text-indigo-600 font-black mr-2">[{item.short_code}]</span>}
                                                {item.portion_label || 'Standard'} • {item.status.toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="py-8">
                                <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-colors">{item.category}</span>
                            </td>
                            <td className="py-8 text-right px-10">
                                <button 
                                    onClick={() => { setPriceItem(item); setNewPrice(item.price); setShowPriceModal(true); }}
                                    className="font-black text-slate-900 group-hover:text-indigo-600 text-xl transition-colors tabular-nums"
                                >
                                    Rs. {parseFloat(item.price).toLocaleString()}
                                </button>
                            </td>
                            <td className="py-8 text-center">
                                {item.track_stock ? (
                                    <div className={cn(
                                        "inline-flex flex-col items-center p-3 rounded-2xl border transition-all min-w-[80px]",
                                        parseFloat(item.stock_qty) <= parseFloat(item.low_stock_threshold) ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-slate-50 border-slate-100 text-slate-900 group-hover:bg-white"
                                    )}>
                                        <span className="font-black text-base">{item.stock_qty}</span>
                                        <span className="text-[8px] opacity-60 uppercase font-black tracking-widest mt-0.5">Level</span>
                                    </div>
                                ) : (
                                    <span className="text-[9px] text-slate-300 uppercase font-black tracking-[0.3em]">No Track</span>
                                )}
                            </td>
                            <td className="py-8 text-center px-10">
                                <div className="flex flex-col items-center gap-3">
                                    {getAvailabilityBadge(item.availability_status)}
                                    <div className="flex gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100">
                                        <button onClick={() => { setAvailabilityItem({...item, nextStatus: 'available'}); setShowAvailabilityModal(true); }} className="p-2 hover:bg-white text-emerald-600 rounded-lg shadow-sm transition-all" title="Mark Available"><CheckCircle2 size={14} /></button>
                                        <button onClick={() => { setAvailabilityItem({...item, nextStatus: 'sold_out'}); setShowAvailabilityModal(true); }} className="p-2 hover:bg-white text-rose-600 rounded-lg shadow-sm transition-all" title="Mark Sold Out"><XCircle size={14} /></button>
                                        <button onClick={() => { setAvailabilityItem({...item, nextStatus: 'temporarily_unavailable'}); setShowAvailabilityModal(true); }} className="p-2 hover:bg-white text-amber-600 rounded-lg shadow-sm transition-all" title="Mark Unavailable"><Clock size={14} /></button>
                                    </div>
                                </div>
                            </td>
                            <td className="py-8 text-right px-10">
                                <div className="flex justify-end gap-2">
                                    <AppButton variant="ghost" size="sm" icon={Edit} className="w-10 h-10 rounded-xl hover:bg-indigo-50 text-indigo-600" onClick={() => handleEdit(item)} />
                                    {item.track_stock === 1 && (
                                        <AppButton variant="ghost" size="sm" icon={Package} onClick={() => handleReceiveStock(item)} className="w-10 h-10 rounded-xl hover:bg-indigo-50 text-indigo-600" />
                                    )}
                                    <AppButton 
                                        variant="ghost" 
                                        size="sm" 
                                        icon={item.status === 'active' ? EyeOff : Eye} 
                                        onClick={() => toggleStatus(item)}
                                        className={cn("w-10 h-10 rounded-xl", item.status === 'active' ? "text-slate-400 hover:bg-slate-50" : "text-emerald-600 hover:bg-emerald-50")}
                                    />
                                    <AppButton 
                                        variant="ghost" 
                                        size="sm" 
                                        icon={Trash2} 
                                        onClick={() => handleDelete(item)}
                                        className="w-10 h-10 rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                                    />
                                </div>
                            </td>
                        </tr>
                    )}
                    renderCard={(item) => (
                        <div key={item.id} className={cn("p-8 space-y-6 bg-white border-b border-slate-50 last:border-0", item.status === 'inactive' && "opacity-60 grayscale")}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                        <Package size={24} />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">{item.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.category} • {item.portion_label || 'Single'}</p>
                                    </div>
                                </div>
                                {getAvailabilityBadge(item.availability_status)}
                            </div>
                            
                            <div className="flex justify-between items-center p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                <div className="flex flex-col">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Valuation</p>
                                    <p className="text-xl font-black text-indigo-600 tabular-nums">Rs. {parseFloat(item.price).toLocaleString()}</p>
                                </div>
                                {item.track_stock && (
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Stock Level</p>
                                        <p className={cn("text-xl font-black tabular-nums", parseFloat(item.stock_qty) <= parseFloat(item.low_stock_threshold) ? "text-rose-500" : "text-slate-900")}>{item.stock_qty}</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <AppButton variant="secondary" size="lg" className="rounded-2xl border-slate-200" icon={Edit} onClick={() => handleEdit(item)}>Edit</AppButton>
                                <AppButton variant="secondary" size="lg" className="rounded-2xl border-slate-200" icon={Trash2} onClick={() => handleDelete(item)}>Delete</AppButton>
                                {item.track_stock === 1 && (
                                    <AppButton variant="primary" size="lg" className="col-span-2 rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 border-none" icon={Package} onClick={() => handleReceiveStock(item)}>Restock Asset</AppButton>
                                )}
                            </div>
                        </div>
                    )}
                />
            </div>
        </div>
      </div>

      {/* Main Add/Edit Modal */}
      <AppModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? "Update Asset Protocol" : "Enroll New Asset"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <FormInput label="Asset Name" icon={Tag} required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <FormSelect 
                    label="Sub-Category Protocol"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    options={[
                        { value: 'Rice & Curry', label: 'Rice & Curry' },
                        { value: 'String Hoppers', label: 'String Hoppers' },
                        { value: 'Eggs & Extras', label: 'Eggs & Extras' },
                        { value: 'Fried Rice - Single Portion', label: 'Fried Rice - Single Portion' },
                        { value: 'Fried Rice - Double Portion', label: 'Fried Rice - Double Portion' },
                        { value: 'Noodles - Single Portion', label: 'Noodles - Single Portion' },
                        { value: 'Noodles - Double Portion', label: 'Noodles - Double Portion' },
                        { value: 'Kottu - Single Portion', label: 'Kottu - Single Portion' },
                        { value: 'Kottu - Double Portion', label: 'Kottu - Double Portion' },
                        { value: 'Devilled / Stew / Fried - 250g', label: 'Devilled / Stew / Fried - 250g' },
                        { value: 'Seafood Specials', label: 'Seafood Specials' },
                        { value: 'Beverage', label: 'Beverage' },
                        { value: 'Dessert', label: 'Dessert' },
                        { value: 'Restricted Retail', label: 'Restricted Retail' },
                        { value: 'Beverages', label: 'Beverages' },
                        { value: 'Snacks', label: 'Snacks' },
                        { value: 'Small Retail', label: 'Small Retail' },
                        { value: 'Packing / Extras', label: 'Packing / Extras' },
                        { value: 'Local Counter Items', label: 'Local Counter Items' }
                    ]}
                />
            </div>

            <div className="p-4 lg:p-6 bg-slate-50 rounded-2xl lg:rounded-[32px] border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="Short Code" placeholder="e.g. CFR, CK" value={formData.short_code} onChange={e => setFormData({...formData, short_code: e.target.value})} />
                <FormSelect 
                    label="Main Category"
                    value={formData.main_category}
                    onChange={e => setFormData({...formData, main_category: e.target.value})}
                    options={[
                        { value: '', label: 'No Group' },
                        { value: 'Rice & Curry', label: 'Rice & Curry' },
                        { value: 'Fried Rice', label: 'Fried Rice' },
                        { value: 'Noodles', label: 'Noodles' },
                        { value: 'Kottu', label: 'Kottu' },
                        { value: 'Eggs & Extras', label: 'Eggs & Extras' },
                        { value: 'Seafood Specials', label: 'Seafood Specials' },
                        { value: 'Devilled / Stew / Fried', label: 'Devilled / Stew / Fried' },
                        { value: 'Beverages', label: 'Beverages' },
                        { value: 'Retail', label: 'Retail' }
                    ]}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormSelect 
                    label="Portion Type"
                    value={formData.portion_type}
                    onChange={e => setFormData({...formData, portion_type: e.target.value})}
                    options={[
                        { value: 'regular', label: 'Regular' },
                        { value: 'single', label: 'Single' },
                        { value: 'double', label: 'Double' },
                        { value: '250g', label: '250g' }
                    ]}
                />
                <div className="flex items-center justify-between sm:justify-start gap-4 pt-2 sm:pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={formData.is_popular} 
                            onChange={e => setFormData({...formData, is_popular: e.target.checked})}
                            className="w-5 h-5 rounded-lg border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[10px] lg:text-xs font-black text-slate-700 uppercase tracking-widest">Popular</span>
                    </label>
                    <FormInput label="Order" type="number" className="w-20" value={formData.display_order} onChange={e => setFormData({...formData, display_order: e.target.value})} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="Price (Rs.)" type="number" icon={DollarSign} required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                <FormInput label="Portion Label" placeholder="e.g. Large, 250g" value={formData.portion_label} onChange={e => setFormData({...formData, portion_label: e.target.value})} />
            </div>

            <FormInput label="Description" placeholder="Optional notes..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormSelect 
                    label="System Status"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    options={[
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' }
                    ]}
                />
                <FormSelect 
                    label="Availability"
                    value={formData.availability_status}
                    onChange={e => setFormData({...formData, availability_status: e.target.value})}
                    options={[
                        { value: 'available', label: 'Available' },
                        { value: 'sold_out', label: 'Sold Out' },
                        { value: 'temporarily_unavailable', label: 'Unavailable' }
                    ]}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <FormSelect 
                    label="Item Type"
                    value={formData.item_type}
                    onChange={e => {
                        const type = e.target.value;
                        let newForm = {...formData, item_type: type};
                        if (type === 'food') {
                            newForm.send_to_kitchen = true;
                            newForm.no_receipt_default = false;
                        } else if (type === 'beverage' || type === 'retail') {
                            newForm.send_to_kitchen = false;
                            newForm.quick_sale_enabled = true;
                            newForm.is_quick_retail = true;
                            newForm.no_receipt_default = true;
                            newForm.show_in_quick_bar = true;
                        } else if (type === 'restricted_retail') {
                            newForm.send_to_kitchen = false;
                            newForm.age_restricted = true;
                            newForm.requires_age_confirmation = true;
                            newForm.quick_sale_enabled = true;
                            newForm.is_quick_retail = true;
                            newForm.no_receipt_default = true;
                            newForm.show_in_quick_bar = true;
                        }
                        setFormData(newForm);
                    }}
                    options={[
                        { value: 'food', label: 'Food' },
                        { value: 'beverage', label: 'Beverage' },
                        { value: 'retail', label: 'Retail' },
                        { value: 'restricted_retail', label: 'Restricted Retail' },
                        { value: 'service', label: 'Service' }
                    ]}
                />
                <FormSelect 
                    label="Unit Type"
                    value={formData.unit_type}
                    onChange={e => setFormData({...formData, unit_type: e.target.value})}
                    options={[
                        { value: 'item', label: 'Item' },
                        { value: 'bottle', label: 'Bottle' },
                        { value: 'pack', label: 'Pack' },
                        { value: 'stick', label: 'Stick' },
                        { value: 'portion', label: 'Portion' }
                    ]}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput 
                    label="Packs Size (Sticks per Pack)" 
                    type="number"
                    value={formData.pack_size} 
                    onChange={e => setFormData({...formData, pack_size: e.target.value})} 
                />
                <FormSelect 
                    label="Default Purchase Unit"
                    value={formData.purchase_unit_type}
                    onChange={e => setFormData({...formData, purchase_unit_type: e.target.value})}
                    options={[
                        { value: 'pack', label: 'Pack' },
                        { value: 'carton', label: 'Carton' },
                        { value: 'box', label: 'Box' },
                        { value: 'item', label: 'Item' }
                    ]}
                />
            </div>

            <div className="p-5 lg:p-6 bg-slate-900 rounded-[28px] lg:rounded-3xl space-y-4 lg:space-y-6 border border-slate-800 shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-[9px] lg:text-[10px] font-black text-indigo-400 uppercase tracking-widest">Inventory Management</label>
                        <p className="text-[8px] lg:text-[10px] text-slate-500 font-bold">Track stock and alerts</p>
                    </div>
                    <button 
                        type="button"
                        onClick={() => setFormData({...formData, track_stock: !formData.track_stock})}
                        className={cn("w-12 h-6 lg:w-14 lg:h-7 rounded-full transition-all relative ring-4", formData.track_stock ? "bg-indigo-600 ring-indigo-900/50" : "bg-slate-700 ring-slate-800/50")}
                    >
                        <div className={cn("absolute top-1 w-4 h-4 lg:w-5 lg:h-5 bg-white rounded-full shadow-lg transition-all", formData.track_stock ? "right-1" : "left-1")}></div>
                    </button>
                </div>

                {formData.track_stock && (
                    <div className="grid grid-cols-2 gap-4 lg:gap-6 animate-in zoom-in-95 duration-300">
                        <div>
                            <label className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Quantity</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-800 border-2 border-transparent rounded-xl lg:rounded-2xl py-2 lg:py-3 px-3 lg:px-4 text-white font-black outline-none focus:border-indigo-500 transition-all text-sm"
                                value={formData.stock_qty} 
                                onChange={e => setFormData({...formData, stock_qty: e.target.value})} 
                            />
                        </div>
                        <div>
                            <label className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Low Alert</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-800 border-2 border-transparent rounded-xl lg:rounded-2xl py-2 lg:py-3 px-3 lg:px-4 text-white font-black outline-none focus:border-indigo-500 transition-all text-sm"
                                value={formData.low_stock_threshold} 
                                onChange={e => setFormData({...formData, low_stock_threshold: e.target.value})} 
                            />
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex gap-4 pt-4">
                <AppButton variant="secondary" className="flex-1 py-6 rounded-[24px] font-black uppercase tracking-[0.2em] text-xs" type="button" onClick={() => setShowModal(false)}>Abort</AppButton>
                <AppButton variant="primary" className="flex-[2] py-6 rounded-[24px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-500/20 bg-indigo-600 border-none" type="submit">Commit Changes</AppButton>
            </div>
        </form>
      </AppModal>
    </div>
  );
};

export default ItemsPage;
