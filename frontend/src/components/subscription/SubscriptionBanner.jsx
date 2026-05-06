import React from 'react';
import { AlertTriangle, XCircle, CreditCard, ArrowRight } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { cn } from '../../utils/cn';

const SubscriptionBanner = () => {
    const { effectiveStatus, showBanner, daysUntilEnd, daysUntilGrace, subscriptionEndDate } = useSubscription();

    if (!showBanner || effectiveStatus === 'locked') return null;

    const endDateFormatted = subscriptionEndDate
        ? new Date(subscriptionEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : null;

    if (effectiveStatus === 'grace') {
        const daysLeft = daysUntilGrace ?? 7;
        return (
            <div className="relative w-full flex items-center gap-4 px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-400 animate-in slide-in-from-top duration-500">
                <AlertTriangle size={18} className="shrink-0 text-amber-400" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">
                        Subscription ended on {endDateFormatted}.
                        <span className="font-black ml-1">
                            {daysLeft > 0
                                ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining before features are restricted.`
                                : 'Restrictions apply soon.'
                            }
                        </span>
                    </p>
                </div>
                <button className="shrink-0 flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-amber-950 rounded-full text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all whitespace-nowrap">
                    <CreditCard size={12} />
                    Renew Now
                    <ArrowRight size={12} />
                </button>
            </div>
        );
    }

    if (effectiveStatus === 'restricted') {
        return (
            <div className="relative w-full flex items-center gap-4 px-6 py-3 bg-rose-500/10 border-b border-rose-500/30 text-rose-400 animate-in slide-in-from-top duration-500">
                <XCircle size={18} className="shrink-0 text-rose-500" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">
                        <span className="text-rose-300 font-black">Subscription Expired.</span>
                        {' '}Reports, Settings and User management are disabled. Billing and orders continue normally.
                    </p>
                </div>
                <button className="shrink-0 flex items-center gap-1.5 px-4 py-1.5 bg-rose-500 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-rose-400 transition-all whitespace-nowrap">
                    <CreditCard size={12} />
                    Renew Subscription
                </button>
            </div>
        );
    }

    if (effectiveStatus === 'trial') {
        const daysLeft = daysUntilEnd ?? 14;
        return (
            <div className="relative w-full flex items-center gap-4 px-6 py-3 bg-sky-500/10 border-b border-sky-500/20 text-sky-400 animate-in slide-in-from-top duration-500">
                <Clock size={18} className="shrink-0 text-sky-400" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">
                        Welcome to RestoLedger! Your trial is active.
                        <span className="font-black ml-1">
                            {daysLeft > 0
                                ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left.`
                                : 'Trial ends today.'
                            }
                        </span>
                    </p>
                </div>
                <button className="shrink-0 flex items-center gap-1.5 px-4 py-1.5 bg-sky-500 text-sky-950 rounded-full text-xs font-black uppercase tracking-widest hover:bg-sky-400 transition-all whitespace-nowrap">
                    <CreditCard size={12} />
                    View Plans
                </button>
            </div>
        );
    }

    return null;
};

export default SubscriptionBanner;
