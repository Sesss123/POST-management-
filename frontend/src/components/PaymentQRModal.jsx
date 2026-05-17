import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
    X, 
    RefreshCcw, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    Zap,
    Loader2
} from 'lucide-react';
import { AppModal, AppButton, useToast } from './ui';
import { gatewayPaymentApi } from '../api/api';
import { cn } from '../utils/cn';

const PaymentQRModal = ({ 
    isOpen, 
    onClose, 
    transactionData, 
    onSuccess, 
    onCancel 
}) => {
    const { addToast } = useToast();
    const [status, setStatus] = useState('pending'); // pending, paid, expired, cancelled, failed
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(false);
    const pollingInterval = useRef(null);

    useEffect(() => {
        if (isOpen && transactionData) {
            setStatus('pending');
            const expiry = new Date(transactionData.expires_at).getTime();
            const now = new Date().getTime();
            setTimeLeft(Math.max(0, Math.floor((expiry - now) / 1000)));

            // Start polling
            startPolling();
        } else {
            stopPolling();
        }

        return () => stopPolling();
    }, [isOpen, transactionData]);

    useEffect(() => {
        if (timeLeft > 0 && status === 'pending') {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && status === 'pending') {
            setStatus('expired');
            stopPolling();
        }
    }, [timeLeft, status]);

    const startPolling = () => {
        stopPolling();
        pollingInterval.current = setInterval(async () => {
            try {
                const { data } = await gatewayPaymentApi.getStatus(transactionData.transaction_uuid);
                if (data.data.status === 'paid') {
                    setStatus('paid');
                    stopPolling();
                    setTimeout(() => onSuccess(data.data), 2000);
                } else if (['failed', 'expired', 'cancelled'].includes(data.data.status)) {
                    setStatus(data.data.status);
                    stopPolling();
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        }, 3000);
    };

    const stopPolling = () => {
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
        }
    };

    const handleCancel = async () => {
        setLoading(true);
        try {
            await gatewayPaymentApi.cancel(transactionData.transaction_uuid);
            setStatus('cancelled');
            stopPolling();
            if (onCancel) onCancel();
            onClose();
        } catch (err) {
            addToast('Failed to cancel transaction', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const handleMockPaid = async () => {
        setLoading(true);
        try {
            await gatewayPaymentApi.mockMarkPaid(transactionData.transaction_uuid);
            addToast('Mock payment successful', 'success');
            // Polling will pick it up, or we can manually set it
        } catch (err) {
            addToast('Mock payment failed', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <AppModal 
            isOpen={isOpen} 
            onClose={status === 'pending' ? () => {} : onClose} 
            title="Scan QR to Pay"
            size="md"
        >
            <div className="p-8 flex flex-col items-center text-center space-y-6">
                {/* Header Info */}
                <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                        Rs. {transactionData?.amount?.toLocaleString()}
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Invoice: {transactionData?.invoice_no}
                    </p>
                </div>

                {/* QR Code Area */}
                <div className="relative group">
                    <div className={cn(
                        "p-6 bg-white rounded-[32px] border-4 transition-all duration-500",
                        status === 'pending' ? "border-indigo-100 group-hover:border-indigo-600 shadow-xl" : 
                        status === 'paid' ? "border-emerald-100 shadow-emerald-100" : "border-rose-100 shadow-rose-100"
                    )}>
                        {status === 'pending' ? (
                            <QRCodeSVG 
                                value={transactionData?.qr_payload || ''} 
                                size={200}
                                level="H"
                                includeMargin={false}
                                imageSettings={null}
                            />
                        ) : status === 'paid' ? (
                            <div className="w-[200px] h-[200px] flex flex-col items-center justify-center text-emerald-500 animate-in zoom-in duration-300">
                                <CheckCircle2 size={80} strokeWidth={3} />
                                <p className="mt-4 font-black uppercase tracking-widest text-sm">Payment Paid</p>
                            </div>
                        ) : (
                            <div className="w-[200px] h-[200px] flex flex-col items-center justify-center text-rose-500 animate-in zoom-in duration-300">
                                <AlertCircle size={80} strokeWidth={3} />
                                <p className="mt-4 font-black uppercase tracking-widest text-sm">{status.toUpperCase()}</p>
                            </div>
                        )}
                    </div>

                    {status === 'pending' && (
                        <div className="absolute -top-3 -right-3 px-3 py-1.5 bg-indigo-600 text-white rounded-full flex items-center gap-2 shadow-lg animate-bounce">
                            <Clock size={14} />
                            <span className="text-xs font-black">{formatTime(timeLeft)}</span>
                        </div>
                    )}
                </div>

                {/* Status Indicator */}
                <div className="w-full">
                    {status === 'pending' ? (
                        <div className="flex items-center justify-center gap-3 text-indigo-600 bg-indigo-50 py-3 rounded-2xl border border-indigo-100 animate-pulse">
                            <RefreshCcw size={18} className="animate-spin" />
                            <span className="text-xs font-black uppercase tracking-widest">Waiting for payment...</span>
                        </div>
                    ) : (
                        <div className={cn(
                            "py-3 rounded-2xl border text-xs font-black uppercase tracking-widest",
                            status === 'paid' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                        )}>
                            {status === 'paid' ? 'Transaction Successful' : `Transaction ${status}`}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 gap-3 w-full">
                    {status === 'pending' && (
                        <AppButton 
                            variant="danger" 
                            fullWidth 
                            onClick={handleCancel}
                            loading={loading}
                        >
                            Cancel Payment
                        </AppButton>
                    ) || (
                        <AppButton 
                            variant="secondary" 
                            fullWidth 
                            onClick={onClose}
                        >
                            Close
                        </AppButton>
                    )}

                    {/* Manual Verification Button */}
                    {status === 'pending' && (
                        <button 
                            onClick={handleMockPaid}
                            className="text-[11px] font-black text-emerald-600 uppercase hover:bg-emerald-50 transition-all py-3 rounded-2xl border-2 border-dashed border-emerald-200 mt-2 flex items-center justify-center gap-2 active:scale-95"
                        >
                            <CheckCircle2 size={16} />
                            Verify Manually (Cashier)
                        </button>
                    )}

                    {/* Mock Button - Visible only in dev/mock provider */}
                    {(status === 'pending' && process.env.NODE_ENV === 'development') && (
                        <button 
                            onClick={handleMockPaid}
                            className="text-[9px] font-black text-slate-300 uppercase hover:text-indigo-400 transition-colors py-1"
                        >
                            <Zap size={10} className="inline mr-1" />
                            Dev: Mock Success
                        </button>
                    )}
                </div>
            </div>
        </AppModal>
    );
};

export default PaymentQRModal;
