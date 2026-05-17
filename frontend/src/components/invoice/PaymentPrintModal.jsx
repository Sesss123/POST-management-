import React, { useRef } from 'react';
import { AppModal, AppButton } from '../ui';
import { Printer, CheckCircle2 } from 'lucide-react';
import PaymentReceiptTemplate from './PaymentReceiptTemplate';

const PaymentPrintModal = ({ isOpen, onClose, payment, settings }) => {
  const printRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  if (!payment) return null;

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Success"
      size="md"
    >
      <div className="flex flex-col items-center py-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
            <CheckCircle2 size={32} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Payment Recorded</h3>
        <p className="text-slate-500 mb-8 font-medium">Customer balance has been updated successfully.</p>

        {/* Receipt Preview */}
        <div className="w-full bg-slate-50 p-6 rounded-[32px] border-2 border-slate-100 mb-8 overflow-hidden">
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar bg-white shadow-inner p-4 rounded-xl border border-slate-200">
                <PaymentReceiptTemplate payment={payment} settings={settings} />
            </div>
        </div>

        <div className="flex gap-4 w-full">
            <AppButton 
                variant="secondary" 
                className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest" 
                onClick={onClose}
            >
                Done
            </AppButton>
            <AppButton 
                variant="primary" 
                className="flex-[2] py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200" 
                icon={Printer}
                onClick={handlePrint}
            >
                Print Receipt
            </AppButton>
        </div>
      </div>
    </AppModal>
  );
};

export default PaymentPrintModal;
