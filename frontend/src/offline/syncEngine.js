import apiClient from '../api/apiClient';
import { updateDraftStatus, getPendingDrafts } from './offlineDb';

export const syncDraft = async (draft, maxRetries = 5) => {
    let attempts = 0;
    while (attempts < maxRetries) {
        try {
            await updateDraftStatus(draft.id, 'syncing');

            const { data } = await apiClient.post('/offline-sync/drafts', {
                idempotency_key: draft.idempotency_key,
                type: draft.type,
                items: draft.items,
                payment_method: draft.payment_method,
                cash_received: draft.cash_received,
                offline_created_at: draft.created_at
            });

            if (data.success) {
                await updateDraftStatus(draft.id, 'synced', null, data.data.invoice_id);
                return { success: true, message: data.message, invoice_id: data.data.invoice_id };
            }
            return { success: false, message: 'Sync failed' };
        } catch (error) {
            attempts++;
            
            // Network error (no response) and retries left -> retry
            if (!error.response && attempts < maxRetries) {
                console.log(`Network error, retrying attempt ${attempts}/${maxRetries}...`);
                await new Promise(resolve => setTimeout(resolve, 1500));
                continue;
            }

            const errMsg = error.response?.data?.message || 'Network or server error during sync';
            const conflictData = error.response?.data?.conflict || null;
            
            await updateDraftStatus(draft.id, conflictData ? 'conflict' : 'failed', errMsg, null, conflictData);
            
            return { 
                success: false, 
                message: errMsg,
                conflict: conflictData
            };
        }
    }
};

export const syncAllDrafts = async (shopId) => {
    const drafts = await getPendingDrafts(shopId);
    let successCount = 0;
    let failCount = 0;

    for (const draft of drafts) {
        if (draft.status === 'pending_sync' || draft.status === 'failed') {
            const result = await syncDraft(draft);
            if (result.success) {
                successCount++;
            } else {
                failCount++;
            }
        }
    }

    return { successCount, failCount, total: drafts.length };
};

export const retryFailedDraft = async (draft) => {
    return await syncDraft(draft);
};
