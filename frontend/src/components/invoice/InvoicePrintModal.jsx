import React, { useState } from 'react';
import { Printer, FileText, Smartphone, X, Download } from 'lucide-react';
import { AppModal, AppButton } from '../ui';
import A4InvoiceTemplate from './A4InvoiceTemplate';
import ThermalReceiptTemplate from './ThermalReceiptTemplate';
import { cn } from '../../utils/cn';

const InvoicePrintModal = ({ isOpen, onClose, invoice }) => {
  const [printMode, setPrintMode] = useState('thermal'); // 'thermal' or 'a4'

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Print Invoice"
      size="xl"
      className="max-h-[90vh] flex flex-col"
    >
      <div className="no-print flex-1 flex flex-col overflow-hidden">
        {/* Selection Tabs */}
        <div className="flex gap-4 p-6 bg-slate-50 border-b border-slate-100 shrink-0">
          <button
            onClick={() => setPrintMode('thermal')}
            className={cn(
              "flex-1 flex flex-col items-center gap-3 p-6 rounded-[32px] border-2 transition-all",
              printMode === 'thermal' 
                ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200" 
                : "bg-white border-transparent text-slate-500 hover:border-slate-200 shadow-sm"
            )}
          >
            <Smartphone size={32} />
            <div>
              <p className="font-black uppercase tracking-widest text-[10px]">80mm Format</p>
              <h4 className="font-bold text-lg">Thermal Receipt</h4>
            </div>
          </button>

          <button
            onClick={() => setPrintMode('a4')}
            className={cn(
              "flex-1 flex flex-col items-center gap-3 p-6 rounded-[32px] border-2 transition-all",
              printMode === 'a4' 
                ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200" 
                : "bg-white border-transparent text-slate-500 hover:border-slate-200 shadow-sm"
            )}
          >
            <FileText size={32} />
            <div>
              <p className="font-black uppercase tracking-widest text-[10px]">Standard Format</p>
              <h4 className="font-bold text-lg">A4 Invoice</h4>
            </div>
          </button>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-slate-200 p-8 overflow-y-auto custom-scrollbar flex justify-center">
            <div className={cn(
                "transition-all transform origin-top",
                printMode === 'thermal' ? "w-[80mm]" : "w-[210mm]"
            )}>
                {printMode === 'thermal' ? (
                    <ThermalReceiptTemplate invoice={invoice} />
                ) : (
                    <A4InvoiceTemplate invoice={invoice} />
                )}
            </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-white border-t border-slate-100 flex gap-4 shrink-0">
            <AppButton variant="secondary" className="flex-1" onClick={onClose}>
                Close
            </AppButton>
            <AppButton variant="primary" className="flex-[2] py-4" icon={Printer} onClick={handlePrint}>
                Print Invoice
            </AppButton>
        </div>
      </div>

      {/* Actual Print Content (Visible only during print) */}
      <div className="print-only fixed inset-0 z-[9999] bg-white overflow-visible">
          {printMode === 'thermal' ? (
              <ThermalReceiptTemplate invoice={invoice} />
          ) : (
              <div className="bg-white min-h-screen">
                  <A4InvoiceTemplate invoice={invoice} />
              </div>
          )}
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
            size: ${printMode === 'thermal' ? '80mm auto' : 'A4'};
          }
        }
      `}} />
    </AppModal>
  );
};

export default InvoicePrintModal;
