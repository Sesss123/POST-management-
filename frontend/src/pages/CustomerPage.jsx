import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../api/api';
import { Users, Plus, Search, User, Phone, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import { AppButton, AppCard, AppTable, StatusBadge, AppModal, FormInput, useToast, ResponsiveDataList } from '../components/ui';

const CustomerPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    credit_limit: 5000,
    status: 'active',
    loyalty_enabled: true
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await customerApi.getAll();
      setCustomers(data.data);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await customerApi.update(editingCustomer.uuid || editingCustomer.id, formData);
        toast.success('Customer updated successfully');
      } else {
        await customerApi.create(formData);
        toast.success('New customer profile created');
      }
      setShowModal(false);
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', address: '', credit_limit: 5000, status: 'active', loyalty_enabled: true });
      fetchCustomers();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      credit_limit: customer.credit_limit,
      status: customer.status,
      loyalty_enabled: customer.loyalty_enabled !== 0
    });
    setShowModal(true);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 lg:gap-0">
        <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 shrink-0">
                <Users size={20} className="lg:w-6 lg:h-6" />
            </div>
            <div>
                <h1 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tight uppercase lg:normal-case">Customer Profiles</h1>
                <p className="text-slate-500 font-medium italic text-[10px] lg:text-sm">Manage memberships and credit limits</p>
            </div>
        </div>
        <AppButton icon={Plus} size="lg" className="w-full sm:w-auto uppercase tracking-widest text-[10px] lg:text-xs font-black" onClick={() => setShowModal(true)}>New Customer</AppButton>
      </header>

      <AppCard>
        <div className="mb-6 lg:mb-8 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 lg:w-5 lg:h-5" size={18} />
          <input 
            type="text" 
            placeholder="Search name, phone or membership ID..." 
            className="w-full bg-slate-50 border-2 border-transparent rounded-[20px] lg:rounded-[24px] py-3 lg:py-4 pl-12 pr-4 text-slate-900 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner text-xs lg:text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ResponsiveDataList 
            loading={loading}
            data={filteredCustomers}
            headers={[
                { label: 'Customer Info' },
                { label: 'Contact' },
                { label: 'Credit Limit', className: 'text-right' },
                { label: 'Balance', className: 'text-right' },
                { label: 'Points', className: 'text-right' },
                { label: 'Status', className: 'text-right' },
                { label: 'Actions', className: 'text-right' }
            ]}
            renderRow={(c) => (
                <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-black">
                                {c.name.charAt(0)}
                            </div>
                            <span className="font-black text-slate-900">{c.name}</span>
                        </div>
                    </td>
                    <td className="py-5 font-bold text-slate-500">{c.phone}</td>
                    <td className="py-5 text-right font-bold text-slate-700">Rs. {parseFloat(c.credit_limit).toLocaleString()}</td>
                    <td className="py-5 text-right font-black text-rose-600">Rs. {parseFloat(c.current_balance).toLocaleString()}</td>
                    <td className="py-5 text-right font-black text-indigo-600">
                        {parseFloat(c.loyalty_points || 0).toFixed(0)}
                    </td>
                    <td className="py-5 text-right"><StatusBadge status={c.status} /></td>
                    <td className="py-5 text-right">
                        <div className="flex justify-end gap-2">
                            <AppButton variant="ghost" size="sm" onClick={() => handleEdit(c)}>Edit Profile</AppButton>
                            <AppButton variant="primary" size="sm" onClick={() => navigate(`/customers/${c.uuid || c.id}/ledger`)}>Ledger</AppButton>
                        </div>
                    </td>
                </tr>
            )}
            renderCard={(c) => (
                <div key={c.id} className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                                {c.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{c.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.phone}</p>
                            </div>
                        </div>
                        <StatusBadge status={c.status} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Credit Limit</p>
                            <p className="text-xs font-bold text-slate-700">Rs. {parseFloat(c.credit_limit).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
                            <p className="text-sm font-black text-rose-500">Rs. {parseFloat(c.current_balance).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-3 rounded-2xl flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Star size={14} className="text-amber-500 fill-amber-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loyalty Points</span>
                        </div>
                        <span className="text-sm font-black text-indigo-600">{parseFloat(c.loyalty_points || 0).toFixed(0)}</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <AppButton variant="secondary" size="sm" className="flex-1" onClick={() => handleEdit(c)}>Edit Profile</AppButton>
                        <AppButton variant="primary" size="sm" className="flex-1" onClick={() => navigate(`/customers/${c.uuid || c.id}/ledger`)}>Ledger</AppButton>
                    </div>
                </div>
            )}
        />
      </AppCard>

      <AppModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCustomer ? "Update Profile" : "New Customer"}
        description="Enter customer details for billing and credit"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
            <FormInput label="Full Name" icon={User} required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <FormInput label="Phone Number" icon={Phone} required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <FormInput label="Address" icon={MapPin} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
                <FormInput label="Credit Limit" type="number" icon={CreditCard} value={formData.credit_limit} onChange={e => setFormData({...formData, credit_limit: e.target.value})} />
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 ml-1">Account Status</label>
                    <select className="input-field" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="active">Active / Healthy</option>
                        <option value="blocked">Blocked / Suspended</option>
                    </select>
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                        <Star size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-900 uppercase">Loyalty Program</p>
                        <p className="text-[10px] font-medium text-slate-500">Earn points on every purchase</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{formData.loyalty_enabled ? 'Enabled' : 'Disabled'}</span>
                    <button 
                        type="button"
                        onClick={() => setFormData({...formData, loyalty_enabled: !formData.loyalty_enabled})}
                        className={cn(
                            "w-12 h-6 rounded-full relative transition-all duration-300",
                            formData.loyalty_enabled ? "bg-indigo-600" : "bg-slate-300"
                        )}
                    >
                        <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                            formData.loyalty_enabled ? "left-7" : "left-1"
                        )} />
                    </button>
                </div>
            </div>
            <div className="flex gap-4 pt-4">
                <AppButton variant="secondary" className="flex-1" type="button" onClick={() => setShowModal(false)}>Cancel</AppButton>
                <AppButton variant="primary" className="flex-1" type="submit">Save Customer</AppButton>
            </div>
        </form>
      </AppModal>
    </div>
  );
};

export default CustomerPage;
