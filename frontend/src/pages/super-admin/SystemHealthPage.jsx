import React, { useState, useEffect, useCallback } from 'react';
import { Server, Database, Store, CreditCard, HardDrive, ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2, XCircle, RefreshCw, Activity, Package, Receipt, Clock, Wifi } from 'lucide-react';
import apiClient from '../../api/apiClient';
import { cn } from '../../utils/cn';

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmt = (v, suffix = '') => (v == null ? 'N/A' : `${v}${suffix}`);
const fmtDate = (iso) => !iso ? 'N/A' : new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtUptime = (s) => {
    if (s == null) return 'N/A';
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const SEVERITY_STYLES = {
    critical: { bg: 'bg-rose-500/5', border: 'border-rose-500/20', icon: XCircle, iconColor: 'text-rose-400', titleColor: 'text-rose-300' },
    warning:  { bg: 'bg-amber-500/5', border: 'border-amber-500/20', icon: AlertTriangle, iconColor: 'text-amber-400', titleColor: 'text-amber-300' },
    info:     { bg: 'bg-slate-800/50', border: 'border-white/5', icon: Activity, iconColor: 'text-slate-400', titleColor: 'text-slate-300' },
};

const STATUS_CARD = {
    healthy:  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', text: 'text-emerald-400', dot: 'bg-emerald-500' },
    warning:  { bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   text: 'text-amber-400',   dot: 'bg-amber-400'  },
    critical: { bg: 'bg-rose-500/10',    border: 'border-rose-500/25',    text: 'text-rose-400',    dot: 'bg-rose-500'   },
};

// ─── small components ─────────────────────────────────────────────────────────

const Sk = ({ h = 'h-32', w = 'w-full' }) => <div className={cn('animate-pulse rounded-2xl bg-white/5', h, w)} />;

const Row = ({ label, value, highlight }) => (
    <div className="flex justify-between items-center py-3 border-b border-white/[0.04] last:border-0">
        <span className="text-sm text-slate-500">{label}</span>
        <span className={cn('text-sm font-bold text-right break-all', highlight || 'text-white')}>{value}</span>
    </div>
);

const Panel = ({ title, icon: Icon, color = 'text-indigo-400', badge, children, span2 }) => (
    <div className={cn('bg-slate-900/50 border border-white/5 rounded-[2rem] p-6', span2 && 'lg:col-span-2')}>
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center"><Icon size={18} className={color} /></div>
                <h3 className="font-black text-white text-sm tracking-tight">{title}</h3>
            </div>
            {badge}
        </div>
        {children}
    </div>
);

const SBadge = ({ status, label }) => {
    const s = { connected: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', online: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20', critical: 'text-rose-400 bg-rose-500/10 border-rose-500/20', disconnected: 'text-rose-400 bg-rose-500/10 border-rose-500/20', normal: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', healthy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }[status] || 'text-slate-500 bg-slate-800 border-slate-700';
    return <span className={cn('px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border inline-flex items-center gap-1.5', s)}><span className="w-1.5 h-1.5 rounded-full bg-current" />{label}</span>;
};

const CountChip = ({ label, value, color = 'text-white' }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
        <span className="text-sm text-slate-500">{label}</span>
        <span className={cn('text-sm font-black', value > 0 ? color : 'text-slate-600')}>{fmt(value)}</span>
    </div>
);

// ─── main ─────────────────────────────────────────────────────────────────────

export default function SystemHealthPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshed, setRefreshed] = useState(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await apiClient.get('/super-admin/system-health');
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
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">System Health</h1>
                    <p className="text-slate-400 mt-1 text-sm">Real-time platform monitoring — no fake data</p>
                    {refreshed && <p className="text-xs text-slate-600 mt-0.5">Last updated: {refreshed.toLocaleTimeString()}</p>}
                </div>
                <button onClick={load} disabled={loading} className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-50">
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Checking...' : 'Refresh'}
                </button>
            </div>

            {/* Error */}
            {error && !loading && (
                <div className="flex items-center gap-4 p-5 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] text-rose-400">
                    <XCircle size={22} className="shrink-0" />
                    <div className="flex-1"><p className="font-bold">Health check failed</p><p className="text-sm opacity-70 mt-0.5">{error}</p></div>
                    <button onClick={load} className="px-4 py-2 bg-rose-500/20 rounded-xl text-rose-300 text-sm font-bold">Retry</button>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="space-y-6">
                    <Sk h="h-24" />
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">{[...Array(6)].map((_, i) => <Sk key={i} h="h-28" />)}</div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">{[...Array(6)].map((_, i) => <Sk key={i} h="h-52" />)}</div>
                </div>
            )}

            {!loading && d && (
                <>
                    {/* Overall status banner */}
                    <div className={cn('flex items-center gap-5 p-6 rounded-[2rem] border', overallStyle.bg, overallStyle.border)}>
                        <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', overallStyle.bg)}>
                            {d.overall_status === 'healthy' ? <CheckCircle2 size={28} className={overallStyle.text} /> : d.overall_status === 'warning' ? <AlertTriangle size={28} className={overallStyle.text} /> : <XCircle size={28} className={overallStyle.text} />}
                        </div>
                        <div>
                            <p className={cn('text-2xl font-black capitalize', overallStyle.text)}>System {d.overall_status}</p>
                            <p className="text-sm text-slate-500 mt-0.5">Checked at {fmtDate(d.checked_at)}</p>
                        </div>
                        <div className="ml-auto text-right">
                            <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Alerts</p>
                            <p className={cn('text-3xl font-black', d.alerts.length > 0 ? 'text-amber-400' : 'text-emerald-500')}>{d.alerts.length}</p>
                        </div>
                    </div>

                    {/* Alerts */}
                    {d.alerts.length > 0 && (
                        <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertCircle size={18} className="text-amber-400" />
                                <h3 className="font-black text-white text-sm">Active Alerts</h3>
                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black">{d.alerts.length}</span>
                            </div>
                            <div className="space-y-2">
                                {d.alerts.map((a, i) => {
                                    const s = SEVERITY_STYLES[a.severity] || SEVERITY_STYLES.info;
                                    const Icon = s.icon;
                                    return (
                                        <div key={i} className={cn('flex items-start gap-3 p-4 rounded-2xl border', s.bg, s.border)}>
                                            <Icon size={16} className={cn('shrink-0 mt-0.5', s.iconColor)} />
                                            <div>
                                                <p className={cn('text-sm font-bold', s.titleColor)}>{a.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {d.alerts.length === 0 && (
                        <div className="flex items-center gap-3 p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                            <CheckCircle2 size={18} className="text-emerald-500" />
                            <p className="text-sm font-bold text-emerald-400">No active system alerts — all clear.</p>
                        </div>
                    )}

                    {/* Main panels grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">

                        {/* Server */}
                        <Panel title="Server" icon={Server} color="text-emerald-400" badge={<SBadge status={d.server?.status} label="Online" />}>
                            <Row label="Node.js" value={fmt(d.server?.node_version)} />
                            <Row label="Environment" value={fmt(d.server?.environment)} />
                            <Row label="Platform / Arch" value={`${fmt(d.server?.platform)} / ${fmt(d.server?.arch)}`} />
                            <Row label="Uptime" value={fmtUptime(d.server?.uptime_seconds)} />
                            <Row label="Memory Used (RSS)" value={fmt(d.server?.memory_used_mb, ' MB')} />
                            <Row label="Heap Used / Total" value={`${fmt(d.server?.memory_heap_used_mb)} / ${fmt(d.server?.memory_heap_total_mb)} MB`} />
                            <Row label="OS Total RAM" value={d.server?.memory_total_mb ? `${d.server.memory_total_mb} MB` : 'N/A'} />
                            <Row label="OS Free RAM" value={d.server?.memory_free_mb ? `${d.server.memory_free_mb} MB` : 'N/A'} />
                            <Row label="Disk" value={fmt(d.server?.disk_status)} />
                        </Panel>

                        {/* Database */}
                        <Panel title="Database" icon={Database} color="text-blue-400" badge={<SBadge status={d.database?.status} label={d.database?.status === 'connected' ? 'Connected' : 'Disconnected'} />}>
                            <Row label="Database Name" value={fmt(d.database?.database_name)} />
                            <Row label="Table Count" value={fmt(d.database?.table_count)} />
                            <Row label="Last Checked" value={fmtDate(d.database?.last_check)} />
                            <Row label="Ping" value={d.database?.status === 'connected' ? '✓ SELECT 1 passed' : '✗ Failed'} highlight={d.database?.status === 'connected' ? 'text-emerald-400' : 'text-rose-400'} />
                            {d.integrity?.tables && (
                                <>
                                    <Row label="Required Tables OK" value={`${d.integrity.tables.required_total - d.integrity.tables.missing_required.length} / ${d.integrity.tables.required_total}`}
                                        highlight={d.integrity.tables.missing_required.length > 0 ? 'text-rose-400' : 'text-emerald-400'} />
                                    <Row label="Optional Tables OK" value={`${d.integrity.tables.optional_total - d.integrity.tables.missing_optional.length} / ${d.integrity.tables.optional_total}`} />
                                    {d.integrity.tables.missing_required.length > 0 && (
                                        <div className="mt-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                                            <p className="text-xs text-rose-400 font-bold">Missing: {d.integrity.tables.missing_required.join(', ')}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </Panel>

                        {/* Integrity */}
                        <Panel title="Data Integrity" icon={Receipt} color="text-violet-400">
                            {d.integrity?.invoices ? (
                                <>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Invoices</p>
                                    <CountChip label="Duplicate invoice #" value={d.integrity.invoices.duplicate_invoice_no} color="text-rose-400" />
                                    <CountChip label="Invoices without items" value={d.integrity.invoices.invoices_without_items} color="text-amber-400" />
                                    <CountChip label="Paid with balance > 0" value={d.integrity.invoices.paid_with_balance} color="text-amber-400" />
                                    <CountChip label="Total mismatches" value={d.integrity.invoices.total_mismatch} color="text-rose-400" />
                                </>
                            ) : <p className="text-sm text-slate-600">Invoice table not available</p>}
                            {d.integrity?.naya && (
                                <>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-4 mb-2">Naya Book</p>
                                    <CountChip label="Balance mismatches" value={d.integrity.naya.customer_balance_mismatch} color="text-amber-400" />
                                </>
                            )}
                            {d.integrity?.held_bills && (
                                <>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-4 mb-2">Held Bills</p>
                                    <CountChip label="Completed without invoice" value={d.integrity.held_bills.completed_without_invoice} color="text-amber-400" />
                                    <CountChip label="Cancelled without reason" value={d.integrity.held_bills.cancelled_without_reason} color="text-slate-400" />
                                </>
                            )}
                            {d.integrity?.kot && (
                                <>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-4 mb-2">KOT</p>
                                    <CountChip label="Active KOTs with no items" value={d.integrity.kot.active_kots_without_items} color="text-rose-400" />
                                </>
                            )}
                            {d.integrity?.stock && (
                                <>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-4 mb-2">Stock</p>
                                    <CountChip label="Negative stock items" value={d.integrity.stock.negative_stock_count} color="text-rose-400" />
                                    <CountChip label="Zero stock, not marked sold out" value={d.integrity.stock.sold_out_not_marked} color="text-amber-400" />
                                </>
                            )}
                        </Panel>

                        {/* Shops & Subscriptions */}
                        <Panel title="Shops & Subscriptions" icon={Store} color="text-indigo-400">
                            {d.shops ? (
                                <>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Shops</p>
                                    <Row label="Total" value={fmt(d.shops.total)} />
                                    <Row label="Active" value={fmt(d.shops.active)} highlight="text-emerald-400" />
                                    <Row label="Inactive" value={fmt(d.shops.inactive)} highlight={d.shops.inactive > 0 ? 'text-amber-400' : 'text-slate-500'} />
                                    <Row label="Suspended" value={fmt(d.shops.suspended)} highlight={d.shops.suspended > 0 ? 'text-rose-400' : 'text-slate-500'} />
                                </>
                            ) : <p className="text-sm text-slate-600 mb-4">Shops table not available</p>}
                            {d.subscriptions ? (
                                <>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-4 mb-2">Subscriptions</p>
                                    <Row label="Active" value={fmt(d.subscriptions.active)} highlight="text-emerald-400" />
                                    <Row label="Grace" value={fmt(d.subscriptions.grace)} highlight={d.subscriptions.grace > 0 ? 'text-amber-400' : 'text-slate-500'} />
                                    <Row label="Restricted" value={fmt(d.subscriptions.restricted)} highlight={d.subscriptions.restricted > 0 ? 'text-rose-400' : 'text-slate-500'} />
                                    <Row label="Locked" value={fmt(d.subscriptions.locked)} highlight={d.subscriptions.locked > 0 ? 'text-slate-400' : 'text-slate-600'} />
                                    <Row label="Expiring ≤7d" value={fmt(d.subscriptions.due_soon_count)} highlight={d.subscriptions.due_soon_count > 0 ? 'text-amber-400' : 'text-slate-500'} />
                                    <Row label="Total expired" value={fmt(d.subscriptions.expired_count)} highlight={d.subscriptions.expired_count > 0 ? 'text-rose-400' : 'text-slate-500'} />
                                </>
                            ) : <p className="text-sm text-slate-600 mt-3">Subscription data not available</p>}
                        </Panel>

                        {/* Operations */}
                        <Panel title="Live Operations" icon={Activity} color="text-cyan-400">
                            {d.operations?.kot ? (
                                <>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">KOT / Kitchen</p>
                                    <CountChip label="Pending KOTs" value={d.operations.kot.pending} color="text-amber-400" />
                                    <CountChip label="Preparing KOTs" value={d.operations.kot.preparing} color="text-indigo-400" />
                                    <CountChip label="Delayed (>20 min)" value={d.operations.kot.delayed_over_20min} color="text-rose-400" />
                                </>
                            ) : <p className="text-sm text-slate-600 mb-3">KOT table not available</p>}
                            {d.operations?.held_bills && (
                                <>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-4 mb-2">Held Bills</p>
                                    <CountChip label="Active held/resumed" value={d.operations.held_bills.active} color="text-amber-400" />
                                    <CountChip label="Older than 4 hours" value={d.operations.held_bills.older_than_4h} color="text-rose-400" />
                                </>
                            )}
                            {d.operations?.naya && (
                                <>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-4 mb-2">Naya Book</p>
                                    <Row label="Total outstanding" value={`Rs. ${(d.operations.naya.total_outstanding || 0).toLocaleString()}`} highlight="text-white" />
                                    <CountChip label="Over credit limit" value={d.operations.naya.over_credit_limit_count} color="text-rose-400" />
                                </>
                            )}
                            {d.operations?.stock && (
                                <>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-4 mb-2">Stock</p>
                                    <CountChip label="Low stock items" value={d.operations.stock.low_stock_count} color="text-amber-400" />
                                    <CountChip label="Sold out items" value={d.operations.stock.sold_out_count} color="text-rose-400" />
                                </>
                            )}
                        </Panel>

                        {/* Backups */}
                        <Panel title="Backups" icon={HardDrive} color="text-amber-400" badge={<SBadge status={d.backups?.enabled ? 'connected' : 'warning'} label={d.backups?.enabled ? 'Enabled' : 'Disabled'} />}>
                            {d.backups?.available ? (
                                <>
                                    <Row label="Last Backup" value={fmtDate(d.backups.last_backup_at)} />
                                    <Row label="Last Status" value={fmt(d.backups.last_backup_status)}
                                        highlight={d.backups.last_backup_status === 'success' ? 'text-emerald-400' : d.backups.last_backup_status === 'not_available' ? 'text-slate-500' : 'text-amber-400'} />
                                    <Row label="Total Backups" value={fmt(d.backups.backup_count)} />
                                    <Row label="Failed (last 7d)" value={fmt(d.backups.failed_last_7d)} highlight={d.backups.failed_last_7d > 0 ? 'text-rose-400' : 'text-slate-500'} />
                                    <Row label="Retention" value={fmt(d.backups.retention_days, ' days')} />
                                </>
                            ) : <p className="text-sm text-slate-600">backup_logs table not found</p>}
                        </Panel>

                        {/* Security */}
                        <Panel title="Security" icon={ShieldCheck} color="text-rose-400" badge={<SBadge status={(d.security?.failed_logins_24h || 0) > 10 ? 'warning' : 'normal'} label={(d.security?.failed_logins_24h || 0) > 10 ? 'Alert' : 'Normal'} />}>
                            {d.security?.available ? (
                                <>
                                    <Row label="Failed logins (24h)" value={fmt(d.security.failed_logins_24h)} highlight={(d.security.failed_logins_24h || 0) > 10 ? 'text-amber-400 font-black' : 'text-white'} />
                                    <Row label="Unauthorized attempts (24h)" value={fmt(d.security.unauthorized_attempts_24h)} highlight={(d.security.unauthorized_attempts_24h || 0) > 5 ? 'text-rose-400 font-black' : 'text-white'} />
                                    <Row label="Audit logs today" value={fmt(d.security.audit_logs_today)} />
                                    <Row label="Sensitive actions today" value={fmt(d.security.sensitive_actions_today)} />
                                </>
                            ) : <p className="text-sm text-slate-600">audit_logs table not available</p>}
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <p className="text-[10px] text-slate-700">No DB credentials or secrets exposed via this endpoint.</p>
                            </div>
                        </Panel>

                        {/* Payment Gateway */}
                        <Panel title="Payment Gateway" icon={Wifi} color="text-emerald-400">
                            <Row label="Provider" value={d.payments?.provider || 'Not configured'} />
                            <Row label="Gateway Enabled" value={d.payments?.gateway_enabled ? 'Yes' : 'No'} highlight={d.payments?.gateway_enabled ? 'text-emerald-400' : 'text-slate-500'} />
                            {d.payments?.available ? (
                                <>
                                    <Row label="Pending QR" value={fmt(d.payments.pending_qr)} highlight={(d.payments.pending_qr || 0) > 10 ? 'text-amber-400' : 'text-white'} />
                                    <Row label="Paid today" value={fmt(d.payments.paid_today)} highlight="text-emerald-400" />
                                    <Row label="Failed/Expired today" value={fmt(d.payments.failed_today)} highlight={(d.payments.failed_today || 0) > 0 ? 'text-rose-400' : 'text-slate-500'} />
                                </>
                            ) : <p className="text-sm text-slate-600 mt-2">payment_transactions table not found</p>}
                        </Panel>
                    </div>

                    <p className="text-center text-xs text-slate-700 pb-4">All data is real — checked at {fmtDate(d.checked_at)}</p>
                </>
            )}
        </div>
    );
}
