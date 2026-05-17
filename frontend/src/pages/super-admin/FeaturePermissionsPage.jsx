
import React, { useState, useEffect } from 'react';
import { 
    Layers, 
    Search, 
    Filter, 
    ArrowUpRight, 
    Truck, 
    Zap, 
    ShoppingCart, 
    ShieldCheck,
    Loader2,
    Store,
    CheckCircle2,
    XCircle,
    Info,
    Sparkles,
    TrendingUp,
    Database,
    Users,
    Wallet,
    BookOpen,
    Calendar,
    Clock,
    LineChart,
    BarChart3,
    UserCog,
    Settings,
    Package,
    ShieldAlert,
    ChevronRight,
    Megaphone,
    Grid3X3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/apiClient';
import { useToast } from '../../components/ui/Feedback';
import { cn } from '../../utils/cn';
import { AppModal } from '../../components/ui';

const FeatureToggle = ({ enabled, loading, onToggle, color = 'indigo' }) => (
    <button 
        onClick={onToggle}
        disabled={loading}
        className={cn(
            "w-12 h-6 rounded-full relative transition-all duration-500 flex items-center px-1 disabled:opacity-50",
            enabled ? `bg-${color}-600 shadow-[0_0_15px_rgba(var(--${color}-600-rgb),0.3)]` : "bg-slate-800"
        )}
    >
        <div className={cn(
            "w-4 h-4 rounded-full bg-white transition-all duration-500 shadow-sm",
            enabled ? "translate-x-6" : "translate-x-0"
        )} />
    </button>
);

const FeaturePermissionsPage = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingId, setUpdatingId] = useState(null);
    const [selectedShop, setSelectedShop] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showToast } = useToast();

    const MODULES = [
        { key: 'delivery_hub', label: 'Delivery Hub', icon: Truck, color: 'blue', desc: 'Logistics & Takeaway flow' },
        { key: 'marketing', label: 'Marketing Suite', icon: Megaphone, color: 'purple', desc: 'Campaigns & SMS Gateway' },
        { key: 'quick_retail', label: 'Quick Retail', icon: ShoppingCart, color: 'amber', desc: 'Non-F&B Fast Checkout' },
        { key: 'expenses', label: 'Expenses', icon: Wallet, color: 'rose', desc: 'Operational cost tracking' },
        { key: 'naya_book', label: 'Naya Book', icon: BookOpen, color: 'indigo', desc: 'Credit ledger management' },
        { key: 'customers', label: 'Customers', icon: Users, color: 'cyan', desc: 'Customer loyalty registry' },
        { key: 'items', label: 'Inventory Hub', icon: Package, color: 'emerald', desc: 'Centralized product matrix' },
        { key: 'tables', label: 'Table Matrix', icon: Grid3X3, color: 'slate', desc: 'Floor & table mapping' },
        { key: 'reservations', label: 'Reservations', icon: Calendar, color: 'orange', desc: 'Booking & Slot management' },
        { key: 'shifts', label: 'Shift System', icon: Clock, color: 'blue', desc: 'Staff clock-in/out protocols' },
        { key: 'bi', label: 'BI Dashboard', icon: LineChart, color: 'violet', desc: 'Neural analytics & insights' },
        { key: 'reports', label: 'Reports', icon: BarChart3, color: 'pink', desc: 'Financial & operational audits' },
        { key: 'users', label: 'Staff Registry', icon: UserCog, color: 'slate', desc: 'Role & access governance' },
        { key: 'audit_logs', label: 'Audit Logs', icon: ShieldCheck, color: 'slate', desc: 'Security event tracking' },
        { key: 'settings', label: 'Settings', icon: Settings, color: 'slate', desc: 'System configuration protocols' },
    ];

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/super-admin/shops');
            if (data.success) {
                setShops(data.data.map(s => ({
                    ...s,
                    module_permissions: typeof s.module_permissions === 'string' 
                        ? JSON.parse(s.module_permissions) 
                        : (s.module_permissions || {})
                })));
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load shop registry', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (shopId, feature, currentValue, isModule = false) => {
        try {
            setUpdatingId(`${shopId}-${feature}`);
            const newValue = !currentValue;
            
            await api.patch(`/super-admin/shops/${shopId}/feature-permission`, { 
                feature, 
                enabled: newValue,
                isModule
            });

            showToast(`Permission synchronized`, 'success');
            
            // Local update
            setShops(prev => prev.map(s => {
                if (s.id !== shopId) return s;
                if (isModule) {
                    const newPerms = { ...s.module_permissions, [feature]: newValue };
                    return { ...s, module_permissions: newPerms };
                }
                return { ...s, [feature]: newValue };
            }));

            // Sync modal if open
            if (selectedShop && selectedShop.id === shopId) {
                setSelectedShop(prev => {
                    if (isModule) {
                        return { ...prev, module_permissions: { ...prev.module_permissions, [feature]: newValue } };
                    }
                    return { ...prev, [feature]: newValue };
                });
            }
        } catch (err) {
            console.error(err);
            showToast('Permission update failed', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredShops = shops.filter(shop => 
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        shop.identifier.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/10">
                            <Layers size={22} />
                        </div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Module Gating Control</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter">Feature Access</h1>
                    <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-tight opacity-70">Manage global feature availability per shop instance</p>
                </div>

                <div className="flex items-center gap-4 bg-slate-900/40 p-4 rounded-3xl border border-white/5 backdrop-blur-md">
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Instances</p>
                        <p className="text-xl font-black text-white">{shops.length}</p>
                    </div>
                    <div className="w-px h-10 bg-white/10 mx-2" />
                    <ShieldCheck className="text-indigo-500" size={32} />
                </div>
            </div>

            {/* Tool Bar */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-indigo-400" size={20} />
                    <input 
                        type="text"
                        placeholder="Search instances by name or identifier..."
                        className="w-full pl-16 pr-8 py-5 bg-slate-900/40 border border-white/5 rounded-3xl text-white font-bold placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all backdrop-blur-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="px-8 py-5 bg-slate-900/40 border border-white/5 rounded-3xl text-slate-400 hover:text-white transition-all flex items-center gap-3 font-bold text-xs uppercase tracking-widest group">
                    <Filter size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                    Refine Registry
                </button>
            </div>

            {/* Feature Matrix Table */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Shop Instance</th>
                                <th className="px-8 py-8 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    <div className="flex flex-col items-center gap-2">
                                        <Truck size={16} className="text-blue-500" />
                                        Delivery Hub
                                    </div>
                                </th>
                                <th className="px-8 py-8 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    <div className="flex flex-col items-center gap-2">
                                        <Zap size={16} className="text-purple-500" />
                                        Marketing Suite
                                    </div>
                                </th>
                                <th className="px-8 py-8 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    <div className="flex flex-col items-center gap-2">
                                        <ShoppingCart size={16} className="text-amber-500" />
                                        Retail Matrix
                                    </div>
                                </th>
                                <th className="px-10 py-8 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Scanning platform nodes...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredShops.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <XCircle size={48} />
                                            <p className="text-xl font-black uppercase tracking-tighter">No instances matched search</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredShops.map((shop) => (
                                <tr key={shop.id} className="group hover:bg-white/[0.03] transition-all duration-300">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-6">
                                            <div className={cn(
                                                "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                                                shop.status === 'active' 
                                                    ? "bg-indigo-600/10 text-indigo-400 border-indigo-500/20 shadow-lg" 
                                                    : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                            )}>
                                                {shop.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-black text-white text-lg tracking-tight group-hover:text-indigo-400 transition-colors">{shop.name}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-mono text-slate-500">#{shop.id}</span>
                                                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{shop.identifier}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td className="px-8 py-8">
                                        <div className="flex justify-center">
                                            <FeatureToggle 
                                                enabled={shop.has_delivery_orders} 
                                                loading={updatingId === `${shop.id}-has_delivery_orders`}
                                                color="blue"
                                                onToggle={() => handleToggle(shop.id, 'has_delivery_orders', shop.has_delivery_orders)}
                                            />
                                        </div>
                                    </td>

                                    <td className="px-8 py-8">
                                        <div className="flex justify-center">
                                            <FeatureToggle 
                                                enabled={shop.has_marketing_center} 
                                                loading={updatingId === `${shop.id}-has_marketing_center`}
                                                color="purple"
                                                onToggle={() => handleToggle(shop.id, 'has_marketing_center', shop.has_marketing_center)}
                                            />
                                        </div>
                                    </td>

                                    <td className="px-8 py-8">
                                        <div className="flex justify-center">
                                            <FeatureToggle 
                                                enabled={shop.has_quick_retail} 
                                                loading={updatingId === `${shop.id}-has_quick_retail`}
                                                color="amber"
                                                onToggle={() => handleToggle(shop.id, 'has_quick_retail', shop.has_quick_retail)}
                                            />
                                        </div>
                                    </td>

                                    <td className="px-10 py-8 text-right flex items-center justify-end gap-3">
                                        <Link 
                                            to={`/super-admin/shops/${shop.identifier}/modules`}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 rounded-xl text-indigo-400 transition-all font-bold text-[10px] uppercase tracking-widest border border-indigo-500/10"
                                        >
                                            <ShieldAlert size={14} />
                                            Manage Modules
                                        </Link>
                                        <Link 
                                            to={`/super-admin/shops/${shop.identifier}`}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest border border-white/5"
                                        >
                                            View Node
                                            <ArrowUpRight size={14} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Legend */}
            <div className="flex flex-wrap gap-6">
                <div className="flex-1 min-w-[300px] bg-indigo-500/5 border border-indigo-500/10 p-8 rounded-[2.5rem] flex gap-5">
                    <Info className="text-indigo-400 flex-shrink-0" size={24} />
                    <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-2">Real-time Provisioning</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed tracking-tight">
                            Feature toggles apply instantly to shop instances. Non-active features will be gated behind a subscription wall for end-users.
                        </p>
                    </div>
                </div>
                <div className="flex-1 min-w-[300px] bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-[2.5rem] flex gap-5">
                    <CheckCircle2 className="text-emerald-400 flex-shrink-0" size={24} />
                    <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-2">Audit Synchronization</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed tracking-tight">
                            Every permission change is logged in the system audit logs for security compliance and billing accuracy.
                        </p>
                    </div>
                </div>
            </div>
            {/* Module Management Modal */}
            <AppModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Module Governance: ${selectedShop?.name}`}
                maxWidth="2xl"
            >
                <div className="space-y-8 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {MODULES.map((mod) => (
                            <div key={mod.key} className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110",
                                        `bg-${mod.color}-500/10 text-${mod.color}-400 border-${mod.color}-500/20`
                                    )}>
                                        <mod.icon size={22} />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-white uppercase tracking-widest">{mod.label}</h4>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight mt-1">{mod.desc}</p>
                                    </div>
                                </div>
                                <FeatureToggle 
                                    enabled={selectedShop?.module_permissions?.[mod.key] !== false} 
                                    loading={updatingId === `${selectedShop?.id}-${mod.key}`}
                                    color={mod.color}
                                    onToggle={() => handleToggle(selectedShop.id, mod.key, selectedShop?.module_permissions?.[mod.key] !== false, true)}
                                />
                            </div>
                        ))}
                    </div>
                    
                    <div className="pt-6 border-t border-white/5">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all border border-white/5"
                        >
                            Finalize Configuration
                        </button>
                    </div>
                </div>
            </AppModal>

            {/* Additional Modules Coming Soon */}
            <div className="pt-12 border-t border-white/5 space-y-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/10">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">Additional Modules</h3>
                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Platform Expansion & Future Readiness</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { title: 'AI Inventory Predictor', icon: Database, color: 'blue', desc: 'Predictive stock replenishment' },
                        { title: 'Dynamic Pricing', icon: TrendingUp, color: 'emerald', desc: 'Real-time demand based pricing' },
                        { title: 'Global Loyalty', icon: Users, color: 'purple', desc: 'Cross-restaurant rewards network' },
                        { title: 'IoT Automation', icon: Zap, color: 'amber', desc: 'Smart kitchen appliance integration' },
                    ].map((m, idx) => (
                        <div key={idx} className="bg-slate-900/20 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md relative overflow-hidden group">
                            <div className="absolute top-4 right-4 bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-indigo-500/20">
                                Coming Soon
                            </div>
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-700",
                                `bg-${m.color}-500/10 text-${m.color}-400 group-hover:scale-110 group-hover:rotate-6`
                            )}>
                                <m.icon size={28} />
                            </div>
                            <h4 className="text-sm font-black text-white mb-2 tracking-tight">{m.title}</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-relaxed">{m.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FeaturePermissionsPage;
