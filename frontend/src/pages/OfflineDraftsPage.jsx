import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../hooks/useNetwork';
import { getPendingDrafts, deleteDraft, updateDraft } from '../offline/offlineDb';
import { syncDraft, syncAllDrafts } from '../offline/syncEngine';
import { AppButton, useToast } from '../components/ui';
import { RefreshCcw, WifiOff, CheckCircle, AlertTriangle, Trash2, Clock, UploadCloud, ShieldAlert } from 'lucide-react';
import OfflineConflictModal from '../components/offline/OfflineConflictModal';

const OfflineDraftsPage = () => {
    const { user } = useAuth();
    const isOnline = useNetwork();
    const { addToast } = useToast();
    
    const [drafts, setDrafts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncingId, setSyncingId] = useState(null);
    const [activeConflictDraft, setActiveConflictDraft] = useState(null);

    const loadDrafts = async () => {
        if (!user?.shop_id) return;
        setLoading(true);
        try {
            const pending = await getPendingDrafts(user.shop_id);
            setDrafts(pending);
        } catch (err) {
            console.error('Failed to load drafts', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDrafts();
    }, [user]);

    const handleSync = async (draft) => {
        if (!isOnline) {
            addToast('Cannot sync while offline', 'warning');
            return;
        }

        setSyncingId(draft.id);
        try {
            const result = await syncDraft(draft);
            if (result.success) {
                addToast(result.message || 'Draft synced successfully', 'success');
            } else if (result.conflict) {
                addToast(`Conflict detected: ${result.conflict.type.replace('_', ' ')}`, 'warning');
            } else {
                addToast(result.message || 'Sync failed', 'danger');
            }
        } finally {
            setSyncingId(null);
            loadDrafts();
        }
    };

    const handleSyncAll = async () => {
        if (!isOnline) {
            addToast('Cannot sync while offline', 'warning');
            return;
        }
        
        if (!user?.shop_id) return;

        setSyncingId('all');
        try {
            const { successCount, failCount } = await syncAllDrafts(user.shop_id);
            addToast(`Synced ${successCount} drafts. Failed/Conflicts: ${failCount}`, successCount > 0 ? 'success' : 'warning');
        } finally {
            setSyncingId(null);
            loadDrafts();
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to cancel and delete this offline draft? This action cannot be undone.')) {
            await deleteDraft(id);
            addToast('Draft deleted', 'info');
            loadDrafts();
        }
    };

    const handleResolve = async (resolvedDraft) => {
        setActiveConflictDraft(null);
        try {
            // Save the resolved changes (e.g. edited quantities, updated cash) back to IndexedDB
            await updateDraft(resolvedDraft);
            addToast('Draft updated successfully. Syncing...', 'success');
            
            // Retry the sync directly
            await handleSync(resolvedDraft);
        } catch (err) {
            console.error('Error updating resolved draft', err);
            addToast('Failed to save resolution details', 'danger');
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest">Loading Drafts...</div>;
    }

    return (
        <div className="p-4 lg:p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Offline Drafts & Conflicts</h1>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                        {drafts.length} pending bills to review/sync
                    </p>
                </div>
                
                {!isOnline ? (
                    <div className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-center gap-2">
                        <WifiOff size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">Internet required to sync</span>
                    </div>
                ) : drafts.length > 0 ? (
                    <AppButton 
                        variant="primary" 
                        onClick={handleSyncAll}
                        disabled={syncingId !== null}
                        isLoading={syncingId === 'all'}
                    >
                        <UploadCloud size={16} className="mr-2" />
                        Sync All Pending
                    </AppButton>
                ) : null}
            </div>

            {drafts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center">
                    <CheckCircle size={64} className="text-emerald-400 mb-4 opacity-50" />
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-2">All Synced Up</h3>
                    <p className="text-sm font-bold text-slate-400">There are no offline drafts waiting to be synced to the server.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {drafts.map(draft => (
                        <div key={draft.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-4">
                            <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                                <div>
                                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded mb-2">
                                        {draft.type.replace('_', ' ')}
                                    </span>
                                    <h4 className="font-black text-slate-900 text-lg uppercase">
                                        Rs. {draft.estimated_total?.toLocaleString() || 0}
                                    </h4>
                                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                                        <Clock size={10} />
                                        {new Date(draft.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <button 
                                        onClick={() => handleDelete(draft.id)}
                                        className="text-slate-300 hover:text-rose-500 p-2 bg-slate-50 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Delete Draft"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-500 mb-2">{draft.items?.length || 0} Items</p>
                                <div className="max-h-24 overflow-y-auto space-y-1">
                                    {draft.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-[11px] text-slate-600">
                                            <span className="truncate pr-2">{item.qty}x {item.item_name}</span>
                                            <span className="shrink-0">Rs. {(item.qty * item.unit_price).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {draft.status === 'conflict' && (
                                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-100 flex flex-col gap-2">
                                    <div className="flex items-start gap-2">
                                        <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                                        <span className="leading-tight">
                                            Conflict: {draft.conflict?.type?.replace('_', ' ')?.toUpperCase()}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setActiveConflictDraft(draft)}
                                        className="w-full py-1.5 bg-white text-rose-600 hover:bg-rose-100/30 rounded-lg border border-rose-200 transition-colors text-[10px] uppercase font-black tracking-widest text-center"
                                    >
                                        Resolve Conflict
                                    </button>
                                </div>
                            )}

                            {draft.status === 'failed' && (
                                <div className="p-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-100 flex items-start gap-2">
                                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                    <span className="leading-tight">{draft.error_message || 'Sync failed previously. Please try again.'}</span>
                                </div>
                            )}

                            {draft.status !== 'conflict' && (
                                <AppButton 
                                    variant={draft.status === 'failed' ? 'primary' : 'primary'}
                                    fullWidth 
                                    onClick={() => handleSync(draft)}
                                    disabled={!isOnline || syncingId !== null}
                                    isLoading={syncingId === draft.id}
                                    className={!isOnline ? 'opacity-50' : ''}
                                >
                                    <RefreshCcw size={16} className="mr-2" />
                                    {draft.status === 'failed' ? 'Retry Sync' : 'Sync Now'}
                                </AppButton>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Offline Conflict Resolution Modal */}
            <OfflineConflictModal
                isOpen={activeConflictDraft !== null}
                onClose={() => setActiveConflictDraft(null)}
                draft={activeConflictDraft}
                onResolve={handleResolve}
            />
        </div>
    );
};

export default OfflineDraftsPage;
