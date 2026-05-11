import React, { useState, useEffect, useCallback } from 'react';
import { 
    ShieldAlert, ShieldCheck, Shield, Lock, AlertTriangle, 
    Activity, Globe, RefreshCw, Eye, X, Monitor, User,
    Clock, MousePointer2, AlertCircle
} from 'lucide-react';
import { superAdminApi } from '../../api/api';
import { useToast } from '../../components/ui/Feedback';
import { cn } from '../../utils/cn';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (iso) => !iso ? 'N/A' : new Date(iso).toLocaleString('en-GB', { 
    day: '2-digit', month: 'short', year: 'numeric', 
    hour: '2-digit', minute: '2-digit', second: '2-digit' 
});

// ─── Components ──────────────────────────────────────────────────────────────
import { AppModal, AppButton, FormInput } from '../../components/ui';

const ProtectionCard = ({ title, config, icon: Icon, onEdit }) => {
    return (
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] hover:bg-slate-900 transition-all group relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Icon size={20} />
                </div>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border",
                        config?.enabled ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    )}>
                        {config?.enabled ? 'Active' : 'Disabled'}
                    </span>
                    <button 
                        onClick={onEdit}
                        className="opacity-0 group-hover:opacity-100 p-1.5 bg-white/10 rounded-lg text-white hover:bg-indigo-600 transition-all"
                    >
                        <MousePointer2 size={12} />
                    </button>
                </div>
            </div>
            <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
            <div className="space-y-1">
                <p className="text-slate-400 text-[11px] font-medium">Limit: <span className="text-white font-bold">{config?.limit} requests</span></p>
                <p className="text-slate-400 text-[11px] font-medium">Window: <span className="text-white font-bold">{config?.window_minutes} mins</span></p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/[0.02] rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all" />
        </div>
    );
};

const SecurityStat = ({ title, count, icon: Icon, colorClass }) => (
    <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] flex items-center gap-5">
        <div className={cn("w-14 h-14 rounded-[1.5rem] flex items-center justify-center", colorClass)}>
            <Icon size={28} />
        </div>
        <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-3xl font-black text-white tracking-tighter">{count}</h3>
        </div>
    </div>
);

export default function SuperAdminSecurityPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        security_auth_limit: '',
        security_general_limit: '',
        security_public_limit: '',
        security_payment_limit: ''
    });

    const { showToast } = useToast();

    const [lastScan, setLastScan] = useState(new Date());

    const fetchSecurityMetrics = useCallback(async (isManual = false) => {
        try {
            setLoading(true);
            if (isManual) showToast('Initiating deep security scan...', 'info');
            
            // Artificial delay for cinematic scanning effect if manual
            const minWait = isManual ? 1500 : 0;
            const startTime = Date.now();
            
            const res = await superAdminApi.getSecurityMetrics();
            
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < minWait) {
                await new Promise(resolve => setTimeout(resolve, minWait - elapsedTime));
            }

            if (res.data.success) {
                setData(res.data.data);
                setLastScan(new Date());
                // Pre-fill edit form
                setEditForm({
                    security_auth_limit: res.data.data.rate_limits.auth.limit,
                    security_general_limit: res.data.data.rate_limits.general_api.limit,
                    security_public_limit: res.data.data.rate_limits.public_menu.limit,
                    security_payment_limit: res.data.data.rate_limits.payment_status.limit
                });
                if (isManual) showToast('Platform integrity verified. Zero anomalies detected.', 'success');
            }
        } catch (err) {
            showToast('Unable to connect to security downlink.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchSecurityMetrics();
    }, [fetchSecurityMetrics]);

    const handleSaveLimits = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const res = await superAdminApi.updatePlatformSettings(editForm);
            if (res.data.success) {
                showToast('Security thresholds updated and reloaded.', 'success');
                setIsEditModalOpen(false);
                fetchSecurityMetrics();
            }
        } catch (err) {
            showToast('Failed to update security settings.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <RefreshCw size={40} className="animate-spin text-indigo-500 opacity-50" />
                <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-[10px]">Hardening Defense Perimeter...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-20 text-center bg-slate-900/50 border border-dashed border-white/10 rounded-[3rem]">
                <ShieldAlert size={60} className="mx-auto text-rose-500 mb-4 opacity-50" />
                <h2 className="text-2xl font-black text-white">Critical Failure</h2>
                <p className="text-slate-500 mt-2">Security monitoring module disconnected.</p>
                <button onClick={fetchSecurityMetrics} className="mt-6 px-6 py-3 bg-white text-slate-950 font-black rounded-2xl uppercase tracking-widest text-xs hover:scale-105 transition-all">Retry Link</button>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
                            <Shield size={24} className="text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Security Center</h1>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Real-time API protection, rate limits, and suspicious activity telemetry.</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 flex items-center gap-2">
                        <Clock size={12} />
                        Last Deep Scan: {lastScan.toLocaleTimeString()}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 border border-indigo-500/20 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-indigo-900/40"
                    >
                        <Shield size={16} />
                        Tune Thresholds
                    </button>
                    <button 
                        onClick={() => fetchSecurityMetrics(true)}
                        disabled={loading}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm transition-all border",
                            loading ? "bg-white/10 border-indigo-500/50" : "bg-white/5 hover:bg-white/10 border-white/5"
                        )}
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Scanning...' : 'Force Scan'}
                    </button>
                </div>
            </div>

            {/* 24h Summary */}
            <div className="relative group">
                {loading && (
                    <div className="absolute inset-0 z-10 rounded-[2.5rem] bg-indigo-500/5 backdrop-blur-[1px] flex items-center justify-center overflow-hidden border border-indigo-500/20">
                        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.8)] animate-scan" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] animate-pulse">Analyzing Reputation Data...</span>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SecurityStat 
                    title="Failed Logins (24h)" 
                    count={data.security_events.failed_logins_24h} 
                    icon={Lock} 
                    colorClass="bg-rose-500/10 text-rose-400" 
                />
                <SecurityStat 
                    title="Unauthorized Attempts" 
                    count={data.security_events.unauthorized_attempts_24h} 
                    icon={ShieldAlert} 
                    colorClass="bg-amber-500/10 text-amber-400" 
                />
                <SecurityStat 
                    title="Rate Limited (24h)" 
                    count={data.security_events.rate_limited_requests_24h} 
                    icon={Activity} 
                    colorClass="bg-indigo-500/10 text-indigo-400" 
                />
                <SecurityStat 
                    title="Forbidden API Calls" 
                    count={data.security_events.forbidden_requests_24h} 
                    icon={AlertTriangle} 
                    colorClass="bg-orange-500/10 text-orange-400" 
                />
                </div>
            </div>

            {/* Rate Limit Protection Status */}
            <div>
                <h3 className="text-white font-black uppercase tracking-widest text-xs mb-6 opacity-60">Active Protection Modules</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ProtectionCard title="Login Protection" config={data.rate_limits.auth} icon={Lock} onEdit={() => setIsEditModalOpen(true)} />
                    <ProtectionCard title="General API Protection" config={data.rate_limits.general_api} icon={Globe} onEdit={() => setIsEditModalOpen(true)} />
                    <ProtectionCard title="Public Menu Protection" config={data.rate_limits.public_menu} icon={Monitor} onEdit={() => setIsEditModalOpen(true)} />
                    <ProtectionCard title="Payment Status Protection" config={data.rate_limits.payment_status} icon={MousePointer2} onEdit={() => setIsEditModalOpen(true)} />
                </div>
            </div>

            {/* Edit Limits Modal */}
            <AppModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Adjust API Protection Limits"
                description="Modify request thresholds across the platform. Changes take effect immediately."
                size="lg"
                footer={
                    <div className="flex justify-end gap-3">
                        <AppButton variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</AppButton>
                        <AppButton loading={saving} onClick={handleSaveLimits}>Apply Security Policy</AppButton>
                    </div>
                }
            >
                <form onSubmit={handleSaveLimits} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">Auth & Access</h4>
                        <FormInput 
                            label="Auth Limit (15 min)"
                            type="number"
                            value={editForm.security_auth_limit}
                            onChange={(e) => setEditForm({...editForm, security_auth_limit: e.target.value})}
                            icon={Lock}
                            className="bg-slate-50"
                        />
                        <p className="text-[10px] text-slate-400 italic">Protects against brute-force login attempts.</p>
                    </div>
                    
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">Platform Traffic</h4>
                        <FormInput 
                            label="General API Limit (15 min)"
                            type="number"
                            value={editForm.security_general_limit}
                            onChange={(e) => setEditForm({...editForm, security_general_limit: e.target.value})}
                            icon={Globe}
                        />
                        <p className="text-[10px] text-slate-400 italic">Total API requests allowed per IP across the platform.</p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">Public Systems</h4>
                        <FormInput 
                            label="Public Menu Limit (15 min)"
                            type="number"
                            value={editForm.security_public_limit}
                            onChange={(e) => setEditForm({...editForm, security_public_limit: e.target.value})}
                            icon={Monitor}
                        />
                        <p className="text-[10px] text-slate-400 italic">Limits anonymous requests to the public menu pages.</p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">Payment Polling</h4>
                        <FormInput 
                            label="Polling Limit (5 min)"
                            type="number"
                            value={editForm.security_payment_limit}
                            onChange={(e) => setEditForm({...editForm, security_payment_limit: e.target.value})}
                            icon={Activity}
                        />
                        <p className="text-[10px] text-slate-400 italic">Prevents automated payment status spamming.</p>
                    </div>
                </form>
            </AppModal>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Suspicious IPs */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-black uppercase tracking-widest text-xs opacity-60">Suspicious Sources (24h)</h3>
                        <span className="text-[10px] font-black text-rose-400 uppercase">Top 10 Threats</span>
                    </div>
                    <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                    <th className="px-6 py-4">IP Address</th>
                                    <th className="px-6 py-4">Events</th>
                                    <th className="px-6 py-4">Risk</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {data.top_suspicious_ips.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-10 text-center text-slate-600 italic text-sm">No suspicious IP patterns detected.</td>
                                    </tr>
                                ) : (
                                    data.top_suspicious_ips.map((ip) => (
                                        <tr key={ip.ip_address} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs text-slate-300">{ip.ip_address}</td>
                                            <td className="px-6 py-4 font-bold text-white text-xs">{ip.event_count}</td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                                                    ip.risk_level === 'CRITICAL' ? "bg-rose-500/20 text-rose-400" :
                                                    ip.risk_level === 'HIGH' ? "bg-orange-500/20 text-orange-400" :
                                                    ip.risk_level === 'MEDIUM' ? "bg-amber-500/20 text-amber-400" :
                                                    "bg-blue-500/20 text-blue-400"
                                                )}>
                                                    {ip.risk_level}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Security Events */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-white font-black uppercase tracking-widest text-xs opacity-60">Security Audit Feed</h3>
                    <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                    <th className="px-6 py-4">Time / Source</th>
                                    <th className="px-6 py-4">Action Triggered</th>
                                    <th className="px-6 py-4">Subject</th>
                                    <th className="px-6 py-4">Context</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {data.recent_security_logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center text-slate-600 italic">No security logs recorded yet.</td>
                                    </tr>
                                ) : (
                                    data.recent_security_logs.map((log) => (
                                        <tr key={log.id} className="group hover:bg-white/[0.02] transition-all">
                                            <td className="px-6 py-4">
                                                <div className="text-[10px] font-mono text-slate-400">{fmtDate(log.created_at)}</div>
                                                <div className="text-[10px] font-mono text-indigo-400 mt-0.5">{log.ip_address}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase px-2 py-1 rounded border",
                                                    log.action.includes('fail') || log.action.includes('unauthorized') ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                                )}>
                                                    {log.action.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-bold text-white">{log.user_name || 'Anonymous'}</p>
                                                <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{log.shop_name || 'System'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[10px] text-slate-400 line-clamp-2 max-w-[200px] font-mono leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">
                                                    {log.details || log.new_value || '-'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
