import React, { useState, useEffect } from 'react';
import { auditApi } from '../api/api';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Calendar,
  User,
  Activity,
  ArrowRightCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { AppCard, AppTable, useToast, StatusBadge } from '../components/ui';
import { cn } from '../utils/cn';

// Helper: parse JSON string safely
const parseJSON = (str) => {
  if (!str) return null;
  if (typeof str === 'object') return str;
  try { return JSON.parse(str); } catch { return null; }
};

// Renders the new_value (or old_value fallback) as readable key:value pills
const AuditDetails = ({ log }) => {
  const data = parseJSON(log.new_value) || parseJSON(log.old_value);

  if (!data) return <span className="text-slate-300 font-bold text-xs">—</span>;

  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== '');

  if (entries.length === 0) return <span className="text-slate-300 font-bold text-xs">—</span>;

  return (
    <div className="flex flex-wrap gap-1 max-w-sm">
      {entries.slice(0, 4).map(([k, v]) => (
        <span
          key={k}
          className="inline-flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-0.5 text-[11px] font-medium text-slate-600 group-hover:bg-indigo-50 transition-colors"
        >
          <span className="text-slate-400 font-semibold">{k}:</span>
          <span className="truncate max-w-[120px]">
            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
          </span>
        </span>
      ))}
      {entries.length > 4 && (
        <span className="inline-flex items-center bg-slate-200 rounded-lg px-2 py-0.5 text-[11px] font-bold text-slate-500">
          +{entries.length - 4} more
        </span>
      )}
    </div>
  );
};

const AuditLogsPage = () => {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    module: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await auditApi.getAll(filters);
      setLogs(data.data);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    (log.action?.toLowerCase().includes(search.toLowerCase())) ||
    (log.entity_type?.toLowerCase().includes(search.toLowerCase())) ||
    (log.user_name?.toLowerCase().includes(search.toLowerCase())) ||
    (log.details && log.details.toString().toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 selection:bg-indigo-500/30">
      {/* Premium Neural Header */}
      <header className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-slate-900 via-indigo-600 to-slate-900 rounded-[48px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white p-10 rounded-[44px] border border-slate-100 shadow-2xl overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50"></div>
            
            <div className="flex items-center gap-8 relative z-10">
                <div className="w-20 h-20 bg-slate-900 text-white rounded-[28px] flex items-center justify-center shadow-2xl shadow-slate-900/40 relative group-hover:scale-110 transition-transform duration-500">
                    <ShieldCheck size={36} />
                    <div className="absolute -top-1 -right-1">
                        <span className="flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 shadow-sm border border-white/20"></span>
                        </span>
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Activity size={14} className="text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Security Audit</span>
                    </div>
                    <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-none mb-1 uppercase">Event Logs</h2>
                    <p className="text-sm font-medium text-slate-400">Trace system activity and administrative protocol execution</p>
                </div>
            </div>

            <div className="relative group w-full lg:w-[450px] z-10">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Search logs, users, or system actions..." 
                    className="w-full bg-slate-50 border border-slate-100 rounded-[32px] py-6 pl-16 pr-8 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-600 transition-all shadow-xl shadow-slate-200/50"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>
      </header>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-transparent rounded-[44px] blur opacity-10"></div>
        <div className="relative bg-white border border-slate-100 rounded-[44px] overflow-hidden shadow-2xl shadow-slate-200/50">
          <AppTable 
            headers={[
                { label: 'Timeline Intelligence' },
                { label: 'Actor' },
                { label: 'Module Classification' },
                { label: 'Action Protocol' },
                { label: 'Intelligence Payload' }
            ]}
            data={filteredLogs}
            loading={loading}
            renderRow={(log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-all group border-b border-slate-50 last:border-0">
                    <td className="py-8 px-10">
                        <div className="flex items-center gap-3">
                            <Clock size={16} className="text-indigo-400" />
                            <div>
                                <p className="text-sm font-black text-slate-900 leading-none mb-1">{new Date(log.created_at).toLocaleDateString()}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.created_at).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    </td>
                    <td className="py-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-slate-900/20 group-hover:scale-110 transition-transform">
                                {log.user_name?.charAt(0)}
                            </div>
                            <div>
                                <span className="font-black text-slate-900 text-sm block uppercase tracking-tight">{log.user_name}</span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Operator ID: {log.user_id}</span>
                            </div>
                        </div>
                    </td>
                    <td className="py-8">
                        <span className={cn(
                            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border",
                            log.entity_type === 'invoice' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : 
                            log.entity_type === 'shift' ? "bg-amber-50 text-amber-600 border-amber-100" : 
                            "bg-slate-50 text-slate-500 border-slate-100"
                        )}>
                            {log.entity_type}
                        </span>
                    </td>
                    <td className="py-8">
                        <div className="flex items-center gap-2">
                            <Activity size={14} className="text-indigo-500" />
                            <span className="font-black text-slate-700 text-xs uppercase tracking-widest">{log.action}</span>
                        </div>
                    </td>
                    <td className="py-8 px-10">
                        <AuditDetails log={log} />
                    </td>
                </tr>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
