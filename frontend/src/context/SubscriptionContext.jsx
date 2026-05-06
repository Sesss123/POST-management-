import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext();

// Features blocked per subscription state
const RESTRICTED_FEATURES = new Set([
    'reports', 'analytics', 'settings_write', 'users_write',
    'promotions', 'backups', 'purchases', 'suppliers',
    'combos', 'modifiers', 'audit-logs', 'business-intelligence'
]);

/**
 * Compute effective subscription status from dates (mirrors server-side logic)
 * so the frontend can update banners without a round-trip.
 */
const resolveEffectiveStatus = (user) => {
    if (!user || user.role === 'super_admin') return 'active';
    
    // Manual Overrides
    if (user.subscriptionStatus === 'suspended')  return 'suspended';
    if (user.subscriptionStatus === 'cancelled')  return 'cancelled';
    if (user.subscriptionStatus === 'locked')     return 'locked';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate   = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null;
    const graceDate = user.gracePeriodUntil ? new Date(user.gracePeriodUntil) : null;
    const trialDate = user.trialEndsAt ? new Date(user.trialEndsAt) : null;

    // 1. Trial Handling
    if (user.subscriptionStatus === 'trial') {
        if (trialDate && today <= trialDate) return 'trial';
        if (!endDate) return 'restricted';
    }

    // 2. Paid Subscription Handling
    if (endDate) {
        if (today <= endDate) return 'active';
        if (graceDate && today <= graceDate) return 'grace';
        return 'restricted';
    }

    // Default
    return 'trial';
};

export const SubscriptionProvider = ({ children }) => {
    const { user } = useAuth();

    const effectiveStatus = useMemo(() => resolveEffectiveStatus(user), [user]);

    const daysUntilEnd = useMemo(() => {
        const targetDate = user?.subscriptionStatus === 'trial' ? user?.trialEndsAt : user?.subscriptionEndDate;
        if (!targetDate) return null;
        return Math.ceil((new Date(targetDate) - new Date()) / (1000 * 60 * 60 * 24));
    }, [user?.subscriptionEndDate, user?.trialEndsAt, user?.subscriptionStatus]);

    const daysUntilGrace = useMemo(() => {
        if (!user?.gracePeriodUntil) return null;
        return Math.ceil((new Date(user.gracePeriodUntil) - new Date()) / (1000 * 60 * 60 * 24));
    }, [user?.gracePeriodUntil]);

    /**
     * Returns true if the given feature key is blocked at current subscription state.
     */
    const isFeatureBlocked = (featureKey) => {
        if (effectiveStatus === 'locked' || effectiveStatus === 'suspended') return true;
        if (effectiveStatus === 'restricted') return RESTRICTED_FEATURES.has(featureKey);
        return false;
    };

    const isLocked     = effectiveStatus === 'locked';
    const isSuspended  = effectiveStatus === 'suspended';
    const isRestricted = effectiveStatus === 'restricted';
    const isGrace      = effectiveStatus === 'grace';
    const isTrial      = effectiveStatus === 'trial';
    const isActive     = effectiveStatus === 'active';
    
    // Show banner for non-active states that aren't fully locked
    const showBanner   = isGrace || isRestricted || isTrial;

    return (
        <SubscriptionContext.Provider value={{
            effectiveStatus,
            isActive,
            isTrial,
            isGrace,
            isRestricted,
            isLocked,
            isSuspended,
            showBanner,
            isFeatureBlocked,
            daysUntilEnd,
            daysUntilGrace,
            subscriptionEndDate: user?.subscriptionEndDate,
            subscriptionPlan: user?.subscriptionPlan,
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => useContext(SubscriptionContext);
