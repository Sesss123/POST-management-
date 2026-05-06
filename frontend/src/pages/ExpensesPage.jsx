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
    Info
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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-rose-200">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Expense Tracker</h2>
                        <p className="text-slate-400 text-sm font-medium">Manage daily operational costs and payouts</p>
                    </div>
                </div>
                <AppButton 
                    variant="danger" 
                    icon={Plus} 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full sm:w-auto"
                >
                    Record Expense
                </AppButton>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Expenses" 
                    value={`Rs. ${totalAmount.toLocaleString()}`} 
                    icon={Wallet}
                    variant="default"
                />
                <StatCard 
                    title="Active Records" 
                    value={expenses.filter(e => e.status === 'active').length} 
                    icon={FileText}
                    variant="default"
                />
                <StatCard 
                    title="Top Category" 
                    value={topCategory.toUpperCase()} 
                    icon={PieChart}
                    variant="default"
                />
            </div>

            <AppCard title="Filters" icon={Filter} className="shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <FormInput 
                        type="date" 
                        value={filters.from} 
                        onChange={(e) => setFilters({...filters, from: e.target.value})}
                        label="From Date"
                    />
                    <FormInput 
                        type="date" 
                        value={filters.to} 
                        onChange={(e) => setFilters({...filters, to: e.target.value})}
                        label="To Date"
                    />
                    <FormSelect 
                        label="Category"
                        value={filters.category}
                        onChange={(e) => setFilters({...filters, category: e.target.value})}
                        options={[
                            { value: 'all', label: 'All Categories' },
                            ...categories.map(c => ({ value: c.toLowerCase(), label: c }))
                        ]}
                    />
                    <FormSelect 
                        label="Status"
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                        options={[
                            { value: 'all', label: 'All Status' },
                            { value: 'active', label: 'Active' },
                            { value: 'cancelled', label: 'Cancelled' }
                        ]}
                    />
                </div>
            </AppCard>

            <AppCard bodyClassName="p-0">
                <AppTable 
                    headers={[
                        { label: 'Date' },
                        { label: 'Expense No' },
                        { label: 'Category' },
                        { label: 'Amount', className: 'text-right' },
                        { label: 'Method' },
                        { label: 'Status' },
                        { label: 'Action', className: 'text-center' }
                    ]}
                    data={expenses}
                    loading={loading}
                    renderRow={(item) => (
                        <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-4 font-bold text-slate-700">{new Date(item.expense_date).toLocaleDateString()}</td>
                            <td className="py-4 px-4 font-medium text-slate-500">{item.expense_no}</td>
                            <td className="py-4 px-4">
                                <Badge variant="primary">{item.category}</Badge>
                            </td>
                            <td className="py-4 px-4 text-right font-black text-slate-900">
                                Rs. {parseFloat(item.amount).toLocaleString()}
                            </td>
                            <td className="py-4 px-4">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold uppercase">{item.payment_method}</span>
                                    {item.paid_from_cash_drawer && (
                                        <span className="text-[9px] text-amber-600 font-black">FROM DRAWER</span>
                                    )}
                                </div>
                            </td>
                            <td className="py-4 px-4">
                                <Badge variant={item.status === 'active' ? 'success' : 'danger'}>
                                    {item.status}
                                </Badge>
                            </td>
                            <td className="py-4 px-4 text-center">
                                {item.status === 'active' && (
                                    <button 
                                        onClick={() => {
                                            if(window.confirm('Cancel this expense?')) handleCancelExpense(item.id);
                                        }}
                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </td>
                        </tr>
                    )}
                />
            </AppCard>

            <AppModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                title="Record Daily Expense"
                description="operational costs deducted from revenue"
                size="md"
            >
                <form onSubmit={handleAddExpense} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput 
                            label="Date"
                            type="date"
                            required
                            value={formData.expense_date}
                            onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                        />
                        <FormSelect 
                            label="Category"
                            required
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            options={[
                                { value: '', label: 'Select Category' },
                                ...categories.map(c => ({ value: c.toLowerCase(), label: c }))
                            ]}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput 
                            label="Amount"
                            type="number"
                            required
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        />
                        <FormSelect 
                            label="Payment Method"
                            value={formData.payment_method}
                            onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                            options={[
                                { value: 'cash', label: 'Cash' },
                                { value: 'card', label: 'Card' },
                                { value: 'bank_transfer', label: 'Bank Transfer' },
                                { value: 'qr', label: 'QR' }
                            ]}
                        />
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                                <Info size={16} />
                            </div>
                            <div className="text-xs">
                                <p className="font-bold text-amber-900">Paid from cash drawer?</p>
                                <p className="text-amber-700">Deducts from current shift balance</p>
                            </div>
                        </div>
                        <div 
                            onClick={() => setFormData({...formData, paid_from_cash_drawer: !formData.paid_from_cash_drawer})}
                            className={cn(
                                "w-12 h-6 rounded-full p-1 cursor-pointer transition-all duration-300",
                                formData.paid_from_cash_drawer ? "bg-amber-600" : "bg-slate-300"
                            )}
                        >
                            <div className={cn(
                                "w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300",
                                formData.paid_from_cash_drawer ? "translate-x-6" : "translate-x-0"
                            )} />
                        </div>
                    </div>

                    <FormInput 
                        label="Note / Reason"
                        placeholder="What was this for?"
                        required
                        value={formData.note}
                        onChange={(e) => setFormData({...formData, note: e.target.value})}
                    />

                    <AppButton 
                        type="submit" 
                        variant="danger" 
                        className="w-full py-4"
                        loading={saving}
                    >
                        Save Expense
                    </AppButton>
                </form>
            </AppModal>
        </div>
    );
};

export default ExpensesPage;
