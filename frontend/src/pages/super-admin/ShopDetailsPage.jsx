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
    CreditCard
} from 'lucide-react';
import api from '../../api/apiClient';
import { useToast } from '../../components/ui/Feedback';

const UsageCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-${color}-500`}>
            <Icon size={48} />
        </div>
        <div className="flex flex-col">
            <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</h4>
            <p className="text-3xl font-black text-white">{value}</p>
        </div>
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
            setShop(shopRes.data.data);
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

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading shop profile...</p>
        </div>
    );

    if (error || !shop) return (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-12 rounded-[2.5rem] text-center max-w-2xl mx-auto mt-20">
            <AlertCircle className="mx-auto mb-6 text-rose-500" size={64} />
            <h2 className="text-2xl font-black mb-2">Shop Not Found</h2>
            <p className="text-slate-400 font-medium">{error || 'The requested shop instance does not exist.'}</p>
            <button onClick={() => navigate('/super-admin/shops')} className="mt-8 px-8 py-4 bg-rose-500 text-white rounded-2xl font-black shadow-xl shadow-rose-900/30">
                Return to Directory
            </button>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link 
                        to="/super-admin/shops"
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5"
                    >
                        <ChevronLeft size={24} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black text-white tracking-tight">{shop.name}</h1>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                shop.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                                {shop.status}
                            </span>
                        </div>
                        <p className="text-slate-400 mt-1 flex items-center gap-2 font-medium">
                            <Store size={14} className="text-indigo-400" /> {shop.slug} • <span className="text-indigo-400 uppercase font-black text-xs">{shop.subscription_plan}</span> plan
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button 
                        onClick={() => setShowAdminModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-sm border border-white/10 transition-all"
                    >
                        <UserPlus size={18} />
                        Add Admin
                    </button>
                    {shop.status === 'active' ? (
                        <button 
                            onClick={() => handleStatusChange('suspended')}
                            className="flex items-center gap-2 px-6 py-3 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-2xl font-bold text-sm transition-all"
                        >
                            <ShieldAlert size={18} />
                            Suspend Instance
                        </button>
                    ) : (
                        <button 
                            onClick={() => handleStatusChange('active')}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-2xl font-bold text-sm transition-all"
                        >
                            <CheckCircle2 size={18} />
                            Reactivate Instance
                        </button>
                    )}
                    <Link 
                        to="/super-admin/subscriptions" 
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-indigo-900/30"
                    >
                        <CreditCard size={18} />
                        Manage Billing
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Stats & Info */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Usage Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <UsageCard title="Active Users" value={usage?.user_count || 0} icon={Users} color="blue" />
                        <UsageCard title="Menu Items" value={usage?.item_count || 0} icon={FileText} color="indigo" />
                        <UsageCard title="Invoices Issued" value={usage?.invoice_count || 0} icon={TrendingUp} color="emerald" />
                        <UsageCard title="Total Rev." value={`Rs. ${Math.round(usage?.total_revenue || 0).toLocaleString()}`} icon={DollarSign} color="amber" />
                    </div>

                    {/* Shop Profile */}
                    <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                <Activity size={20} />
                            </div>
                            <h3 className="text-xl font-black text-white">Instance Configuration</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Support Email</label>
                                <p className="text-lg font-bold text-white pl-1">{shop.email || 'No email registered'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Number</label>
                                <p className="text-lg font-bold text-white pl-1">{shop.phone || 'No phone registered'}</p>
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Physical Address</label>
                                <p className="text-lg font-bold text-white pl-1 leading-relaxed">{shop.address || 'No address registered'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Provisioned On</label>
                                <div className="flex items-center gap-3 pl-1">
                                    <Calendar size={18} className="text-slate-500" />
                                    <p className="text-lg font-bold text-white">{new Date(shop.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Instance Status</label>
                                <div className="flex items-center gap-3 pl-1">
                                    <div className={`w-3 h-3 rounded-full ${shop.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`} />
                                    <p className="text-lg font-black text-white uppercase">{shop.status}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Platform Insights */}
                <div className="space-y-8">
                    <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group">
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full group-hover:bg-indigo-500/20 transition-all" />
                        
                        <h3 className="text-xl font-black text-white mb-6">Subscription Status</h3>
                        
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                <span className="text-xs font-bold text-slate-400">Current Plan</span>
                                <span className="text-xs font-black text-white uppercase tracking-widest bg-indigo-600 px-3 py-1 rounded-lg">{shop.subscription_plan}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400">Status</span>
                                <span className={`text-xs font-black uppercase tracking-widest ${
                                    shop.subscription_status === 'active' ? 'text-emerald-500' : 'text-rose-500'
                                }`}>{shop.subscription_status}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400">Next Billing</span>
                                <span className="text-sm font-bold text-white">{shop.subscription_end_date ? new Date(shop.subscription_end_date).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5">
                            <button 
                                onClick={() => navigate('/super-admin/subscriptions')}
                                className="w-full py-4 bg-slate-950 hover:bg-slate-900 border border-white/5 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all group"
                            >
                                <Settings size={16} className="group-hover:rotate-90 transition-transform duration-500" />
                                Billing Preferences
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8">
                        <h3 className="text-xl font-black text-white mb-6">Recent Usage</h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-white">Daily Average Sales</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Calculating from 30 days...</p>
                                </div>
                                <p className="text-sm font-black text-white">Rs. {Math.round((usage?.total_revenue || 0) / 30).toLocaleString()}</p>
                            </div>
                            {/* Placeholder for activity log mini-view */}
                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest text-center py-4 border-2 border-dashed border-white/5 rounded-2xl">
                                Real-time activity log coming soon
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Admin Modal */}
            {showAdminModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                                <UserPlus size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Add Instance Admin</h3>
                                <p className="text-slate-400 text-sm font-medium">Provision a new owner/manager account.</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreateAdmin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input 
                                        type="text"
                                        required
                                        className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white font-bold focus:border-indigo-500 outline-none transition-all"
                                        placeholder="e.g. John Doe"
                                        value={adminFormData.name}
                                        onChange={(e) => setAdminFormData({...adminFormData, name: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative">
                                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input 
                                        type="email"
                                        required
                                        className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white font-bold focus:border-indigo-500 outline-none transition-all"
                                        placeholder="admin@shop.com"
                                        value={adminFormData.email}
                                        onChange={(e) => setAdminFormData({...adminFormData, email: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Temporary Password</label>
                                <div className="relative">
                                    <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input 
                                        type="password"
                                        required
                                        className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white font-bold focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Min. 8 characters"
                                        value={adminFormData.password}
                                        onChange={(e) => setAdminFormData({...adminFormData, password: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowAdminModal(false)}
                                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={adminLoading}
                                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-900/30 transition-all flex items-center justify-center gap-3"
                                >
                                    {adminLoading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                    Create Admin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopDetailsPage;
