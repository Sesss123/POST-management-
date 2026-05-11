import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Shield, 
  UserCheck, 
  UserX, 
  Loader2, 
  Plus, 
  Key, 
  Mail, 
  Building2,
  MoreVertical,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { superAdminApi } from '../../api/api';
import { useToast } from '../../components/ui/Feedback';
import { cn } from '../../utils/cn';


const SuperAdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'super_admin' });
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'global_admin'
  const { showToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await superAdminApi.getPlatformUsers();
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (error) {
      showToast('Failed to fetch platform users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await superAdminApi.createPlatformUser(formData);
      if (res.data.success) {
        showToast('User created successfully', 'success');
        setShowAddModal(false);
        setFormData({ name: '', email: '', password: '', role: 'super_admin' });
        fetchUsers();
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create user', 'error');
    }
  };

  const handleStatusToggle = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await superAdminApi.updateUserStatus(user.id, newStatus);
      showToast(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
      fetchUsers();
    } catch (error) {
      showToast('Failed to update user status', 'error');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await superAdminApi.resetUserPassword(selectedUser.id, newPassword);
      showToast('Password reset successful', 'success');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (error) {
      showToast('Failed to reset password', 'error');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.shop_name?.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'active') return matchesSearch && u.status === 'active';
    if (filter === 'global_admin') return matchesSearch && u.role === 'super_admin';
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Platform Users</h1>
          <p className="text-slate-400 mt-1">Manage global administrators and shop-level accounts</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-900/30 transition-all"
        >
          <Plus size={20} />
          Create Platform User
        </button>
      </div>

      {/* Stats Mini Row / Filters */}
      <div className="flex flex-wrap gap-4">
        <button 
          onClick={() => setFilter(filter === 'all' ? 'active' : 'all')}
          className={cn(
            "px-6 py-3 border rounded-2xl flex items-center gap-3 transition-all",
            filter === 'active' 
              ? "bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20" 
              : "bg-slate-900/50 border-white/5 hover:bg-slate-900"
          )}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className={cn(
            "text-xs font-black uppercase tracking-widest",
            filter === 'active' ? "text-emerald-400" : "text-white"
          )}>
            {users.filter(u => u.status === 'active').length} Active Users
          </span>
        </button>

        <button 
          onClick={() => setFilter(filter === 'global_admin' ? 'all' : 'global_admin')}
          className={cn(
            "px-6 py-3 border rounded-2xl flex items-center gap-3 transition-all",
            filter === 'global_admin' 
              ? "bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20" 
              : "bg-slate-900/50 border-white/5 hover:bg-slate-900"
          )}
        >
          <Shield size={16} className={filter === 'global_admin' ? "text-indigo-400" : "text-slate-500"} />
          <span className={cn(
            "text-xs font-black uppercase tracking-widest",
            filter === 'global_admin' ? "text-indigo-400" : "text-slate-500"
          )}>
            {users.filter(u => u.role === 'super_admin').length} Global Admins
          </span>
        </button>

        {filter !== 'all' && (
          <button 
            onClick={() => setFilter('all')}
            className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors ml-2"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Search by name, email or shop..." 
          className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">User Profile</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">System Role</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Assignment</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Joined</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Users size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      user.role === 'super_admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-800 text-slate-400 border-white/5'
                    }`}>
                      {user.role === 'super_admin' ? <ShieldCheck size={12} /> : null}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                      {user.shop_name ? (
                        <>
                          <Building2 size={14} className="text-slate-600" />
                          {user.shop_name}
                        </>
                      ) : (
                        <span className="text-xs text-slate-600 uppercase font-black italic">Global Scope</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${user.status === 'active' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-500">
                    {new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => { setSelectedUser(user); setShowPasswordModal(true); }}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-indigo-400 transition-all border border-white/5"
                        title="Reset Password"
                      >
                        <Key size={18} />
                      </button>
                      <button 
                        onClick={() => handleStatusToggle(user)}
                        className={`p-2.5 rounded-xl transition-all border ${
                          user.status === 'active' 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white' 
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                        }`}
                        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {user.status === 'active' ? <UserX size={18} /> : <UserCheck size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-white tracking-tight mb-8">Create Platform User</h3>
            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold focus:border-indigo-500 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold focus:border-indigo-500 outline-none transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <input 
                  type="password" 
                  required
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold focus:border-indigo-500 outline-none transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Role</label>
                <select 
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold focus:border-indigo-500 outline-none transition-all"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="super_admin">Super Admin (Global)</option>
                  <option value="admin">Shop Admin (Requires shop_id)</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 bg-white/5 text-slate-400 hover:text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-900/30 transition-all"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">Reset Password</h3>
            <p className="text-slate-400 text-sm font-medium mb-8">Set a new temporary password for {selectedUser?.name}.</p>
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Min. 8 characters"
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold focus:border-indigo-500 outline-none transition-all"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-4 bg-white/5 text-slate-400 hover:text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-900/30 transition-all"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminUsersPage;
