import React, { useState, useEffect, useCallback } from 'react';
import { 
    ClipboardList, Search, Loader2, Calendar, User, Store, 
    Filter, RefreshCw, Eye, X, ChevronLeft, ChevronRight, 
    ShieldAlert, Globe, Monitor
} from 'lucide-react';
import apiClient from '../../api/apiClient';
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
            "text-[10px] font-black uppercase tracking-tight px-2 py-1 rounded border",
            isError ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
            isDelete ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
            isCreate ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
            "bg-blue-500/10 text-blue-400 border-blue-500/20"
        )}>
            {action?.replace(/_/g, ' ')}
        </span>
    );
};

export default function SuperAdminAuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
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
            const { data } = await apiClient.get('/super-admin/audit-logs', { params });
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
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Audit Logs</h1>
                    <p className="text-slate-400 text-sm mt-1">Platform-level security and activity trail tracking.</p>
                </div>
                <button 
                    onClick={handleRefresh}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 p-5 bg-slate-900/50 border border-white/5 rounded-[2rem]">
                <div className="relative lg:col-span-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text"
                        placeholder="Search logs..."
                        className="w-full bg-slate-950 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <select 
                        className="w-full bg-slate-950 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm appearance-none"
                        value={filters.action}
                        onChange={(e) => setFilters(p => ({ ...p, action: e.target.value }))}
                    >
                        <option value="">All Actions</option>
                        <option value="login_success">Login Success</option>
                        <option value="login_failed">Login Failed</option>
                        <option value="unauthorized_access_attempt">Unauthorized Attempt</option>
                        <option value="shop_created">Shop Created</option>
                        <option value="subscription_changed">Subscription Change</option>
                    </select>
                </div>
                <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <select 
                        className="w-full bg-slate-950 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm appearance-none"
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
                </div>
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="date"
                        className="w-full bg-slate-950 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                        value={filters.date_from}
                        onChange={(e) => setFilters(p => ({ ...p, date_from: e.target.value }))}
                    />
                    <span className="absolute -top-2 left-3 px-1 bg-slate-900 text-[9px] font-black text-slate-500 uppercase tracking-widest">From</span>
                </div>
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="date"
                        className="w-full bg-slate-950 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                        value={filters.date_to}
                        onChange={(e) => setFilters(p => ({ ...p, date_to: e.target.value }))}
                    />
                    <span className="absolute -top-2 left-3 px-1 bg-slate-900 text-[9px] font-black text-slate-500 uppercase tracking-widest">To</span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl shadow-black/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-white/5">
                                <th className="px-8 py-5">Timestamp</th>
                                <th className="px-8 py-5">Initiator</th>
                                <th className="px-8 py-5">Action</th>
                                <th className="px-8 py-5">Target Shop</th>
                                <th className="px-8 py-5 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {loading && logs.length === 0 ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-8 py-6"><div className="h-4 bg-white/5 rounded-full w-full"></div></td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-500">
                                            <ClipboardList size={40} className="opacity-20" />
                                            <p className="font-bold">No audit logs found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="group hover:bg-white/[0.02] transition-all">
                                        <td className="px-8 py-5">
                                            <div className="text-xs font-mono text-slate-400 group-hover:text-white transition-colors">{fmtDate(log.created_at)}</div>
                                            <div className="text-[10px] text-slate-600 mt-0.5 font-mono">{log.ip_address}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-[10px]">
                                                    {log.user_name?.charAt(0) || 'S'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white leading-none">{log.user_name || 'System'}</p>
                                                    <p className="text-[10px] text-slate-500 mt-1">ID: {log.user_id || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <StatusBadge action={log.action} />
                                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter font-black opacity-50">
                                                {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                                            </p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                <Store size={14} className="text-slate-600" />
                                                <span className="font-medium">{log.shop_name || 'Platform'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button 
                                                onClick={() => setSelectedLog(log)}
                                                className="p-2.5 bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 rounded-xl transition-all"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.total > 0 && (
                    <div className="px-8 py-5 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                            Showing <span className="text-white font-bold">{logs.length}</span> of <span className="text-white font-bold">{pagination.total}</span> logs
                        </p>
                        <div className="flex items-center gap-2">
                            <button 
                                disabled={pagination.page === 1 || loading}
                                onClick={() => fetchLogs(pagination.page - 1)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-xs font-black text-white px-3">
                                Page {pagination.page}
                            </span>
                            <button 
                                disabled={pagination.page * pagination.limit >= pagination.total || loading}
                                onClick={() => fetchLogs(pagination.page + 1)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between p-8 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                    <ClipboardList size={24} className="text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">Log Details</h3>
                                    <p className="text-slate-500 text-xs mt-0.5">Entry ID: {selectedLog.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="p-3 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-2xl transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Timestamp</p>
                                    <div className="flex items-center gap-2 text-slate-300 font-mono text-xs">
                                        <Calendar size={14} className="text-slate-500" /> {fmtDate(selectedLog.created_at)}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Action</p>
                                    <StatusBadge action={selectedLog.action} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">User IP Address</p>
                                    <div className="flex items-center gap-2 text-slate-300 font-mono text-xs">
                                        <Monitor size={14} className="text-slate-500" /> {selectedLog.ip_address}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Entity Target</p>
                                    <div className="text-slate-300 text-sm font-bold capitalize">
                                        {selectedLog.entity_type} {selectedLog.entity_id ? `#${selectedLog.entity_id}` : '(None)'}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Changes Data</p>
                                <div className="space-y-4">
                                    {selectedLog.old_value && (
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-bold text-rose-400/60 ml-1 italic">Old Values</p>
                                            <pre className="p-4 bg-slate-950 border border-white/5 rounded-2xl text-[11px] text-slate-400 overflow-x-auto font-mono">
                                                {JSON.stringify(maskSensitive(safeParse(selectedLog.old_value)), null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-emerald-400/60 ml-1 italic">New Values / Params</p>
                                        <pre className="p-4 bg-slate-950 border border-white/5 rounded-2xl text-[11px] text-slate-200 overflow-x-auto font-mono">
                                            {JSON.stringify(maskSensitive(safeParse(selectedLog.new_value)), null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            {selectedLog.user_agent && (
                                <div className="pt-6 border-t border-white/5">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">User Agent / Device</p>
                                    <p className="text-[11px] text-slate-500 font-mono leading-relaxed">{selectedLog.user_agent}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
