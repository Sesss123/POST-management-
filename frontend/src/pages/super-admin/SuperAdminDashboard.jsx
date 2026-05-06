import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Users, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import apiClient from '../../api/apiClient';
import { cn } from '../../utils/cn';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group">
    <div className={cn("absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 blur-3xl transition-all group-hover:scale-150", color)} />
    
    <div className="relative z-10">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg", color)}>
        <Icon size={28} className="text-white" />
      </div>
      
      <p className="text-slate-400 font-medium mb-1">{title}</p>
      <div className="flex items-end gap-3">
        <h3 className="text-4xl font-black text-white tracking-tighter">{value}</h3>
        {trend && (
          <span className="flex items-center text-xs font-bold text-emerald-400 mb-2">
            <TrendingUp size={14} className="mr-1" />
            {trend}
          </span>
        )}
      </div>
    </div>
  </div>
);

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await apiClient.get('/super-admin/stats');
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      setError('Failed to fetch platform stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>;
  if (error) return <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-rose-500 flex items-center gap-3"><AlertCircle size={20} />{error}</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Platform Overview</h1>
          <p className="text-slate-400 mt-2">Global system statistics and shop performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold text-sm transition-all flex items-center gap-2">
            <Activity size={18} className="text-indigo-400" />
            System Health
          </button>
          <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-900/40 transition-all flex items-center gap-2">
            <Plus size={18} />
            Onboard New Shop
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Active Shops" 
          value={stats?.shops_count || 0} 
          icon={Store} 
          color="bg-indigo-600"
          trend="+2 this month"
        />
        <StatCard 
          title="Global Platform Users" 
          value={stats?.users_count || 0} 
          icon={Users} 
          color="bg-violet-600"
          trend="+12 this week"
        />
        <StatCard 
          title="Total System GMV" 
          value={`Rs. ${(stats?.total_revenue || 0).toLocaleString()}`} 
          icon={TrendingUp} 
          color="bg-emerald-600"
          trend="Lifetime"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Store className="text-indigo-400" size={24} />
              Recent Onboardings
            </h2>
            <button className="text-indigo-400 text-sm font-bold hover:text-white transition-colors">View All Shops</button>
          </div>
          
          <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Shop Name</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Identifier</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats?.recent_shops?.map((shop) => (
                  <tr key={shop.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/10">
                          {shop?.name ? shop.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span className="font-bold text-white">{shop?.name || 'Unnamed Shop'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-400 font-mono">{shop.identifier}</td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        shop.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                      )}>
                        {shop.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 bg-white/5 hover:bg-indigo-600 hover:text-white rounded-lg text-slate-400 transition-all">
                        <ArrowUpRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="text-indigo-400" size={24} />
            System Status
          </h2>
          
          <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Database</span>
                <span className="flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Optimal
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">API Gateway</span>
                <span className="flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Backups</span>
                <span className="flex items-center gap-1.5 text-xs font-black text-indigo-400 uppercase tracking-widest">
                  Scheduled
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <div className="p-4 bg-indigo-600/10 border border-indigo-600/20 rounded-2xl">
                <div className="flex items-center gap-3 text-indigo-400 mb-2">
                  <ShieldCheck size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">Security Audit</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Last global security audit completed 2 days ago. No vulnerabilities detected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
