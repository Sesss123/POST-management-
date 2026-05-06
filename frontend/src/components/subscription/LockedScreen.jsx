import React from 'react';
import { ShieldOff, Phone, Mail, RefreshCw } from 'lucide-react';

const LockedScreen = () => {
    const handleRefresh = () => window.location.reload();

    return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950 text-white p-8">
            {/* Animated background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-900/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center max-w-lg animate-in fade-in zoom-in-95 duration-700">
                {/* Icon */}
                <div className="relative mb-8">
                    <div className="w-28 h-28 rounded-[40px] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center rotate-3 shadow-2xl shadow-rose-900/40">
                        <ShieldOff size={52} className="text-rose-500" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full border-4 border-slate-950 shadow-lg shadow-rose-500/50" />
                </div>

                {/* Text */}
                <div className="space-y-4 mb-10">
                    <div>
                        <p className="text-[11px] font-black text-rose-500 uppercase tracking-[0.3em] mb-2">Account Status</p>
                        <h1 className="text-5xl font-black text-white tracking-tighter leading-none">
                            Account<br />Locked
                        </h1>
                    </div>
                    <p className="text-slate-400 text-base leading-relaxed max-w-sm">
                        Your restaurant account has been locked due to an overdue subscription. 
                        All operations are paused until the account is reactivated.
                    </p>
                </div>

                {/* Contact box */}
                <div className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-3 mb-8">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Contact Support to Unlock</p>
                    <a
                        href="tel:+94000000000"
                        className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group"
                    >
                        <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-600/30 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition-all">
                            <Phone size={18} className="text-indigo-400 group-hover:text-white" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-slate-500 font-bold">Call Support</p>
                            <p className="text-sm text-white font-bold">+94 000 000 000</p>
                        </div>
                    </a>
                    <a
                        href="mailto:support@restoledger.com"
                        className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group"
                    >
                        <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-600/30 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition-all">
                            <Mail size={18} className="text-indigo-400 group-hover:text-white" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-slate-500 font-bold">Email Support</p>
                            <p className="text-sm text-white font-bold">support@restoledger.com</p>
                        </div>
                    </a>
                </div>

                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-400 transition-colors text-xs font-bold uppercase tracking-widest"
                >
                    <RefreshCw size={14} />
                    Check Account Status
                </button>
            </div>

            {/* Footer */}
            <p className="absolute bottom-6 text-[10px] text-slate-700 font-bold tracking-widest uppercase">
                Powered by RestoLedger POS
            </p>
        </div>
    );
};

export default LockedScreen;
