import React, { useState, useEffect } from 'react';
import { kitchenApi } from '../api/api';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  Timer, 
  AlertCircle,
  UtensilsCrossed,
  Printer,
  ChevronRight
} from 'lucide-react';
import { AppCard, StatusBadge, useToast, AppButton } from '../components/ui';
import { kotApi } from '../api/api';
import KOTPrintModal from '../components/invoice/KOTPrintModal';
import { cn } from '../utils/cn';

const KitchenDisplay = () => {
  const toast = useToast();
  const [kots, setKots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKot, setSelectedKot] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    fetchKots();
    const interval = setInterval(fetchKots, 10000); // Auto refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchKots = async () => {
    try {
      const { data } = await kitchenApi.getKots();
      setKots(data.data);
    } catch (err) {
      console.error('Failed to fetch KOTs');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintKOT = async (id) => {
    try {
        const { data } = await kotApi.getById(id);
        setSelectedKot(data.data);
        setShowPrintModal(true);
    } catch (err) {
        toast.error('Failed to load KOT for printing');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await kitchenApi.updateStatus(id, status);
      toast.success(`KOT marked as ${status}`);
      fetchKots();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-500';
      case 'preparing': return 'bg-indigo-500';
      case 'ready': return 'bg-emerald-500';
      default: return 'bg-slate-500';
    }
  };

  const getTimeElapsed = (createdAt) => {
    const start = new Date(createdAt);
    const now = new Date();
    const diff = Math.floor((now - start) / 60000); // minutes
    return diff;
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-400">Loading Kitchen Display...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-slate-900 p-6 rounded-[32px] text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <ChefHat size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight uppercase">Kitchen Display System</h2>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Real-time Order Preparation</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
            <Timer size={16} className="text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest">{kots.length} Active Tickets</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {kots.map((kot) => (
          <div key={kot.id} className="flex flex-col bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden group hover:shadow-2xl transition-all border-t-8" style={{ borderTopColor: getStatusColor(kot.status) === 'bg-amber-500' ? '#f59e0b' : getStatusColor(kot.status) === 'bg-indigo-500' ? '#6366f1' : '#10b981' }}>
            <div className="p-6 border-b border-slate-50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">Table {kot.table_no || 'T/A'}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{kot.kot_no}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className={cn("px-3 py-1 rounded-full flex items-center gap-1.5", getStatusColor(kot.status))}>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{kot.status}</span>
                    </div>
                    <button 
                        onClick={() => handlePrintKOT(kot.id)}
                        className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                        title="Print Ticket"
                    >
                        <Printer size={14} />
                    </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-slate-400">
                <Clock size={14} />
                <span className={cn("text-xs font-bold", getTimeElapsed(kot.created_at) > 15 ? "text-rose-500" : "text-slate-500")}>
                  {getTimeElapsed(kot.created_at)} mins ago
                </span>
              </div>
            </div>

            <div className="flex-1 p-6 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar bg-slate-50/50">
              {kot.items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0 text-xs font-black text-slate-900">
                    {item.qty}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900 leading-tight">{item.item_name}</p>
                    {item.note && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1 italic">Note: {item.note}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-white border-t border-slate-100 grid grid-cols-1 gap-2">
              {kot.status === 'pending' && (
                <button 
                  onClick={() => handleUpdateStatus(kot.id, 'preparing')}
                  className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                >
                  <ChefHat size={16} />
                  Start Preparing
                </button>
              )}
              {kot.status === 'preparing' && (
                <button 
                  onClick={() => handleUpdateStatus(kot.id, 'ready')}
                  className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                >
                  <CheckCircle2 size={16} />
                  Mark Ready
                </button>
              )}
              {kot.status === 'ready' && (
                <button 
                  onClick={() => handleUpdateStatus(kot.id, 'served')}
                  className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black shadow-lg shadow-slate-200"
                >
                  <UtensilsCrossed size={16} />
                  Mark Served
                </button>
              )}
            </div>
          </div>
        ))}

        {kots.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-20">
            <UtensilsCrossed size={64} className="mb-4" />
            <h2 className="text-2xl font-black uppercase">No active kitchen tickets</h2>
          </div>
        )}
      </div>

      <KOTPrintModal 
        isOpen={showPrintModal} 
        onClose={() => setShowPrintModal(false)} 
        kot={selectedKot} 
      />
    </div>
  );
};

export default KitchenDisplay;
