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
  AlertCircle
} from 'lucide-react';
import { AppCard, AppTable, useToast, StatusBadge } from '../components/ui';
import { cn } from '../utils/cn';

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
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.module.toLowerCase().includes(search.toLowerCase()) ||
    log.user_name.toLowerCase().includes(search.toLowerCase()) ||
    (log.details && log.details.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-900 text-white rounded-[24px] flex items-center justify-center shadow-lg">
                <ShieldCheck size={32} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Security Audit</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">System activity and security logs</p>
            </div>
        </div>
        <div className="relative group w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
                type="text" 
                placeholder="Search logs, users, actions..." 
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3 pl-12 pr-4 text-slate-900 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
      </div>

      <AppCard className="bg-white rounded-[40px] shadow-xl border-none overflow-hidden">
          <AppTable 
            headers={[
                { label: 'Time' },
                { label: 'User' },
                { label: 'Module' },
                { label: 'Action' },
                { label: 'Details' }
            ]}
            data={filteredLogs}
            loading={loading}
            renderRow={(log) => (
                <tr key={log.id} className="hover:bg-slate-50 border-b border-slate-50 last:border-none group transition-colors">
                    <td className="py-5">
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-300" />
                            <span className="text-xs font-bold text-slate-500">
                                {new Date(log.created_at).toLocaleString()}
                            </span>
                        </div>
                    </td>
                    <td className="py-5">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-indigo-600">
                                {log.user_name?.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-900">{log.user_name}</span>
                        </div>
                    </td>
                    <td className="py-5">
                        <StatusBadge 
                            status={
                                log.module === 'INVOICE' ? 'active' : 
                                log.module === 'SHIFT' ? 'warning' : 'default'
                            } 
                            text={log.module} 
                        />
                    </td>
                    <td className="py-5">
                        <div className="flex items-center gap-2">
                            <Activity size={14} className="text-slate-400" />
                            <span className="font-black text-slate-700 text-xs uppercase tracking-tight">{log.action}</span>
                        </div>
                    </td>
                    <td className="py-5">
                        <p className="text-sm font-medium text-slate-500 max-w-md truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                            {log.details || '-'}
                        </p>
                    </td>
                </tr>
            )}
          />
      </AppCard>
    </div>
  );
};

export default AuditLogsPage;
