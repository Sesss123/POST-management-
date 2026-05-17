import React, { useState, useEffect } from 'react';
import {
    Plus,
    Filter,
    Trash2,
    FileText,
    Wallet,
    BarChart3,
    PieChart,
    Calendar,
    Search,
    AlertCircle,
    Info,
    Sparkles,
    RefreshCw,
    Activity,
    History,
    ChevronRight,
    TrendingDown,
    ArrowRight
} from 'lucide-react';
import {
    AppButton,
    AppCard,
    StatCard,
    AppTable,
    AppModal,
    FormInput,
    FormSelect,
    Badge,
    useToast
} from '../components/ui';
import { expenseApi } from '../api/api';
import { cn } from '../utils/cn';

const GlassCard = ({ title, value, icon: Icon, variant = 'primary', className }) => {
    const variants = {
        primary: "bg-indigo-50 border-indigo-100",
        success: "bg-emerald-50 border-emerald-100",
        danger: "bg-rose-50 border-rose-100",
        warning: "bg-amber-50 border-amber-100",
    };

    const iconColors = {
        primary: "text-indigo-600",
        success: "text-emerald-600",
        danger: "text-rose-600",
        warning: "text-amber-600",
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

const ExpensesPage = () => {
    const toast = useToast();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        expense_date: new Date().toISOString().split('T')[0],
        category: '',
        amount: '',
        payment_method: 'cash',
        paid_from_cash_drawer: false,
        note: ''
    });

    const [filters, setFilters] = useState({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
        category: 'all',
        status: 'active'
    });

    const [summary, setSummary] = useState([]);

    useEffect(() => {
        fetchExpenses();
    }, [filters]);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const res = await expenseApi.getAll(filters);
            if (res.data.success) {
                setExpenses(res.data.data);
                if (res.data.today_summary) {
                    setSummary(res.data.today_summary);
                }
            }
        } catch (error) {
            toast.error('Failed to fetch expenses');
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await expenseApi.create(formData);
            if (res.data.success) {
                toast.success('Expense recorded successfully');
                setIsModalOpen(false);
                setFormData({
                    expense_date: new Date().toISOString().split('T')[0],
                    category: '',
                    amount: '',
                    payment_method: 'cash',
                    paid_from_cash_drawer: false,
                    note: ''
                });
                fetchExpenses();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to record expense');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelExpense = async (id) => {
        try {
            const res = await expenseApi.cancel(id);
            if (res.data.success) {
                toast.success('Expense cancelled');
                fetchExpenses();
            }
        } catch (error) {
            toast.error('Failed to cancel expense');
        }
    };

    const totalAmount = expenses.reduce((sum, exp) => sum + (exp.status === 'active' ? parseFloat(exp.amount) : 0), 0);

    const categories = [
        'Gas', 'Vegetables', 'Chicken', 'Meat', 'Fish', 'Cleaning',
        'Transport', 'Salary Advance', 'Electricity', 'Water',
        'Rent', 'Maintenance', 'Marketing', 'Stationery', 'Other'
    ];

    const topCategory = summary.length > 0
        ? summary.reduce((prev, current) => (parseFloat(prev.total) > parseFloat(current.total)) ? prev : current).category
        : 'None';

    const formatCurrency = (val) => {
        return `Rs. ${parseFloat(val || 0).toLocaleString()}`;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-130px)] space-y-4 animate-in fade-in duration-700 p-1 selection:bg-rose-500/30 overflow-hidden bg-slate-50/50">
            {/* Premium Neural Header - White Theme */}
            <header className="relative group shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-rose-600 via-orange-600 to-rose-500 rounded-[32px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-orange-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-rose-500/40 group-hover:scale-110 transition-transform duration-500">
                            <Wallet size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={14} className="text-rose-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500">Operational Matrix</span>
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-1 uppercase">Expense Ledger</h2>
                            <p className="text-sm font-medium text-slate-400">Manage operational costs with premium light-themed analytics</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto relative z-10">
                        <AppButton
                            variant="danger"
                            icon={Plus}
                            size="lg"
                            onClick={() => setIsModalOpen(true)}
                            className="rounded-[24px] px-8 py-6 font-black uppercase text-xs tracking-widest shadow-2xl shadow-rose-500/20 bg-rose-600 hover:bg-rose-500 border-none"
                        >
                            Record Payout
                        </AppButton>
                        
                        <AppButton 
                            variant="secondary" 
                            icon={RefreshCw} 
                            size="lg" 
                            className="rounded-[24px] bg-white border-slate-100 text-slate-400 hover:text-rose-600 shadow-sm" 
                            onClick={fetchExpenses} 
                            loading={loading}
                        />
                    </div>
                </div>
            </header>

            {/* KPI Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 shrink-0">
                <GlassCard
                    title="Total Liability"
                    value={formatCurrency(totalAmount)}
                    icon={TrendingDown}
                    variant="danger"
                />
                <GlassCard
                    title="Active Records"
                    value={expenses.filter(e => e.status === 'active').length}
                    icon={FileText}
                    variant="primary"
                />
                <GlassCard
                    title="Main Exhaust"
                    value={topCategory.toUpperCase()}
                    icon={PieChart}
                    variant="warning"
                />
            </div>

            {/* Light Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-6 items-center shrink-0">
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:flex-1">
                    <div className="flex-1 bg-white border border-slate-100 rounded-[32px] p-2 flex items-center gap-2 shadow-sm">
                        <Calendar size={18} className="text-slate-400 ml-4" />
                        <input 
                            type="date"
                            value={filters.from}
                            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                            className="bg-transparent text-slate-900 text-xs font-bold p-2 outline-none border-none flex-1"
                        />
                        <span className="text-slate-300 text-[10px] font-black uppercase">TO</span>
                        <input 
                            type="date"
                            value={filters.to}
                            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                            className="bg-transparent text-slate-900 text-xs font-bold p-2 outline-none border-none flex-1"
                        />
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="relative group">
                            <select 
                                className="bg-white border border-slate-100 text-slate-900 px-10 py-5 rounded-[32px] font-black text-[10px] uppercase tracking-widest outline-none cursor-pointer hover:bg-slate-50 transition-all appearance-none text-center min-w-[180px] shadow-sm"
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            >
                                <option value="all">ALL CATEGORIES</option>
                                {categories.map(c => <option key={c} value={c.toLowerCase()}>{c.toUpperCase()}</option>)}
                            </select>
                            <ChevronRight size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
                        </div>
                        <div className="relative group">
                            <select 
                                className="bg-white border border-slate-100 text-slate-900 px-10 py-5 rounded-[32px] font-black text-[10px] uppercase tracking-widest outline-none cursor-pointer hover:bg-slate-50 transition-all appearance-none text-center min-w-[160px] shadow-sm"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="all">ALL STATUS</option>
                                <option value="active">ACTIVE</option>
                                <option value="cancelled">CANCELLED</option>
                            </select>
                            <ChevronRight size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Ledger Content - White Theme */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-64 bg-white rounded-[48px] animate-pulse border border-slate-100 shadow-sm" />
                        ))}
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="py-40 text-center opacity-20 group">
                        <History size={100} className="mx-auto mb-8 text-slate-300 group-hover:scale-110 transition-transform duration-700" />
                        <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-400">No operational costs found</h3>
                    </div>
                ) : (
                    <div className="bg-white rounded-[48px] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/40">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol ID</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Magnitude</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Channel</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">State</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {expenses.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-10 py-8">
                                                <p className="text-sm font-black text-slate-900 group-hover:text-rose-600 transition-colors uppercase tracking-tight leading-none mb-1">{item.expense_no}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(item.expense_date).toLocaleDateString()}</p>
                                            </td>
                                            <td className="px-10 py-8">
                                                <Badge variant="primary" className="bg-indigo-50 text-indigo-600 border-indigo-100 font-black uppercase text-[9px] px-4 py-1 rounded-xl">{item.category}</Badge>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <span className="text-lg font-black text-slate-900 tabular-nums tracking-tighter">{formatCurrency(item.amount)}</span>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{item.payment_method}</span>
                                                    {item.paid_from_cash_drawer && (
                                                        <span className="text-[9px] text-amber-600 font-black flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> DRAWER SYNC
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <Badge variant={item.status === 'active' ? 'success' : 'danger'} className="font-black uppercase text-[9px] px-4 py-1 rounded-xl shadow-sm">
                                                    {item.status.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                {item.status === 'active' && (
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Cancel this operational expense?')) handleCancelExpense(item.id);
                                                        }}
                                                        className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-100 transition-all flex items-center justify-center mx-auto shadow-sm active:scale-95"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal remains white but updated with premium light accents */}
            <AppModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Record Matrix Payout"
                description="Operational costs deducted from total liquidity"
                size="md"
            >
                <form onSubmit={handleAddExpense} className="space-y-10 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormInput
                            label="Operational Date"
                            type="date"
                            required
                            value={formData.expense_date}
                            onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                            className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-rose-600"
                        />
                        <FormSelect
                            label="Category Protocol"
                            required
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            options={[
                                { value: '', label: 'IDENTIFY CATEGORY...' },
                                ...categories.map(c => ({ value: c.toLowerCase(), label: c.toUpperCase() }))
                            ]}
                            className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-rose-600"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormInput
                            label="Magnitude (Amount)"
                            type="number"
                            required
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-rose-600"
                        />
                        <FormSelect
                            label="Settlement Channel"
                            value={formData.payment_method}
                            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                            options={[
                                { value: 'cash', label: 'CASH LIQUIDITY' },
                                { value: 'card', label: 'CARD PROTOCOL' },
                                { value: 'bank_transfer', label: 'WIRE TRANSFER' },
                                { value: 'qr', label: 'QR SCAN' }
                            ]}
                            className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-rose-600"
                        />
                    </div>

                    <div className="p-8 bg-slate-900 rounded-[44px] flex items-center justify-between shadow-2xl relative overflow-hidden group">
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-14 h-14 bg-white/10 text-amber-400 rounded-2xl flex items-center justify-center border border-white/5 shadow-xl">
                                <Info size={28} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Cash Drawer Protocol</p>
                                <p className="text-sm font-bold text-white">Auto-deduct from current shift</p>
                            </div>
                        </div>
                        <div
                            onClick={() => setFormData({ ...formData, paid_from_cash_drawer: !formData.paid_from_cash_drawer })}
                            className={cn(
                                "w-16 h-8 rounded-full p-1.5 cursor-pointer transition-all duration-500 relative z-10",
                                formData.paid_from_cash_drawer ? "bg-rose-500 shadow-lg shadow-rose-500/20" : "bg-white/10"
                            )}
                        >
                            <div className={cn(
                                "w-5 h-5 bg-white rounded-full shadow-2xl transition-all duration-500",
                                formData.paid_from_cash_drawer ? "translate-x-8" : "translate-x-0"
                            )} />
                        </div>
                        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px]" />
                    </div>

                    <FormInput
                        label="Transmission Note"
                        placeholder="Define payout purpose for auditing..."
                        required
                        value={formData.note}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-rose-600"
                    />

                    <div className="flex gap-6 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Abort</button>
                        <AppButton
                            type="submit"
                            variant="danger"
                            className="flex-[2] py-6 rounded-[28px] font-black uppercase text-xs tracking-widest shadow-2xl shadow-rose-600/20 bg-rose-600 hover:bg-rose-500 border-none active:scale-95"
                            loading={saving}
                        >
                            Authorize Payout
                        </AppButton>
                    </div>
                </form>
            </AppModal>
        </div>
    );
};

export default ExpensesPage;
