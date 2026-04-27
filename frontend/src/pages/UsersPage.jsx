import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, User, Mail, Lock, Shield } from 'lucide-react';
import apiClient from '../api/apiClient';
import { AppButton, AppCard, AppTable, StatusBadge, AppModal, FormInput, FormSelect, useToast } from '../components/ui';

const UsersPage = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await apiClient.get('/users');
      setUsers(data.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/users', formData);
      toast.success('System user created successfully');
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'cashier' });
      fetchUsers();
    } catch (err) {
      toast.error('Failed to create user');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                <ShieldCheck size={24} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Security</h1>
                <p className="text-slate-500 font-medium italic">Manage staff accounts and access roles</p>
            </div>
        </div>
        <AppButton icon={Plus} size="lg" onClick={() => setShowModal(true)}>Add System User</AppButton>
      </header>

      <AppCard>
        <AppTable 
            headers={[
                { label: 'Full Name' },
                { label: 'Email / ID' },
                { label: 'Access Role' },
                { label: 'Status', className: 'text-right' }
            ]}
            data={users}
            loading={loading}
            renderRow={(u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-5 font-black text-slate-900">{u.name}</td>
                    <td className="py-5 font-bold text-slate-400">{u.email}</td>
                    <td className="py-5">
                        <div className="flex items-center gap-2">
                            <Shield size={14} className={u.role === 'admin' ? "text-indigo-600" : "text-emerald-600"} />
                            <span className={cn(
                                "text-xs font-black uppercase tracking-widest",
                                u.role === 'admin' ? "text-indigo-600" : "text-emerald-600"
                            )}>
                                {u.role}
                            </span>
                        </div>
                    </td>
                    <td className="py-5 text-right"><StatusBadge status="active" /></td>
                </tr>
            )}
        />
      </AppCard>

      <AppModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Staff Account"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
            <FormInput label="Staff Name" icon={User} required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <FormInput label="Email / Login ID" type="email" icon={Mail} required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <FormInput label="Security Password" type="password" icon={Lock} required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            <FormSelect 
                label="System Role"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                options={[
                    { value: 'cashier', label: 'Cashier (Sales Only)' },
                    { value: 'admin', label: 'Administrator (Full Access)' }
                ]}
            />
            <div className="flex gap-4 pt-4">
                <AppButton variant="secondary" className="flex-1" type="button" onClick={() => setShowModal(false)}>Cancel</AppButton>
                <AppButton variant="primary" className="flex-1" type="submit">Create Account</AppButton>
            </div>
        </form>
      </AppModal>
    </div>
  );
};

export default UsersPage;
