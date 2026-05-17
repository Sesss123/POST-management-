import React, { useState, useEffect } from 'react';
import { 
  Database, 
  AlertCircle, 
  Download, 
  RefreshCcw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck,
  Search,
  HardDrive,
  Settings,
  AlertTriangle,
  Activity,
  Archive,
  ArrowUpRight,
  Shield,
  Zap,
  Cpu
} from 'lucide-react';
import { superAdminApi } from '../../api/api';
import { useToast } from '../../components/ui/Feedback';
import { cn } from '../../utils/cn';

const SuperAdminBackupsPage = () => {
  const [backups, setBackups] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsRes, settingsRes] = await Promise.all([
        superAdminApi.getBackups(),
        superAdminApi.getPlatformSettings()
      ]);
      
      if (logsRes.data.success) setBackups(logsRes.data.data);
      if (settingsRes.data.success) setSettings(settingsRes.data.data);
    } catch (error) {
      showToast('Failed to fetch backup data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerBackup = async () => {
    try {
      setRunning(true);
      const res = await superAdminApi.runBackup();
      if (res.data.success) {
        showToast('Manual backup completed successfully', 'success');
        fetchData();
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Manual backup failed', 'error');
    } finally {
      setRunning(false);
    }
  };

  const successBackups = backups.filter(b => b.status === 'success');
  const failedBackups = backups.filter(b => b.status === 'failed');
  const totalSize = successBackups.reduce((acc, curr) => acc + parseFloat(curr.file_size_mb || 0), 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 selection:bg-indigo-500/30">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-indigo-500" size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Storage Redundancy Protocol</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">Platform Snapshots</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchData}
            className="w-14 h-14 bg-slate-900/50 border border-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
            title="Sync Matrix"
          >
            <RefreshCcw size={22} className={cn("group-hover:rotate-180 transition-transform duration-700", loading ? 'animate-spin' : '')} />
          </button>
          <button 
            onClick={handleTriggerBackup}
            disabled={running || loading}
            className="flex items-center gap-4 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white rounded-2xl font-black text-sm shadow-2xl shadow-indigo-900/40 transition-all group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            {running ? <RefreshCcw className="animate-spin" size={20} /> : <Archive size={20} className="group-hover:scale-110 transition-transform relative z-10" />}
            <span className="relative z-10 uppercase tracking-[0.2em]">{running ? 'Processing Snapshot...' : 'Initialize Backup Protocol'}</span>
          </button>
        </div>
      </div>

      {/* Cinematic Engine Status */}
      <div className={cn(
        "bg-slate-900/40 backdrop-blur-md border rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group transition-all shadow-2xl",
        settings.backup_enabled === 'true' ? "border-indigo-500/20 shadow-indigo-900/20" : "border-rose-500/20 shadow-rose-900/20"
      )}>
        <div className="absolute -right-32 -top-32 w-96 h-96 bg-indigo-600 opacity-[0.03] rounded-full blur-3xl group-hover:opacity-[0.06] transition-opacity" />
        
        <div className={cn(
          "w-24 h-24 rounded-[2rem] flex items-center justify-center shrink-0 shadow-2xl relative z-10 border transition-all",
          settings.backup_enabled === 'true' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
        )}>
          {settings.backup_enabled === 'true' ? <ShieldCheck size={48} className="animate-pulse" /> : <AlertTriangle size={48} />}
        </div>
        
        <div className="relative z-10 text-center md:text-left flex-1">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
             <div className={cn("w-2 h-2 rounded-full animate-ping", settings.backup_enabled === 'true' ? "bg-emerald-500" : "bg-rose-500")} />
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Backup Engine Security</h3>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight uppercase leading-none">
            {settings.backup_enabled === 'true' ? 'Engine Active' : 'Protocol Suspended'}
          </h2>
          <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-6">
             <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <Clock size={14} className="text-indigo-400" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Schedule: <span className="text-white">{settings.backup_schedule_time || 'UNSET'}</span></span>
             </div>
             <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <Archive size={14} className="text-indigo-400" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Retention: <span className="text-white">{settings.backup_retention_days || '14'} DAYS</span></span>
             </div>
             <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <Terminal size={14} className="text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-400 font-mono tracking-tighter lowercase">{settings.backup_local_dir || 'database/backups'}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Stats Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Last Successful Snapshot', value: successBackups[0]?.created_at ? new Date(successBackups[0].created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'PROTOCOL EMPTY', icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Total Snapshot Volume', value: `${totalSize.toFixed(2)} MB`, sub: 'Local Storage Node', icon: HardDrive, color: 'text-indigo-400' },
          { label: 'Matrix Registries', value: `${backups.length} Snapshots`, icon: Database, color: 'text-slate-400' },
          { label: 'Integrity Failures', value: `${failedBackups.length} Anomalies`, icon: XCircle, color: 'text-rose-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-8 rounded-[2rem] group hover:border-indigo-500/30 transition-all shadow-xl">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-indigo-500/50 transition-all">
                   <stat.icon size={18} className={stat.color} />
                </div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</h4>
             </div>
             <p className="text-xl font-black text-white tracking-tight uppercase">{stat.value}</p>
             {stat.sub && <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* Snapshot Registry Table */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
        <div className="p-10 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
             <h3 className="text-xl font-black text-white uppercase tracking-tight">Snapshot Registry</h3>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">Historical backup protocol matrix</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={16} />
               <input 
                 type="text" 
                 placeholder="Search matrix..." 
                 className="bg-slate-950/50 border-2 border-white/5 rounded-2xl py-3 pl-11 pr-5 text-xs font-bold text-white placeholder:text-slate-700 outline-none focus:border-indigo-600 transition-all w-64" 
               />
             </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01] border-b border-white/5 text-slate-500 text-[10px] uppercase font-black tracking-[0.3em]">
                <th className="px-10 py-6">Redundancy Payload</th>
                <th className="px-10 py-6">Volume</th>
                <th className="px-10 py-6">Trigger</th>
                <th className="px-10 py-6">Integrity</th>
                <th className="px-10 py-6">Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                      <p className="text-slate-600 font-black uppercase tracking-[0.5em] text-[10px] animate-pulse">Syncing Payload Registry...</p>
                    </div>
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-10 py-24 text-center">
                     <div className="flex flex-col items-center gap-4 opacity-30">
                        <Archive size={60} className="text-slate-600" />
                        <p className="text-xl font-black text-slate-600 uppercase tracking-widest">Protocol Matrix Empty</p>
                     </div>
                  </td>
                </tr>
              ) : backups.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.03] transition-all group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-indigo-500/50 transition-all text-slate-400">
                         <Database size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white font-mono tracking-tight group-hover:text-indigo-400 transition-colors uppercase">{log.file_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <Terminal size={10} className="text-indigo-500" />
                           <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{log.local_path}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className="text-xs font-black text-white uppercase tracking-tighter">{log.file_size_mb || '0.00'} MB</span>
                  </td>
                  <td className="px-10 py-8">
                    <span className={cn(
                      "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border",
                      log.backup_type === 'manual' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                    )}>
                      {log.backup_type}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]",
                        log.status === 'success' ? "bg-emerald-500 text-emerald-500" : log.status === 'failed' ? "bg-rose-500 text-rose-500" : "bg-indigo-400 text-indigo-400"
                      )} />
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em]",
                        log.status === 'success' ? "text-emerald-500" : log.status === 'failed' ? "text-rose-500" : "text-indigo-400"
                      )}>
                        {log.status}
                      </span>
                    </div>
                    {log.error_message && <p className="text-[9px] text-rose-400/60 mt-1.5 font-bold uppercase tracking-tight max-w-xs leading-tight italic truncate">Anomalies: {log.error_message}</p>}
                  </td>
                  <td className="px-10 py-8">
                    <div className="space-y-1">
                       <p className="text-xs font-black text-white tracking-tighter">
                         {new Date(log.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                       </p>
                       <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                         {new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                       </p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 py-10 opacity-30 group hover:opacity-100 transition-opacity">
          <Shield size={14} className="text-slate-500 group-hover:text-indigo-500 transition-colors" />
          <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.5em] group-hover:text-slate-400 transition-colors">
              Storage Redundancy Protocol V4.2 — Encrypted Snapshot Matrix — RestoLedger Infrastructure
          </p>
      </div>
    </div>
  );
};

export default SuperAdminBackupsPage;
