import React, { useState, useEffect, useCallback } from 'react';
import { 
  Server, 
  Database, 
  Store, 
  HardDrive, 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  RefreshCcw, 
  Activity, 
  Receipt, 
  Clock, 
  Wifi,
  Cpu,
  Layers,
  Zap,
  Terminal,
  Search,
  ArrowUpRight
} from 'lucide-react';
import { superAdminApi } from '../../api/api';
import { cn } from '../../utils/cn';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (v, suffix = '') => (v == null ? 'N/A' : `${v}${suffix}`);
const fmtDate = (iso) => !iso ? 'N/A' : new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtUptime = (s) => {
    if (s == null) return 'N/A';
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const SEVERITY_STYLES = {
    critical: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', icon: XCircle, iconColor: 'text-rose-400', titleColor: 'text-rose-300' },
    warning:  { bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: AlertTriangle, iconColor: 'text-amber-400', titleColor: 'text-amber-300' },
    info:     { bg: 'bg-slate-800/40', border: 'border-white/5', icon: Activity, iconColor: 'text-slate-400', titleColor: 'text-slate-300' },
};

const STATUS_CARD = {
    healthy:  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', shadow: 'shadow-emerald-900/40' },
    warning:  { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   shadow: 'shadow-amber-900/40'  },
    critical: { bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    text: 'text-rose-400',    shadow: 'shadow-rose-900/40'   },
};

// ─── Modern Components ─────────────────────────────────────────────────────────

const Sk = ({ h = 'h-32', w = 'w-full' }) => (
    <div className={cn('animate-pulse rounded-3xl bg-slate-900/40 border border-white/5', h, w)} />
);

const GlassCard = ({ title, subtitle, icon: Icon, color = 'text-indigo-400', children, span2, className }) => (
    <div className={cn(
        "bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group transition-all hover:border-indigo-500/30",
        span2 && 'lg:col-span-2',
        className
    )}>
        <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-indigo-600 rounded-full opacity-[0.05] blur-3xl group-hover:opacity-[0.1] transition-opacity" />
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-indigo-500/50 transition-all">
                        <Icon size={22} className={color} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight uppercase leading-tight">{title}</h3>
                        {subtitle && <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{subtitle}</p>}
                    </div>
                </div>
            </div>
            {children}
        </div>
    </div>
);

const Row = ({ label, value, highlight }) => (
    <div className="flex justify-between items-center py-3.5 border-b border-white/[0.04] last:border-0 group/row">
        <span className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover/row:text-slate-400 transition-colors">{label}</span>
        <span className={cn('text-xs font-black text-right break-all uppercase tracking-tighter transition-all', highlight || 'text-white')}>{value}</span>
    </div>
);

const SBadge = ({ status, label }) => {
    const s = { 
        connected: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_-5px_#10b981]', 
        online: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_-5px_#10b981]', 
        warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_-5px_#f59e0b]', 
        critical: 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[0_0_15px_-5px_#f43f5e]', 
        disconnected: 'text-rose-400 bg-rose-500/10 border-rose-500/20', 
        normal: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', 
        healthy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_-5px_#10b981]' 
    }[status] || 'text-slate-500 bg-slate-800 border-slate-700';
    
    return (
        <span className={cn('px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border inline-flex items-center gap-2', s)}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {label}
        </span>
    );
};

const CountChip = ({ label, value, color = 'text-white' }) => (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0 group/row">
        <span className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover/row:text-slate-400 transition-colors">{label}</span>
        <span className={cn('text-xs font-black tracking-tighter', value > 0 ? color : 'text-slate-700')}>
            {value > 0 ? value.toLocaleString() : 'NONE'}
        </span>
    </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SystemHealthPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshed, setRefreshed] = useState(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await superAdminApi.getSystemHealth();
            if (res.data.success) { setData(res.data.data); setRefreshed(new Date()); }
            else setError('Unexpected response from server.');
        } catch (e) {
            setError(e.response?.status === 403 ? 'Access denied. Super Admin only.' : e.response?.data?.message || 'Could not reach backend.');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const d = data;
    const overallStyle = d ? STATUS_CARD[d.overall_status] || STATUS_CARD.healthy : STATUS_CARD.healthy;

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20 selection:bg-indigo-500/30">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="text-indigo-500" size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Telemetry Matrix</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">Diagnostic Command</h1>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Sync</p>
                        {refreshed && <p className="text-xs font-black text-white tracking-tighter uppercase">{refreshed.toLocaleTimeString()}</p>}
                    </div>
                    <button 
                        onClick={load} 
                        disabled={loading} 
                        className="w-14 h-14 bg-slate-900/50 border border-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all group disabled:opacity-50"
                        title="Force Protocol Re-sync"
                    >
                        <RefreshCcw size={22} className={cn("group-hover:rotate-180 transition-transform duration-700", loading ? 'animate-spin' : '')} />
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && !loading && (
                <div className="flex items-center gap-6 p-8 bg-rose-500/10 border border-rose-500/30 rounded-[2.5rem] text-rose-400 shadow-2xl shadow-rose-900/20 animate-in zoom-in-95 duration-500">
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/20">
                        <XCircle size={32} />
                    </div>
                    <div className="flex-1">
                        <p className="text-xl font-black uppercase tracking-tight">Diagnostic Failure</p>
                        <p className="text-sm font-bold opacity-70 mt-1 uppercase tracking-widest">{error}</p>
                    </div>
                    <button onClick={load} className="px-8 py-4 bg-rose-500/20 hover:bg-rose-500/30 rounded-2xl text-rose-200 text-xs font-black uppercase tracking-[0.2em] transition-all border border-rose-500/20">Re-Initialize</button>
                </div>
            )}

            {/* Loading Placeholder */}
            {loading && (
                <div className="space-y-10">
                    <Sk h="h-40" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => <Sk key={i} h="h-[400px]" />)}
                    </div>
                </div>
            )}

            {!loading && d && (
                <>
                    {/* Overall status banner */}
                    <div className={cn(
                        'flex flex-col md:flex-row items-center gap-8 p-10 rounded-[3.5rem] border backdrop-blur-md transition-all relative overflow-hidden', 
                        overallStyle.bg, overallStyle.border, overallStyle.shadow
                    )}>
                        <div className="absolute -right-24 -top-24 w-64 h-64 bg-current opacity-[0.03] rounded-full blur-3xl"></div>
                        
                        <div className={cn('w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl relative z-10', overallStyle.bg)}>
                            {d.overall_status === 'healthy' ? <ShieldCheck size={40} className={overallStyle.text} /> : d.overall_status === 'warning' ? <AlertTriangle size={40} className={overallStyle.text} /> : <XCircle size={40} className={overallStyle.text} />}
                        </div>
                        
                        <div className="flex-1 text-center md:text-left relative z-10">
                            <p className={cn('text-4xl font-black tracking-tighter uppercase', overallStyle.text)}>System {d.overall_status} Protocol</p>
                            <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Integrity Verified: {fmtDate(d.checked_at)}</span>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl px-8 py-6 rounded-[2rem] border border-white/5 text-center relative z-10">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Active Anomalies</p>
                            <p className={cn('text-5xl font-black leading-none tracking-tighter', d.alerts.length > 0 ? 'text-amber-400' : 'text-emerald-500')}>
                                {d.alerts.length.toString().padStart(2, '0')}
                            </p>
                        </div>
                    </div>

                    {/* Alerts Workspace */}
                    {d.alerts.length > 0 && (
                        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                            <div className="absolute -left-12 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl"></div>
                            <div className="flex items-center gap-4 mb-8 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                    <AlertCircle size={20} />
                                </div>
                                <h3 className="font-black text-white text-lg tracking-tight uppercase">High-Priority Alerts Matrix</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                {d.alerts.map((a, i) => {
                                    const s = SEVERITY_STYLES[a.severity] || SEVERITY_STYLES.info;
                                    const Icon = s.icon;
                                    return (
                                        <div key={i} className={cn('flex items-start gap-4 p-6 rounded-3xl border group transition-all hover:bg-white/5', s.bg, s.border)}>
                                            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border bg-white/5', s.border, s.iconColor)}>
                                                <Icon size={18} />
                                            </div>
                                            <div>
                                                <p className={cn('text-sm font-black uppercase tracking-tight', s.titleColor)}>{a.title}</p>
                                                <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">{a.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {d.alerts.length === 0 && (
                        <div className="flex items-center gap-4 p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[2.5rem] shadow-xl shadow-emerald-900/10 animate-in fade-in slide-in-from-top-4 duration-1000">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500">
                                <ShieldCheck size={24} />
                            </div>
                            <p className="text-sm font-black text-emerald-400 uppercase tracking-widest">Zero Critical Anomalies Detected — All Node Protocols Operational.</p>
                        </div>
                    )}

                    {/* Main Telemetry Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">

                        {/* Core Server Telemetry */}
                        <GlassCard title="Core Node Engine" subtitle="Server Telemetry" icon={Terminal} color="text-emerald-400">
                            <div className="mb-6">
                                <SBadge status={d.server?.status} label="Engine Online" />
                            </div>
                            <Row label="Node Runtime" value={fmt(d.server?.node_version)} />
                            <Row label="Environment" value={fmt(d.server?.environment)} />
                            <Row label="Architecture" value={`${fmt(d.server?.platform)} / ${fmt(d.server?.arch)}`} />
                            <Row label="Active Uptime" value={fmtUptime(d.server?.uptime_seconds)} />
                            <Row label="Process Load" value={d.server?.load_avg ? d.server.load_avg.map(l => l.toFixed(2)).join(' | ') : 'N/A'} highlight="text-indigo-400" />
                            <Row label="Memory Footprint" value={fmt(d.server?.memory_used_mb, ' MB')} highlight="text-white" />
                            <Row label="V8 Heap Usage" value={`${fmt(d.server?.memory_heap_used_mb)} / ${fmt(d.server?.memory_heap_total_mb)} MB`} />
                            <Row label="Host RAM (Total)" value={d.server?.memory_total_mb ? `${d.server.memory_total_mb} MB` : 'N/A'} />
                            <Row label="Host RAM (Free)" value={d.server?.memory_free_mb ? `${d.server.memory_free_mb} MB` : 'N/A'} highlight="text-emerald-500" />
                            <Row label="Volume Status" value={fmt(d.server?.disk_status)} highlight="text-emerald-400" />
                        </GlassCard>

                        {/* Database Matrix */}
                        <GlassCard title="Database Core" subtitle="Relational Matrix" icon={Database} color="text-blue-400">
                            <div className="mb-6">
                                <SBadge status={d.database?.status} label={d.database?.status === 'connected' ? 'Secure Link' : 'Matrix Split'} />
                            </div>
                            <Row label="Cluster Name" value={fmt(d.database?.database_name)} />
                            <Row label="Registry Count" value={fmt(d.database?.table_count, ' Tables')} />
                            <Row label="Sync Protocol" value={d.database?.status === 'connected' ? 'PROTOCOL OK' : 'FAILED'} highlight={d.database?.status === 'connected' ? 'text-emerald-400' : 'text-rose-400'} />
                            {d.integrity?.tables && (
                                <>
                                    <Row label="Required Matrix" value={`${d.integrity.tables.required_total - d.integrity.tables.missing_required.length} / ${d.integrity.tables.required_total}`}
                                        highlight={d.integrity.tables.missing_required.length > 0 ? 'text-rose-400' : 'text-emerald-400'} />
                                    <Row label="Secondary Matrix" value={`${d.integrity.tables.optional_total - d.integrity.tables.missing_optional.length} / ${d.integrity.tables.optional_total}`} />
                                    {d.integrity.tables.missing_required.length > 0 && (
                                        <div className="mt-4 p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl relative">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 rounded-full"></div>
                                            <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest mb-1">Missing Protocols</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase">{d.integrity.tables.missing_required.join(' | ')}</p>
                                        </div>
                                    )}
                                </>
                            )}
                            <div className="mt-8 pt-8 border-t border-white/5">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Last integrity check: {fmtDate(d.database?.last_check)}</p>
                            </div>
                        </GlassCard>

                        {/* Neural Integrity Analytics */}
                        <GlassCard title="Data Integrity" subtitle="Neural Ledger Audit" icon={Receipt} color="text-violet-400">
                            {d.integrity?.invoices ? (
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-3">Invoice Protocol</p>
                                    <CountChip label="Hash Collisions" value={d.integrity.invoices.duplicate_invoice_no} color="text-rose-400" />
                                    <CountChip label="Empty Payloads" value={d.integrity.invoices.invoices_without_items} color="text-amber-400" />
                                    <CountChip label="Balance Anomalies" value={d.integrity.invoices.paid_with_balance} color="text-amber-400" />
                                    <CountChip label="Sum Mismatches" value={d.integrity.invoices.total_mismatch} color="text-rose-400" />
                                </div>
                            ) : <p className="text-xs text-slate-700 italic">Invoice matrix offline</p>}
                            {d.integrity?.naya && (
                                <div className="mt-6">
                                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-3">Credit Protocol</p>
                                    <CountChip label="Balance Drift" value={d.integrity.naya.customer_balance_mismatch} color="text-amber-400" />
                                </div>
                            )}
                            {d.integrity?.stock && (
                                <div className="mt-6">
                                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-3">Inventory Protocol</p>
                                    <CountChip label="Negative States" value={d.integrity.stock.negative_stock_count} color="text-rose-400" />
                                    <CountChip label="Ghost Stock" value={d.integrity.stock.sold_out_not_marked} color="text-amber-400" />
                                </div>
                            )}
                        </GlassCard>

                        {/* Node Governance */}
                        <GlassCard title="Node Governance" subtitle="Access & Subscriptions" icon={Store} color="text-indigo-400">
                            {d.shops ? (
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-3">Tenant Registry</p>
                                    <Row label="Total Nodes" value={fmt(d.shops.total)} />
                                    <Row label="Active Uplinks" value={fmt(d.shops.active)} highlight="text-emerald-400 font-black" />
                                    <Row label="Idle Nodes" value={fmt(d.shops.inactive)} highlight={d.shops.inactive > 0 ? 'text-amber-400' : 'text-slate-700'} />
                                    <Row label="Blacklisted" value={fmt(d.shops.suspended)} highlight={d.shops.suspended > 0 ? 'text-rose-400' : 'text-slate-700'} />
                                </div>
                            ) : <p className="text-xs text-slate-700 italic">Tenant data restricted</p>}
                            {d.subscriptions ? (
                                <div className="mt-8 pt-8 border-t border-white/5 space-y-1">
                                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-3">Licensing Matrix</p>
                                    <Row label="Active License" value={fmt(d.subscriptions.active)} highlight="text-emerald-400" />
                                    <Row label="Grace Phase" value={fmt(d.subscriptions.grace)} highlight={d.subscriptions.grace > 0 ? 'text-amber-400' : 'text-slate-700'} />
                                    <Row label="Restricted" value={fmt(d.subscriptions.restricted)} highlight={d.subscriptions.restricted > 0 ? 'text-rose-400' : 'text-slate-700'} />
                                    <Row label="Terminating ≤7d" value={fmt(d.subscriptions.due_soon_count)} highlight={d.subscriptions.due_soon_count > 0 ? 'text-amber-400 font-black' : 'text-slate-700'} />
                                    <Row label="Terminated" value={fmt(d.subscriptions.expired_count)} highlight={d.subscriptions.expired_count > 0 ? 'text-rose-600' : 'text-slate-700'} />
                                </div>
                            ) : <p className="text-xs text-slate-700 italic mt-4">License matrix offline</p>}
                        </GlassCard>

                        {/* Live Operations Telemetry */}
                        <GlassCard title="Live Operations" subtitle="Operational Telemetry" icon={Zap} color="text-cyan-400">
                            {d.operations?.kot ? (
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-3">Kitchen Protocol</p>
                                    <CountChip label="Queue Length" value={d.operations.kot.pending} color="text-amber-400" />
                                    <CountChip label="Active Prep" value={d.operations.kot.preparing} color="text-indigo-400" />
                                    <CountChip label="Latency Overload" value={d.operations.kot.delayed_over_20min} color="text-rose-400" />
                                </div>
                            ) : <p className="text-xs text-slate-700 italic">Operation data unavailable</p>}
                            {d.operations?.naya && (
                                <div className="mt-8 pt-8 border-t border-white/5">
                                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-3">Fiscal Protocol</p>
                                    <Row label="System Debt" value={`Rs. ${(d.operations.naya.total_outstanding || 0).toLocaleString()}`} highlight="text-white font-black" />
                                    <CountChip label="Limit Breaches" value={d.operations.naya.over_credit_limit_count} color="text-rose-400" />
                                </div>
                            )}
                            {d.operations?.stock && (
                                <div className="mt-6">
                                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-3">Neural Inventory</p>
                                    <CountChip label="Low Signal" value={d.operations.stock.low_stock_count} color="text-amber-400" />
                                    <CountChip label="Zero Signal" value={d.operations.stock.sold_out_count} color="text-rose-400" />
                                </div>
                            )}
                        </GlassCard>

                        {/* Infrastructure & Security */}
                        <GlassCard title="Security & Storage" subtitle="Infrastructure Matrix" icon={ShieldCheck} color="text-rose-400">
                            <div className="mb-6">
                                <SBadge status={d.backups?.enabled ? 'healthy' : 'warning'} label={d.backups?.enabled ? 'Storage Secure' : 'Storage Exposed'} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-3">Backup Protocol</p>
                                <Row label="Last Snapshot" value={fmtDate(d.backups.last_backup_at)} />
                                <Row label="Matrix Status" value={fmt(d.backups.last_backup_status)} highlight="text-emerald-400" />
                                <Row label="Total Samples" value={fmt(d.backups.backup_count)} />
                                <Row label="Failed (7d)" value={fmt(d.backups.failed_last_7d)} highlight={d.backups.failed_last_7d > 0 ? 'text-rose-400' : 'text-slate-700'} />
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/5 space-y-1">
                                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-3">Security Firewall</p>
                                <Row label="Auth Failures (24h)" value={fmt(d.security.failed_logins_24h)} highlight={(d.security.failed_logins_24h || 0) > 10 ? 'text-amber-400 font-black' : 'text-white'} />
                                <Row label="Incursion Attempts" value={fmt(d.security.unauthorized_attempts_24h)} highlight={(d.security.unauthorized_attempts_24h || 0) > 5 ? 'text-rose-400 font-black' : 'text-white'} />
                                <Row label="Audit Events" value={fmt(d.security.audit_logs_today)} />
                                <Row label="Privilege Escalation" value={fmt(d.security.sensitive_actions_today)} highlight="text-rose-400" />
                            </div>
                        </GlassCard>
                    </div>

                    <div className="flex items-center justify-center gap-4 py-10 opacity-30 group hover:opacity-100 transition-opacity">
                        <Cpu size={14} className="text-slate-500 group-hover:text-indigo-500 transition-colors" />
                        <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.5em] group-hover:text-slate-400 transition-colors">
                            RestoLedger Diagnostic Interface — System Protocol V2.4.1 — Verified {fmtDate(d.checked_at)}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
