import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Store, 
  Reply, 
  Activity,
  Tag,
  RefreshCcw,
  ShieldCheck
} from 'lucide-react';
import { superAdminApi } from '../../api/api';
import { AppButton, AppCard, useToast } from '../../components/ui';
import { cn } from '../../utils/cn';

const TicketDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('open');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getTickets();
      if (res.data.success) {
        const found = res.data.data.find(t => t.id === parseInt(id));
        if (found) {
          setTicket(found);
          setResponse(found.admin_response || '');
          setStatus(found.status);
        } else {
          toast.error('Protocol identifier not found in matrix');
          navigate('/super-admin/tickets');
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to sync with support matrix');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await superAdminApi.updateTicket(id, { status, admin_response: response });
      if (res.data.success) {
        toast.success('Response transmitted successfully');
        fetchTicket();
      }
    } catch (error) {
      console.error(error);
      toast.error('Transmission failure: Server error');
    } finally {
      setUpdating(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] animate-pulse">Accessing Inquiry Protocol...</p>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 selection:bg-indigo-500/30">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
              <button 
                onClick={() => navigate('/super-admin/tickets')}
                className="w-14 h-14 bg-slate-900/50 border border-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
              >
                <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                  <div className="flex items-center gap-2 mb-2">
                      <Activity className="text-indigo-500" size={18} />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Protocol Details</span>
                  </div>
                  <h1 className="text-4xl font-black text-white tracking-tight uppercase">Inquiry ID: {ticket.id}</h1>
              </div>
          </div>
          
          <div className="flex items-center gap-4">
              <button 
                  onClick={fetchTicket}
                  className="p-4 bg-slate-900/50 border border-white/5 rounded-full text-slate-400 hover:bg-white/5 transition-all hover:rotate-180"
                  title="Resync Protocol"
              >
                  <RefreshCcw size={20} />
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute -right-24 -top-24 w-64 h-64 bg-indigo-600 opacity-[0.05] rounded-full blur-3xl"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 mb-12">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Inquiry Origin Node</p>
                      <h2 className="text-4xl font-black text-white tracking-tight uppercase">{ticket.shop_name}</h2>
                      <div className="flex items-center gap-3 mt-4">
                         <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-indigo-400 border border-white/5">
                            <User size={18} />
                         </div>
                         <div>
                            <p className="text-xs font-black text-white uppercase tracking-widest">{ticket.user_name}</p>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Authorized Shop Agent</p>
                         </div>
                      </div>
                   </div>
                   <div className="flex flex-col items-end gap-3">
                      <div className={cn("px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl", getStatusStyles(ticket.status))}>
                         {ticket.status}
                      </div>
                      <div className={cn("px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border", getPriorityStyles(ticket.priority))}>
                         {ticket.priority} PRIORITY
                      </div>
                   </div>
                </div>

                <div className="space-y-8 relative z-10">
                   <div className="pt-8 border-t border-white/5">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4">Transmission Subject</p>
                      <h3 className="text-3xl font-black text-white leading-tight tracking-tight uppercase">{ticket.subject}</h3>
                   </div>

                   <div className="bg-slate-950/50 rounded-[2.5rem] p-10 border border-white/5 relative">
                      <div className="absolute -left-1 top-10 bottom-10 w-1 bg-indigo-600 rounded-full shadow-[0_0_15px_#6366f1]"></div>
                      <p className="text-xl text-slate-300 font-medium leading-relaxed italic">
                        "{ticket.message}"
                      </p>
                   </div>

                   <div className="flex items-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-widest pt-4">
                      <div className="flex items-center gap-2">
                         <Clock size={14} className="text-indigo-500" />
                         <span>Logged: {new Date(ticket.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <ShieldCheck size={14} className="text-indigo-500" />
                         <span>Verified Protocol</span>
                      </div>
                   </div>
                </div>
            </div>

            {/* Response Section */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute -left-24 -bottom-24 w-64 h-64 bg-emerald-600 opacity-[0.05] rounded-full blur-3xl"></div>
                
                <form onSubmit={handleUpdate} className="space-y-8 relative z-10">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-white tracking-tight uppercase">Admin Response Protocol</h3>
                      <div className="bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
                         <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic">Direct Transmission Channel</span>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Official Statement</label>
                      <textarea 
                        className="w-full bg-slate-950/50 border-2 border-white/5 rounded-[2.5rem] p-10 text-lg font-bold text-white placeholder:text-slate-800 outline-none focus:border-indigo-600 transition-all h-64 resize-none shadow-inner"
                        placeholder="Type your official response to the shop agent..."
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        required
                      />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Final Protocol Status</label>
                         <div className="grid grid-cols-2 gap-3">
                            {['open', 'pending', 'resolved', 'closed'].map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setStatus(s)}
                                className={cn(
                                  "py-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                  status === s 
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-900/50" 
                                    : "bg-slate-950 border-white/5 text-slate-600 hover:border-indigo-500/30 hover:text-white"
                                )}
                              >
                                {s}
                              </button>
                            ))}
                         </div>
                      </div>
                      <AppButton 
                        type="submit" 
                        variant="primary" 
                        icon={Reply}
                        loading={updating}
                        className="h-16 rounded-2xl shadow-2xl shadow-indigo-900/50 uppercase font-black tracking-[0.3em] text-sm"
                      >
                        Transmit Response
                      </AppButton>
                   </div>
                </form>
            </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6 pb-4 border-b border-white/5">Audit Trail</h4>
                <div className="space-y-6">
                   <div className="flex gap-4">
                      <div className="w-1 h-12 bg-indigo-600 rounded-full shrink-0"></div>
                      <div>
                         <p className="text-xs font-black text-white uppercase tracking-widest">Protocol Initialized</p>
                         <p className="text-[10px] font-black text-slate-500 uppercase mt-1">{new Date(ticket.created_at).toLocaleString()}</p>
                      </div>
                   </div>
                   {ticket.responded_at && (
                     <div className="flex gap-4">
                        <div className="w-1 h-12 bg-emerald-500 rounded-full shrink-0"></div>
                        <div>
                           <p className="text-xs font-black text-white uppercase tracking-widest">Response Transmitted</p>
                           <p className="text-[10px] font-black text-slate-500 uppercase mt-1">{new Date(ticket.responded_at).toLocaleString()}</p>
                        </div>
                     </div>
                   )}
                </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900/20 to-violet-900/20 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 shadow-2xl text-center">
                <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
                   <ShieldCheck className="text-indigo-400" size={40} />
                </div>
                <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2">Secure Channel</h4>
                <p className="text-xs font-medium text-slate-400 leading-relaxed">
                  All transmissions within this support matrix are encrypted and logged for quality protocol assurance.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailsPage;
