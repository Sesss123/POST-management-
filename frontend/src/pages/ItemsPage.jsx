import React, { useState, useEffect } from 'react';
import { itemApi } from '../api/api';
import { Package, Plus, Search, Tag, DollarSign, Filter, Edit, Trash2, Eye, EyeOff, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { AppButton, AppCard, AppTable, StatusBadge, AppModal, FormInput, FormSelect, useToast, ResponsiveDataList } from '../components/ui';
import { cn } from '../utils/cn';

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
    pack_size: 20
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
        pack_size: 20
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
      show_in_quick_bar: item.show_in_quick_bar === 1 || item.show_in_quick_bar === true
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 lg:gap-0">
        <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-10 h-10 lg:w-14 lg:h-14 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl lg:rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200 ring-4 ring-white shrink-0">
                <Package size={20} className="lg:w-7 lg:h-7" />
            </div>
            <div>
                <h1 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tight uppercase lg:normal-case">Menu & Items</h1>
                <p className="text-slate-500 font-medium italic text-[10px] lg:text-sm">Configure your restaurant's food and drink offerings</p>
            </div>
        </div>
        <AppButton icon={Plus} size="lg" className="w-full sm:w-auto uppercase tracking-widest text-[10px] lg:text-xs font-black" onClick={() => { resetForm(); setEditingItem(null); setShowModal(true); }}>Add New Item</AppButton>
      </header>

      <AppCard className="overflow-visible">
        <div className="flex flex-col lg:flex-row gap-4 mb-6 lg:mb-8">
            <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors lg:w-5 lg:h-5" size={18} />
                <input 
                    type="text" 
                    placeholder="Search items..." 
                    className="w-full bg-slate-50 border-2 border-transparent rounded-[20px] lg:rounded-[24px] py-3 lg:py-4 pl-12 pr-4 text-slate-900 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner text-sm lg:text-base"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="flex gap-2">
                <select 
                    className="flex-1 lg:flex-none bg-slate-50 border-2 border-transparent rounded-[16px] lg:rounded-[20px] px-3 lg:px-4 py-2 text-[10px] lg:text-xs font-black text-slate-700 outline-none focus:border-indigo-600 transition-all shadow-sm"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <select 
                    className="flex-1 lg:flex-none bg-slate-50 border-2 border-transparent rounded-[16px] lg:rounded-[20px] px-3 lg:px-4 py-2 text-[10px] lg:text-xs font-black text-slate-700 outline-none focus:border-indigo-600 transition-all shadow-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="All">All Status</option>
                    <option value="available">Available</option>
                    <option value="sold_out">Sold Out</option>
                    <option value="temporarily_unavailable">Unavailable</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>
        </div>

        <ResponsiveDataList 
            loading={loading}
            data={filteredItems}
            headers={[
                { label: 'Item Details' },
                { label: 'Category' },
                { label: 'Price', className: 'text-right' },
                { label: 'Inventory', className: 'text-center' },
                { label: 'Availability', className: 'text-center' },
                { label: 'Actions', className: 'text-right' }
            ]}
            renderRow={(item) => (
                <tr key={item.id} className={cn("hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0", item.status === 'inactive' && "opacity-60 grayscale bg-slate-50/30")}>
                    <td className="py-5">
                        <div className="flex flex-col">
                            <p className="font-black text-slate-900 leading-tight">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                {item.short_code && <span className="text-indigo-600 font-black mr-2">[{item.short_code}]</span>}
                                {item.portion_label || 'Single'} • {item.status.toUpperCase()}
                                {item.is_popular && <span className="ml-2 text-amber-500 font-black">★ POPULAR</span>}
                            </p>
                        </div>
                    </td>
                    <td className="py-5">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest">{item.category}</span>
                    </td>
                    <td className="py-5 text-right">
                        <button 
                            onClick={() => { setPriceItem(item); setNewPrice(item.price); setShowPriceModal(true); }}
                            className="font-black text-indigo-600 hover:scale-110 transition-transform flex items-center justify-end gap-1 ml-auto group"
                        >
                            Rs. {parseFloat(item.price).toLocaleString()}
                            <Edit size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </td>
                    <td className="py-5 text-center">
                        {item.track_stock ? (
                            <div className="inline-flex flex-col items-center p-2 bg-slate-50 rounded-xl border border-slate-100">
                                <span className={cn("font-black text-xs", parseFloat(item.stock_qty) <= parseFloat(item.low_stock_threshold) ? "text-rose-600" : "text-slate-900")}>
                                    {item.stock_qty}
                                </span>
                                <span className="text-[8px] text-slate-400 uppercase font-bold">Min: {item.low_stock_threshold}</span>
                            </div>
                        ) : (
                            <span className="text-[8px] text-slate-300 uppercase font-black tracking-widest">No Track</span>
                        )}
                    </td>
                    <td className="py-5 text-center">
                        <div className="flex flex-col items-center gap-1">
                            {getAvailabilityBadge(item.availability_status)}
                            <div className="flex gap-1 mt-1">
                                <button onClick={() => { setAvailabilityItem({...item, nextStatus: 'available'}); setShowAvailabilityModal(true); }} className="p-1 hover:bg-emerald-100 rounded transition-colors text-emerald-600" title="Mark Available"><CheckCircle2 size={12} /></button>
                                <button onClick={() => { setAvailabilityItem({...item, nextStatus: 'sold_out'}); setShowAvailabilityModal(true); }} className="p-1 hover:bg-rose-100 rounded transition-colors text-rose-600" title="Mark Sold Out"><XCircle size={12} /></button>
                                <button onClick={() => { setAvailabilityItem({...item, nextStatus: 'temporarily_unavailable'}); setShowAvailabilityModal(true); }} className="p-1 hover:bg-amber-100 rounded transition-colors text-amber-600" title="Mark Unavailable"><Clock size={12} /></button>
                            </div>
                        </div>
                    </td>
                    <td className="py-5 text-right">
                        <div className="flex justify-end gap-1">
                            <AppButton variant="ghost" size="sm" icon={Edit} onClick={() => handleEdit(item)} />
                            {item.track_stock === 1 && (
                                <AppButton variant="ghost" size="sm" icon={Package} onClick={() => handleReceiveStock(item)} className="text-indigo-600" />
                            )}
                            <AppButton 
                                variant="ghost" 
                                size="sm" 
                                icon={item.status === 'active' ? EyeOff : Eye} 
                                onClick={() => toggleStatus(item)}
                                className={item.status === 'active' ? "text-slate-400" : "text-emerald-600"}
                            />
                            <AppButton 
                                variant="ghost" 
                                size="sm" 
                                icon={Trash2} 
                                onClick={() => handleDelete(item)}
                                className="text-rose-400 hover:text-rose-600"
                            />
                        </div>
                    </td>
                </tr>
            )}
            renderCard={(item) => (
                <div key={item.id} className={cn("p-5 space-y-4", item.status === 'inactive' && "opacity-60 grayscale")}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category} • {item.portion_label || 'Single'}</p>
                        </div>
                        {getAvailabilityBadge(item.availability_status)}
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-y border-slate-50">
                        <div className="flex flex-col">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Price</p>
                            <p className="text-sm font-black text-indigo-600">Rs. {parseFloat(item.price).toLocaleString()}</p>
                        </div>
                        {item.track_stock && (
                            <div className="text-right">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock</p>
                                <p className={cn("text-sm font-black", parseFloat(item.stock_qty) <= parseFloat(item.low_stock_threshold) ? "text-rose-500" : "text-slate-900")}>{item.stock_qty}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <AppButton variant="secondary" size="sm" className="px-2" icon={Edit} onClick={() => handleEdit(item)} />
                        <AppButton variant="secondary" size="sm" className="px-2" icon={DollarSign} onClick={() => { setPriceItem(item); setNewPrice(item.price); setShowPriceModal(true); }} />
                        <AppButton variant="secondary" size="sm" className="px-2 text-rose-500" icon={Trash2} onClick={() => handleDelete(item)} />
                        {item.track_stock === 1 && (
                            <AppButton variant="secondary" size="sm" className="flex-1" icon={Package} onClick={() => handleReceiveStock(item)}>Stock</AppButton>
                        )}
                        <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
                            <button onClick={() => { setAvailabilityItem({...item, nextStatus: 'available'}); setShowAvailabilityModal(true); }} className="p-2 hover:bg-white text-emerald-600 rounded-lg shadow-sm transition-all"><CheckCircle2 size={14} /></button>
                            <button onClick={() => { setAvailabilityItem({...item, nextStatus: 'sold_out'}); setShowAvailabilityModal(true); }} className="p-2 hover:bg-white text-rose-600 rounded-lg shadow-sm transition-all"><XCircle size={14} /></button>
                            <button onClick={() => { setAvailabilityItem({...item, nextStatus: 'temporarily_unavailable'}); setShowAvailabilityModal(true); }} className="p-2 hover:bg-white text-amber-600 rounded-lg shadow-sm transition-all"><Clock size={14} /></button>
                        </div>
                    </div>
                </div>
            )}
        />
      </AppCard>

      {/* Main Add/Edit Modal */}
      <AppModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? "Update Menu Item" : "Add Menu Item"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <FormInput label="Item Name" icon={Tag} required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <FormSelect 
                    label="Sub-Category"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="Barcode (Optional)" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                
                <div className="flex flex-col gap-2 justify-center">
                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                        <input 
                            type="checkbox" 
                            checked={formData.send_to_kitchen} 
                            onChange={e => setFormData({...formData, send_to_kitchen: e.target.checked})}
                            className="w-5 h-5 rounded-lg border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[10px] lg:text-xs font-black text-slate-700 uppercase tracking-widest">Send to Kitchen (KOT)</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={formData.is_quick_retail} 
                            onChange={e => setFormData({...formData, is_quick_retail: e.target.checked})}
                            className="w-5 h-5 rounded-lg border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[10px] lg:text-xs font-black text-slate-700 uppercase tracking-widest">Quick Retail (No-Bill)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={formData.is_restaurant_item} 
                            onChange={e => setFormData({...formData, is_restaurant_item: e.target.checked})}
                            className="w-5 h-5 rounded-lg border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[10px] lg:text-xs font-black text-slate-700 uppercase tracking-widest">Restaurant Menu Item</span>
                    </label>
                </div>
            </div>

            {formData.item_type === 'restricted_retail' && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex flex-col gap-2">
                    <p className="text-xs font-bold text-rose-700 uppercase">Age Restriction Settings</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={formData.age_restricted} 
                            onChange={e => setFormData({...formData, age_restricted: e.target.checked})}
                            className="w-5 h-5 rounded-lg border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[10px] lg:text-xs font-black text-slate-700 uppercase tracking-widest">Age Restricted Item</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={formData.requires_age_confirmation} 
                            onChange={e => setFormData({...formData, requires_age_confirmation: e.target.checked})}
                            className="w-5 h-5 rounded-lg border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[10px] lg:text-xs font-black text-slate-700 uppercase tracking-widest">Require Age Confirmation on Checkout</span>
                    </label>
                </div>
            )}
            
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
                <AppButton variant="secondary" className="flex-1" type="button" onClick={() => setShowModal(false)}>Cancel</AppButton>
                <AppButton variant="primary" className="flex-1" type="submit">Save Menu Item</AppButton>
            </div>
        </form>
      </AppModal>

      {/* Price Update Modal */}
      <AppModal isOpen={showPriceModal} onClose={() => setShowPriceModal(false)} title="Update Price" size="sm">
          <form onSubmit={handleUpdatePrice} className="space-y-6">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mb-4">
                  <p className="text-xs font-bold text-indigo-700 uppercase">Current Item</p>
                  <p className="text-lg font-black text-slate-900">{priceItem?.name}</p>
              </div>
              <FormInput label="New Price (Rs.)" type="number" icon={DollarSign} autoFocus required value={newPrice} onChange={e => setNewPrice(e.target.value)} />
              <div className="flex gap-3">
                  <AppButton variant="secondary" className="flex-1" type="button" onClick={() => setShowPriceModal(false)}>Cancel</AppButton>
                  <AppButton variant="primary" className="flex-1" type="submit">Update Price</AppButton>
              </div>
          </form>
      </AppModal>

      {/* Availability Update Modal */}
      <AppModal isOpen={showAvailabilityModal} onClose={() => setShowAvailabilityModal(false)} title="Change Availability" size="sm">
          <form onSubmit={handleUpdateAvailability} className="space-y-6">
              <div className={cn(
                  "p-4 rounded-2xl border mb-4",
                  availabilityItem?.nextStatus === 'available' ? "bg-emerald-50 border-emerald-100" :
                  availabilityItem?.nextStatus === 'sold_out' ? "bg-rose-50 border-rose-100" : "bg-amber-50 border-amber-100"
              )}>
                  <p className="text-[10px] font-black uppercase mb-1">Set Status To</p>
                  <p className="text-xl font-black uppercase tracking-tighter">
                      {availabilityItem?.nextStatus?.replace('_', ' ') || ''}
                  </p>
              </div>
              <FormInput label="Reason (Optional)" icon={Clock} placeholder="e.g. Out of stock, Kitchen busy..." value={availabilityReason} onChange={e => setAvailabilityReason(e.target.value)} />
              <div className="flex gap-3">
                  <AppButton variant="secondary" className="flex-1" type="button" onClick={() => setShowAvailabilityModal(false)}>Cancel</AppButton>
                  <AppButton 
                    className="flex-1" 
                    variant={availabilityItem?.nextStatus === 'available' ? 'primary' : 'danger'} 
                    type="submit"
                  >
                      Confirm Change
                  </AppButton>
              </div>
          </form>
      </AppModal>
      {/* Receive Stock Modal */}
      <AppModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        title={`Receive Stock: ${receiveItem?.name || ''}`}
      >
        <form onSubmit={submitReceiveStock} className="space-y-6">
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 mb-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-indigo-900">Current Stock</p>
                    <p className="text-xl font-black text-indigo-600">{receiveItem?.stock_qty} {receiveItem?.unit_type}s</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormSelect
                    label="Purchase Unit"
                    value={receiveData.purchase_unit_type}
                    onChange={(e) => setReceiveData({...receiveData, purchase_unit_type: e.target.value})}
                    options={[
                        { label: 'Pack', value: 'pack' },
                        { label: 'Carton', value: 'carton' },
                        { label: 'Bottle', value: 'bottle' },
                        { label: 'Packet', value: 'packet' },
                        { label: 'Item', value: 'item' }
                    ]}
                />
                <FormInput
                    label="Qty of Purchase Units"
                    type="number"
                    step="0.01"
                    value={receiveData.purchase_unit_qty}
                    onChange={(e) => setReceiveData({...receiveData, purchase_unit_qty: e.target.value})}
                    placeholder="e.g. 10 packs"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormInput
                    label="Units Per Pack"
                    type="number"
                    value={receiveData.units_per_purchase_unit}
                    onChange={(e) => setReceiveData({...receiveData, units_per_purchase_unit: e.target.value})}
                    required
                />
                <div className="flex flex-col justify-end">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sticks Added</p>
                        <p className="text-lg font-black text-indigo-600">
                            {(parseFloat(receiveData.purchase_unit_qty || 0) * parseInt(receiveData.units_per_purchase_unit || 1)).toFixed(0)}
                        </p>
                    </div>
                </div>
            </div>

            <FormInput
                label="Cost Per Purchase Unit (Optional)"
                type="number"
                step="0.01"
                value={receiveData.cost_per_purchase_unit}
                onChange={(e) => setReceiveData({...receiveData, cost_per_purchase_unit: e.target.value})}
                placeholder="e.g. 1500"
            />

            <FormInput
                label="Note"
                value={receiveData.note}
                onChange={(e) => setReceiveData({...receiveData, note: e.target.value})}
                placeholder="Reason for receiving stock"
            />

            <div className="flex justify-end gap-3 pt-4">
                <AppButton type="button" variant="ghost" onClick={() => setShowReceiveModal(false)}>Cancel</AppButton>
                <AppButton type="submit" variant="primary">Confirm Receipt</AppButton>
            </div>
        </form>
      </AppModal>
    </div>
  );
};

export default ItemsPage;
