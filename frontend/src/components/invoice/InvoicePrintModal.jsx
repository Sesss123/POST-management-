import React, { useState } from 'react';
import { Printer, FileText, Smartphone, X, Download, RotateCcw } from 'lucide-react';
import { AppModal, AppButton } from '../ui';
import A4InvoiceTemplate from './A4InvoiceTemplate';
import ThermalReceiptTemplate from './ThermalReceiptTemplate';
import { cn } from '../../utils/cn';
import { invoiceApi } from '../../api/api';
import { useToast } from '../ui';

const InvoicePrintModal = ({ isOpen, onClose, invoice, onRestore, autoPrint = true }) => {
  const [printMode, setPrintMode] = useState('thermal'); // 'thermal' or 'a4'
  const [voiding, setVoiding] = useState(false);
  const toast = useToast();

  React.useEffect(() => {
    if (isOpen && autoPrint && invoice) {
      const timer = setTimeout(() => {
        // window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, invoice]);

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

  return (
    <AppModal
        isOpen={isOpen}
        onClose={onClose}
        title="Invoice Details"
        size="lg"
    >
      <div className="space-y-6">
        {/* Actions Bar (Top) */}
        <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm">
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
                    disabled={voiding}
                    size="sm"
                    className="flex-1 sm:flex-none h-10 px-4 rounded-xl text-[10px]"
                    icon={RotateCcw}
                >
                    {voiding ? 'WAIT...' : 'EDIT'}
                </AppButton>
                <AppButton 
                    variant="success" 
                    size="sm"
                    className="flex-1 sm:flex-none h-10 px-6 rounded-xl text-[10px] shadow-emerald-100" 
                    icon={Printer} 
                    onClick={handlePrint}
                    disabled={voiding}
                >
                    PRINT
                </AppButton>
            </div>
        </div>

        {/* Preview Area */}
        <div className="no-print flex justify-center bg-slate-50 p-6 rounded-[32px] border-2 border-dashed border-slate-200 items-start overflow-x-auto custom-scrollbar min-h-[500px]">
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

        {/* Actual Print Content (Visible only during print) */}
        <div className="print-only fixed inset-0 z-[99999] bg-white overflow-visible">
            {printMode === 'thermal' ? (
                <ThermalReceiptTemplate invoice={invoice} />
            ) : (
                <div className="bg-white min-h-screen">
                    <A4InvoiceTemplate invoice={invoice} />
                </div>
            )}
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
                size: ${printMode === 'thermal' ? '80mm auto' : 'A4'};
            }
            }
        `}} />
      </div>
    </AppModal>

  );

};

export default InvoicePrintModal;
