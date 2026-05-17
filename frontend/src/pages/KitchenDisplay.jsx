import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { kitchenApi } from '../api/api';
import { getSocket } from '../api/socket';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  Play, 
  Check, 
  XCircle, 
  History, 
  RotateCcw,
  UtensilsCrossed,
  LayoutGrid,
  ChevronRight,
  Filter,
  Search,
  Timer,
  AlertCircle,
  Truck,
  ShoppingBag,
  User,
  MoreVertical,
  CheckCircle,
  Clock3,
  Plus,
  MessageSquare
} from 'lucide-react';
import { 
  AppButton, 
  AppCard, 
  AppModal, 
  FormInput, 
  FormSelect, 
  useToast,
  Badge
} from '../components/ui';
import { cn } from '../utils/cn';

const KitchenDisplay = () => {
  const toast = useToast();
  const [kots, setKots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshInterval] = useState(10000); // 10 seconds
  
  // Filters
  const [filters, setFilters] = useState({
    order_type: 'All',
    status: 'All'
  });

  // Modal for cancellation
  const [cancelModal, setCancelModal] = useState({ show: false, kotId: null, reason: '' });

  const fetchKots = useCallback(async () => {
    try {
      const { data } = await kitchenApi.getActiveKots();
      setKots(data.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await kitchenApi.getHistory();
      setKots(data.data);
      setLastUpdated(new Date());
    } catch (err) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === 'active') {
      fetchKots();
      
      const socket = getSocket();
      if (socket) {
        socket.on('new_kot', fetchKots);
        socket.on('kot_status_updated', fetchKots);
        return () => {
          socket.off('new_kot', fetchKots);
          socket.off('kot_status_updated', fetchKots);
        };
      }
    } else {
      fetchHistory();
    }
  }, [activeTab, fetchKots, fetchHistory, refreshInterval]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await kitchenApi.updateStatus(id, status);
      toast.success(`Order marked as ${status}`);
      fetchKots();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCancel = async () => {
    if (!cancelModal.reason) return toast.error('Please provide a reason');
    try {
      await kitchenApi.cancelKot(cancelModal.kotId, cancelModal.reason);
      toast.success('KOT cancelled');
      setCancelModal({ show: false, kotId: null, reason: '' });
      fetchKots();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const getElapsedTime = (createdAt) => {
    const start = new Date(createdAt);
    const now = new Date();
    const diff = Math.floor((now - start) / 60000); // minutes
    return diff;
  };

  const getTimeColor = (minutes) => {
    if (minutes >= 40) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (minutes >= 20) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-slate-500 bg-slate-50 border-slate-100';
  };

  const filteredKots = useMemo(() => {
    return kots.filter(kot => {
      const matchesSearch = 
        kot.kot_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kot.table_no?.toString().includes(searchQuery) ||
        kot.items?.some(item => item.item_name?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesOrderType = filters.order_type === 'All' || kot.order_type === filters.order_type;
      const matchesStatus = filters.status === 'All' || kot.status === filters.status;
      
      return matchesSearch && matchesOrderType && matchesStatus;
    });
  }, [kots, searchQuery, filters]);

  const renderKotCard = (kot) => {
    const elapsed = getElapsedTime(kot.created_at);
    const timeStyles = getTimeColor(elapsed);
    
    return (
      <div key={kot.uuid || kot.id} className={cn(
        "bg-white rounded-[2rem] border-2 shadow-xl shadow-slate-200/40 transition-all duration-300 flex flex-col overflow-hidden animate-in zoom-in-95",
        kot.status === 'pending' ? "border-amber-100 ring-4 ring-amber-50/50" :
        kot.status === 'preparing' ? "border-indigo-100 ring-4 ring-indigo-50/50" :
        kot.status === 'ready' ? "border-emerald-100 ring-4 ring-emerald-50/50" : "border-slate-100"
      )}>
        {/* Card Header */}
        <header className={cn(
          "px-5 py-4 flex justify-between items-start",
          kot.status === 'pending' ? "bg-gradient-to-br from-amber-50 to-white" :
          kot.status === 'preparing' ? "bg-gradient-to-br from-indigo-50 to-white" :
          kot.status === 'ready' ? "bg-gradient-to-br from-emerald-50 to-white" : "bg-slate-50/50"
        )}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
               <span className={cn(
                 "w-2 h-2 rounded-full animate-pulse",
                 kot.status === 'pending' ? "bg-amber-500" :
                 kot.status === 'preparing' ? "bg-indigo-500" : "bg-emerald-500"
               )}></span>
               <h4 className="font-black text-base text-slate-900 tracking-tight">#{kot.kot_no}</h4>
               {kot.order_type === 'takeaway' ? <Badge variant="warning" className="text-[8px] px-1.5 py-0">TAK</Badge> : 
                kot.order_type === 'delivery' ? <Badge variant="primary" className="text-[8px] px-1.5 py-0">DEL</Badge> : 
                <Badge variant="secondary" className="text-[8px] px-1.5 py-0">DINE</Badge>}
            </div>
            <div className="flex flex-col">
               <span className="text-[11px] font-black uppercase text-slate-900 flex items-center gap-1">
                  {kot.order_type === 'dine_in' ? `Table ${kot.table_no || '?'}` : kot.order_type.toUpperCase()}
               </span>
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                  <User size={10} className="opacity-50" /> {kot.created_by_name}
               </span>
            </div>
          </div>
          <div className={cn("px-3 py-2 rounded-2xl border-2 flex flex-col items-center min-w-[65px] shadow-sm transition-colors", timeStyles)}>
             <span className="text-base font-black tracking-tighter leading-none">{elapsed}m</span>
             <span className="text-[8px] font-black uppercase tracking-[0.2em] mt-1 opacity-70">TIMER</span>
          </div>
        </header>

        {/* Card Body */}
        <div className="p-5 flex-1 space-y-4">
          <div className="space-y-3.5">
            {kot.items.map((item, idx) => (
              <div key={idx} className="flex gap-4 group">
                <div className="w-9 h-9 rounded-[14px] bg-slate-900 flex items-center justify-center text-white font-black shrink-0 text-xs shadow-lg shadow-slate-200">
                  {item.qty}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="font-black text-slate-900 text-sm leading-tight mb-1.5 uppercase tracking-tight truncate">{item.item_name}</p>
                   
                   {/* Modifiers & Notes */}
                   {(item.modifier_names || item.special_note || item.note) && (
                     <div className="bg-slate-50/50 rounded-2xl p-2.5 border border-slate-100 space-y-2 shadow-inner">
                        {item.modifier_names && (
                           <div className="flex flex-wrap gap-1.5">
                              {item.modifier_names.split(',').map((mod, i) => {
                                 const modLower = mod.toLowerCase().trim();
                                 const isRemoval = modLower.startsWith('no ') || modLower.includes('without') || modLower.includes('- ');
                                 return (
                                    <span key={i} className={cn(
                                       "text-[9px] font-black uppercase px-2 py-1 rounded-xl border flex items-center gap-1 shadow-sm transition-all",
                                       isRemoval 
                                          ? "bg-rose-50 text-rose-600 border-rose-200" 
                                          : "bg-indigo-50 text-indigo-600 border-indigo-200"
                                    )}>
                                       {isRemoval ? <X size={10} strokeWidth={3} /> : <Plus size={10} strokeWidth={3} />}
                                       {mod.trim().replace(/^[-+]\s*/, '')}
                                    </span>
                                 );
                              })}
                           </div>
                        )}
                        {(item.special_note || item.note) && (
                           <div className="flex items-start gap-1.5 bg-white p-2 rounded-xl border border-slate-100">
                              <AlertCircle size={12} className="text-rose-500 shrink-0 mt-0.5" />
                              <p className="text-[10px] font-bold text-rose-600 italic leading-snug">
                                 {item.special_note || item.note}
                              </p>
                           </div>
                        )}
                     </div>
                   )}
                </div>
              </div>
            ))}
          </div>

          {kot.note && (
            <div className="mt-4 p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <MessageSquare size={16} />
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">Kitchen Instruction</p>
              <p className="text-xs font-bold text-indigo-900 italic leading-relaxed">"{kot.note}"</p>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <footer className="p-4 bg-slate-50/30 border-t border-slate-100 flex gap-3">
           {kot.status === 'pending' && (
             <AppButton 
               variant="primary" 
               block 
               size="lg" 
               icon={Play} 
               onClick={() => handleStatusUpdate(kot.uuid || kot.id, 'preparing')}
               className="rounded-2xl uppercase text-[11px] tracking-widest font-black h-12 shadow-lg shadow-indigo-100"
             >
               Start Prep
             </AppButton>
           )}
           {kot.status === 'preparing' && (
             <AppButton 
               variant="success" 
               block 
               size="lg" 
               icon={Check} 
               onClick={() => handleStatusUpdate(kot.uuid || kot.id, 'ready')}
               className="rounded-2xl uppercase text-[11px] tracking-widest font-black h-12 shadow-lg shadow-emerald-100"
             >
               Mark Ready
             </AppButton>
           )}
           {kot.status === 'ready' && (
             <AppButton 
               variant="dark" 
               block 
               size="lg" 
               icon={CheckCircle2} 
               onClick={() => handleStatusUpdate(kot.uuid || kot.id, 'served')}
               className="rounded-2xl uppercase text-[11px] tracking-widest font-black h-12 shadow-lg shadow-slate-200"
             >
               Served
             </AppButton>
           )}
           {kot.status !== 'served' && kot.status !== 'cancelled' && (
             <button 
               onClick={() => setCancelModal({ show: true, kotId: kot.uuid || kot.id, reason: '' })}
               className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 text-slate-300 hover:text-rose-500 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-100 transition-all flex items-center justify-center shrink-0"
               title="Cancel KOT"
             >
               <XCircle size={22} />
             </button>
           )}
        </footer>
      </div>
    );
  };

  const getColumnKots = (status) => filteredKots.filter(k => k.status === status);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4 animate-in fade-in duration-500">
      {/* Top Bar */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <ChefHat size={24} />
           </div>
           <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">KDS Terminal</h2>
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                 <div className="flex items-center gap-1">
                    <Clock size={12} />
                    {lastUpdated.toLocaleTimeString()}
                 </div>
                 <div className="flex items-center gap-1 text-indigo-600">
                    <RotateCcw size={12} className="animate-spin-slow" />
                    Auto-refresh active
                 </div>
              </div>
           </div>
        </div>

        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text"
                    placeholder="Search KOT#, Table, Item..."
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-2.5 pl-12 pr-4 text-sm font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <select 
                    className="bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-2.5 text-xs font-black text-slate-700 outline-none focus:border-indigo-600 transition-all shadow-sm flex-1 sm:flex-none"
                    value={filters.order_type}
                    onChange={(e) => setFilters({...filters, order_type: e.target.value})}
                >
                    <option value="All">All Types</option>
                    <option value="dine_in">Dine-in</option>
                    <option value="takeaway">Takeaway</option>
                    <option value="delivery">Delivery</option>
                </select>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button 
                        onClick={() => setActiveTab('active')}
                        className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'active' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                        Active
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'history' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                        History
                    </button>
                </div>
            </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 overflow-hidden">
          {activeTab === 'active' ? (
              <div className="h-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto pb-4 custom-scrollbar">
                  {/* PENDING */}
                  <div className="flex flex-col gap-4 min-w-[280px]">
                      <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black shadow-md">{getColumnKots('pending').length}</div>
                              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-900">Pending</h3>
                          </div>
                          <div className="flex-1 h-px bg-amber-200 mx-3 rounded-full opacity-50" />
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                          {getColumnKots('pending').length === 0 ? (
                              <div className="h-40 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                                  <Clock3 size={24} className="text-slate-200 mb-2" />
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No pending</p>
                              </div>
                          ) : getColumnKots('pending').map(renderKotCard)}
                      </div>
                  </div>

                  {/* PREPARING */}
                  <div className="flex flex-col gap-4 min-w-[280px]">
                      <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-md">{getColumnKots('preparing').length}</div>
                              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-900">Preparing</h3>
                          </div>
                          <div className="flex-1 h-px bg-indigo-200 mx-3 rounded-full opacity-50" />
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                          {getColumnKots('preparing').length === 0 ? (
                              <div className="h-40 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                                  <RotateCcw size={24} className="text-slate-200 mb-2" />
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nothing cooking</p>
                              </div>
                          ) : getColumnKots('preparing').map(renderKotCard)}
                      </div>
                  </div>

                  {/* READY */}
                  <div className="flex flex-col gap-4 min-w-[280px]">
                      <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black shadow-md">{getColumnKots('ready').length}</div>
                              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-900">Ready</h3>
                          </div>
                          <div className="flex-1 h-px bg-emerald-200 mx-3 rounded-full opacity-50" />
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                          {getColumnKots('ready').length === 0 ? (
                              <div className="h-40 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                                  <CheckCircle size={24} className="text-slate-200 mb-2" />
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No ready items</p>
                              </div>
                          ) : getColumnKots('ready').map(renderKotCard)}
                      </div>
                  </div>

                  {/* SERVED / HISTORY */}
                  <div className="flex flex-col gap-4 min-w-[280px]">
                      <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-md">{getColumnKots('served').length}</div>
                              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-900">Served Today</h3>
                          </div>
                          <div className="flex-1 h-px bg-slate-200 mx-3 rounded-full opacity-50" />
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                          {getColumnKots('served').length === 0 ? (
                              <div className="h-40 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                                  <History size={24} className="text-slate-200 mb-2" />
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No served orders</p>
                              </div>
                          ) : getColumnKots('served').map(renderKotCard)}
                      </div>
                  </div>
              </div>
          ) : (
              <div className="h-full bg-white rounded-[40px] border border-slate-100 shadow-sm p-6 overflow-hidden flex flex-col">
                  <div className="flex items-center gap-2 mb-6">
                      <History className="text-indigo-600" size={20} />
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">KOT History (Today)</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
                        {getColumnKots('served').concat(kots.filter(k => k.status === 'cancelled')).length === 0 ? (
                            <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">No history found for today</div>
                        ) : (
                            getColumnKots('served').concat(kots.filter(k => k.status === 'cancelled'))
                                .sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at))
                                .map(renderKotCard)
                        )}
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* Cancel Modal */}
      <AppModal 
        isOpen={cancelModal.show} 
        onClose={() => setCancelModal({ show: false, kotId: null, reason: '' })}
        title="Cancel KOT"
        icon={XCircle}
      >
        <div className="space-y-6">
           <p className="text-sm font-medium text-slate-500">Are you sure you want to cancel this KOT? This action cannot be undone and will be logged.</p>
           <FormInput 
             label="Reason for Cancellation" 
             required 
             placeholder="e.g. Item out of stock, Customer changed mind"
             value={cancelModal.reason}
             onChange={(e) => setCancelModal({...cancelModal, reason: e.target.value})}
           />
           <div className="flex gap-3">
              <AppButton variant="secondary" className="flex-1" onClick={() => setCancelModal({ show: false, kotId: null, reason: '' })}>Close</AppButton>
              <AppButton variant="danger" className="flex-1" onClick={handleCancel}>Confirm Cancel</AppButton>
           </div>
        </div>
      </AppModal>
    </div>
  );
};

export default KitchenDisplay;
