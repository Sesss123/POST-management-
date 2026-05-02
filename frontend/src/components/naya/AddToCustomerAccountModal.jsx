import React, { useState, useEffect } from 'react';
import { customerApi } from '../../api/api';
import { 
  Search, 
  UserPlus, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Plus,
  ArrowRight,
  Phone,
  MapPin,
  CreditCard,
  Wallet,
  Receipt
} from 'lucide-react';
import { AppButton, AppModal, FormInput, useToast } from '../ui';
import { cn } from '../../utils/cn';

const AddToCustomerAccountModal = ({ isOpen, onClose, billAmount, onConfirm, processing }) => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    credit_limit: '0',
    opening_balance: '0'
  });

  useEffect(() => {
    if (isOpen) {
        fetchCustomers();
    } else {
        resetState();
    }
  }, [isOpen, search]);

  const resetState = () => {
    setSearch('');
    setSelectedCustomer(null);
    setShowCreateForm(false);
    setNewCustomer({
        name: '',
        phone: '',
        address: '',
        credit_limit: '0',
        opening_balance: '0'
    });
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
        const { data } = await customerApi.getDebtors({ search, include_zero: true });
        setCustomers(data.data);
    } catch (err) {
        console.error('Failed to fetch customers');
    } finally {
        setLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return toast.error('Name and Phone are required');
    
    setLoading(true);
    try {
        const { data } = await customerApi.create(newCustomer);
        if (data.success) {
            toast.success('Customer account created successfully');
            setSelectedCustomer(data.data);
            setShowCreateForm(false);
            setSearch('');
            fetchCustomers();
        }
    } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to create customer');
    } finally {
        setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedCustomer) return;
    if (selectedCustomer.status === 'blocked') return toast.error('This customer account is blocked');
    
    onConfirm(selectedCustomer.id);
  };

  const newBalance = selectedCustomer ? parseFloat(selectedCustomer.current_balance) + billAmount : 0;
  const isOverLimit = selectedCustomer && parseFloat(selectedCustomer.credit_limit) > 0 && newBalance > parseFloat(selectedCustomer.credit_limit);

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add to Customer Account"
      description="Record this bill as credit in the customer's Naya Book"
      size="md"
    >
      <div className="space-y-6 py-2">
        {!showCreateForm ? (
            <>
                {/* Search & Selection */}
                <div className="space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search by name or phone..." 
                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold outline-none focus:bg-white focus:border-purple-600 focus:shadow-xl transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                        {customers.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedCustomer(c)}
                                className={cn(
                                    "w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all",
                                    selectedCustomer?.id === c.id 
                                        ? "bg-purple-50 border-purple-600 shadow-md" 
                                        : "bg-white border-transparent hover:bg-slate-50"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        selectedCustomer?.id === c.id ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-400"
                                    )}>
                                        <User size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-slate-900 leading-none mb-1">{c.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.phone}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Balance</p>
                                    <p className={cn("font-black", parseFloat(c.current_balance) > 0 ? "text-rose-500" : "text-emerald-500")}>
                                        Rs. {parseFloat(c.current_balance).toLocaleString()}
                                    </p>
                                </div>
                            </button>
                        ))}
                        
                        {customers.length === 0 && !loading && (
                            <div className="py-8 text-center text-slate-400 italic text-sm">
                                No customers found matching "{search}"
                            </div>
                        )}

                        <button 
                            onClick={() => setShowCreateForm(true)}
                            className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-purple-600 hover:text-purple-600 transition-all flex items-center justify-center gap-2 font-bold"
                        >
                            <UserPlus size={20} />
                            Create New Account
                        </button>
                    </div>
                </div>

                {/* Selection Preview */}
                {selectedCustomer && (
                    <div className="p-6 bg-slate-900 rounded-[32px] text-white relative overflow-hidden animate-in slide-in-from-bottom-4">
                        <div className="relative z-10 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-xl font-black tracking-tight">{selectedCustomer.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedCustomer.phone}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Credit Limit</p>
                                    <p className="font-black">Rs. {parseFloat(selectedCustomer.credit_limit || 0).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/10">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Account Balance</p>
                                    <p className="text-xl font-black text-rose-400">Rs. {parseFloat(selectedCustomer.current_balance).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">New Invoice</p>
                                    <p className="text-xl font-black text-purple-400">+ Rs. {billAmount.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Estimated Total Balance</p>
                                    <p className={cn(
                                        "text-3xl font-black tracking-tighter",
                                        isOverLimit ? "text-amber-400" : "text-emerald-400"
                                    )}>Rs. {newBalance.toLocaleString()}</p>
                                </div>
                                {isOverLimit && (
                                    <div className="flex items-center gap-2 text-amber-400 animate-pulse">
                                        <AlertCircle size={20} />
                                        <span className="text-[10px] font-black uppercase">Credit Limit Risk</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="absolute right-0 bottom-0 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl" />
                    </div>
                )}

                <div className="flex gap-4 pt-4">
                    <AppButton variant="secondary" className="flex-1" onClick={onClose}>Cancel</AppButton>
                    <AppButton 
                        variant="success" 
                        className="flex-[2]" 
                        onClick={handleConfirm}
                        disabled={!selectedCustomer || processing}
                        loading={processing}
                    >
                        Confirm Add to Account
                    </AppButton>
                </div>
            </>
        ) : (
            /* Create Customer Form */
            <form onSubmit={handleCreateCustomer} className="space-y-6 animate-in slide-in-from-right-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormInput 
                        label="Full Name" 
                        required 
                        icon={User} 
                        value={newCustomer.name}
                        onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                    />
                    <FormInput 
                        label="Phone Number" 
                        required 
                        icon={Phone} 
                        value={newCustomer.phone}
                        onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                    />
                </div>
                <FormInput 
                    label="Address (Optional)" 
                    icon={MapPin} 
                    value={newCustomer.address}
                    onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormInput 
                        label="Credit Limit (Optional)" 
                        type="number" 
                        icon={CreditCard} 
                        value={newCustomer.credit_limit}
                        onChange={e => setNewCustomer({...newCustomer, credit_limit: e.target.value})}
                    />
                    <FormInput 
                        label="Opening Balance (Optional)" 
                        type="number" 
                        icon={Wallet} 
                        value={newCustomer.opening_balance}
                        onChange={e => setNewCustomer({...newCustomer, opening_balance: e.target.value})}
                    />
                </div>

                <div className="flex gap-4 pt-4">
                    <AppButton variant="secondary" className="flex-1" type="button" onClick={() => setShowCreateForm(false)}>Back to List</AppButton>
                    <AppButton variant="success" className="flex-[2]" type="submit" loading={loading}>Create & Select Account</AppButton>
                </div>
            </form>
        )}
      </div>
    </AppModal>
  );
};

export default AddToCustomerAccountModal;
