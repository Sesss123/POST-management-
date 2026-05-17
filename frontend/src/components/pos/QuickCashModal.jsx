import React from 'react';
import { X, CircleDollarSign } from 'lucide-react';
import { AppModal, AppButton } from '../ui';
import { cn } from '../../utils/cn';

const QuickCashModal = ({ 
    isOpen, 
    onClose, 
    amount, 
    onConfirm, 
    processing 
}) => {
    const payableAmount = parseFloat(amount) || 0;

    const denominations = [
        { label: 'EXACT', value: payableAmount },
        { label: '+100', value: 100 },
        { label: '+500', value: 500 },
        { label: '+1000', value: 1000 }
    ];

    const calculateChange = (received) => {
        const change = received - payableAmount;
        return change >= 0 ? change : 0;
    };

    // Determine which denomination is the "suggested" one (closest higher value)
    const getSuggestedValue = () => {
        if (payableAmount <= 100) return 100;
        if (payableAmount <= 500) return 500;
        if (payableAmount <= 1000) return 1000;
        return null;
    };

    const suggested = getSuggestedValue();

    return (
        <AppModal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="QUICK CASH (NO RECEIPT)"
            size="md"
        >
            <div className="p-8 flex flex-col items-center text-center space-y-10">
                {/* Header Section */}
                <div className="w-full bg-emerald-50/50 rounded-[32px] p-8 border border-emerald-100/50 relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">Payable Amount</p>
                        <h3 className="text-5xl font-black text-slate-900 tracking-tight">
                            <span className="text-2xl mr-1">Rs.</span>
                            {payableAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                    </div>
                    {/* Decorative Background Element */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
                </div>

                {/* Quick Buttons Grid */}
                <div className="grid grid-cols-2 gap-4 w-full">
                    {denominations.map((denom) => {
                        const change = calculateChange(denom.value);
                        const isSuggested = denom.value === suggested && denom.label !== 'EXACT';
                        const isDisabled = denom.value < payableAmount && denom.label !== 'EXACT';

                        return (
                            <button
                                key={denom.label}
                                onClick={() => !isDisabled && onConfirm(denom.value)}
                                disabled={isDisabled || processing}
                                className={cn(
                                    "flex flex-col items-center justify-center p-8 rounded-[32px] border-2 transition-all duration-300 relative group",
                                    isSuggested 
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-lg shadow-emerald-100/50 scale-[1.02]" 
                                        : "bg-slate-50/50 border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-white",
                                    isDisabled && "opacity-40 cursor-not-allowed grayscale"
                                )}
                            >
                                <span className="text-xl font-black uppercase tracking-tight mb-1">{denom.label}</span>
                                <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest",
                                    isSuggested ? "text-emerald-500" : "text-slate-400"
                                )}>
                                    (Change: {change.toLocaleString()})
                                </span>
                                
                                {isSuggested && (
                                    <div className="absolute top-3 right-3 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="w-full pt-4">
                    <button 
                        onClick={onClose}
                        className="w-full py-6 rounded-[24px] bg-slate-50 text-slate-600 font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </AppModal>
    );
};

export default QuickCashModal;
