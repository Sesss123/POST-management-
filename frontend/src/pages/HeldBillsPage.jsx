import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { heldBillApi, sessionApi, gatewayPaymentApi } from '../api/api';
import { 
  PauseCircle, 
  Trash2, 
  CheckCircle2, 
  Search, 
  Clock,
  Printer,
  XCircle,
  Eye,
  Receipt,
  ArrowRight,
  Phone,
  FileText,
  History,
  CheckCircle,
  AlertCircle,
  Zap,
  Grid3X3,
  Utensils,
  Sparkles,
  RefreshCw,
  Activity,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react';
import { AppButton, AppModal, useToast } from '../components/ui';
import PaymentQRModal from '../components/PaymentQRModal';
import { cn } from '../utils/cn';

const GlassCard = ({ title, value, icon: Icon, variant = 'primary', className }) => {
    const variants = {
        primary: "from-indigo-500/20 to-purple-500/20 border-indigo-500/30",
        success: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
        danger: "from-rose-500/20 to-orange-500/20 border-rose-500/30",
        warning: "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
    };

    const iconColors = {
        primary: "text-indigo-400",
        success: "text-emerald-400",
        danger: "text-rose-400",
        warning: "text-amber-400",
    };

    return (
        <div className={cn(
            "relative group overflow-hidden bg-slate-900/40 backdrop-blur-2xl border rounded-[40px] p-8 transition-all duration-500 hover:scale-[1.02]",
            variants[variant],
            className
        )}>
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className={cn("w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center", iconColors[variant])}>
                        <Icon size={28} />
                    </div>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
                <h4 className="text-3xl font-black text-white tabular-nums tracking-tighter">
                    {value}
                </h4>
            </div>
        </div>
    );
};

const HeldBillsPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('held'); // 'held' or 'tables'
  const [bills, setBills] = useState([]);
  const [tableSessions, setTableSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('held');
  
  const [selectedBill, setSelectedBill] = useState(null);
  const [billItems, setBillItems] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrTransactionData, setQrTransactionData] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'held') {
        const { data } = await heldBillApi.getAll({ status: statusFilter, search });
        setBills(data.data);
      } else {
        const { data } = await sessionApi.getOpen();
        // Manual search filter for table sessions since API might not support it directly here
        const sessions = search 
            ? data.data.filter(s => 
                s.table_no?.toString().includes(search) || 
                s.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
                s.session_no?.toLowerCase().includes(search.toLowerCase())
              )
            : data.data;
        setTableSessions(sessions);
      }
    } catch (err) {
      toast.error('Data synchronization failed');
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, search, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e) => {
      if (e.key === 'Enter') fetchData();
  };

  const fetchBillDetails = async (bill) => {
      setSelectedBill(bill);
      setProcessing(true);
      try {
          const { data } = await heldBillApi.getDetails(bill.uuid || bill.id);
          setBillItems(data.data.items);
          setShowDetailsModal(true);
      } catch (err) {
          toast.error('Failed to load telemetry items');
      } finally {
          setProcessing(false);
      }
  };

  const handleResumeHeld = (id) => {
      localStorage.setItem('resume_held_bill_id', id);
      navigate('/cash-sale');
  };

  const handleResumeTable = (tableId) => {
      localStorage.setItem('resume_table_id', tableId);
      navigate('/table-billing');
  };
  
  const handleQRPayment = async () => {
      setProcessing(true);
      try {
          const payload = {
              held_bill_id: selectedBill.uuid || selectedBill.id,
              items: billItems.map(i => ({ 
                  id: i.item_id, 
                  qty: i.qty,
                  price: i.unit_price
              })),
              discount_type: selectedBill.discount_type || 'fixed',
              discount_value: selectedBill.discount_value || 0,
              promotion_id: selectedBill.promotion_id || null,
              customer_id: selectedBill.customer_id || null,
              order_type: selectedBill.order_type || 'takeaway',
              source: 'held_bill'
          };
          
          const res = await gatewayPaymentApi.createQR(payload);
          setQrTransactionData(res.data.data);
          setShowQRModal(true);
          setShowDetailsModal(false);
      } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to initialize QR protocol');
      } finally {
          setProcessing(false);
      }
  };

  const formatCurrency = (val) => {
    return `Rs. ${parseFloat(val || 0).toLocaleString()}`;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 p-2 sm:p-6 lg:p-8 selection:bg-amber-500/30 max-h-screen overflow-hidden flex flex-col">
      {/* Premium Neural Header */}
      <header className="relative group shrink-0">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 rounded-[48px] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-slate-900/80 backdrop-blur-3xl p-10 rounded-[44px] border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-700 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-amber-500/40 group-hover:scale-110 transition-transform duration-500">
                    <PauseCircle size={32} />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={14} className="text-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400">Parked Operations</span>
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tight leading-none mb-1 uppercase">Parked Bills</h2>
                    <p className="text-sm font-medium text-slate-400">Unified dashboard for suspended transactions and active sessions</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto relative z-10">
                {/* Modern Unified Tabs */}
                <div className="flex bg-white/5 p-2 rounded-[24px] border border-white/10 backdrop-blur-md">
                    <button 
                        onClick={() => setActiveTab('held')}
                        className={cn(
                            "flex items-center gap-3 px-8 py-4 rounded-[18px] font-black text-[10px] uppercase tracking-widest transition-all duration-300",
                            activeTab === 'held' ? "bg-white text-slate-900 shadow-xl scale-105" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <PauseCircle size={16} />
                        Held
                    </button>
                    <button 
                        onClick={() => setActiveTab('tables')}
                        className={cn(
                            "flex items-center gap-3 px-8 py-4 rounded-[18px] font-black text-[10px] uppercase tracking-widest transition-all duration-300",
                            activeTab === 'tables' ? "bg-white text-slate-900 shadow-xl scale-105" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Grid3X3 size={16} />
                        Tables
                    </button>
                </div>
                
                <AppButton 
                    variant="secondary" 
                    icon={RefreshCw} 
                    size="lg" 
                    className="rounded-[24px] bg-white/5 border-white/5 text-white hover:text-amber-400" 
                    onClick={fetchData} 
                    loading={loading}
                />
            </div>
        </div>
      </header>

      {/* Dynamic Controls Bar - NOW VISIBLE FOR BOTH TABS */}
      <div className="flex flex-col lg:flex-row gap-6 items-center shrink-0">
          <div className="relative group w-full lg:flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors" size={20} />
              <input 
                  type="text" 
                  placeholder={activeTab === 'held' ? "Search by customer, phone or bill identifier..." : "Search by table number, customer or session..."}
                  className="w-full bg-slate-900/40 border border-white/10 rounded-[32px] py-6 pl-16 pr-8 text-white font-bold outline-none focus:ring-4 focus:ring-amber-500/10 focus:bg-slate-900/60 focus:border-amber-600 transition-all shadow-xl"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearch}
              />
          </div>
          
          <div className="flex gap-4 w-full lg:w-auto">
              <select 
                  className="bg-slate-900/40 border border-white/10 text-white px-10 py-6 rounded-[32px] font-black text-[10px] uppercase tracking-widest outline-none cursor-pointer hover:bg-slate-900/60 transition-all appearance-none text-center min-w-[200px]"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
              >
                  <option value="held">ACTIVE (PARKED)</option>
                  <option value="resumed">RESUMED</option>
                  <option value="completed">SETTLED</option>
                  <option value="cancelled">ABORTED</option>
              </select>
          </div>
      </div>

      {/* Main Grid Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {loading ? (
                [...Array(8)].map((_, i) => (
                    <div key={i} className="h-80 bg-slate-900/40 rounded-[48px] animate-pulse border border-white/5" />
                ))
            ) : activeTab === 'held' ? (
                bills.length === 0 ? (
                    <div className="col-span-full py-40 text-center opacity-20 group">
                        <History size={100} className="mx-auto mb-8 text-slate-500 group-hover:scale-110 transition-transform duration-700" />
                        <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-500">No active parkings recorded</h3>
                    </div>
                ) : (
                    bills.map(bill => (
                        <div key={bill.id} className="group relative bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[48px] border border-white/10 hover:border-amber-500/50 shadow-2xl transition-all duration-700 flex flex-col h-full overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="px-5 py-2 bg-amber-500/10 text-amber-500 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-amber-500/20">
                                    {bill.status}
                                </div>
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Clock size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{new Date(bill.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                            
                            <div className="flex-1 relative z-10">
                                <h4 className="font-black text-amber-500 text-[10px] tracking-[0.3em] uppercase mb-2">{bill.hold_no}</h4>
                                <h3 className="font-black text-white text-2xl leading-none mb-6 uppercase truncate">{bill.customer_name || 'Walk-in Member'}</h3>
                                <div className="p-6 bg-white/5 rounded-[32px] border border-white/5 transition-all group-hover:bg-white/10">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Exposure Value</p>
                                    <p className="text-3xl font-black text-white tracking-tighter tabular-nums">{formatCurrency(bill.grand_total)}</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 mt-10 relative z-10">
                                <button 
                                    onClick={() => handleResumeHeld(bill.uuid || bill.id)}
                                    className="flex-[2] bg-white text-slate-900 py-5 rounded-[28px] font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all active:scale-95 shadow-xl"
                                >
                                    Resume Protocol
                                </button>
                                <button 
                                    onClick={() => fetchBillDetails(bill)}
                                    className="flex-1 bg-white/5 text-white py-5 rounded-[28px] border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center"
                                >
                                    <Eye size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )
            ) : (
                tableSessions.length === 0 ? (
                    <div className="col-span-full py-40 text-center opacity-20 group">
                        <Grid3X3 size={100} className="mx-auto mb-8 text-slate-500 group-hover:scale-110 transition-transform duration-700" />
                        <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-500">No active dining sessions</h3>
                    </div>
                ) : (
                    tableSessions.map(session => (
                        <div key={session.id} className="group relative bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[48px] border border-amber-500/30 hover:border-amber-500 shadow-2xl transition-all duration-700 flex flex-col h-full overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="px-6 py-2 bg-amber-500 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-500/20">
                                    Terminal {session.table_no}
                                </div>
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Clock size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{new Date(session.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                            
                            <div className="flex-1 relative z-10">
                                <h4 className="font-black text-amber-500 text-[10px] tracking-[0.3em] uppercase mb-2">{session.session_no}</h4>
                                <h3 className="font-black text-white text-2xl leading-none mb-6 uppercase truncate">{session.customer_name || 'Guest Participant'}</h3>
                                <div className="flex items-center gap-4 p-5 bg-white/5 rounded-[28px] border border-white/5">
                                    <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-amber-500">
                                        <Utensils size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Lead Waiter</p>
                                        <p className="text-xs font-black text-slate-300 truncate">{session.waiter_name || 'Protocol Default'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => handleResumeTable(session.table_id)}
                                className="w-full mt-10 bg-amber-500 text-slate-900 py-6 rounded-[28px] font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all shadow-2xl shadow-amber-500/20 active:scale-95 relative z-10"
                            >
                                Open Session Protocol
                            </button>
                        </div>
                    ))
                )
            )}
        </div>
      </div>

      {/* Details Modal */}
      <AppModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={selectedBill?.hold_no || "Operational Details"}
        description=" Suspended transaction metadata and item log"
        size="lg"
      >
        {selectedBill && (
            <div className="space-y-10 py-6">
                <div className="bg-slate-900 rounded-[44px] p-10 border border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-3 text-amber-400">
                            <Activity size={18} />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Protocol Item Log</p>
                        </div>
                        
                        <div className="space-y-6 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                            {billItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center group/item bg-white/5 p-5 rounded-[28px] border border-transparent hover:border-white/10 transition-all">
                                    <div>
                                        <p className="text-sm font-black text-white uppercase tracking-tight">{item.item_name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black text-amber-500 uppercase px-2 py-0.5 bg-amber-500/10 rounded-lg">{item.qty} Unit(s)</span>
                                            <span className="text-[10px] font-bold text-slate-500">@ {formatCurrency(item.unit_price)}</span>
                                        </div>
                                    </div>
                                    <span className="text-lg font-black text-white tabular-nums tracking-tighter">{formatCurrency(item.total)}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="pt-10 border-t border-white/10 flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Quantum Final</p>
                                <span className="text-4xl font-black text-amber-500 tracking-tighter tabular-nums">{formatCurrency(selectedBill.grand_total)}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{selectedBill.order_type}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{selectedBill.customer_name || 'Walk-in'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-amber-600/5 rounded-full blur-[100px]" />
                </div>

                <div className="flex gap-6">
                    <button 
                        onClick={() => setShowDetailsModal(false)}
                        className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                        Abort
                    </button>
                    <button 
                        onClick={() => handleResumeHeld(selectedBill.uuid || selectedBill.id)}
                        className="flex-[2] py-6 bg-slate-900 text-white rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-2xl flex items-center justify-center gap-3"
                    >
                        Resume Order <ArrowRight size={18} />
                    </button>
                    <button 
                        onClick={handleQRPayment}
                        className="flex-1 py-6 bg-emerald-600 text-white rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-emerald-500 shadow-2xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3"
                    >
                        <Zap size={18} /> QR
                    </button>
                </div>
            </div>
        )}
      </AppModal>

      <PaymentQRModal 
            isOpen={showQRModal}
            onClose={() => setShowQRModal(false)}
            transactionData={qrTransactionData}
            onSuccess={() => {
                setShowQRModal(false);
                toast.success('Payment protocol verified!');
                fetchData();
            }}
        />
    </div>
  );
};

export default HeldBillsPage;
