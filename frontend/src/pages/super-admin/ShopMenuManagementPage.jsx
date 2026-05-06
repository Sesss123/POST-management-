import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, List, Search, Copy, RefreshCw, Plus, 
    Trash2, Save, Filter, ChevronRight, Store, 
    CheckCircle2, AlertTriangle, Loader2 
} from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useToast } from '../../components/ui/Feedback';
import { cn } from '../../utils/cn';

const ShopMenuManagementPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [cloning, setCloning] = useState(false);
    const [shop, setShop] = useState(null);
    const [items, setItems] = useState([]);
    const [shops, setShops] = useState([]);
    const [search, setSearch] = useState('');
    const [showCloneModal, setShowCloneModal] = useState(false);
    const [cloneForm, setCloneForm] = useState({
        source_type: 'template',
        source_id: 'default'
    });

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [shopRes, itemsRes, shopsRes] = await Promise.all([
                apiClient.get(`/super-admin/shops/${id}`),
                apiClient.get(`/super-admin/shops/${id}/menu`),
                apiClient.get('/super-admin/shops')
            ]);

            if (shopRes.data.success) setShop(shopRes.data.data);
            if (itemsRes.data.success) setItems(itemsRes.data.data);
            if (shopsRes.data.success) setShops(shopsRes.data.data.filter(s => s.id !== parseInt(id)));
        } catch (err) {
            showToast('Failed to fetch shop menu data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClone = async (e) => {
        e.preventDefault();
        setCloning(true);
        try {
            const { data } = await apiClient.post(`/super-admin/shops/${id}/menu/clone`, cloneForm);
            if (data.success) {
                showToast('Menu cloned successfully', 'success');
                setShowCloneModal(false);
                fetchData();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to clone menu', 'error');
        } finally {
            setCloning(false);
        }
    };

    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
                <p className="text-slate-400 font-medium">Loading Shop Menu...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/super-admin/shops')}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <Store size={16} className="text-indigo-400" />
                            <h1 className="text-3xl font-black text-white tracking-tight">
                                {shop?.name} Menu
                            </h1>
                        </div>
                        <p className="text-slate-400 text-sm">Manage items, prices, and templates for this tenant.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowCloneModal(true)}
                        className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-900/20"
                    >
                        <Copy size={18} />
                        Clone Menu / Import
                    </button>
                </div>
            </div>

            {/* Stats & Search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Items</p>
                    <p className="text-2xl font-black text-white">{items.length}</p>
                </div>
                <div className="md:col-span-3 bg-slate-900/50 border border-white/5 rounded-3xl p-2 flex items-center gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                            type="text"
                            placeholder="Search by name or category..."
                            className="w-full bg-transparent pl-12 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Item Details</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Category</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Base Price</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Public</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredItems.map((item) => (
                                <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-5">
                                        <div>
                                            <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{item.name}</p>
                                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.uuid}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-[10px] font-bold">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-black text-white">
                                            {shop?.currency_symbol || 'Rs.'} {parseFloat(item.price).toLocaleString()}
                                        </p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold",
                                            item.status === 'active' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", item.status === 'active' ? "bg-emerald-400" : "bg-rose-400")} />
                                            {item.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        {item.show_on_public_menu ? (
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                        ) : (
                                            <AlertTriangle size={16} className="text-slate-600" />
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-white/5 rounded-full text-slate-600">
                                                <List size={32} />
                                            </div>
                                            <p className="text-slate-400 font-medium">No items found for this shop.</p>
                                            <button 
                                                onClick={() => setShowCloneModal(true)}
                                                className="text-indigo-400 text-sm font-bold hover:underline"
                                            >
                                                Clone from template or another shop
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Clone Modal */}
            {showCloneModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        onClick={() => !cloning && setShowCloneModal(false)}
                    />
                    <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl p-8 space-y-6">
                        <div>
                            <h2 className="text-2xl font-black text-white">Clone Menu</h2>
                            <p className="text-slate-400 text-sm">Import items into {shop?.name}</p>
                        </div>

                        <form onSubmit={handleClone} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Source Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setCloneForm({ source_type: 'template', source_id: 'default' })}
                                        className={cn(
                                            "p-4 rounded-2xl border transition-all text-sm font-bold",
                                            cloneForm.source_type === 'template' ? "bg-indigo-600/10 border-indigo-500/50 text-white" : "bg-slate-950 border-white/5 text-slate-500"
                                        )}
                                    >
                                        Template
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setCloneForm({ source_type: 'shop', source_id: '' })}
                                        className={cn(
                                            "p-4 rounded-2xl border transition-all text-sm font-bold",
                                            cloneForm.source_type === 'shop' ? "bg-indigo-600/10 border-indigo-500/50 text-white" : "bg-slate-950 border-white/5 text-slate-500"
                                        )}
                                    >
                                        Existing Shop
                                    </button>
                                </div>
                            </div>

                            {cloneForm.source_type === 'shop' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Source Shop</label>
                                    <select 
                                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white focus:outline-none"
                                        value={cloneForm.source_id}
                                        onChange={(e) => setCloneForm(p => ({ ...p, source_id: e.target.value }))}
                                        required
                                    >
                                        <option value="">Select shop...</option>
                                        {shops.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.identifier})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                                <p className="text-[11px] text-amber-200/70 leading-relaxed">
                                    <AlertTriangle className="inline mr-1" size={12} />
                                    This will add all items from the source to the current shop. 
                                    Existing items will not be deleted.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setShowCloneModal(false)}
                                    disabled={cloning}
                                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={cloning || (cloneForm.source_type === 'shop' && !cloneForm.source_id)}
                                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                >
                                    {cloning ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                    Clone Menu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopMenuManagementPage;
