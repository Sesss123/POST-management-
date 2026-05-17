import React, { useState, useEffect, useCallback } from 'react';
import { 
    ClipboardList, Search, Loader2, Calendar, User, Store, 
    Filter, RefreshCcw, Eye, X, ChevronLeft, ChevronRight, 
    ShieldAlert, Globe, Monitor, Activity, ShieldCheck,
    Hash, Terminal, ArrowUpRight
} from 'lucide-react';
import { superAdminApi } from '../../api/api';
import { useToast } from '../../components/ui/Feedback';
import { cn } from '../../utils/cn';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (iso) => !iso ? 'N/A' : new Date(iso).toLocaleString('en-GB', { 
    day: '2-digit', month: 'short', year: 'numeric', 
    hour: '2-digit', minute: '2-digit', second: '2-digit' 
});

const safeParse = (str) => {
    if (!str) return {};
    try {
        return typeof str === 'string' ? JSON.parse(str) : str;
    } catch (e) {
        return { raw: str };
    }
};

const maskSensitive = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const sensitiveKeys = ['password', 'token', 'secret', 'api_key', 'jwt', 'db_password', 'auth_token'];
    const masked = { ...obj };
    Object.keys(masked).forEach(key => {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
            masked[key] = '********';
        } else if (typeof masked[key] === 'object') {
            masked[key] = maskSensitive(masked[key]);
        }
    });
    return masked;
};

// ─── Components ──────────────────────────────────────────────────────────────

const StatusBadge = ({ action }) => {
    const isError = action?.includes('fail') || action?.includes('unauthorized') || action?.includes('error');
    const isDelete = action?.includes('delete');
    const isCreate = action?.includes('create') || action?.includes('onboard');

    return (
        <span className={cn(
            "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-2xl transition-all",
            isError ? "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-rose-900/20" :
            isDelete ? "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-900/20" :
            isCreate ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-900/20" :
            "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-indigo-900/20"
        )}>
            {action?.replace(/_/g, ' ')}
        </span>
    );
};

import { useLocation } from 'react-router-dom';

export default function SuperAdminAuditLogsPage() {
    const location = useLocation();
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(() => {
        const params = new URLSearchParams(location.search);
        return params.get('search') || '';
    });
    const [filters, setFilters] = useState({ action: '', entity_type: '', date_from: '', date_to: '' });
    const [selectedLog, setSelectedLog] = useState(null);
    const { showToast } = useToast();

    const fetchLogs = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: pagination.limit,
                search: searchTerm,
                action: filters.action,
                entity_type: filters.entity_type,
                date_from: filters.date_from,
                date_to: filters.date_to
            };
            const { data } = await superAdminApi.getAuditLogs(params);
            if (data.success) {
                setLogs(data.data.logs);
                setPagination(data.data.pagination);
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load audit logs', 'error');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, filters, pagination.limit, showToast]);

    useEffect(() => {
        const timer = setTimeout(() => fetchLogs(1), 300);
        return () => clearTimeout(timer);
    }, [fetchLogs]);

    const handleRefresh = () => fetchLogs(pagination.page);

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20 selection:bg-indigo-500/30">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="text-indigo-500" size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Security Command</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">Audit Matrix</h1>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Sync</p>
                        <p className="text-xs font-black text-white tracking-tighter uppercase">Live Stream Active</p>
                    </div>
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="w-14 h-14 bg-slate-900/50 border border-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all group disabled:opacity-50"
                        title="Resync Audit Protocol"
                    >
                        <RefreshCcw size={22} className={cn("group-hover:rotate-180 transition-transform duration-700", loading ? 'animate-spin' : '')} />
                    </button>
                </div>
            </div>

            {/* Glassmorphic Filters */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full opacity-[0.03] blur-3xl group-hover:opacity-[0.05] transition-opacity" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 relative z-10">
                    <div className="relative lg:col-span-2">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input 
                            type="text"
                            placeholder="Search logs matrix..."
                            className="w-full bg-slate-950/50 border-2 border-white/5 rounded-2xl pl-14 pr-5 py-4 text-white placeholder:text-slate-700 outline-none focus:border-indigo-600 transition-all font-bold tracking-tight"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="absolute -top-2 left-5 px-2 bg-slate-900 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Matrix Query</span>
                    </div>
                    
                    <div className="relative">
                        <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <select 
                            className="w-full bg-slate-950/50 border-2 border-white/5 rounded-2xl pl-14 pr-5 py-4 text-white outline-none focus:border-indigo-600 transition-all font-bold appearance-none text-xs uppercase tracking-widest"
                            value={filters.action}
                            onChange={(e) => setFilters(p => ({ ...p, action: e.target.value }))}
                        >
                            <option value="">All Actions</option>
                            <option value="login_success">Login Success</option>
                            <option value="login_failed">Login Failed</option>
                            <option value="unauthorized_access_attempt">Unauthorized</option>
                            <option value="shop_created">Shop Created</option>
                            <option value="subscription_changed">Sub Change</option>
                        </select>
                        <span className="absolute -top-2 left-5 px-2 bg-slate-900 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Protocol</span>
                    </div>

                    <div className="relative">
                        <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <select 
                            className="w-full bg-slate-950/50 border-2 border-white/5 rounded-2xl pl-14 pr-5 py-4 text-white outline-none focus:border-indigo-600 transition-all font-bold appearance-none text-xs uppercase tracking-widest"
                            value={filters.entity_type}
                            onChange={(e) => setFilters(p => ({ ...p, entity_type: e.target.value }))}
                        >
                            <option value="">All Entities</option>
                            <option value="auth">Auth</option>
                            <option value="shop">Shop</option>
                            <option value="user">User</option>
                            <option value="invoice">Invoice</option>
                            <option value="setting">Setting</option>
                        </select>
                        <span className="absolute -top-2 left-5 px-2 bg-slate-900 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Node Entity</span>
                    </div>

                    <div className="relative">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                            type="date"
                            className="w-full bg-slate-950/50 border-2 border-white/5 rounded-2xl pl-14 pr-5 py-4 text-white outline-none focus:border-indigo-600 transition-all font-bold text-xs uppercase"
                            value={filters.date_from}
                            onChange={(e) => setFilters(p => ({ ...p, date_from: e.target.value }))}
                        />
                        <span className="absolute -top-2 left-5 px-2 bg-slate-900 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Timeline Start</span>
                    </div>

                    <div className="relative">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                            type="date"
                            className="w-full bg-slate-950/50 border-2 border-white/5 rounded-2xl pl-14 pr-5 py-4 text-white outline-none focus:border-indigo-600 transition-all font-bold text-xs uppercase"
                            value={filters.date_to}
                            onChange={(e) => setFilters(p => ({ ...p, date_to: e.target.value }))}
                        />
                        <span className="absolute -top-2 left-5 px-2 bg-slate-900 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Timeline End</span>
                    </div>
                </div>
            </div>

            {/* Telemetry Grid */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
                <div className="overflow-x-auto overflow-y-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] text-slate-500 text-[10px] uppercase font-black tracking-[0.3em] border-b border-white/5">
                                <th className="px-10 py-6">Audit Lifecycle</th>
                                <th className="px-10 py-6">Protocol Initiator</th>
                                <th className="px-10 py-6">Matrix Action</th>
                                <th className="px-10 py-6">Target Node</th>
                                <th className="px-10 py-6 text-right">Access</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {loading && logs.length === 0 ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-10 py-8"><div className="h-6 bg-white/5 rounded-xl w-full"></div></td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-10 py-24 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5 text-slate-600">
                                                <ClipboardList size={40} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xl font-black text-white uppercase tracking-widest">Protocol Matrix Clear</p>
                                                <p className="text-sm font-bold text-slate-500 uppercase tracking-tighter">No audit transmissions detected in current timeline.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="group hover:bg-white/[0.03] transition-all relative">
                                        <td className="px-10 py-7">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] group-hover:scale-125 transition-transform" />
                                                <div className="space-y-1">
                                                    <div className="text-[11px] font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{fmtDate(log.created_at)}</div>
                                                    <div className="text-[10px] text-slate-500 font-bold font-mono tracking-tighter uppercase">{log.ip_address}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-7">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-xs border border-indigo-500/20 shadow-xl group-hover:border-indigo-500/50 transition-all">
                                                    {log.user_name?.charAt(0) || 'S'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white leading-none uppercase tracking-tight group-hover:text-indigo-300 transition-colors">{log.user_name || 'System Protocol'}</p>
                                                    <p className="text-[9px] text-slate-500 mt-1 font-black uppercase tracking-widest opacity-60">ID: {log.user_id || 'INTERNAL'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-7">
                                            <div className="flex flex-col items-start gap-2">
                                                <StatusBadge action={log.action} />
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-md border border-white/5">
                                                    <Hash size={10} className="text-indigo-500" />
                                                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">
                                                        {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-7">
                                            <div className="flex items-center gap-3 text-xs font-black text-slate-300 uppercase tracking-tight group-hover:text-white transition-colors">
                                                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                                                    <Store size={14} className="text-indigo-500/60" />
                                                </div>
                                                <span>{log.shop_name || 'Global Matrix'}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-7 text-right">
                                            <button 
                                                onClick={() => setSelectedLog(log)}
                                                className="w-12 h-12 bg-white/5 hover:bg-indigo-600 hover:text-white text-slate-400 rounded-2xl transition-all border border-white/5 group-hover:shadow-2xl group-hover:shadow-indigo-900/40 flex items-center justify-center"
                                            >
                                                <ArrowUpRight size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Protocol */}
                {pagination.total > 0 && (
                    <div className="px-10 py-8 bg-white/[0.01] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                                    Displaying <span className="text-white font-black">{logs.length}</span> / <span className="text-indigo-400 font-black">{pagination.total}</span> Protocol Entries
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                disabled={pagination.page === 1 || loading}
                                onClick={() => fetchLogs(pagination.page - 1)}
                                className="w-12 h-12 bg-slate-950 border border-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all shadow-xl"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="px-6 h-12 bg-indigo-600 rounded-xl flex items-center justify-center border border-indigo-500 shadow-2xl shadow-indigo-900/50">
                                <span className="text-xs font-black text-white uppercase tracking-widest">
                                    Matrix Phase {pagination.page}
                                </span>
                            </div>
                            <button 
                                disabled={pagination.page * pagination.limit >= pagination.total || loading}
                                onClick={() => fetchLogs(pagination.page + 1)}
                                className="w-12 h-12 bg-slate-950 border border-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all shadow-xl"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Audit Protocol Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 border-2 border-white/5 w-full max-w-4xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 relative">
                        <div className="absolute -right-32 -top-32 w-96 h-96 bg-indigo-600 opacity-[0.05] rounded-full blur-3xl"></div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-10 border-b border-white/5 bg-white/[0.02] relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[2rem] bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
                                    <ShieldCheck size={32} className="text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Audit Protocol Detail</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Hash size={12} className="text-indigo-500" />
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{selectedLog.id}</p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="w-14 h-14 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-2xl transition-all border border-white/5 mt-6 sm:mt-0 flex items-center justify-center">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-10 space-y-10 max-h-[65vh] overflow-y-auto custom-scrollbar relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Protocol Lifecycle</p>
                                    <div className="flex items-center gap-3 text-white font-black text-sm uppercase tracking-tighter">
                                        <Calendar size={16} className="text-slate-500" /> {fmtDate(selectedLog.created_at)}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Matrix Action</p>
                                    <StatusBadge action={selectedLog.action} />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Node Uplink</p>
                                    <div className="flex items-center gap-3 text-indigo-300 font-black text-sm uppercase tracking-tighter">
                                        <Terminal size={16} className="text-slate-500" /> {selectedLog.ip_address}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Target Registry</p>
                                    <div className="text-white text-[10px] font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5 inline-flex items-center gap-2">
                                        <Hash size={12} className="text-indigo-500" />
                                        {selectedLog.entity_type} {selectedLog.entity_id ? `#${selectedLog.entity_id}` : 'GLOBAL'}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-white/5 space-y-8">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-black text-white uppercase tracking-[0.3em]">Neural Payload Changes</h4>
                                    <div className="px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic">Differential Analysis</span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-6">
                                    {selectedLog.old_value && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 ml-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">Previous State Archive</p>
                                            </div>
                                            <pre className="p-8 bg-slate-950 border-2 border-white/5 rounded-[2.5rem] text-xs text-slate-500 overflow-x-auto font-mono leading-relaxed shadow-inner">
                                                {JSON.stringify(maskSensitive(safeParse(selectedLog.old_value)), null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 ml-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Current Payload State</p>
                                        </div>
                                        <pre className="p-8 bg-slate-950 border-2 border-white/5 rounded-[2.5rem] text-xs text-slate-200 overflow-x-auto font-mono leading-relaxed shadow-inner">
                                            {JSON.stringify(maskSensitive(safeParse(selectedLog.new_value)), null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            {selectedLog.user_agent && (
                                <div className="pt-10 border-t border-white/5">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Uplink Device Telemetry</p>
                                    <div className="p-6 bg-slate-950 border border-white/5 rounded-2xl flex items-start gap-4 italic shadow-inner">
                                        <Monitor size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-slate-400 font-mono leading-relaxed tracking-tight">{selectedLog.user_agent}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
