import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { superAdminApi } from '../../api/api';
import { 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Store, 
  Search,
  Filter,
  ArrowUpRight,
  Reply,
  X,
  Tag,
  Activity,
  RefreshCcw
} from 'lucide-react';
import { AppButton, AppCard, AppModal, useToast } from '../../components/ui';
import { cn } from '../../utils/cn';

const GlassCard = ({ title, subtitle, icon: Icon, children, className }) => (
  <div className={cn(
    "bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group transition-all hover:border-indigo-500/30",
    className
  )}>
    <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-indigo-600 rounded-full opacity-[0.08] blur-3xl group-hover:opacity-[0.12] transition-opacity" />
    <div className="relative z-10">
      <div className="flex items-center gap-4 mb-8">
        {Icon && (
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-300 border border-white/5 group-hover:border-indigo-500/50 transition-all">
            <Icon size={24} />
          </div>
        )}
        <div>
          <h3 className="text-xl font-black text-white tracking-tight uppercase leading-tight">{title}</h3>
          {subtitle && <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  </div>
);

const SupportTicketsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data } = await superAdminApi.getTickets();
      if (data.success) setTickets(data.data);
    } catch (err) {
      toast.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'high': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'urgent': return 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-900/50';
      default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'resolved': return 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/50';
      case 'closed': return 'bg-slate-700 text-white';
      case 'pending': return 'bg-amber-500 text-white shadow-lg shadow-amber-900/50';
      case 'in_progress': return 'bg-blue-600 text-white shadow-lg shadow-blue-900/50';
      default: return 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 selection:bg-indigo-500/30">
      {/* Premium Neural Header - Analytics Style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
              <div className="flex items-center gap-2 mb-2">
                  <Activity className="text-indigo-500" size={18} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Live Support Infrastructure</span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight uppercase">Helpdesk Matrix</h1>
          </div>
          
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-[2rem] border border-white/5 shadow-xl">
                  {['all', 'open', 'pending', 'resolved'].map((f) => (
                      <button 
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
                            filter === f ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50" : "text-slate-500 hover:text-white"
                        )}
                      >
                          {f}
                      </button>
                  ))}
              </div>
              <button 
                  onClick={fetchTickets}
                  className="p-4 bg-slate-900/50 border border-white/5 rounded-full text-slate-400 hover:bg-white/5 transition-all hover:rotate-180"
                  title="Sync Matrix"
              >
                  <RefreshCcw size={20} />
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-2xl"></div>)
        ) : filteredTickets.length > 0 ? (
          filteredTickets.map(ticket => (
            <div 
              key={ticket.id} 
              onClick={() => navigate(`/super-admin/tickets/${ticket.id}`)}
              className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 flex flex-col md:flex-row md:items-center gap-8 cursor-pointer hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 -mr-20 -mt-20 bg-indigo-600 rounded-full opacity-[0.05] blur-3xl group-hover:opacity-[0.1] transition-opacity" />
              
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 group-hover:border-indigo-500/50 transition-all", 
                ticket.priority === 'high' || ticket.priority === 'urgent' ? "bg-rose-500/10 text-rose-500" : "bg-white/5 text-slate-400"
              )}>
                {ticket.priority === 'high' || ticket.priority === 'urgent' ? <AlertCircle size={32} /> : <MessageSquare size={32} />}
              </div>
              
              <div className="flex-1 min-w-0 space-y-2 relative z-10">
                 <div className="flex items-center gap-3">
                    <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest", getStatusStyles(ticket.status))}>
                      {ticket.status}
                    </span>
                    <h3 className="font-black text-white text-xl truncate group-hover:text-indigo-400 transition-colors tracking-tight uppercase">{ticket.subject}</h3>
                 </div>
                 <div className="flex flex-wrap items-center gap-6 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5 group-hover:text-slate-300 transition-colors"><Store size={12} className="text-indigo-500" /> {ticket.shop_name}</span>
                    <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5 group-hover:text-slate-300 transition-colors"><User size={12} className="text-indigo-500" /> {ticket.user_name}</span>
                    <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5 group-hover:text-slate-300 transition-colors"><Clock size={12} className="text-indigo-500" /> {new Date(ticket.created_at).toLocaleString()}</span>
                 </div>
              </div>

              <div className="flex items-center gap-4 relative z-10">
                 {ticket.admin_response && (
                   <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20" title="Responded">
                     <CheckCircle2 size={24} />
                   </div>
                 )}
                 <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all border border-white/5">
                    <ArrowUpRight size={24} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                 </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 text-center bg-slate-900/40 backdrop-blur-md rounded-[3rem] border border-white/5 shadow-2xl">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
               <MessageSquare className="text-slate-600" size={48} />
            </div>
            <p className="text-white font-black text-xl uppercase tracking-widest">No support inquiry protocols found</p>
            <p className="text-slate-500 text-sm font-bold mt-2">Communication matrix is currently clear.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportTicketsPage;
