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
import { Link } from 'react-router-dom';
import { superAdminApi } from '../../api/api';
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
      const { data } = await superAdminApi.getStats();
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
    <div className="space-y-10 animate-in fade-in duration-1000 pb-20 relative">
      {/* Background Subtle Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-600/5 blur-[120px] rounded-full -z-10" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Platform Overview</h1>
          <p className="text-slate-400 mt-2 font-medium">Global system telemetry and tenant performance matrix.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/super-admin/system-health" className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2">
            <Activity size={16} className="text-indigo-400" />
            Live Health
          </Link>
          <Link to="/super-admin/shops/new" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-900/40 transition-all flex items-center gap-2">
            <Plus size={16} />
            Onboard Shop
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <StatCard 
          title="Active Tenants" 
          value={stats?.shops?.total || 0} 
          icon={Store} 
          color="bg-indigo-600"
          trend={stats?.shops?.new_this_month ? `+${stats.shops.new_this_month} this month` : '0 this month'}
        />
        <StatCard 
          title="Platform Users" 
          value={stats?.users_count || 0} 
          icon={Users} 
          color="bg-violet-600"
          trend={null}
        />
        <StatCard 
          title="Monthly Revenue" 
          value={`Rs. ${Number(stats?.revenue_trends?.this_month || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          icon={TrendingUp} 
          color="bg-emerald-600"
          trend={stats?.revenue_trends?.delta > 0 ? `+Rs. ${stats.revenue_trends.delta.toLocaleString()}` : stats?.revenue_trends?.delta < 0 ? `-Rs. ${Math.abs(stats.revenue_trends.delta).toLocaleString()}` : 'Steady'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-white uppercase tracking-widest opacity-60 flex items-center gap-2">
              <Store className="text-indigo-400" size={16} />
              Recent Onboardings
            </h2>
            <Link to="/super-admin/shops" className="text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">View All Shops</Link>
          </div>
          
          <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Shop Entity</th>
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
                        shop.subscription_status === 'active' ? "bg-emerald-500/10 text-emerald-500" : 
                        shop.subscription_status === 'grace' ? "bg-amber-500/10 text-amber-500" :
                        "bg-rose-500/10 text-rose-500"
                      )}>
                        {shop.subscription_status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Link to={`/super-admin/shops/${shop.id}`} className="p-2 bg-white/5 hover:bg-indigo-600 hover:text-white rounded-lg text-slate-400 transition-all inline-flex items-center justify-center">
                        <ArrowUpRight size={18} />
                      </Link>
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
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Database</span>
                <span className={cn(
                  "flex items-center gap-1.5 text-xs font-black uppercase tracking-widest",
                  stats?.server_health?.db_status === 'connected' ? "text-emerald-400" : "text-rose-400"
                )}>
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", stats?.server_health?.db_status === 'connected' ? "bg-emerald-400" : "bg-rose-400")} />
                  {stats?.server_health?.db_status === 'connected' ? 'Connected' : 'Error'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Server Status</span>
                <span className="flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Memory Usage</span>
                <div className="text-right">
                    <span className="text-xs font-black text-white uppercase tracking-widest">
                    {stats?.server_health?.memory_used_mb || 0} MB
                    </span>
                    <div className="w-24 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                        <div 
                            className="h-full bg-indigo-500 transition-all duration-1000" 
                            style={{ width: `${Math.min(100, ((stats?.server_health?.memory_used_mb || 0) / (stats?.server_health?.memory_total_mb || 16000)) * 100)}%` }}
                        />
                    </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Uptime</span>
                <span className="text-xs font-black text-slate-300 uppercase tracking-widest">
                  {(() => {
                    const s = stats?.server_health?.uptime_seconds || 0;
                    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
                    return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
                  })()}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium text-slate-400">Backup Storage</span>
                <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                  {stats?.server_health?.backup_storage_mb || 0} MB
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <div className={cn(
                "p-4 rounded-2xl border",
                (stats?.security?.failed_logins_24h > 10 || stats?.security?.unauthorized_attempts_24h > 0) 
                  ? "bg-rose-600/10 border-rose-600/20" 
                  : "bg-indigo-600/10 border-indigo-600/20"
              )}>
                <div className={cn(
                  "flex items-center gap-3 mb-2",
                  (stats?.security?.failed_logins_24h > 10 || stats?.security?.unauthorized_attempts_24h > 0) ? "text-rose-400" : "text-indigo-400"
                )}>
                  <ShieldCheck size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">Security Telemetry (24h)</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400">
                    Failed Logins: <span className={cn(stats?.security?.failed_logins_24h > 10 ? "text-rose-400" : "text-white")}>{stats?.security?.failed_logins_24h || 0}</span>
                  </p>
                  <p className="text-[10px] font-bold text-slate-400">
                    Unauthorized Access: <span className={cn(stats?.security?.unauthorized_attempts_24h > 0 ? "text-rose-400" : "text-white")}>{stats?.security?.unauthorized_attempts_24h || 0} blocks</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
