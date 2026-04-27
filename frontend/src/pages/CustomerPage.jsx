import React, { useState, useEffect } from 'react';
import { customerApi } from '../api/api';
import { Users, Plus, Search, User, Phone, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import { AppButton, AppCard, AppTable, StatusBadge, AppModal, FormInput, useToast } from '../components/ui';

const CustomerPage = () => {
  const toast = useToast();
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
    status: 'active'
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
        await customerApi.update(editingCustomer.id, formData);
        toast.success('Customer updated successfully');
      } else {
        await customerApi.create(formData);
        toast.success('New customer profile created');
      }
      setShowModal(false);
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', address: '', credit_limit: 5000, status: 'active' });
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
      status: customer.status
    });
    setShowModal(true);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                <Users size={24} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Customer Profiles</h1>
                <p className="text-slate-500 font-medium italic">Manage memberships and credit limits</p>
            </div>
        </div>
        <AppButton icon={Plus} size="lg" onClick={() => setShowModal(true)}>New Customer</AppButton>
      </header>

      <AppCard>
        <div className="mb-8 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, phone or membership ID..." 
            className="w-full bg-slate-50 border-2 border-transparent rounded-[24px] py-4 pl-12 pr-4 text-slate-900 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <AppTable 
            headers={[
                { label: 'Customer Info' },
                { label: 'Contact' },
                { label: 'Credit Limit', className: 'text-right' },
                { label: 'Balance', className: 'text-right' },
                { label: 'Status', className: 'text-right' },
                { label: 'Actions', className: 'text-right' }
            ]}
            data={filteredCustomers}
            loading={loading}
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
                    <td className="py-5 text-right"><StatusBadge status={c.status} /></td>
                    <td className="py-5 text-right">
                        <AppButton variant="ghost" size="sm" onClick={() => handleEdit(c)}>Edit Profile</AppButton>
                    </td>
                </tr>
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
