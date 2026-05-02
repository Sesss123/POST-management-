import React from 'react';
import { Printer, X, ChefHat } from 'lucide-react';
import { AppModal, AppButton } from '../ui';
import KOTTemplate from './KOTTemplate';

const KOTPrintModal = ({ isOpen, onClose, kot }) => {
  if (!kot) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Kitchen Order Ticket"
      size="lg"
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="no-print flex items-center justify-between gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                    <ChefHat size={20} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">KOT Preview</p>
                    <p className="text-sm font-black text-slate-900 uppercase">Token: {kot.kot_no}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <AppButton variant="secondary" size="sm" onClick={onClose} className="h-10 px-4 rounded-xl text-[10px]">
                    CLOSE
                </AppButton>
                <AppButton 
                    variant="primary" 
                    size="sm" 
                    className="h-10 px-6 rounded-xl text-[10px] bg-orange-600 hover:bg-orange-700 shadow-orange-100" 
                    icon={Printer} 
                    onClick={handlePrint}
                >
                    PRINT KOT
                </AppButton>
            </div>
        </div>

        {/* Preview Area */}
        <div className="no-print flex justify-center bg-slate-900 p-8 rounded-[40px] shadow-inner items-start overflow-y-auto max-h-[60vh] custom-scrollbar">
            <div className="w-[80mm] bg-white shadow-2xl transition-all duration-300">
                <KOTTemplate kot={kot} />
            </div>
        </div>

        {/* Actual Print Content (Visible only during print) */}
        <div className="print-only fixed inset-0 z-[99999] bg-white overflow-visible">
            <KOTTemplate kot={kot} />
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            .print-only {
                display: none !important;
            }
            @media print {
            .no-print, .modal-backdrop, .modal-container, header, nav, aside {
                display: none !important;
            }
            .print-only {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            body {
                visibility: hidden;
                background: white !important;
            }
            .print-only, .print-only * {
                visibility: visible;
            }
            @page {
                margin: 0;
                size: 80mm auto;
            }
            }
        `}} />
      </div>
    </AppModal>


  );
};

export default KOTPrintModal;
