import React, { useState, useEffect } from 'react';
import { shiftApi } from '../api/api';
import { 
  Clock, 
  Unlock, 
  Lock, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  History,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Wallet
} from 'lucide-react';
import { AppButton, AppCard, FormInput, AppModal, useToast, StatusBadge } from '../components/ui';
import { cn } from '../utils/cn';

const ShiftPage = () => {
  const toast = useToast();
  const [currentShift, setCurrentShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Modals
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  
  // Form States
  const [openingCash, setOpeningCash] = useState(0);
  const [actualCash, setActualCash] = useState(0);
  const [movementType, setMovementType] = useState('cash_in');
  const [movementAmount, setMovementAmount] = useState(0);
  const [movementReason, setMovementReason] = useState('');

  useEffect(() => {
    fetchCurrentShift();
  }, []);

  const fetchCurrentShift = async () => {
    try {
      const { data } = await shiftApi.getCurrent();
      setCurrentShift(data.data);
    } catch (err) {
      setCurrentShift(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShift = async () => {
    setProcessing(true);
    try {
      await shiftApi.open({ opening_cash: openingCash });
      toast.success('Shift opened successfully');
      setShowOpenModal(false);
      fetchCurrentShift();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to open shift');
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseShift = async () => {
    setProcessing(true);
    try {
      await shiftApi.close({ actual_cash: actualCash });
      toast.success('Shift closed successfully');
      setShowCloseModal(false);
      fetchCurrentShift();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close shift');
    } finally {
      setProcessing(false);
    }
  };

  const handleRecordMovement = async () => {
    if (movementAmount <= 0) return toast.info('Amount must be greater than 0');
    setProcessing(true);
    try {
      await shiftApi.recordMovement({
        type: movementType,
        amount: movementAmount,
        reason: movementReason
      });
      toast.success('Cash movement recorded');
      setShowMovementModal(false);
      setMovementAmount(0);
      setMovementReason('');
      fetchCurrentShift();
    } catch (err) {
      toast.error('Failed to record movement');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading shift status...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
        <div className="flex items-center gap-4">
            <div className={cn(
                "w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg",
                currentShift ? "bg-emerald-50 text-emerald-600 shadow-emerald-100" : "bg-slate-50 text-slate-400 shadow-slate-100"
            )}>
                <Clock size={32} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Shift Management</h2>
                <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={currentShift ? 'active' : 'inactive'} text={currentShift ? 'Open' : 'Closed'} />
                    {currentShift && (
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Started: {new Date(currentShift.start_time).toLocaleString()}
                        </span>
                    )}
                </div>
            </div>
        </div>
        {!currentShift ? (
            <AppButton size="lg" icon={Unlock} onClick={() => setShowOpenModal(true)} className="px-8">Open New Shift</AppButton>
        ) : (
            <div className="flex gap-3">
                <AppButton variant="secondary" icon={ArrowUpCircle} onClick={() => {setMovementType('cash_in'); setShowMovementModal(true);}}>Cash In</AppButton>
                <AppButton variant="secondary" icon={ArrowDownCircle} onClick={() => {setMovementType('cash_out'); setShowMovementModal(true);}}>Cash Out</AppButton>
                <AppButton variant="danger" icon={Lock} onClick={() => setShowCloseModal(true)}>Close Shift</AppButton>
            </div>
        )}
      </div>

      {currentShift && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AppCard className="border-none shadow-lg bg-white p-6 flex flex-col gap-2">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-2">
                    <Wallet size={20} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opening Cash</p>
                <p className="text-2xl font-black text-slate-900">Rs. {parseFloat(currentShift.opening_cash).toLocaleString()}</p>
            </AppCard>

            <AppCard className="border-none shadow-lg bg-white p-6 flex flex-col gap-2">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-2">
                    <ArrowUpCircle size={20} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Cash</p>
                <p className="text-2xl font-black text-emerald-600">Rs. {parseFloat(currentShift.expected_cash || 0).toLocaleString()}</p>
            </AppCard>

            <AppCard className="border-none shadow-lg bg-white p-6 flex flex-col gap-2">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2">
                    <Calculator size={20} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sales</p>
                <p className="text-2xl font-black text-slate-900">Rs. {parseFloat(currentShift.total_sales || 0).toLocaleString()}</p>
            </AppCard>

            <AppCard className="border-none shadow-lg bg-white p-6 flex flex-col gap-2">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-2">
                    <History size={20} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                <p className="text-2xl font-black text-slate-900 uppercase">{currentShift.user_name}</p>
            </AppCard>
        </div>
      )}

      {/* Open Shift Modal */}
      <AppModal
        isOpen={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        title="Open Daily Shift"
      >
        <div className="space-y-6 py-4">
            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 text-center">
                <Wallet size={48} className="mx-auto text-indigo-300 mb-4" />
                <p className="text-sm font-bold text-indigo-900">Enter the initial cash amount in the drawer to start the shift.</p>
            </div>
            <FormInput 
                label="Opening Cash (Rs.)"
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="e.g. 5000"
            />
            <AppButton 
                variant="primary" 
                className="w-full py-4 shadow-lg shadow-indigo-100" 
                onClick={handleOpenShift}
                loading={processing}
            >
                START SHIFT
            </AppButton>
        </div>
      </AppModal>

      {/* Cash Movement Modal */}
      <AppModal
        isOpen={showMovementModal}
        onClose={() => setShowMovementModal(false)}
        title={movementType === 'cash_in' ? 'Record Cash In' : 'Record Cash Out'}
      >
        <div className="space-y-6 py-4">
            <FormInput 
                label="Amount (Rs.)"
                type="number"
                value={movementAmount}
                onChange={(e) => setMovementAmount(e.target.value)}
                placeholder="0.00"
            />
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason / Note</label>
                <textarea 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 h-24 resize-none"
                    placeholder="e.g. Petty cash for milk, Customer refund..."
                    value={movementReason}
                    onChange={(e) => setMovementReason(e.target.value)}
                />
            </div>
            <AppButton 
                variant="primary" 
                className="w-full py-4" 
                onClick={handleRecordMovement}
                loading={processing}
            >
                RECORD MOVEMENT
            </AppButton>
        </div>
      </AppModal>

      {/* Close Shift Modal */}
      <AppModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Close Shift & Handover"
        size="lg"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-4">
            <div className="space-y-6">
                <div className="p-6 bg-slate-900 text-white rounded-[32px] space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/10 pb-2">Shift Statistics</h4>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Opening Cash</span>
                        <span className="font-bold">Rs. {parseFloat(currentShift?.opening_cash || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Cash Sales</span>
                        <span className="font-bold">Rs. {parseFloat(currentShift?.cash_sales || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Cash In/Out (Net)</span>
                        <span className={cn("font-bold", currentShift?.net_movements < 0 ? "text-rose-400" : "text-emerald-400")}>
                            {currentShift?.net_movements < 0 ? '-' : '+'} Rs. {Math.abs(currentShift?.net_movements || 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Expected in Drawer</p>
                            <p className="text-2xl font-black text-emerald-400">Rs. {parseFloat(currentShift?.expected_cash || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-amber-50 rounded-[32px] border border-amber-100 flex gap-4">
                    <AlertCircle className="text-amber-600 shrink-0" size={24} />
                    <p className="text-xs font-bold text-amber-900 leading-relaxed">
                        Please count the physical cash in your drawer carefully. Any difference will be logged as a discrepancy.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Actual Cash in Drawer</label>
                    <input 
                        type="number" 
                        value={actualCash}
                        onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] p-6 text-3xl font-black text-slate-900 outline-none focus:border-indigo-600 transition-all text-center"
                        placeholder="0.00"
                    />
                </div>

                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Difference</p>
                        <p className={cn(
                            "text-xl font-black",
                            (actualCash - (currentShift?.expected_cash || 0)) === 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                            Rs. {(actualCash - (currentShift?.expected_cash || 0)).toLocaleString()}
                        </p>
                    </div>
                    {(actualCash - (currentShift?.expected_cash || 0)) === 0 ? (
                        <CheckCircle2 size={32} className="text-emerald-600" />
                    ) : (
                        <AlertCircle size={32} className="text-rose-600" />
                    )}
                </div>

                <AppButton 
                    variant="primary" 
                    className="w-full py-5 rounded-3xl uppercase tracking-widest font-black shadow-xl shadow-indigo-100" 
                    onClick={handleCloseShift}
                    loading={processing}
                >
                    FINALIZE & CLOSE SHIFT
                </AppButton>
            </div>
        </div>
      </AppModal>
    </div>
  );
};

export default ShiftPage;
