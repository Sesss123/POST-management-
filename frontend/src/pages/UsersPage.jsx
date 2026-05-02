import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, User, Mail, Lock, Shield } from 'lucide-react';
import apiClient from '../api/apiClient';
import { AppButton, AppCard, AppTable, StatusBadge, AppModal, FormInput, FormSelect, useToast, ResponsiveDataList } from '../components/ui';
import { cn } from '../utils/cn';

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
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 lg:gap-0">
        <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 shrink-0">
                <ShieldCheck size={20} className="lg:w-6 lg:h-6" />
            </div>
            <div>
                <h1 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tight uppercase lg:normal-case">System Security</h1>
                <p className="text-slate-500 font-medium italic text-[10px] lg:text-sm">Manage staff accounts and access roles</p>
            </div>
        </div>
        <AppButton icon={Plus} size="lg" className="w-full sm:w-auto uppercase tracking-widest text-[10px] lg:text-xs font-black" onClick={() => setShowModal(true)}>Add System User</AppButton>
      </header>

      <AppCard>
        <ResponsiveDataList 
            loading={loading}
            data={users}
            headers={[
                { label: 'Full Name' },
                { label: 'Email / ID' },
                { label: 'Access Role' },
                { label: 'Status', className: 'text-right' }
            ]}
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
            renderCard={(u) => (
                <div key={u.id} className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-black">
                                {u.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{u.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{u.email}</p>
                            </div>
                        </div>
                        <StatusBadge status="active" />
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                        <Shield size={14} className={u.role === 'admin' ? "text-indigo-600" : "text-emerald-600"} />
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-[0.2em]",
                            u.role === 'admin' ? "text-indigo-600" : "text-emerald-600"
                        )}>
                            {u.role} Account
                        </span>
                    </div>
                </div>
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
