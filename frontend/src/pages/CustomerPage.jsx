import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../api/api';
import { 
    Users, 
    Plus, 
    Search, 
    User, 
    Phone, 
    MapPin, 
    CreditCard, 
    ShieldCheck, 
    Star, 
    TrendingUp, 
    Wallet, 
    Award, 
    ArrowUpRight, 
    Filter, 
    ChevronRight,
    UserPlus, 
    Mail, 
    MessageSquare, 
    History, 
    AlertCircle,
    Sparkles,
    RefreshCw,
    Activity,
    Settings,
    MoreHorizontal
} from 'lucide-react';
import { AppButton, useToast, AppModal, FormInput, Badge } from '../components/ui';
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

const CustomerPage = () => {
    const toast = useToast();
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); 
    const [filterDebt, setFilterDebt] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        status: 'active'
    });

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await customerApi.getAll();
            setCustomers(data.data);
        } catch (err) {
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                await customerApi.update(editingCustomer.uuid || editingCustomer.id, formData);
                toast.success('Member intelligence updated');
            } else {
                await customerApi.create(formData);
                toast.success('New member enrolled successfully');
            }
            setShowModal(false);
            setEditingCustomer(null);
            setFormData({ name: '', phone: '', address: '', status: 'active' });
            fetchCustomers();
        } catch (err) {
            toast.error('Operation protocol failed');
        }
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
            status: customer.status
        });
        setShowModal(true);
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                               (c.phone && c.phone.includes(search));
        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
        const matchesDebt = filterDebt === 'all' || 
                            (filterDebt === 'has_debt' && parseFloat(c.current_balance || 0) > 0) ||
                            (filterDebt === 'cleared' && parseFloat(c.current_balance || 0) <= 0);
        
        return matchesSearch && matchesStatus && matchesDebt;
    });

    const totalCustomers = customers.length;
    const totalOutstanding = customers.reduce((acc, c) => acc + parseFloat(c.current_balance || 0), 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-1 selection:bg-indigo-500/30 bg-slate-50/50">
            {/* Header - White Theme */}
            <header className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-500 rounded-[32px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 group-hover:scale-110 transition-transform duration-500">
                            <Users size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={14} className="text-indigo-600" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Directory Services</span>
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-1 uppercase">Customer HQ</h2>
                            <p className="text-sm font-medium text-slate-400">Strategic member management and credit exposure analytics</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto relative z-10">
                        <AppButton 
                            variant="primary" 
                            icon={UserPlus} 
                            size="lg" 
                            className="w-full sm:w-auto rounded-[24px] px-10 py-6 bg-indigo-600 hover:bg-indigo-500 shadow-2xl shadow-indigo-600/20 font-black uppercase tracking-widest text-xs border-none" 
                            onClick={() => setShowModal(true)}
                        >
                            Enroll Member
                        </AppButton>
                        <AppButton 
                            variant="secondary" 
                            icon={RefreshCw} 
                            size="lg" 
                            className="rounded-[24px] bg-white border-slate-100 text-slate-400 hover:text-indigo-600 shadow-sm" 
                            onClick={fetchCustomers} 
                            loading={loading}
                        />
                    </div>
                </div>
            </header>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <GlassCard 
                    title="Active Members" 
                    value={totalCustomers} 
                    icon={Users} 
                    variant="primary" 
                />
                <GlassCard 
                    title="Total Exposure" 
                    value={`Rs. ${totalOutstanding.toLocaleString()}`} 
                    icon={TrendingUp} 
                    variant="danger" 
                />
                <GlassCard 
                    title="Settlement Rate" 
                    value={`${totalCustomers > 0 ? '94%' : '0%'}`} 
                    icon={ShieldCheck} 
                    variant="success" 
                />
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col lg:flex-row gap-6 items-center">
                <div className="relative group w-full lg:flex-1">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search members by name, phone or identifier..." 
                        className="w-full bg-white border border-slate-100 rounded-[32px] py-6 pl-16 pr-8 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-xl shadow-slate-200/40"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-4 w-full lg:w-auto">
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "px-8 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 border",
                            showFilters ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20" : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50 shadow-sm"
                        )}
                    >
                        <Filter size={18} /> Filters
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 animate-in slide-in-from-top-4 duration-500 flex flex-wrap gap-10">
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Protocol</p>
                        <div className="flex gap-2">
                            {['all', 'active', 'blocked'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={cn(
                                        "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        filterStatus === status ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                    )}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Exposure Status</p>
                        <div className="flex gap-2">
                            {[{ id: 'all', label: 'All' }, { id: 'has_debt', label: 'In Arrears' }, { id: 'cleared', label: 'Settled' }].map(debt => (
                                <button
                                    key={debt.id}
                                    onClick={() => setFilterDebt(debt.id)}
                                    className={cn(
                                        "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        filterDebt === debt.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                    )}
                                >
                                    {debt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                {loading ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="h-96 bg-white rounded-[48px] animate-pulse border border-slate-100 shadow-sm" />
                    ))
                ) : filteredCustomers.map(customer => (
                    <div key={customer.id} className="group relative bg-white p-10 rounded-[48px] border border-slate-100 hover:border-indigo-400 shadow-2xl shadow-slate-200/40 transition-all duration-700 flex flex-col h-full overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-indigo-600 border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                                <User size={32} />
                            </div>
                            <Badge variant={customer.status === 'active' ? 'success' : 'danger'} className="px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm">
                                {customer.status === 'active' ? 'Protocol Healthy' : 'Blocked'}
                            </Badge>
                        </div>

                        <div className="mb-10 relative z-10">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-2 truncate uppercase">{customer.name}</h3>
                            <div className="flex items-center gap-3 text-slate-400">
                                <Phone size={14} className="text-indigo-600" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{customer.phone}</span>
                            </div>
                        </div>

                        <div className="space-y-4 mb-10 relative z-10">
                            <div className="bg-slate-50/80 p-6 rounded-[32px] border border-slate-100 transition-all group-hover:bg-white shadow-inner">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Exposure Profile</p>
                                <div className="flex justify-between items-baseline">
                                    <p className={cn(
                                        "text-2xl font-black tabular-nums tracking-tighter",
                                        parseFloat(customer.current_balance || 0) > 0 ? "text-rose-600" : "text-emerald-600"
                                    )}>
                                        Rs. {parseFloat(customer.current_balance || 0).toLocaleString()}
                                    </p>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Outstanding</span>
                                </div>
                            </div>
                            
                            {customer.address && (
                                <div className="flex items-start gap-4 px-6 py-4 bg-slate-50/50 rounded-[28px] border border-slate-100">
                                    <MapPin size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed truncate">{customer.address}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto flex gap-4 relative z-10">
                            <button 
                                onClick={() => handleEdit(customer)}
                                className="flex-1 bg-slate-50 text-slate-500 py-5 rounded-[28px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95 border border-slate-100 shadow-sm"
                            >
                                Intelligence
                            </button>
                            <button 
                                onClick={() => navigate(`/customers/${customer.uuid || customer.id}/ledger`)}
                                className="flex-1 bg-indigo-600 text-white py-5 rounded-[28px] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 shadow-2xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 border-none"
                            >
                                Ledger <ArrowUpRight size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Redesigned Neural Modal - White Theme */}
            <AppModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingCustomer ? "Refine Protocol" : "Enroll Member"}
                description="Secure member encryption and profile initialization"
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-10 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormInput label="Identifier / Full Name" icon={User} required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600" />
                        <FormInput label="Communication Line" icon={Phone} required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600" />
                        <div className="md:col-span-2">
                            <FormInput label="Geo-Location / Address" icon={MapPin} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Access Protocol</label>
                            <select className="w-full h-[70px] bg-slate-50 border-2 border-slate-100 rounded-[28px] px-8 font-black text-slate-900 outline-none focus:border-indigo-600 transition-all appearance-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                <option value="active">Protocol Healthy</option>
                                <option value="blocked">Protocol Suspended</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-900 rounded-[44px] text-white shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="w-14 h-14 bg-white/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-white/5 shadow-xl">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Membership Authentication</p>
                                <p className="text-sm font-bold text-white">Enrollment logging enabled</p>
                            </div>
                        </div>
                        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px]" />
                    </div>

                    <div className="flex gap-6 pt-6">
                        <button 
                            type="button" 
                            onClick={() => setShowModal(false)}
                            className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                        >
                            Abort
                        </button>
                        <AppButton variant="primary" className="flex-[2] py-6 rounded-[28px] uppercase tracking-widest text-xs font-black shadow-2xl shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-500 border-none active:scale-95" type="submit">
                            Authorize Enrollment
                        </AppButton>
                    </div>
                </form>
            </AppModal>
        </div>
    );
};

export default CustomerPage;
