import React, { useState, useEffect } from 'react';
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
  Tag
} from 'lucide-react';
import { AppButton, AppCard, AppModal, useToast } from '../../components/ui';
import { cn } from '../../utils/cn';

const SupportTicketsPage = () => {
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('open');
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await superAdminApi.updateTicket(selectedTicket.id, { status, admin_response: response });
      toast.success('Response sent successfully');
      setSelectedTicket(null);
      setResponse('');
      fetchTickets();
    } catch (err) {
      toast.error('Failed to update ticket');
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'high': return 'bg-rose-50 text-rose-600';
      case 'medium': return 'bg-amber-50 text-amber-600';
      default: return 'bg-emerald-50 text-emerald-600';
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'resolved': return 'bg-emerald-500 text-white';
      case 'closed': return 'bg-slate-500 text-white';
      case 'pending': return 'bg-amber-500 text-white';
      default: return 'bg-indigo-600 text-white';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <MessageSquare className="text-indigo-600" size={32} />
            Support Helpdesk
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage and respond to shop owner inquiries</p>
        </div>
        
        <div className="flex bg-white p-2 rounded-2xl border-2 border-slate-50 shadow-sm">
           {['all', 'open', 'pending', 'resolved'].map(f => (
             <button
               key={f}
               onClick={() => setFilter(f)}
               className={cn(
                 "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 filter === f ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
               )}
             >
               {f}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-2xl"></div>)
        ) : filteredTickets.length > 0 ? (
          filteredTickets.map(ticket => (
            <div 
              key={ticket.id} 
              onClick={() => {
                setSelectedTicket(ticket);
                setResponse(ticket.admin_response || '');
                setStatus(ticket.status);
              }}
              className="bg-white border-2 border-slate-50 rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center gap-6 cursor-pointer hover:border-indigo-100 hover:shadow-xl hover:shadow-slate-200/40 transition-all group"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner", getPriorityStyles(ticket.priority))}>
                {ticket.priority === 'high' ? <AlertCircle size={28} /> : <MessageSquare size={28} />}
              </div>
              
              <div className="flex-1 min-w-0 space-y-1">
                 <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter", getStatusStyles(ticket.status))}>
                      {ticket.status}
                    </span>
                    <h3 className="font-black text-slate-800 text-lg truncate group-hover:text-indigo-600 transition-colors">{ticket.subject}</h3>
                 </div>
                 <div className="flex flex-wrap items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Store size={12} /> {ticket.shop_name}</span>
                    <span className="flex items-center gap-1"><User size={12} /> {ticket.user_name}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(ticket.created_at).toLocaleString()}</span>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 {ticket.admin_response && (
                   <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100" title="Responded">
                     <CheckCircle2 size={18} />
                   </div>
                 )}
                 <ArrowUpRight size={20} className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200">
            <MessageSquare className="mx-auto text-slate-200 mb-4" size={64} />
            <p className="text-slate-400 font-bold text-lg">No support tickets found</p>
          </div>
        )}
      </div>

      {/* Response Modal */}
      <AppModal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title="Ticket Inquiry Details"
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-8 py-4">
            <div className="bg-slate-50 p-8 rounded-[2.5rem] space-y-4 border border-slate-100">
               <div className="flex justify-between items-start">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inquiry From</p>
                     <p className="text-lg font-black text-slate-900">{selectedTicket.shop_name}</p>
                     <p className="text-xs font-bold text-slate-500">{selectedTicket.user_name} ({selectedTicket.priority} priority)</p>
                  </div>
                  <div className={cn("px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm", getStatusStyles(selectedTicket.status))}>
                     {selectedTicket.status}
                  </div>
               </div>
               <div className="pt-4 border-t border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject</p>
                  <p className="text-xl font-black text-slate-900 leading-tight">{selectedTicket.subject}</p>
                  <p className="mt-4 text-slate-600 font-medium leading-relaxed bg-white p-6 rounded-3xl border border-slate-100 shadow-inner">
                    {selectedTicket.message}
                  </p>
               </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Update Status</label>
                  <div className="grid grid-cols-3 gap-3">
                     {['open', 'pending', 'resolved'].map(s => (
                       <button
                         key={s}
                         type="button"
                         onClick={() => setStatus(s)}
                         className={cn(
                           "py-3 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all",
                           status === s 
                             ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" 
                             : "bg-white border-slate-100 text-slate-400"
                         )}
                       >
                         {s}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Response</label>
                  <textarea 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all h-40 resize-none shadow-sm"
                    placeholder="Type your official response to the shop owner..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    required
                  />
               </div>

               <div className="flex gap-4 pt-4">
                  <AppButton variant="secondary" className="flex-1 rounded-2xl h-14" onClick={() => setSelectedTicket(null)}>Close View</AppButton>
                  <AppButton 
                    type="submit" 
                    variant="primary" 
                    icon={Reply}
                    className="flex-[2] rounded-2xl h-14 shadow-xl shadow-indigo-100 uppercase font-black tracking-widest"
                  >
                    SEND RESPONSE
                  </AppButton>
               </div>
            </form>
          </div>
        )}
      </AppModal>
    </div>
  );
};

export default SupportTicketsPage;
