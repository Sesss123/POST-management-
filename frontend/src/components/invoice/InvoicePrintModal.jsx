import React, { useState } from 'react';
import { Printer, FileText, Smartphone, X, Download, RotateCcw } from 'lucide-react';
import { AppModal, AppButton } from '../ui';
import A4InvoiceTemplate from './A4InvoiceTemplate';
import ThermalReceiptTemplate from './ThermalReceiptTemplate';
import { cn } from '../../utils/cn';
import { invoiceApi, kotApi } from '../../api/api';
import { useToast } from '../ui';
import { Utensils } from 'lucide-react';

const InvoicePrintModal = ({ isOpen, onClose, invoice, onRestore, autoPrint = true }) => {
  const [printMode, setPrintMode] = useState('thermal'); // 'thermal' or 'a4'
  const [voiding, setVoiding] = useState(false);
  const [sendingKOT, setSendingKOT] = useState(false);
  const toast = useToast();

  // Auto-print effect disabled as per user preference
  // React.useEffect(() => {
  //   if (isOpen && autoPrint && invoice) {
  //     const timer = setTimeout(() => {
  //       if (isOpen) {
  //           window.print();
  //       }
  //     }, 1000);
  //     return () => {
  //       clearTimeout(timer);
  //     };
  //   }
  // }, [isOpen, autoPrint, invoice]);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleVoidAndEdit = async () => {
    if (!window.confirm('This will delete current invoice and restore items to cart for editing. Continue?')) return;
    
    try {
        setVoiding(true);
        const { data } = await invoiceApi.voidInvoice(invoice.id);
        if (data.success) {
            toast.success('Invoice removed. Restoring cart...');
            if (onRestore) onRestore(data.data);
            onClose();
        }
    } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to void invoice');
    } finally {
        setVoiding(false);
    }
  };

  const handleSendKOT = async () => {
    try {
        setSendingKOT(true);
        const { data } = await kotApi.createFromInvoice(invoice.uuid || invoice.id);
        if (data.success) {
            toast.success('KOT sent to kitchen successfully!');
        }
    } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to send KOT. Maybe no kitchen items in this bill?');
    } finally {
        setSendingKOT(false);
    }
  };

  return (
    <AppModal
        isOpen={isOpen}
        onClose={onClose}
        title="Invoice Details"
        size="xl"
    >
      <div className="space-y-4">
        {/* Actions Bar - Always Visible (not hidden during print) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-sm no-print">
            <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200">
                <button
                    onClick={() => setPrintMode('thermal')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        printMode === 'thermal' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <Smartphone size={14} /> Thermal
                </button>
                <button
                    onClick={() => setPrintMode('a4')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        printMode === 'a4' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <FileText size={14} /> A4 Paper
                </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                <AppButton 
                    variant="warning"
                    onClick={handleVoidAndEdit}
                    disabled={voiding || sendingKOT}
                    size="sm"
                    className="flex-1 sm:flex-none h-10 px-4 rounded-xl text-[10px]"
                    icon={RotateCcw}
                >
                    {voiding ? 'WAIT...' : 'EDIT'}
                </AppButton>
                <AppButton 
                    variant="primary"
                    onClick={handleSendKOT}
                    loading={sendingKOT}
                    disabled={voiding}
                    size="sm"
                    className="flex-1 sm:flex-none h-10 px-4 rounded-xl text-[10px] bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                    icon={Utensils}
                >
                    SEND KOT
                </AppButton>
                <AppButton 
                    variant="success" 
                    size="sm"
                    className="flex-1 sm:flex-none h-10 px-6 rounded-xl text-[10px] shadow-emerald-100" 
                    icon={Printer} 
                    onClick={handlePrint}
                    disabled={voiding || sendingKOT}
                >
                    PRINT
                </AppButton>
            </div>
        </div>

        {/* Preview Area */}
        <div className="flex justify-center bg-slate-50 p-6 rounded-[32px] border-2 border-dashed border-slate-200 items-start overflow-x-auto custom-scrollbar min-h-[500px] print:hidden">
            <div className={cn(
                "bg-white shadow-2xl transition-all duration-300",
                printMode === 'thermal' ? "w-[80mm]" : "w-full max-w-[210mm]"
            )}>
                {printMode === 'thermal' ? (
                    <ThermalReceiptTemplate invoice={invoice} />
                ) : (
                    <A4InvoiceTemplate invoice={invoice} />
                )}
            </div>
        </div>

        <div className="flex gap-4 pt-6 border-t border-slate-100 no-print">
            <AppButton 
                variant="secondary" 
                className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest" 
                onClick={onClose}
            >
                Close
            </AppButton>
            <AppButton 
                variant="success" 
                className="flex-[2] py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-200" 
                icon={Printer}
                onClick={handlePrint}
                disabled={voiding || sendingKOT}
            >
                Print Invoice
            </AppButton>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              /* Hide everything by default */
              body * {
                visibility: hidden !important;
              }
              
              /* Only show our print container and its children */
              .print-only, .print-only * {
                visibility: visible !important;
              }

              .print-only {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: ${printMode === 'thermal' ? '80mm' : '100%'} !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
              }

              /* Hide action buttons and controls */
              .no-print {
                display: none !important;
              }

              /* Reset body for print */
              body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
                display: block !important;
                height: auto !important;
                overflow: visible !important;
              }

              @page {
                margin: 0;
                size: ${printMode === 'thermal' ? '80mm auto' : 'A4'};
                orientation: portrait;
              }
            }
        `}} />
      </div>
    </AppModal>

  );

};

export default InvoicePrintModal;
