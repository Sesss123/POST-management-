import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ChevronLeft, 
    Store, 
    Activity, 
    Users, 
    FileText, 
    TrendingUp, 
    Calendar,
    Settings,
    ShieldAlert,
    CheckCircle2,
    UserPlus,
    Loader2,
    AlertCircle,
    User,
    DollarSign,
    CreditCard,
    Truck,
    ShoppingCart,
    ShieldCheck,
    Smartphone,
    Globe,
    Zap,
    Mail,
    Edit2,
    Save,
    X,
    Wallet,
    BookOpen,
    LineChart,
    BarChart3,
    UserCog,
    Package,
    Megaphone,
    Grid3X3,
    Clock
} from 'lucide-react';
import api from '../../api/apiClient';
import { useToast } from '../../components/ui/Feedback';
import { AppModal } from '../../components/ui';

const UsageCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group hover:bg-slate-900/60 transition-all duration-500">
        <div className={`absolute -top-6 -right-6 w-24 h-24 bg-${color}-500/10 blur-2xl rounded-full group-hover:scale-150 transition-transform duration-700`} />
        <div className="relative z-10 flex flex-col gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-${color}-500/10 flex items-center justify-center text-${color}-400 border border-${color}-500/20`}>
                <Icon size={24} />
            </div>
            <div>
                <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</h4>
                <p className="text-3xl font-black text-white tracking-tight">{value}</p>
            </div>
        </div>
    </div>
);

const FeatureToggle = ({ label, checked, onChange, icon: Icon, desc, color = 'indigo' }) => (
    <div className="bg-slate-950/40 p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between group/toggle hover:bg-slate-900/60 transition-all duration-500 relative overflow-hidden">
        <div className="flex items-center gap-6 relative z-10">
            {Icon && (
                <div className={`w-14 h-14 rounded-2xl bg-${color}-500/10 flex items-center justify-center text-${color}-400 border border-${color}-500/20 group-hover/toggle:scale-110 transition-transform duration-500`}>
                    <Icon size={28} />
                </div>
            )}
            <div>
                <p className="text-lg font-black text-white tracking-tight">{label}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-70">{desc || 'Permission Gating'}</p>
            </div>
        </div>
        <button 
            onClick={() => onChange(!checked)}
            className={`w-16 h-8 rounded-full relative transition-all duration-500 flex items-center px-1.5 ${checked ? `bg-${color}-600 shadow-[0_0_20px_rgba(var(--${color}-600-rgb),0.3)]` : 'bg-slate-800'}`}
        >
            <div className={`w-5 h-5 rounded-full bg-white transition-all duration-500 shadow-xl ${checked ? 'translate-x-8' : 'translate-x-0'}`} />
        </button>
    </div>
);

const ShopDetailsPage = () => {
    const { identifier } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [shop, setShop] = useState(null);
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [adminFormData, setAdminFormData] = useState({ name: '', email: '', password: '' });
    const [adminLoading, setAdminLoading] = useState(false);
    const [isEditingTechnical, setIsEditingTechnical] = useState(false);
    const [techForm, setTechForm] = useState({ email: '', phone: '', address: '' });
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);

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
        fetchShopDetails();
    }, [identifier]);

    const fetchShopDetails = async () => {
        try {
            setLoading(true);
            const [shopRes, usageRes] = await Promise.all([
                api.get(`/super-admin/shops/${identifier}`),
                api.get(`/super-admin/shops/${identifier}/usage`)
            ]);
            const shopData = shopRes.data.data;
            shopData.module_permissions = typeof shopData.module_permissions === 'string' 
                ? JSON.parse(shopData.module_permissions) 
                : (shopData.module_permissions || {});
            setShop(shopData);
            setTechForm({
                email: shopData.email || '',
                phone: shopData.phone || '',
                address: shopData.address || ''
            });
            setUsage(usageRes.data.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load shop details');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await api.patch(`/super-admin/shops/${shop.id}/status`, { status: newStatus });
            showToast(`Shop status updated to ${newStatus}`, 'success');
            fetchShopDetails();
        } catch (err) {
            showToast('Failed to update status', 'error');
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        try {
            setAdminLoading(true);
            await api.post(`/super-admin/shops/${shop.id}/create-admin`, adminFormData);
            setShowAdminModal(false);
            setAdminFormData({ name: '', email: '', password: '' });
            showToast('Admin created successfully', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to create admin', 'error');
        } finally {
            setAdminLoading(false);
        }
    };

    const handleDeliveryToggle = async (enabled) => {
        try {
            await api.patch(`/super-admin/shops/${shop.id}/delivery-permission`, { enabled });
            showToast(`Delivery permission ${enabled ? 'enabled' : 'disabled'}`, 'success');
            setShop(prev => ({ ...prev, has_delivery_orders: enabled }));
        } catch (err) {
            showToast('Failed to update delivery permission', 'error');
        }
    };

    const handleSaveTechnical = async () => {
        try {
            setAdminLoading(true);
            await api.put(`/super-admin/shops/${shop.id}`, {
                name: shop.name,
                status: shop.status,
                ...techForm
            });
            showToast('Technical Profile updated successfully', 'success');
            setShop(prev => ({ ...prev, ...techForm }));
            setIsEditingTechnical(false);
        } catch (err) {
            console.error(err);
            showToast('Failed to update technical profile', 'error');
        } finally {
            setAdminLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <Store className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 animate-pulse" size={24} />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Retrieving Instance Profile...</p>
        </div>
    );

    if (error || !shop) return (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-16 rounded-[3rem] text-center max-w-2xl mx-auto mt-20 backdrop-blur-xl animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-rose-500/30">
                <AlertCircle className="text-rose-500" size={40} />
            </div>
            <h2 className="text-3xl font-black mb-3 tracking-tight">Deployment Not Found</h2>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">{error || 'The requested shop instance does not exist in our registry.'}</p>
            <button onClick={() => navigate('/super-admin/shops')} className="mt-10 px-12 py-5 bg-rose-500 hover:bg-rose-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest transition-all shadow-2xl shadow-rose-900/40">
                Return to Directory
            </button>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Glass Hero Header */}
            <div className="relative overflow-hidden bg-slate-900/40 border border-white/5 p-12 rounded-[3.5rem] backdrop-blur-3xl group">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full -mr-40 -mt-40"></div>
                <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                    <div className="flex items-start gap-6">
                        <Link 
                            to="/super-admin/shops"
                            className="mt-1 p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5 group/back"
                        >
                            <ChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <h1 className="text-5xl font-black text-white tracking-tighter">{shop.name}</h1>
                                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border ${
                                    shop.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}>
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${shop.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    {shop.status}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-6">
                                <p className="text-slate-400 font-bold text-lg flex items-center gap-2.5">
                                    <Zap size={20} className="text-indigo-500" /> 
                                    <span className="opacity-60">ID:</span> {shop.identifier}
                                </p>
                                <div className="h-4 w-px bg-white/10 hidden md:block" />
                                <p className="text-slate-400 font-bold text-lg flex items-center gap-2.5">
                                    <CreditCard size={20} className="text-indigo-500" /> 
                                    <span className="opacity-60">Plan:</span> 
                                    <span className="text-indigo-400 uppercase font-black tracking-widest text-sm bg-indigo-500/10 px-3 py-1 rounded-lg">
                                        {shop.subscription_plan}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <button 
                            onClick={() => navigate(`/super-admin/shops/${identifier}/modules`)}
                            className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-[2rem] font-black text-xs tracking-widest uppercase border border-white/10 transition-all active:scale-95"
                        >
                            <ShieldCheck size={20} className="text-emerald-400" />
                            Features
                        </button>
                        <button 
                            onClick={() => setShowAdminModal(true)}
                            className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-[2rem] font-black text-xs tracking-widest uppercase border border-white/10 transition-all active:scale-95"
                        >
                            <UserPlus size={20} className="text-indigo-400" />
                            Add Admin
                        </button>
                        {shop.status === 'active' ? (
                            <button 
                                onClick={() => handleStatusChange('suspended')}
                                className="flex items-center gap-3 px-8 py-4 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-[2rem] font-black text-xs tracking-widest uppercase transition-all active:scale-95"
                            >
                                <ShieldAlert size={20} />
                                Suspend
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleStatusChange('active')}
                                className="flex items-center gap-3 px-8 py-4 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-[2rem] font-black text-xs tracking-widest uppercase transition-all active:scale-95"
                            >
                                <CheckCircle2 size={20} />
                                Activate
                            </button>
                        )}
                        <Link 
                            to="/super-admin/subscriptions" 
                            className="flex items-center gap-3 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black text-xs tracking-widest uppercase transition-all shadow-2xl shadow-indigo-900/40 active:scale-95"
                        >
                            <DollarSign size={20} />
                            Billing
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-10">
                    {/* Real-time Usage Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        <UsageCard title="Active Nodes" value={usage?.user_count || 0} icon={Users} color="blue" />
                        <UsageCard title="Asset Catalog" value={usage?.item_count || 0} icon={FileText} color="indigo" />
                        <UsageCard title="Flow Volume" value={usage?.invoice_count || 0} icon={Activity} color="emerald" />
                        <UsageCard title="GTV (Gross)" value={`Rs. ${Math.round(usage?.total_revenue || 0).toLocaleString()}`} icon={TrendingUp} color="amber" />
                    </div>

                    {/* Deep Configuration Card */}
                    <div className="bg-slate-900/40 border border-white/5 rounded-[3.5rem] p-12 backdrop-blur-xl space-y-12">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/10">
                                <Settings size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Technical Profile</h3>
                                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Infrastructure & Identity parameters</p>
                            </div>
                            <div className="ml-auto">
                                {isEditingTechnical ? (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setIsEditingTechnical(false)}
                                            className="p-3 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-xl transition-all border border-white/5"
                                        >
                                            <X size={18} />
                                        </button>
                                        <button 
                                            onClick={handleSaveTechnical}
                                            disabled={adminLoading}
                                            className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-900/40 disabled:opacity-50"
                                        >
                                            {adminLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setIsEditingTechnical(true)}
                                        className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-16">
                            <div className="space-y-3 group">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 group-hover:text-indigo-400 transition-colors">Primary Communication</label>
                                <div className="p-6 bg-slate-950/50 border border-white/5 rounded-[2rem] flex items-center gap-4 group-hover:bg-slate-950/70 transition-all duration-500">
                                    <Mail className="text-slate-600" size={24} />
                                    <div className="flex-1 overflow-hidden">
                                        {isEditingTechnical ? (
                                            <input 
                                                type="email"
                                                value={techForm.email}
                                                onChange={(e) => setTechForm({ ...techForm, email: e.target.value })}
                                                className="w-full bg-transparent border-b border-indigo-500/50 text-white focus:outline-none py-1"
                                                placeholder="Support Email"
                                            />
                                        ) : (
                                            <p className="text-lg font-black text-white truncate">{shop.email || 'no-email-link'}</p>
                                        )}
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Global Support Node</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 group">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 group-hover:text-indigo-400 transition-colors">Telemetric Contact</label>
                                <div className="p-6 bg-slate-950/50 border border-white/5 rounded-[2rem] flex items-center gap-4 group-hover:bg-slate-950/70 transition-all duration-500">
                                    <Smartphone className="text-slate-600" size={24} />
                                    <div className="flex-1 overflow-hidden">
                                        {isEditingTechnical ? (
                                            <input 
                                                type="text"
                                                value={techForm.phone}
                                                onChange={(e) => setTechForm({ ...techForm, phone: e.target.value })}
                                                className="w-full bg-transparent border-b border-indigo-500/50 text-white focus:outline-none py-1"
                                                placeholder="Contact Number"
                                            />
                                        ) : (
                                            <p className="text-lg font-black text-white">{shop.phone || 'no-phone-link'}</p>
                                        )}
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Secure Voice Gateway</p>
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-3 group">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 group-hover:text-indigo-400 transition-colors">Physical Coordinates</label>
                                <div className="p-6 bg-slate-950/50 border border-white/5 rounded-[2.5rem] flex items-start gap-4 group-hover:bg-slate-950/70 transition-all duration-500">
                                    <Globe className="text-slate-600 mt-1" size={24} />
                                    <div className="flex-1 overflow-hidden">
                                        {isEditingTechnical ? (
                                            <input 
                                                type="text"
                                                value={techForm.address}
                                                onChange={(e) => setTechForm({ ...techForm, address: e.target.value })}
                                                className="w-full bg-transparent border-b border-indigo-500/50 text-white focus:outline-none py-1"
                                                placeholder="Physical Address"
                                            />
                                        ) : (
                                            <p className="text-lg font-black text-white leading-tight">{shop.address || 'Global/Remote Instance'}</p>
                                        )}
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Geospatial Datacenter</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Provisioning Date</label>
                                <div className="p-6 bg-slate-950/30 rounded-[2rem] flex items-center gap-4 border border-white/5">
                                    <Calendar size={24} className="text-indigo-500" />
                                    <p className="text-lg font-black text-white">{new Date(shop.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Instance Integrity</label>
                                <div className="p-6 bg-slate-950/30 rounded-[2rem] flex items-center gap-4 border border-white/5">
                                    <ShieldCheck size={24} className={shop.status === 'active' ? 'text-emerald-500' : 'text-rose-500'} />
                                    <p className={`text-lg font-black uppercase tracking-widest ${shop.status === 'active' ? 'text-emerald-400' : 'text-rose-400'}`}>{shop.status}</p>
                                </div>
                            </div>
                        </div>

                        {/* Feature Permissions Grid */}
                        <div id="feature-gating" className="space-y-8 pt-12 border-t border-white/5">
                            <div className="flex items-center gap-3">
                                <ShieldAlert size={20} className="text-indigo-400" />
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Feature Permission Gating</h4>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FeatureToggle 
                                    label="Delivery Engine" 
                                    desc="Logistics & Takeaway flow"
                                    icon={Truck}
                                    color="blue"
                                    checked={shop.has_delivery_orders} 
                                    onChange={(val) => handleDeliveryToggle(val)} 
                                />
                                <FeatureToggle 
                                    label="Marketing Suite" 
                                    desc="Campaigns & SMS Gateway"
                                    icon={Zap}
                                    color="purple"
                                    checked={shop.has_marketing_center} 
                                    onChange={async (val) => {
                                        try {
                                            await api.patch(`/super-admin/shops/${shop.id}/feature-permission`, { feature: 'has_marketing_center', enabled: val });
                                            showToast(`Marketing Suite ${val ? 'enabled' : 'disabled'}`, 'success');
                                            setShop(prev => ({ ...prev, has_marketing_center: val }));
                                        } catch (err) { showToast('Permission Update Failed', 'error'); }
                                    }} 
                                />
                                <FeatureToggle 
                                    label="Retail Matrix" 
                                    desc="Non-F&B Fast Checkout"
                                    icon={ShoppingCart}
                                    color="amber"
                                    checked={shop.has_quick_retail} 
                                    onChange={async (val) => {
                                        try {
                                            await api.patch(`/super-admin/shops/${shop.id}/feature-permission`, { feature: 'has_quick_retail', enabled: val });
                                            showToast(`Retail Matrix ${val ? 'enabled' : 'disabled'}`, 'success');
                                            setShop(prev => ({ ...prev, has_quick_retail: val }));
                                        } catch (err) { showToast('Permission Update Failed', 'error'); }
                                    }} 
                                />
                                <div className="p-8 rounded-[2.5rem] border-2 border-dashed border-white/5 flex items-center justify-center text-slate-600 group cursor-help">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-slate-400 transition-colors">Additional Modules Coming Soon</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats Area */}
                <div className="lg:col-span-4 space-y-10">
                    {/* Billing Context Card */}
                    <div className="bg-slate-900/40 border border-white/5 rounded-[3.5rem] p-10 relative overflow-hidden group backdrop-blur-xl">
                        <div className={`absolute -top-12 -right-12 w-40 h-40 blur-[80px] rounded-full transition-all duration-700 ${
                            shop.subscription_status === 'active' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                        }`} />
                        
                        <div className="relative z-10 space-y-8">
                            <h3 className="text-2xl font-black text-white tracking-tight">SaaS Health</h3>
                            
                            <div className="space-y-4">
                                <div className="bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Plan</span>
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest bg-indigo-600 px-3 py-1.5 rounded-xl shadow-lg shadow-indigo-900/20">{shop.subscription_plan}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Revenue Status</span>
                                        <span className={`text-xs font-black uppercase tracking-widest ${
                                            shop.subscription_status === 'active' ? 'text-emerald-500' : 'text-rose-500'
                                        }`}>{shop.subscription_status}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Renewal Date</span>
                                        <span className="text-sm font-black text-white">{shop.subscription_end_date ? new Date(shop.subscription_end_date).toLocaleDateString('en-GB') : 'N/A'}</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => navigate('/super-admin/subscriptions')}
                                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-900/30"
                                >
                                    <CreditCard size={18} />
                                    Billing Dashboard
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Operational Insights */}
                    <div className="bg-slate-900/40 border border-white/5 rounded-[3.5rem] p-10 backdrop-blur-xl">
                        <h3 className="text-2xl font-black text-white tracking-tight mb-8">Growth Index</h3>
                        <div className="space-y-8">
                            <div className="flex items-center gap-5 group">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors border border-indigo-500/10">
                                    <TrendingUp size={22} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Average Daily Volume</p>
                                    <p className="text-xl font-black text-white mt-1">Rs. {Math.round((usage?.total_revenue || 0) / 30).toLocaleString()}</p>
                                </div>
                            </div>
                            
                            <div className="p-8 bg-slate-950/50 rounded-[2.5rem] border border-white/5 text-center">
                                <Activity size={32} className="text-slate-700 mx-auto mb-4 animate-pulse" />
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Telemetry Streaming Active</p>
                                <p className="text-[9px] text-slate-600 font-bold uppercase mt-2">Node Version: 2.4.0-Resto</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Admin Modal */}
            {showAdminModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
                    <div className="bg-slate-900 border border-white/10 rounded-[3.5rem] w-full max-w-xl p-12 shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[80px] rounded-full -mr-32 -mt-32" />
                        
                        <div className="relative flex items-center gap-6 mb-12">
                            <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-[2rem] flex items-center justify-center border border-indigo-500/20 shadow-2xl">
                                <UserPlus size={36} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-white tracking-tight">Provision Instance Admin</h3>
                                <p className="text-slate-400 font-medium text-lg mt-1">Authorize a new root account for this node.</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreateAdmin} className="relative space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Display Identity</label>
                                <div className="relative group">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                    <input 
                                        type="text" required
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] py-5 pl-16 pr-8 text-white font-black text-lg focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Full Legal Name"
                                        value={adminFormData.name}
                                        onChange={(e) => setAdminFormData({...adminFormData, name: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Auth Identifier (Email)</label>
                                <div className="relative group">
                                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                    <input 
                                        type="email" required
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] py-5 pl-16 pr-8 text-white font-black text-lg focus:border-indigo-500 outline-none transition-all"
                                        placeholder="admin@shop-domain.com"
                                        value={adminFormData.email}
                                        onChange={(e) => setAdminFormData({...adminFormData, email: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Initial Security Key</label>
                                <div className="relative group">
                                    <ShieldAlert className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                    <input 
                                        type="password" required
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] py-5 pl-16 pr-8 text-white font-black text-lg focus:border-indigo-500 outline-none transition-all"
                                        placeholder="••••••••••••"
                                        value={adminFormData.password}
                                        onChange={(e) => setAdminFormData({...adminFormData, password: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-6 pt-6">
                                <button 
                                    type="button"
                                    onClick={() => setShowAdminModal(false)}
                                    className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all"
                                >
                                    Abort
                                </button>
                                <button 
                                    type="submit"
                                    disabled={adminLoading}
                                    className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-indigo-900/40 transition-all flex items-center justify-center gap-4"
                                >
                                    {adminLoading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                    Deploy Admin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Module Management Modal */}
            <AppModal
                isOpen={isModuleModalOpen}
                onClose={() => setIsModuleModalOpen(false)}
                title={`Shop Module Governance: ${shop?.name}`}
                maxWidth="3xl"
            >
                <div className="space-y-8 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {MODULES.map((mod) => {
                            const isEnabled = shop.module_permissions?.[mod.key] !== false;
                            
                            // Map color to hex/rgb for stability
                            const colorMap = {
                                blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', active: 'bg-blue-600' },
                                purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', active: 'bg-purple-600' },
                                amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', active: 'bg-amber-600' },
                                rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', active: 'bg-rose-600' },
                                indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', active: 'bg-indigo-600' },
                                cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', active: 'bg-cyan-600' },
                                emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', active: 'bg-emerald-600' },
                                slate: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', active: 'bg-slate-600' },
                                orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', active: 'bg-orange-600' },
                                violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', active: 'bg-violet-600' },
                                pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20', active: 'bg-pink-600' },
                            };
                            const c = colorMap[mod.color] || colorMap.indigo;

                            return (
                                <div key={mod.key} className="bg-slate-900/60 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between group hover:border-white/10 transition-all duration-300 backdrop-blur-md">
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                                            c.bg, c.text, c.border
                                        )}>
                                            <mod.icon size={26} />
                                        </div>
                                        <div>
                                            <h4 className="text-[12px] font-black text-white uppercase tracking-[0.1em]">{mod.label}</h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1 leading-tight max-w-[150px]">{mod.desc}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={async () => {
                                            try {
                                                const newVal = !isEnabled;
                                                await api.patch(`/super-admin/shops/${shop.id}/feature-permission`, { 
                                                    feature: mod.key, 
                                                    enabled: newVal,
                                                    isModule: true
                                                });
                                                setShop(prev => ({
                                                    ...prev,
                                                    module_permissions: { ...prev.module_permissions, [mod.key]: newVal }
                                                }));
                                                showToast(`${mod.label} synchronized`, 'success');
                                            } catch (err) { showToast('Sync failed', 'error'); }
                                        }}
                                        className={cn(
                                            "w-14 h-7 rounded-full relative transition-all duration-500 flex items-center px-1.5 shrink-0",
                                            isEnabled ? c.active : "bg-slate-800"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded-full bg-white transition-all duration-500 shadow-lg",
                                            isEnabled ? "translate-x-7" : "translate-x-0"
                                        )} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="pt-6 border-t border-white/5">
                        <button 
                            onClick={() => setIsModuleModalOpen(false)}
                            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                        >
                            Finalize Configuration
                        </button>
                    </div>
                </div>
            </AppModal>
        </div>
    );
};

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default ShopDetailsPage;
