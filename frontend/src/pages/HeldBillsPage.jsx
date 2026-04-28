import React, { useState, useEffect } from 'react';
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
  Receipt
} from 'lucide-react';
import { AppButton, AppCard, AppModal, useToast, StatusBadge } from '../components/ui';
import { cn } from '../utils/cn';

const HeldBillsPage = () => {
  const toast = useToast();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [selectedBill, setSelectedBill] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const { data } = await heldBillApi.getAll();
      setBills(data.data);
    } catch (err) {
      toast.error('Failed to load parked bills');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBill = async () => {
    if (!cancelReason) return toast.info('Reason is required');
    setProcessing(true);
    try {
      await heldBillApi.cancel(selectedBill.id, cancelReason);
      toast.success('Bill cancelled');
      setShowCancelModal(false);
      setCancelReason('');
      fetchBills();
    } catch (err) {
      toast.error('Failed to cancel bill');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteBill = async (paymentMethod) => {
    setProcessing(true);
    try {
      await heldBillApi.complete(selectedBill.id, { payment_method: paymentMethod });
      toast.success('Bill completed successfully');
      setShowDetailsModal(false);
      fetchBills();
    } catch (err) {
      toast.error('Failed to complete bill');
    } finally {
      setProcessing(false);
    }
  };

  const filteredBills = bills.filter(b => 
    b.reference_name.toLowerCase().includes(search.toLowerCase()) ||
    b.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-[24px] flex items-center justify-center shadow-lg shadow-amber-100">
                <PauseCircle size={32} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Parked Bills</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage held/parked cash sales</p>
            </div>
        </div>
        <div className="relative group w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
                type="text" 
                placeholder="Search reference name..." 
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3 pl-12 pr-4 text-slate-900 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
            [...Array(8)].map((_, i) => (
                <div key={i} className="h-48 bg-white rounded-[32px] animate-pulse border border-slate-100"></div>
            ))
        ) : filteredBills.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-20">
                <PauseCircle size={64} className="mx-auto mb-4" />
                <h3 className="text-xl font-black uppercase">No parked bills found</h3>
            </div>
        ) : (
            filteredBills.map(bill => (
                <button 
                    key={bill.id} 
                    onClick={() => {setSelectedBill(bill); setShowDetailsModal(true);}}
                    className={cn(
                        "bg-white p-8 rounded-[40px] border-2 text-left transition-all group relative overflow-hidden shadow-lg",
                        bill.status === 'held' ? "border-transparent hover:border-indigo-600 hover:shadow-2xl" : "border-slate-100 grayscale opacity-60"
                    )}
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            <Clock size={24} />
                        </div>
                        <StatusBadge status={bill.status === 'held' ? 'active' : 'inactive'} text={bill.status} />
                    </div>
                    <h4 className="font-black text-slate-900 text-lg leading-tight mb-2 uppercase tracking-tight">{bill.reference_name}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                        {new Date(bill.created_at).toLocaleDateString()} at {new Date(bill.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="flex justify-between items-end">
                        <span className="text-2xl font-black text-indigo-600">Rs. {parseFloat(bill.subtotal).toLocaleString()}</span>
                        <Eye size={20} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </div>
                </button>
            ))
        )}
      </div>

      {/* Bill Details Modal */}
      <AppModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Parked Bill Details"
        size="lg"
      >
        {selectedBill && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-4">
                <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-[32px] space-y-4">
                        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                            <PauseCircle className="text-amber-500" size={24} />
                            <div>
                                <h4 className="font-black text-slate-900 uppercase tracking-tight">{selectedBill.reference_name}</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase">Created: {new Date(selectedBill.created_at).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {/* Assuming bill items come from a separate fetch or joined */}
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Items</p>
                            <p className="text-xs font-bold text-slate-500 italic">Load detailed items here...</p>
                        </div>
                        <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Total Value</span>
                            <span className="text-2xl font-black text-indigo-600">Rs. {parseFloat(selectedBill.subtotal).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {selectedBill.status === 'held' ? (
                        <>
                            <div className="grid grid-cols-1 gap-3">
                                <AppButton 
                                    variant="primary" 
                                    className="py-5 rounded-3xl" 
                                    icon={CheckCircle2} 
                                    onClick={() => handleCompleteBill('cash')}
                                    loading={processing}
                                >
                                    Quick Cash Checkout
                                </AppButton>
                                <AppButton 
                                    variant="secondary" 
                                    className="py-5 rounded-3xl" 
                                    icon={Receipt}
                                    onClick={() => handleCompleteBill('card')}
                                    loading={processing}
                                >
                                    Quick Card Checkout
                                </AppButton>
                            </div>
                            <div className="pt-6 border-t border-slate-100">
                                <AppButton 
                                    variant="danger" 
                                    className="w-full py-4 rounded-2xl" 
                                    icon={Trash2}
                                    onClick={() => setShowCancelModal(true)}
                                >
                                    Cancel Bill
                                </AppButton>
                            </div>
                        </>
                    ) : (
                        <div className="p-6 bg-rose-50 rounded-[32px] border border-rose-100 flex flex-col gap-2">
                            <AlertCircle className="text-rose-500" size={32} />
                            <h4 className="font-black text-rose-900 uppercase">Bill {selectedBill.status}</h4>
                            {selectedBill.cancel_reason && (
                                <p className="text-sm font-bold text-rose-700 italic">Reason: {selectedBill.cancel_reason}</p>
                            )}
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
            <div className="p-4 bg-rose-50 rounded-2xl flex gap-3 items-center">
                <AlertCircle className="text-rose-500" size={24} />
                <p className="text-xs font-bold text-rose-900">Are you sure you want to cancel this bill? This action will be logged.</p>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cancellation Reason</label>
                <textarea 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:border-rose-500 h-32 resize-none"
                    placeholder="e.g. Order mistake, Customer changed mind..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                />
            </div>
            <div className="flex gap-4">
                <AppButton variant="secondary" className="flex-1" onClick={() => setShowCancelModal(false)}>Back</AppButton>
                <AppButton variant="danger" className="flex-[2]" onClick={handleCancelBill} loading={processing}>Confirm Cancel</AppButton>
            </div>
        </div>
      </AppModal>
    </div>
  );
};

export default HeldBillsPage;
