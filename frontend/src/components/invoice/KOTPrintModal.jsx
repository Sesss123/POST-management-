import React from 'react';
import { Printer, X } from 'lucide-react';
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
      title="Print KOT"
      size="lg"
      className="max-h-[90vh] flex flex-col"
    >
      <div className="no-print flex-1 flex flex-col overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 bg-slate-800 p-8 overflow-y-auto custom-scrollbar flex justify-center">
            <div className="w-[80mm] transition-all transform origin-top shadow-2xl">
                <KOTTemplate kot={kot} />
            </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-white border-t border-slate-100 flex gap-4 shrink-0">
            <AppButton variant="secondary" className="flex-1" onClick={onClose}>
                Close
            </AppButton>
            <AppButton variant="primary" className="flex-[2] py-4 bg-orange-600 hover:bg-orange-700" icon={Printer} onClick={handlePrint}>
                Print KOT
            </AppButton>
        </div>
      </div>

      {/* Actual Print Content (Visible only during print) */}
      <div className="print-only fixed inset-0 z-[9999] bg-white overflow-visible">
          <KOTTemplate kot={kot} />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print, .modal-backdrop, .modal-container > div:not(.print-only) {
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
    </AppModal>
  );
};

export default KOTPrintModal;
