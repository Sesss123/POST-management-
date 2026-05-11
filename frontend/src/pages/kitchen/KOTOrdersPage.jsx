import React, { useState, useEffect } from 'react';
import { kotApi } from '../../api/api';
import { 
  ChefHat, 
  Search, 
  Printer, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Timer,
  RefreshCw,
  Eye,
  Utensils
} from 'lucide-react';
import { AppCard, StatusBadge, useToast, AppButton, AppModal } from '../../components/ui';
import KOTPrintModal from '../../components/invoice/KOTPrintModal';
import { cn } from '../../utils/cn';

const KOTOrdersPage = () => {
  const toast = useToast();
  const [kots, setKots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedKot, setSelectedKot] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  

  useEffect(() => {
    fetchKots();
  }, []);

  const fetchKots = async () => {
    try {
      const { data } = await kotApi.getAll();
      setKots(data.data);
    } catch (err) {
      toast.error('Failed to load KOT orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id, isPrint = false) => {
    try {
      const { data } = await kotApi.getById(id);
      setSelectedKot(data.data);
      if (isPrint) {
          setShowPrintModal(true);
      } else {
          setShowDetails(true);
      }
    } catch (err) {
      toast.error('Failed to load KOT details');
    }
  };

  const filteredKots = kots.filter(k => 
    k.kot_no.toLowerCase().includes(search.toLowerCase()) || 
    (k.table_no && k.table_no.toString().includes(search))
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-500';
      case 'preparing': return 'bg-indigo-500';
      case 'ready': return 'bg-emerald-500';
      case 'served': return 'bg-slate-900';
      default: return 'bg-slate-400';
    }
  };

  if (loading) return <div className="p-8 text-center font-black text-slate-400 uppercase tracking-widest text-xs">Loading KOT records...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500 text-white rounded-[20px] flex items-center justify-center shadow-2xl shadow-amber-200">
                <ChefHat size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">KOT Orders</h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Kitchen Order Ticket Management</p>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="relative group w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Search KOT or Table..." 
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none focus:border-amber-500 transition-all shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <button 
                onClick={fetchKots}
                className="p-3 bg-white rounded-2xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-slate-100 transition-all shadow-sm"
            >
                <RefreshCw size={20} />
            </button>
        </div>
      </div>

      <AppCard className="overflow-hidden border-none shadow-2xl shadow-slate-200/50 rounded-[40px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-6 font-black text-[10px] uppercase tracking-widest">KOT NO</th>
                <th className="p-6 font-black text-[10px] uppercase tracking-widest">Table</th>
                <th className="p-6 font-black text-[10px] uppercase tracking-widest">Status</th>
                <th className="p-6 font-black text-[10px] uppercase tracking-widest">Time</th>
                <th className="p-6 font-black text-[10px] uppercase tracking-widest">Created By</th>
                <th className="p-6 font-black text-[10px] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredKots.map((kot) => (
                <tr key={kot.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-6">
                    <p className="font-black text-slate-900">#{kot.kot_no}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{kot.order_type}</p>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                            <Utensils size={14} />
                        </div>
                        <span className="font-black text-slate-700">Table {kot.table_no || 'T/A'}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white font-black text-[8px] uppercase tracking-widest shadow-sm", getStatusColor(kot.status))}>
                        {kot.status}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Clock size={14} />
                        <span className="text-xs font-bold">{new Date(kot.created_at).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="p-6 text-xs font-bold text-slate-500 uppercase tracking-tight">
                    {kot.created_by_name}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => handleViewDetails(kot.id)}
                            className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all"
                            title="View Items"
                        >
                            <Eye size={16} />
                        </button>
                        <button 
                            onClick={() => handleViewDetails(kot.id, true)}
                            className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                            title="Reprint KOT"
                        >
                            <Printer size={16} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AppCard>

      {/* KOT Details Modal */}
      <AppModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={`KOT Details: #${selectedKot?.kot_no}`}
      >
        <div className="space-y-8 py-4">
            <div className="flex justify-between items-start bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Source Table</p>
                    <h4 className="text-2xl font-black text-slate-900 leading-none">Table {selectedKot?.table_no || 'T/A'}</h4>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white font-black text-[8px] uppercase tracking-widest", getStatusColor(selectedKot?.status))}>
                        {selectedKot?.status}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Order Items</p>
                <div className="space-y-3">
                    {selectedKot?.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-4 bg-white border-2 border-slate-50 rounded-2xl">
                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg">
                                {item.qty}
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-slate-900 leading-tight uppercase tracking-tight">{item.item_name}</p>
                                {item.note && (
                                    <div className="mt-2 flex items-center gap-1.5 bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg w-fit">
                                        <AlertCircle size={10} />
                                        <p className="text-[8px] font-black uppercase italic">{item.note}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-4">
                <AppButton variant="secondary" className="flex-1" onClick={() => setShowDetails(false)}>Close</AppButton>
                <AppButton 
                    variant="primary" 
                    className="flex-1 bg-orange-600" 
                    icon={Printer} 
                    onClick={() => {
                        setShowDetails(false);
                        setShowPrintModal(true);
                    }}
                >
                    Print KOT
                </AppButton>
            </div>
        </div>
      </AppModal>

      <KOTPrintModal 
        isOpen={showPrintModal} 
        onClose={() => setShowPrintModal(false)} 
        kot={selectedKot} 
      />
    </div>
  );
};

export default KOTOrdersPage;
