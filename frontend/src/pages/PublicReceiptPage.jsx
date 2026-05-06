import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
    Receipt, 
    Calendar, 
    User, 
    Hash, 
    Phone, 
    MapPin, 
    ArrowLeft, 
    Download,
    CheckCircle2,
    Globe,
    CreditCard,
    Wallet,
    Info,
    Printer
} from 'lucide-react';
import { brandingApi } from '../api/api';
import { cn } from '../utils/cn';

const PublicReceiptPage = () => {
    const { uuid } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReceipt();
    }, [uuid]);

    const fetchReceipt = async () => {
        try {
            setLoading(true);
            const res = await brandingApi.getPublicReceipt(uuid);
            setInvoice(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Receipt not found');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Authenticating Receipt...</p>
                </div>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-[40px] p-12 text-center shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Info size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Access Denied</h2>
                    <p className="text-slate-400 mt-2 font-medium">{error || 'This receipt link is invalid or has expired.'}</p>
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                        Go to Homepage
                    </button>
                </div>
            </div>
        );
    }

    const theme = invoice.receipt_theme || 'classic';

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 p-4 sm:p-8 pb-20">
            <div className="max-w-xl mx-auto">
                {/* Header Actions */}
                <div className="flex items-center justify-between mb-8 px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                            <Receipt size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight uppercase">Digital Receipt</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Official Transaction Record</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => window.print()}
                        className="w-10 h-10 bg-white text-slate-900 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm border border-slate-100"
                    >
                        <Printer size={18} />
                    </button>
                </div>

                {/* Main Receipt Content */}
                <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                    {/* Top Branding Bar */}
                    <div className="bg-slate-900 p-8 text-center text-white relative">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
                        {invoice.receipt_logo_url ? (
                            <img src={invoice.receipt_logo_url} alt="Logo" className="h-16 mx-auto mb-4 object-contain" />
                        ) : (
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                                <Globe size={32} className="text-white/40" />
                            </div>
                        )}
                        <h2 className="text-2xl font-black tracking-tighter uppercase leading-tight">{invoice.receipt_restaurant_name || 'RESTOLEDGER POS'}</h2>
                        <div className="flex flex-col items-center gap-1 mt-3 text-indigo-300">
                            {invoice.receipt_restaurant_address && (
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-80">
                                    <MapPin size={12} />
                                    <span>{invoice.receipt_restaurant_address}</span>
                                </div>
                            )}
                            {invoice.receipt_restaurant_phone && (
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-80">
                                    <Phone size={12} />
                                    <span>{invoice.receipt_restaurant_phone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Receipt Body */}
                    <div className="p-8 sm:p-12">
                        {/* Status Label */}
                        <div className="flex justify-center mb-10">
                            <div className={cn(
                                "px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] border flex items-center gap-2",
                                invoice.payment_status === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                            )}>
                                <CheckCircle2 size={14} />
                                {invoice.payment_status === 'paid' ? 'Payment Successful' : 'Payment Failed'}
                            </div>
                        </div>

                        {/* Invoice Metadata */}
                        <div className="grid grid-cols-2 gap-8 mb-12 py-8 border-y border-slate-50">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Number</p>
                                <p className="text-sm font-black text-slate-900">{invoice.invoice_no}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</p>
                                <p className="text-sm font-black text-slate-900">{new Date(invoice.created_at).toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</p>
                                <p className="text-sm font-black text-slate-900">{invoice.customer_name || 'Guest'}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</p>
                                <p className="text-sm font-black text-slate-900 uppercase">{invoice.payment_method}</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="space-y-6 mb-12">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Order Summary</h3>
                                <div className="h-px bg-slate-50 flex-1 ml-4"></div>
                            </div>
                            
                            <div className="space-y-4">
                                {invoice.items?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between gap-4 group">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <h4 className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{item.item_name}</h4>
                                                <p className="text-sm font-black text-slate-900 ml-4">
                                                    {invoice.currency_symbol || 'Rs.'} {parseFloat(item.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{item.qty} × {invoice.currency_symbol || 'Rs.'} {parseFloat(item.unit_price).toLocaleString()}</span>
                                                {item.modifiers?.length > 0 && (
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">+ {item.modifiers.length} Modifiers</span>
                                                )}
                                            </div>
                                            {item.modifiers?.map((mod, midx) => (
                                                <p key={midx} className="text-[10px] text-slate-400 mt-1 italic pl-2 border-l-2 border-slate-100">
                                                    + {mod.name} ({invoice.currency_symbol || 'Rs.'} {parseFloat(mod.price_delta).toLocaleString()})
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="space-y-3 bg-slate-50 rounded-3xl p-8 border border-slate-100/50">
                            <div className="flex justify-between text-sm font-bold text-slate-500">
                                <span>Subtotal</span>
                                <span>{invoice.currency_symbol || 'Rs.'} {parseFloat(invoice.subtotal).toLocaleString()}</span>
                            </div>
                            
                            {parseFloat(invoice.discount) > 0 && (
                                <div className="flex justify-between text-sm font-bold text-rose-500">
                                    <span>Discount</span>
                                    <span>-{invoice.currency_symbol || 'Rs.'} {parseFloat(invoice.discount).toLocaleString()}</span>
                                </div>
                            )}

                            {parseFloat(invoice.service_charge_amount) > 0 && (
                                <div className="flex justify-between text-sm font-bold text-slate-500">
                                    <span>Service Charge ({invoice.service_charge_rate}%)</span>
                                    <span>{invoice.currency_symbol || 'Rs.'} {parseFloat(invoice.service_charge_amount).toLocaleString()}</span>
                                </div>
                            )}

                            {parseFloat(invoice.tax_amount) > 0 && (
                                <div className="flex justify-between text-sm font-bold text-slate-500">
                                    <span>{invoice.tax_name || 'Tax'} ({invoice.tax_rate}%)</span>
                                    <span>{invoice.currency_symbol || 'Rs.'} {parseFloat(invoice.tax_amount).toLocaleString()}</span>
                                </div>
                            )}

                            <div className="pt-4 mt-4 border-t border-slate-200 flex justify-between items-center">
                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Total Amount</span>
                                <span className="text-2xl font-black text-slate-900">
                                    {invoice.currency_symbol || 'Rs.'} {parseFloat(invoice.grand_total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        {/* Footer Message */}
                        <div className="mt-12 text-center">
                            <p className="text-xs text-slate-400 font-bold italic leading-relaxed px-8">
                                "{invoice.receipt_footer_message || 'Thank you for your visit. Hope to see you again soon!'}"
                            </p>
                            <div className="flex items-center justify-center gap-4 mt-8 opacity-20 grayscale">
                                <CreditCard size={20} />
                                <Wallet size={20} />
                                <Receipt size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Zigzag Bottom Edge (SVG) */}
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij48cGF0aCBkPSJNMCAwbDggOCA4LTh2MTZIMHoiIGZpbGw9IiNmOGZhZmMiLz48L3N2Zz4=')] bg-repeat-x"></div>
                </div>

                {/* Secure Badge */}
                <div className="mt-8 flex items-center justify-center gap-2 text-slate-400">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Verified Digital Receipt by RestoLedger</span>
                </div>
            </div>
        </div>
    );
};

export default PublicReceiptPage;
