import React, { useState, useEffect, useCallback } from 'react';
import { 
    ShieldCheck, 
    Plus, 
    User, 
    Mail, 
    Lock, 
    Shield, 
    Sparkles, 
    RefreshCw, 
    ChevronRight, 
    Activity, 
    Settings, 
    MoreHorizontal,
    ArrowLeft,
    Eye,
    Key,
    UserCheck,
    UserPlus
} from 'lucide-react';
import apiClient from '../api/apiClient';
import { 
    AppButton, 
    AppModal, 
    FormInput, 
    FormSelect, 
    useToast,
    Skeleton 
} from '../components/ui';
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

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/users');
      setUsers(data.data);
    } catch (err) {
      toast.error('Identity synchronization failed');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/users', formData);
      toast.success('Access protocol initialized successfully');
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'cashier' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Access creation protocol failed');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] space-y-4 animate-in fade-in duration-700 p-1 selection:bg-indigo-500/30 overflow-hidden bg-slate-50/50">
      {/* Premium Neural Header - White Theme */}
      <header className="relative group shrink-0">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 rounded-[32px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
            <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 group-hover:scale-110 transition-transform duration-500">
                    <ShieldCheck size={32} />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={14} className="text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Security Control</span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-1 uppercase">Access Management</h2>
                    <p className="text-sm font-medium text-slate-400">Encrypted staff accounts and system protocol assignment</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto relative z-10">
                <AppButton 
                    variant="primary" 
                    icon={UserPlus} 
                    size="lg" 
                    className="w-full sm:w-auto rounded-[24px] px-10 py-6 bg-indigo-600 hover:bg-indigo-500 shadow-2xl shadow-indigo-500/20 font-black uppercase tracking-widest text-xs border-none" 
                    onClick={() => setShowModal(true)}
                >
                    Enroll Agent
                </AppButton>
                <AppButton 
                    variant="secondary" 
                    icon={RefreshCw} 
                    size="lg" 
                    className="rounded-[24px] bg-white border-slate-100 text-slate-400 hover:text-indigo-600 shadow-sm" 
                    onClick={fetchUsers} 
                    loading={loading}
                />
            </div>
        </div>
      </header>

      {/* Global Intelligence Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 shrink-0">
          <GlassCard 
            title="Active Agents" 
            value={users.length} 
            icon={UserCheck} 
            variant="success" 
          />
          <GlassCard 
            title="Elevated Protocols" 
            value={users.filter(u => u.role === 'admin').length} 
            icon={Shield} 
            variant="primary" 
          />
          <GlassCard 
            title="System Security" 
            value="Quantum Stable" 
            icon={Key} 
            variant="warning" 
          />
      </section>

      {/* Main Agent List - White Theme */}
      <div className="flex-1 overflow-hidden bg-white rounded-[44px] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col">
          <div className="p-10 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/30">
              <div className="flex items-center gap-4 text-slate-900">
                  <div className="w-12 h-12 bg-white shadow-sm text-indigo-600 rounded-2xl flex items-center justify-center border border-slate-100">
                    <Activity size={24} />
                  </div>
                  <div>
                      <h3 className="font-black uppercase tracking-tight text-lg">Active Personnel Directory</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Audited Access Control Telemetry</p>
                  </div>
              </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-20 border-b border-slate-100">
                <tr>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Agent Identity</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Login Identification</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Access Level</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Telemetry Status</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                        <td colSpan="5" className="px-10 py-8"><Skeleton className="h-10 w-full rounded-xl" /></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr><td colSpan="5" className="py-40 text-center opacity-20"><User size={64} className="mx-auto mb-6 text-slate-300" /><p className="text-xl font-black uppercase tracking-widest text-slate-400">No personnel records found</p></td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-10 py-8">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[20px] flex items-center justify-center text-white font-black text-xl shadow-2xl shadow-indigo-100 border border-white/20 transition-transform group-hover:scale-105">
                                {u.name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-black text-slate-900 text-lg tracking-tight uppercase leading-none mb-1">{u.name}</p>
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Verified Agent</p>
                            </div>
                        </div>
                    </td>
                    <td className="px-10 py-8">
                        <div className="flex items-center gap-3 text-slate-500 font-bold group-hover:text-slate-900 transition-colors">
                            <Mail size={16} className="text-slate-400" />
                            <span className="text-sm">{u.email}</span>
                        </div>
                    </td>
                    <td className="px-10 py-8">
                        <div className={cn(
                            "inline-flex items-center gap-3 px-6 py-2 rounded-xl border transition-all duration-500",
                            u.role === 'admin' 
                                ? "bg-indigo-50 border-indigo-100 text-indigo-600 shadow-sm" 
                                : "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm"
                        )}>
                            <Shield size={14} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{u.role.toUpperCase()}</span>
                        </div>
                    </td>
                    <td className="px-10 py-8">
                        <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Sync</span>
                        </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                        <button className="w-12 h-12 bg-slate-50 text-slate-400 hover:bg-white hover:text-indigo-600 rounded-2xl transition-all flex items-center justify-center border border-slate-100 group-hover:scale-105 shadow-sm active:scale-95">
                            <Settings size={20} />
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>

      {/* Modern Enrollment Modal - White */}
      <AppModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Agent Enrollment Protocol"
        description="Initializing encrypted access credentials"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-10 py-6">
            <div className="grid grid-cols-1 gap-8">
                <FormInput 
                    label="Agent Real Identity" 
                    icon={User} 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600"
                />
                <FormInput 
                    label="Intelligence Login ID (Email)" 
                    type="email" 
                    icon={Mail} 
                    required 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600"
                />
                <FormInput 
                    label="Encrypted Access Key" 
                    type="password" 
                    icon={Lock} 
                    required 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600"
                />
                <FormSelect 
                    label="Clearance Level"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    options={[
                        { value: 'cashier', label: 'FIELD AGENT (CASHIER)' },
                        { value: 'admin', label: 'COMMAND DIRECTOR (ADMIN)' }
                    ]}
                    className="rounded-[28px] h-20 px-8 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600"
                />
            </div>
            
            <div className="p-8 bg-slate-900 rounded-[44px] text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-14 h-14 bg-white/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-white/5 shadow-xl">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Security Protocol</p>
                        <p className="text-sm font-bold text-white">Enrollment is permanent</p>
                        <p className="text-[10px] text-slate-500 font-medium italic">Identity logged for all future operations</p>
                    </div>
                </div>
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="flex gap-6 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Abort</button>
                <AppButton 
                    variant="primary" 
                    className="flex-[2] py-6 rounded-[28px] font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-500 border-none active:scale-95" 
                    type="submit"
                >
                    Authorize Enrollment
                </AppButton>
            </div>
        </form>
      </AppModal>
    </div>
  );
};

export default UsersPage;
