import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { heldBillApi } from '../api/api';
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
  User,
  Phone,
  FileText,
  History,
  CheckCircle,
  X,
  AlertCircle
} from 'lucide-react';
import { AppButton, AppCard, AppModal, useToast, StatusBadge } from '../components/ui';
import { cn } from '../utils/cn';

const HeldBillsPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('held');
  
  const [selectedBill, setSelectedBill] = useState(null);
  const [billItems, setBillItems] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBills();
  }, [statusFilter]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const { data } = await heldBillApi.getAll({ status: statusFilter, search });
      setBills(data.data);
    } catch (err) {
      toast.error('Failed to load parked bills');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
      if (e.key === 'Enter') fetchBills();
  };

  const fetchBillDetails = async (bill) => {
      setSelectedBill(bill);
      setProcessing(true);
      try {
          const { data } = await heldBillApi.getDetails(bill.uuid || bill.id);
          setBillItems(data.data.items);
          setShowDetailsModal(true);
      } catch (err) {
          toast.error('Failed to load bill items');
      } finally {
          setProcessing(false);
      }
  };

  const handleResume = (id) => {
      // We'll use localStorage to pass the resume ID to CashSalePage
      localStorage.setItem('resume_held_bill_id', id);
      navigate('/cash-sale');
  };

  const handleCancelBill = async () => {
    if (!cancelReason) return toast.info('Reason is required');
    setProcessing(true);
    try {
      await heldBillApi.cancel(selectedBill.uuid || selectedBill.id, cancelReason);
      toast.success('Bill cancelled successfully');
      setShowCancelModal(false);
      setShowDetailsModal(false);
      setCancelReason('');
      fetchBills();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel bill');
    } finally {
      setProcessing(false);
    }
  };

  const statusColors = {
      held: 'bg-amber-100 text-amber-700',
      resumed: 'bg-indigo-100 text-indigo-700',
      completed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-rose-100 text-rose-700'
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 lg:p-10 rounded-[32px] lg:rounded-[48px] shadow-xl border border-slate-100">
        <div className="flex items-center gap-4 lg:gap-6">
            <div className="w-12 h-12 lg:w-20 lg:h-20 bg-amber-50 text-amber-600 rounded-[20px] lg:rounded-[32px] flex items-center justify-center shadow-lg shadow-amber-100/50">
                <PauseCircle size={window.innerWidth > 1024 ? 40 : 24} />
            </div>
            <div>
                <h2 className="text-xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight">Parked Bills</h2>
                <p className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Temporary cart management system</p>
            </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative group flex-1 sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Search Hold No, Name..." 
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3 pl-12 pr-4 text-slate-900 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-sm text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleSearch}
                />
            </div>
            <select 
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none cursor-pointer hover:bg-slate-800 transition-colors"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
                <option value="held">Held (Active)</option>
                <option value="resumed">Resumed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="all">All Status</option>
            </select>
        </div>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {loading ? (
            [...Array(8)].map((_, i) => (
                <div key={i} className="h-64 bg-white rounded-[32px] animate-pulse border border-slate-100 shadow-sm"></div>
            ))
        ) : bills.length === 0 ? (
            <div className="col-span-full py-24 text-center opacity-20">
                <History size={80} className="mx-auto mb-6" />
                <h3 className="text-2xl font-black uppercase tracking-tighter">No records found</h3>
                <p className="text-sm font-bold uppercase tracking-widest mt-2">Try changing filters or search terms</p>
            </div>
        ) : (
            bills.map(bill => (
                <div 
                    key={bill.id} 
                    className={cn(
                        "bg-white p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] border-2 transition-all group relative overflow-hidden flex flex-col h-full",
                        bill.status === 'held' || bill.status === 'resumed' ? "border-transparent shadow-lg hover:shadow-2xl hover:border-indigo-600" : "border-slate-50 opacity-70 grayscale shadow-sm"
                    )}
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest", statusColors[bill.status])}>
                            {bill.status}
                        </div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">
                            {new Date(bill.created_at).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="flex-1">
                        <h4 className="font-black text-indigo-600 text-xs tracking-widest uppercase mb-1">{bill.hold_no}</h4>
                        <h3 className="font-black text-slate-900 text-xl leading-tight mb-3 uppercase truncate">{bill.customer_name || 'Walk-in Customer'}</h3>
                        
                        <div className="space-y-2 mb-6">
                            {bill.customer_phone && (
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Phone size={12} />
                                    <span className="text-[10px] font-bold tracking-widest">{bill.customer_phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-slate-400">
                                <Clock size={12} />
                                <span className="text-[10px] font-bold tracking-widest">
                                    {new Date(bill.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-end pt-4 border-t border-slate-50">
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Amount</p>
                            <p className="text-2xl font-black text-slate-900 leading-none tracking-tighter">Rs. {parseFloat(bill.grand_total).toLocaleString()}</p>
                        </div>
                        <AppButton 
                            variant="secondary" 
                            size="sm" 
                            className="p-3 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"
                            onClick={() => fetchBillDetails(bill)}
                        >
                            <Eye size={18} />
                        </AppButton>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* Bill Details Modal */}
      <AppModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={selectedBill?.hold_no || "Bill Details"}
        size="lg"
      >
        {selectedBill && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-4">
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 lg:p-8 rounded-[32px] space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                <Receipt size={28} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight leading-tight">{selectedBill.customer_name}</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedBill.hold_no}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Cart Items</p>
                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                {billItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center gap-4">
                                        <div className="flex-1">
                                            <p className="text-xs font-black text-slate-800 uppercase leading-tight">{item.item_name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Qty: {item.qty} × Rs. {parseFloat(item.unit_price).toLocaleString()}</p>
                                        </div>
                                        <span className="text-xs font-black text-slate-900 whitespace-nowrap">Rs. {parseFloat(item.total).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t-2 border-dashed border-slate-200 flex justify-between items-center">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Final Total</span>
                            <span className="text-2xl font-black text-indigo-600">Rs. {parseFloat(selectedBill.grand_total).toLocaleString()}</span>
                        </div>
                    </div>

                    {selectedBill.note && (
                        <div className="p-6 bg-indigo-50 rounded-[24px] border border-indigo-100">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <FileText size={12} /> Note
                            </p>
                            <p className="text-sm font-bold text-indigo-900 leading-relaxed italic">"{selectedBill.note}"</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex-1 space-y-4">
                        <div className="p-6 bg-white border-2 border-slate-100 rounded-[32px] space-y-4">
                             <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <History size={16} className="text-indigo-600" /> Audit Trail
                             </h4>
                             <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Created by {selectedBill.created_by_name} at {new Date(selectedBill.created_at).toLocaleTimeString()}</p>
                                </div>
                                {selectedBill.resumed_at && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Resumed at {new Date(selectedBill.resumed_at).toLocaleTimeString()}</p>
                                    </div>
                                )}
                                {selectedBill.status === 'completed' && (
                                     <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-600" />
                                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                                            Completed <CheckCircle size={12} />
                                        </p>
                                    </div>
                                )}
                                {selectedBill.status === 'cancelled' && (
                                     <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                                        <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Cancellation Reason</p>
                                        <p className="text-xs font-bold text-rose-900 italic">{selectedBill.cancel_reason}</p>
                                    </div>
                                )}
                             </div>
                        </div>

                        {selectedBill.status === 'completed' && selectedBill.invoice_id && (
                             <AppButton 
                                variant="secondary" 
                                className="w-full py-5 rounded-3xl" 
                                icon={Printer}
                                onClick={() => navigate(`/reports/daily-sales?invoice_id=${selectedBill.invoice_id}`)}
                            >
                                View Linked Invoice
                            </AppButton>
                        )}
                    </div>

                    {(selectedBill.status === 'held' || selectedBill.status === 'resumed') && (
                        <div className="space-y-3 pt-6 border-t border-slate-100">
                            <AppButton 
                                variant="primary" 
                                className="w-full py-6 rounded-[32px] text-lg shadow-xl shadow-indigo-200" 
                                icon={ArrowRight}
                                onClick={() => handleResume(selectedBill.uuid || selectedBill.id)}
                            >
                                Resume To Cart
                            </AppButton>
                            <button 
                                onClick={() => setShowCancelModal(true)}
                                className="w-full py-3 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] hover:text-rose-700 transition-colors"
                            >
                                Cancel This Bill
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}
      </AppModal>

      {/* Cancel Modal */}
      <AppModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Parked Bill"
      >
        <div className="space-y-6 py-4">
            <div className="p-5 bg-rose-50 rounded-[24px] border border-rose-100 flex gap-4 items-center">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm">
                    <AlertCircle size={24} />
                </div>
                <p className="text-xs font-bold text-rose-900 leading-snug">Are you sure you want to cancel this bill? This action will be permanently logged and cannot be undone.</p>
            </div>
            
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cancellation Reason <span className="text-rose-500">*</span></label>
                <textarea 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] p-5 text-sm font-bold text-slate-900 outline-none focus:border-rose-500 h-32 resize-none transition-all"
                    placeholder="e.g. Order cancelled by customer, mistake in items..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                />
            </div>

            <div className="flex gap-4">
                <AppButton variant="secondary" className="flex-1 py-4 rounded-2xl" onClick={() => setShowCancelModal(false)}>Keep Bill</AppButton>
                <AppButton 
                    variant="danger" 
                    className="flex-[2] py-4 rounded-2xl shadow-lg shadow-rose-100" 
                    onClick={handleCancelBill} 
                    loading={processing}
                    disabled={!cancelReason}
                >
                    Confirm Cancellation
                </AppButton>
            </div>
        </div>
      </AppModal>
    </div>
  );
};

export default HeldBillsPage;
