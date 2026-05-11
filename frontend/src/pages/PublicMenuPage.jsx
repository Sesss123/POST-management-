import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
    Search, Utensils, Info, Phone, MapPin, 
    ChevronRight, Star, Flame, Leaf, ArrowLeft, 
    X, Grid, List as ListIcon, Filter, Clock
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

import { API_BASE_URL } from '../api/config';

const PublicMenuPage = () => {
    const { t, i18n } = useTranslation();
    const { tableNo, shopIdentifier } = useParams();
    const [loading, setLoading] = useState(true);
    const [menuData, setMenuData] = useState(null);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        fetchMenu();
    }, [tableNo]);

    const fetchMenu = async () => {
        try {
            const slug = shopIdentifier || 'default';
            const res = await axios.get(`${API_BASE_URL}/api/public-menu/${slug}/table/${tableNo || 'walk-in'}`);
            setMenuData(res.data.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch menu:', err);
            if (err.response?.status === 403) {
                setMenuData({ disabled: true, message: err.response.data.message });
            } else if (err.response?.status === 404) {
                setMenuData({ disabled: true, message: 'Restaurant not found.' });
            }
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-rose-100 rounded-full"></div>
                    <div className="w-20 h-20 border-4 border-rose-900 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                    <Utensils className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-900" size={24} />
                </div>
                <h2 className="text-xl font-black text-stone-900 mt-6 tracking-tight uppercase">Setting the Table</h2>
                <p className="text-stone-500 italic text-sm mt-1">Fetching our freshest menu items...</p>
            </div>
        );
    }

    if (menuData?.disabled) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-rose-50 text-rose-900 rounded-[40px] flex items-center justify-center mb-8 rotate-3 shadow-sm border border-rose-100">
                    <Clock size={48} />
                </div>
                <h2 className="text-3xl font-black text-stone-900 tracking-tight uppercase leading-none">Menu Offline</h2>
                <p className="text-stone-600 mt-4 max-w-xs leading-relaxed font-medium">{menuData.message || 'We are currently updating our digital menu. Please check back shortly.'}</p>
                <div className="mt-10 px-8 py-5 bg-white rounded-[32px] border border-stone-100 shadow-xl shadow-stone-200/50 text-xs font-bold text-stone-400 italic">
                    Please refer to our physical menu or ask our team for assistance.
                </div>
            </div>
        );
    }

    if (!menuData || !menuData.restaurant) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-rose-50 text-rose-900 rounded-3xl flex items-center justify-center mb-6">
                    <X size={40} />
                </div>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">MENU UNAVAILABLE</h2>
                <p className="text-stone-500 mb-8 max-w-xs">We couldn't load the menu for this table. Please ask our staff for assistance.</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="px-10 py-4 bg-rose-900 text-white rounded-[24px] font-black uppercase tracking-widest text-sm shadow-2xl shadow-rose-900/30 active:scale-95 transition-all"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const { restaurant, items, categories, settings } = menuData;

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                             item.category.toLowerCase().includes(search.toLowerCase()) ||
                             (item.public_description && item.public_description.toLowerCase().includes(search.toLowerCase()));
        const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const featuredItems = items.filter(item => item.is_featured);

    const SpiceBadge = ({ level }) => {
        if (!level || level === 'none') return null;
        const count = level === 'mild' ? 1 : level === 'medium' ? 2 : level === 'spicy' ? 3 : 4;
        const label = level.charAt(0).toUpperCase() + level.slice(1);
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full border border-rose-100 shadow-sm">
                <div className="flex gap-0.5">
                    {[...Array(count)].map((_, i) => <Flame key={i} size={10} fill="currentColor" />)}
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] pb-32 font-sans selection:bg-rose-100 selection:text-rose-900 overflow-x-hidden">
            {/* Premium Hero Header */}
            <div className="relative pt-16 pb-20 px-8 overflow-hidden bg-rose-950">
                {/* Abstract background decorations */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-900 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600 rounded-full blur-[80px] opacity-10 -ml-20 -mb-20"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-3xl border border-white/20 shadow-2xl">
                            {restaurant.logo_url ? (
                                <img src={restaurant.logo_url} alt={restaurant.name} className="w-12 h-12 object-contain" />
                            ) : (
                                <Utensils className="text-white" size={28} />
                            )}
                        </div>
                        {tableNo && (
                            <div className="px-5 py-2.5 bg-amber-500 text-amber-950 rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 border border-amber-400">
                                Table {tableNo}
                            </div>
                        )}
                        <LanguageSwitcher className="ml-4" showLabel={false} />
                    </div>
                    
                    <h1 className="text-4xl font-black text-white tracking-tighter leading-[0.9] mb-4 drop-shadow-sm">{restaurant.name}</h1>
                    <p className="text-rose-100/70 text-sm font-medium max-w-[280px] leading-relaxed italic">
                        {t('public_menu.tell_waiter')}
                    </p>
                    
                    <div className="mt-8 flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2 text-rose-100/60 text-[10px] font-black uppercase tracking-widest">
                            <MapPin size={14} className="text-amber-500" /> {restaurant.address || 'Colombo, Sri Lanka'}
                        </div>
                        {restaurant.phone && (
                            <div className="flex items-center gap-2 text-rose-100/60 text-[10px] font-black uppercase tracking-widest border-l border-white/10 pl-4">
                                <Phone size={14} className="text-amber-500" /> {restaurant.phone}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Interaction Bar */}
            <div className="sticky top-0 z-50 px-6 -mt-10">
                <div className="bg-white/80 backdrop-blur-xl p-3 rounded-[32px] shadow-2xl shadow-stone-300/50 border border-white/50 flex flex-col gap-4">
                    <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                        <input 
                            type="text" 
                            placeholder={t('public_menu.search_placeholder')}
                            className="w-full bg-stone-50 border-none rounded-[24px] py-4 pl-12 pr-6 text-stone-900 font-bold placeholder:text-stone-300 outline-none focus:ring-2 focus:ring-rose-900/5 transition-all text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    
                    <div className="overflow-x-auto no-scrollbar flex gap-2 pb-1">
                        <button 
                            onClick={() => setActiveCategory('All')}
                            className={cn(
                                "px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2",
                                activeCategory === 'All' 
                                ? "bg-rose-900 text-white border-rose-900 shadow-lg shadow-rose-900/20 scale-105" 
                                : "bg-white text-stone-400 border-stone-50 hover:border-rose-100"
                            )}
                        >
                            {t('public_menu.all_menu')}
                        </button>
                        {categories.map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={cn(
                                    "px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2",
                                    activeCategory === cat 
                                    ? "bg-rose-900 text-white border-rose-900 shadow-lg shadow-rose-900/20 scale-105" 
                                    : "bg-white text-stone-400 border-stone-50 hover:border-rose-100"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Featured Section: Chef's Picks */}
            {activeCategory === 'All' && !search && featuredItems.length > 0 && (
                <div className="mt-12">
                    <div className="px-8 flex justify-between items-end mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-8 h-[2px] bg-amber-500"></span>
                                <p className="text-[10px] text-amber-600 font-black uppercase tracking-[0.2em]">Signature</p>
                            </div>
                            <h2 className="text-3xl font-black text-stone-900 tracking-tighter uppercase">{t('public_menu.featured_items')}</h2>
                        </div>
                    </div>
                    
                    <div className="px-8 overflow-x-auto no-scrollbar flex gap-6 pb-6">
                        {featuredItems.map(item => (
                            <div 
                                key={item.uuid} 
                                onClick={() => setSelectedItem(item)}
                                className="w-[300px] bg-white rounded-[40px] border border-stone-100 shadow-xl shadow-stone-200/40 flex-shrink-0 overflow-hidden group active:scale-95 transition-all relative"
                            >
                                <div className="h-48 bg-stone-100 relative overflow-hidden">
                                    {settings.show_images && item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50 text-rose-100">
                                            <Utensils size={48} />
                                        </div>
                                    )}
                                    <div className="absolute top-5 right-5 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl">
                                        <Star size={16} className="text-amber-500 fill-amber-500" />
                                    </div>
                                    {item.availability_status !== 'available' && (
                                        <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center">
                                            <div className="px-6 py-2 bg-white text-stone-900 font-black text-[10px] uppercase tracking-widest rounded-full shadow-2xl">
                                                {item.availability_status === 'sold_out' ? t('public_menu.sold_out') : t('public_menu.unavailable')}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-7">
                                    <h3 className="text-lg font-black text-stone-900 mb-1 truncate leading-tight">{item.name}</h3>
                                    <p className="text-[11px] text-stone-400 font-bold uppercase tracking-widest mb-4">{item.category}</p>
                                    <div className="flex justify-between items-center">
                                        {settings.show_prices ? (
                                            <p className="text-xl font-black text-rose-900 tracking-tighter">Rs. {parseFloat(item.price).toLocaleString()}</p>
                                        ) : (
                                            <div className="h-6"></div>
                                        )}
                                        <div className="w-10 h-10 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-300">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Menu Grid */}
            <div className="mt-12 px-8">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-8 h-[2px] bg-rose-900"></span>
                            <p className="text-[10px] text-rose-900 font-black uppercase tracking-[0.2em]">Menu</p>
                        </div>
                        <h2 className="text-3xl font-black text-stone-900 tracking-tighter uppercase">{activeCategory}</h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map(item => (
                        <div 
                            key={item.uuid} 
                            onClick={() => setSelectedItem(item)}
                            className={cn(
                                "bg-white rounded-[32px] border border-stone-100 shadow-sm overflow-hidden active:scale-[0.98] transition-all flex flex-col group",
                                item.availability_status !== 'available' && "opacity-75"
                            )}
                        >
                            {settings.show_images && (
                                <div className="h-44 bg-stone-50 relative overflow-hidden">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-stone-50 text-stone-100">
                                            <Utensils size={32} />
                                        </div>
                                    )}
                                    {item.availability_status !== 'available' && (
                                        <div className="absolute inset-0 bg-stone-100/40 backdrop-blur-[1px] flex items-center justify-center">
                                            <div className="px-4 py-1.5 bg-stone-900 text-white font-black text-[9px] uppercase tracking-widest rounded-full shadow-lg">
                                                {t('public_menu.sold_out')}
                                            </div>
                                        </div>
                                    )}
                                    {item.is_veg && (
                                        <div className="absolute top-4 left-4 w-7 h-7 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg border border-emerald-400">
                                            <Leaf size={14} className="text-white" fill="currentColor" />
                                        </div>
                                    )}
                                    {item.is_featured && (
                                        <div className="absolute top-4 right-4 w-7 h-7 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg border border-amber-400">
                                            <Star size={14} className="text-amber-950 fill-amber-950" />
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="mb-4">
                                    <h3 className="text-base font-black text-stone-900 leading-tight mb-1 group-hover:text-rose-900 transition-colors">{item.name}</h3>
                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{item.category} {item.portion_label && `• ${item.portion_label}`}</p>
                                </div>
                                <p className="text-xs text-stone-500 line-clamp-2 italic mb-6 leading-relaxed flex-1">
                                    {item.public_description || "Traditional recipe prepared with our finest ingredients."}
                                </p>
                                <div className="flex justify-between items-center pt-4 border-t border-stone-50">
                                    <div className="flex gap-2">
                                        <SpiceBadge level={item.spice_level} />
                                    </div>
                                    {settings.show_prices && (
                                        <p className="text-lg font-black text-rose-900 tracking-tighter">Rs. {parseFloat(item.price).toLocaleString()}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredItems.length === 0 && (
                    <div className="py-24 text-center">
                        <div className="w-20 h-20 bg-stone-50 rounded-[32px] flex items-center justify-center text-stone-200 mx-auto mb-6">
                            <Search size={32} />
                        </div>
                        <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">{t('common.no_data')}</h3>
                        <p className="text-stone-400 mt-2 font-medium italic">{t('public_menu.search_placeholder')}</p>
                    </div>
                )}
            </div>

            {/* Footer with instructions */}
            <div className="mt-20 px-8 text-center border-t border-stone-100 pt-16">
                <div className="bg-rose-900 p-8 rounded-[40px] shadow-2xl shadow-rose-900/20 mb-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-amber-500/10 transition-all duration-700"></div>
                    <p className="text-[11px] font-black text-rose-200 uppercase tracking-[0.3em] mb-4">Ready to Order?</p>
                    <h3 className="text-xl font-black text-white leading-tight mb-4">{t('public_menu.tell_waiter')}</h3>
                    <div className="w-12 h-1 bg-amber-500 mx-auto rounded-full"></div>
                </div>

                <div className="space-y-4 opacity-50">
                    <p className="text-[10px] text-stone-400 font-black uppercase tracking-[0.2em]">{restaurant.name}</p>
                    <p className="text-[10px] text-stone-400 font-medium max-w-[240px] mx-auto italic leading-relaxed">
                        {restaurant.address} • {restaurant.phone}
                    </p>
                    <p className="text-[9px] text-stone-300 font-black uppercase tracking-widest pt-4">Powered by RestoLedger POS</p>
                </div>
            </div>

            {/* Item Detail Sheet (Modal) */}
            {selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
                    <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedItem(null)}></div>
                    <div className="relative w-full max-w-xl bg-white rounded-t-[48px] sm:rounded-[48px] max-h-[95vh] overflow-y-auto animate-in slide-in-from-bottom duration-500 shadow-2xl no-scrollbar">
                        <div className="sticky top-0 right-0 p-8 flex justify-end z-10 pointer-events-none">
                            <button 
                                onClick={() => setSelectedItem(null)}
                                className="w-12 h-12 bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl flex items-center justify-center text-stone-900 pointer-events-auto active:scale-90 transition-all border border-stone-100"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="px-8 -mt-12 pb-12">
                            <div className="h-[320px] bg-stone-50 rounded-[48px] overflow-hidden mb-10 relative shadow-2xl shadow-stone-200 group">
                                {settings.show_images && selectedItem.image_url ? (
                                    <img src={selectedItem.image_url} alt={selectedItem.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50 text-rose-100">
                                        <Utensils size={80} />
                                    </div>
                                )}
                                {selectedItem.is_veg && (
                                    <div className="absolute top-8 left-8 px-5 py-2.5 bg-emerald-500 text-white rounded-2xl flex items-center gap-2 shadow-2xl border border-emerald-400">
                                        <Leaf size={18} fill="currentColor" />
                                        <span className="text-[11px] font-black uppercase tracking-widest">{t('public_menu.vegetarian')}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-8">
                                <div className="flex justify-between items-start gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-3 py-1 bg-stone-100 text-stone-400 rounded-full text-[9px] font-black uppercase tracking-widest">{selectedItem.category}</span>
                                            {selectedItem.is_featured && <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-widest">Signature</span>}
                                        </div>
                                        <h2 className="text-3xl font-black text-stone-900 tracking-tighter leading-tight">{selectedItem.name}</h2>
                                    </div>
                                    {settings.show_prices && (
                                        <div className="text-right">
                                            <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">Price</p>
                                            <p className="text-3xl font-black text-rose-900 tracking-tighter leading-none">Rs. {parseFloat(selectedItem.price).toLocaleString()}</p>
                                            {selectedItem.portion_label && <p className="text-[11px] text-stone-500 font-bold italic mt-2">{selectedItem.portion_label}</p>}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-6 border-y border-stone-100">
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">Spice Intensity</p>
                                        <SpiceBadge level={selectedItem.spice_level} />
                                    </div>
                                    <div className="space-y-1.5 text-right">
                                        <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">Dietary Type</p>
                                        <p className="text-xs font-black text-stone-900 flex items-center justify-end gap-2">
                                            {selectedItem.is_veg ? <><Leaf size={14} className="text-emerald-500" /> Veg</> : <><Utensils size={14} className="text-rose-500" /> Non-Veg</>}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-stone-900 uppercase tracking-widest flex items-center gap-2 opacity-40">
                                        {t('public_menu.story_behind')}
                                    </h4>
                                    <p className="text-base text-stone-600 leading-relaxed font-medium italic">
                                        {selectedItem.public_description || "A masterfully crafted dish using traditional techniques and the freshest local ingredients. Every bite is designed to take you on a culinary journey."}
                                    </p>
                                </div>

                                <div className="pt-6">
                                    <div className="bg-[#FDFBF7] p-8 rounded-[40px] border border-stone-100 text-center shadow-inner relative overflow-hidden">
                                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-50 rounded-full blur-3xl opacity-50"></div>
                                        <p className="text-[11px] font-black text-rose-900 uppercase tracking-widest mb-3">Order Instruction</p>
                                        <p className="text-sm font-bold text-stone-700 leading-relaxed">
                                            {t('public_menu.order_instruction_text')} <span className="text-rose-900">"{selectedItem.name}"</span>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Badge */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-full px-8 max-w-md">
                <div className="bg-stone-900/90 backdrop-blur-xl py-4 px-8 rounded-full shadow-2xl border border-white/10 flex items-center justify-between animate-in slide-in-from-bottom-10 duration-1000">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-rose-900 rounded-full flex items-center justify-center">
                            <Utensils size={14} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[9px] text-white/40 font-black uppercase tracking-widest leading-none mb-1">Status</p>
                            <p className="text-[11px] text-white font-bold leading-none">{t('public_menu.ready_to_order')}</p>
                        </div>
                    </div>
                    <div className="h-8 w-[1px] bg-white/10 mx-4"></div>
                    <button 
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="text-[10px] font-black text-amber-500 uppercase tracking-widest active:scale-95 transition-transform"
                    >
                        {t('public_menu.back_to_top')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PublicMenuPage;
