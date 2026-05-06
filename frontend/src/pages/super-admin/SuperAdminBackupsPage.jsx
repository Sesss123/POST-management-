import React, { useState, useEffect } from 'react';
import { 
  Database, 
  AlertCircle, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck,
  Search,
  HardDrive,
  Settings,
  AlertTriangle
} from 'lucide-react';
import api from '../../api/apiClient';
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
        api.get('/super-admin/backups'),
        api.get('/super-admin/platform-settings')
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
      const res = await api.post('/super-admin/backups/run');
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Platform Backups</h1>
          <p className="text-slate-400 mt-1">Automated snapshots and database integrity monitoring</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchData}
            className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={handleTriggerBackup}
            disabled={running || loading}
            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-900/30 transition-all group"
          >
            {running ? <RefreshCw className="animate-spin" size={20} /> : <Database size={20} className="group-hover:scale-110 transition-transform" />}
            {running ? 'Processing...' : 'Run Manual Backup'}
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className={cn(
        "bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[2.5rem] flex items-start gap-6 relative overflow-hidden group transition-all",
        settings.backup_enabled !== 'true' && "bg-rose-500/5 border-rose-500/20"
      )}>
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
          {settings.backup_enabled === 'true' ? <ShieldCheck size={80} className="text-indigo-500" /> : <AlertTriangle size={80} className="text-rose-500" />}
        </div>
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
          settings.backup_enabled === 'true' ? "bg-indigo-500/20 text-indigo-400" : "bg-rose-500/20 text-rose-400"
        )}>
          {settings.backup_enabled === 'true' ? <ShieldCheck size={32} /> : <AlertTriangle size={32} />}
        </div>
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">
            Backup Engine: {settings.backup_enabled === 'true' ? 'Active' : 'Disabled'}
          </h3>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed max-w-2xl font-medium">
            Daily snapshots are {settings.backup_enabled === 'true' ? 'scheduled' : 'currently paused'}. 
            Current schedule: <span className="text-white font-bold">{settings.backup_schedule_time || 'N/A'}</span>. 
            Retention period is set to <span className="text-white font-bold">{settings.backup_retention_days || '14'} days</span>.
            Output directory: <span className="text-indigo-400 font-mono text-xs">{settings.backup_local_dir || 'database/backups'}</span>
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 size={18} className="text-emerald-500" />
            <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Last Successful</h4>
          </div>
          <p className="text-lg font-bold text-white">
              {successBackups[0]?.created_at 
                ? new Date(successBackups[0].created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                : 'Never'}
          </p>
        </div>
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-3">
            <HardDrive size={18} className="text-indigo-500" />
            <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Storage Used</h4>
          </div>
          <p className="text-lg font-bold text-white">{totalSize.toFixed(2)} MB <span className="text-slate-600 text-xs font-medium ml-2">/ local storage</span></p>
        </div>
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-3">
            <Database size={18} className="text-slate-400" />
            <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Logs</h4>
          </div>
          <p className="text-lg font-bold text-white">{backups.length} <span className="text-slate-600 text-xs font-medium ml-2">snapshots</span></p>
        </div>
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-3">
            <XCircle size={18} className="text-rose-500" />
            <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Failed Attempts</h4>
          </div>
          <p className="text-lg font-bold text-white">{failedBackups.length} <span className="text-slate-600 text-xs font-medium ml-2">errors logged</span></p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <h3 className="text-xl font-black text-white">Backup Logs</h3>
          <div className="flex items-center gap-4">
             <div className="relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
               <input type="text" placeholder="Filter logs..." className="bg-slate-950 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all" />
             </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">File Name</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Size</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Executed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                      <p className="text-slate-600 font-bold uppercase tracking-widest text-[9px]">Analyzing logs...</p>
                    </div>
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center text-slate-500 font-bold">No historical backup logs found.</td>
                </tr>
              ) : backups.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <Database size={16} className="text-slate-500" />
                      <div>
                        <p className="text-sm font-bold text-white font-mono">{log.file_name}</p>
                        <p className="text-[10px] text-slate-600 font-medium">Path: {log.local_path}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-bold text-white">{log.file_size_mb || '0.00'} MB</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                      log.backup_type === 'manual' ? "bg-amber-500/10 text-amber-500" : "bg-indigo-500/10 text-indigo-400"
                    )}>
                      {log.backup_type}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      {log.status === 'success' ? (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      ) : log.status === 'failed' ? (
                        <XCircle size={14} className="text-rose-500" />
                      ) : (
                        <Clock size={14} className="text-indigo-400 animate-pulse" />
                      )}
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        log.status === 'success' ? "text-emerald-500" : log.status === 'failed' ? "text-rose-500" : "text-indigo-400"
                      )}>
                        {log.status}
                      </span>
                    </div>
                    {log.error_message && <p className="text-[9px] text-rose-400 mt-1 max-w-xs truncate">{log.error_message}</p>}
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-400">
                    {new Date(log.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminBackupsPage;

