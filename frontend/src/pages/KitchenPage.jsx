import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  UtensilsCrossed,
  LayoutGrid,
  List,
  RefreshCw,
  ChefHat
} from 'lucide-react';
import { useToast } from '../components/ui/Feedback';
import { cn } from '../utils/cn';

const KitchenPage = () => {
  const [kots, setKots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [refreshing, setRefreshing] = useState(false);
  const showToast = useToast();

  useEffect(() => {
    fetchKots();
    const interval = setInterval(fetchKots, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchKots = async () => {
    setRefreshing(true);
    try {
      const { data } = await apiClient.get('/kot/pending');
      setKots(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await apiClient.patch(`/kot/${id}/status`, { status });
      showToast(`Order marked as ${status}`, 'success');
      fetchKots();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const getElapsedTimeColor = (minutes) => {
      if (minutes < 10) return 'text-emerald-500';
      if (minutes < 20) return 'text-amber-500';
      return 'text-rose-500 animate-pulse';
  };

  if (loading) return (
      <div className="h-full flex flex-col items-center justify-center py-24 gap-4">
          <RefreshCw className="text-indigo-600 animate-spin" size={48} />
          <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Syncing with Kitchen...</p>
      </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-900 text-white rounded-[20px] flex items-center justify-center shadow-2xl">
                <ChefHat size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Kitchen Display</h1>
                <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", refreshing ? "bg-emerald-500 animate-pulse" : "bg-slate-300")}></div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        {refreshing ? 'Updating orders...' : 'Live Feed Active'}
                    </p>
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchKots}
            className="p-3 bg-white rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100 transition-all shadow-sm group"
          >
            <RefreshCw size={20} className={cn(refreshing && "animate-spin")} />
          </button>
          <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100">
            <button 
                onClick={() => setViewMode('grid')}
                className={cn(
                    "p-2.5 rounded-xl transition-all",
                    viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:text-slate-600'
                )}
            >
                <LayoutGrid size={20} />
            </button>
            <button 
                onClick={() => setViewMode('list')}
                className={cn(
                    "p-2.5 rounded-xl transition-all",
                    viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:text-slate-600'
                )}
            >
                <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {kots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border-4 border-dashed border-slate-50">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
            <UtensilsCrossed size={48} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">No Active Orders</h3>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">All orders have been served</p>
        </div>
      ) : (
        <div className={cn(
            viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" 
                : "space-y-6 max-w-5xl mx-auto"
        )}>
          {kots.map((kot) => {
              const minutes = Math.floor((new Date() - new Date(kot.created_at)) / 60000);
              return (
                <div 
                  key={kot.id} 
                  className={cn(
                    "bg-white rounded-[32px] overflow-hidden flex flex-col border-2 transition-all duration-300 shadow-xl",
                    kot.status === 'preparing' ? 'border-indigo-600 shadow-indigo-100 scale-[1.02]' : 'border-slate-50 shadow-slate-100',
                    viewMode === 'list' && "flex-row h-auto"
                  )}
                >
                  {/* Header */}
                  <div className={cn(
                    "p-6 flex justify-between items-start transition-colors duration-500",
                    kot.status === 'preparing' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white',
                    viewMode === 'list' && "w-64 shrink-0 flex-col justify-center"
                  )}>
                    <div>
                      <h4 className="text-2xl font-black tracking-tight leading-none mb-2">
                        {kot.table_no ? `Table ${kot.table_no}` : 'Walk-in'}
                      </h4>
                      <p className="text-[10px] opacity-70 font-black uppercase tracking-widest">{kot.kot_no}</p>
                    </div>
                    <div className={cn("text-right", viewMode === 'list' && "text-left mt-4")}>
                        <div className="flex items-center gap-2 font-black text-lg">
                            <Clock size={18} className={getElapsedTimeColor(minutes)} />
                            <span className={getElapsedTimeColor(minutes)}>{minutes}m</span>
                        </div>
                        <p className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-50">Since Order</p>
                    </div>
                  </div>
    
                  {/* Items List */}
                  <div className="p-8 flex-1 space-y-5">
                    {kot.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start group">
                        <div className="flex gap-5">
                            <span className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-900 text-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                {item.qty}
                            </span>
                            <div className="pt-1">
                                <p className="font-black text-slate-900 text-base leading-tight uppercase tracking-tight">{item.item_name}</p>
                                {item.note && (
                                    <div className="mt-2 flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1 rounded-lg w-fit">
                                        <AlertCircle size={10} />
                                        <p className="text-[10px] font-black uppercase italic">{item.note}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                      </div>
                    ))}
                  </div>
    
                  {/* Actions */}
                  <div className={cn(
                      "p-6 bg-slate-50 border-t border-slate-100 flex gap-4",
                      viewMode === 'list' && "w-64 shrink-0 flex-col items-center justify-center bg-white border-t-0 border-l"
                  )}>
                    {kot.status === 'pending' ? (
                      <button 
                        onClick={() => updateStatus(kot.id, 'preparing')}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95"
                      >
                        Start Preparation
                      </button>
                    ) : (
                      <button 
                        onClick={() => updateStatus(kot.id, 'ready')}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 flex items-center justify-center gap-3 transition-all active:scale-95"
                      >
                        <CheckCircle2 size={18} />
                        Mark as Ready
                      </button>
                    )}
                  </div>
                </div>
              );
          })}
        </div>
      )}
    </div>
  );
};

export default KitchenPage;
