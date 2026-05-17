import React, { useState } from 'react';
import { X, AlertTriangle, AlertCircle, ShoppingCart, DollarSign, Archive, Check } from 'lucide-react';
import { AppButton } from '../ui';

const OfflineConflictModal = ({ isOpen, onClose, draft, onResolve }) => {
    if (!isOpen || !draft) return null;

    const conflict = draft.conflict || {};
    const conflictType = conflict.type || 'unknown';
    const details = conflict.details || {};
    
    const [editedDraft, setEditedDraft] = useState({ ...draft });
    const [additionalCash, setAdditionalCash] = useState(0);

    const handleQtyChange = (itemId, newQty) => {
        const updatedItems = editedDraft.items.map(item => {
            if (item.id === itemId || item.item_id === itemId) {
                return { ...item, qty: Math.max(1, parseInt(newQty)) };
            }
            return item;
        });

        // Re-calculate subtotal
        const newSub = updatedItems.reduce((acc, it) => acc + (it.qty * it.unit_price), 0);

        setEditedDraft({
            ...editedDraft,
            items: updatedItems,
            estimated_total: newSub // simple update
        });
    };

    const handleRemoveItem = (itemId) => {
        const updatedItems = editedDraft.items.filter(item => item.id !== itemId && item.item_id !== itemId);
        const newSub = updatedItems.reduce((acc, it) => acc + (it.qty * it.unit_price), 0);
        
        setEditedDraft({
            ...editedDraft,
            items: updatedItems,
            estimated_total: newSub
        });
    };

    const handleAcceptPrice = () => {
        // We will accept the new price from server. To do this, we update the draft prices locally
        if (conflictType === 'price_changed' || conflictType === 'insufficient_cash') {
            const serverTotal = details.new_total || details.server_total;
            
            // Adjust individual items if details provide them, or let backend recalculate
            // But since cashier accepts, we update estimated_total to match new_total and matches cash_received
            setEditedDraft(prev => ({
                ...prev,
                estimated_total: serverTotal,
                cash_received: serverTotal // make cash received equal to total
            }));
            onResolve({
                ...editedDraft,
                estimated_total: serverTotal,
                cash_received: serverTotal,
                status: 'pending_sync',
                conflict: null
            });
        }
    };

    const handleSaveAndSync = () => {
        const finalDraft = {
            ...editedDraft,
            status: 'pending_sync',
            conflict: null
        };
        if (conflictType === 'insufficient_cash') {
            finalDraft.cash_received = parseFloat(editedDraft.cash_received || 0) + parseFloat(additionalCash);
        }
        onResolve(finalDraft);
    };

    const renderConflictBody = () => {
        switch (conflictType) {
            case 'price_changed':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className="text-xs font-black uppercase text-amber-800 tracking-wider">Prices Changed While Offline</h4>
                                <p className="text-xs text-amber-600 font-bold mt-1">
                                    The items in this bill now have different current server pricing.
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                <span>Original Total:</span>
                                <span className="line-through text-slate-400">Rs. {details.old_total?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm font-black text-slate-800">
                                <span>New Server Total:</span>
                                <span className="text-rose-500">Rs. {details.new_total?.toLocaleString() || 0}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <AppButton variant="primary" fullWidth onClick={handleAcceptPrice}>
                                <Check size={16} className="mr-2" />
                                Accept New Price & Sync
                            </AppButton>
                        </div>
                    </div>
                );

            case 'insufficient_cash':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-3">
                            <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className="text-xs font-black uppercase text-rose-800 tracking-wider">Insufficient Cash Received</h4>
                                <p className="text-xs text-rose-600 font-bold mt-1">
                                    Cash received (Rs. {details.cash_received?.toLocaleString() || 0}) is less than the new server total (Rs. {details.new_total?.toLocaleString() || 0}).
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                                Collect Additional Cash:
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="number"
                                    className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-800 focus:outline-none focus:border-rose-500"
                                    value={additionalCash}
                                    onChange={(e) => setAdditionalCash(Math.max(0, parseFloat(e.target.value || 0)))}
                                    placeholder="Enter additional amount collected"
                                />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                                Total collected will be: Rs. {(parseFloat(details.cash_received || 0) + additionalCash).toLocaleString()}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <AppButton variant="primary" fullWidth onClick={handleSaveAndSync} disabled={parseFloat(details.cash_received || 0) + additionalCash < (details.new_total || 0)}>
                                Update Cash & Retry
                            </AppButton>
                        </div>
                    </div>
                );

            case 'insufficient_stock':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className="text-xs font-black uppercase text-amber-800 tracking-wider">Insufficient Stock</h4>
                                <p className="text-xs text-amber-600 font-bold mt-1">
                                    Item <strong>{details.item_name}</strong> has insufficient stock. Requested: {details.requested_qty}, Available: {details.available_qty}.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Adjust Quantities:</h4>
                            {editedDraft.items.map(item => (
                                <div key={item.id || item.item_id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="max-w-[60%]">
                                        <span className="text-xs font-black text-slate-800 block truncate">{item.item_name}</span>
                                        <span className="text-[10px] text-slate-400 font-bold block">
                                            {(item.id === details.item_id || item.item_name === details.item_name) ? `Max available: ${details.available_qty}` : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center text-xs font-black"
                                            value={item.qty}
                                            onChange={(e) => handleQtyChange(item.id || item.item_id, e.target.value)}
                                        />
                                        <button 
                                            onClick={() => handleRemoveItem(item.id || item.item_id)}
                                            className="p-1 hover:bg-rose-50 hover:text-rose-500 rounded text-slate-400 transition-colors"
                                            title="Remove Item"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <AppButton variant="primary" fullWidth onClick={handleSaveAndSync}>
                                Save Changes & Sync
                            </AppButton>
                        </div>
                    </div>
                );

            case 'item_unavailable':
            case 'item_not_found':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-3">
                            <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className="text-xs font-black uppercase text-rose-800 tracking-wider">Item Unavailable</h4>
                                <p className="text-xs text-rose-600 font-bold mt-1">
                                    Item <strong>{details.item_name}</strong> is no longer active, sold out, or unavailable.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Remove Unavailable Item:</h4>
                            {editedDraft.items.map(item => (
                                <div key={item.id || item.item_id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <span className="text-xs font-black text-slate-800 truncate max-w-[70%]">
                                        {item.item_name}
                                    </span>
                                    {(item.item_name === details.item_name) ? (
                                        <button
                                            onClick={() => handleRemoveItem(item.id || item.item_id)}
                                            className="px-3 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-black transition-colors"
                                        >
                                            Remove
                                        </button>
                                    ) : (
                                        <span className="text-xs font-bold text-slate-400">{item.qty}x</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <AppButton variant="primary" fullWidth onClick={handleSaveAndSync} disabled={editedDraft.items.some(i => i.item_name === details.item_name)}>
                                Sync Remaining Items
                            </AppButton>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                            <AlertCircle className="text-slate-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">System Conflict Error</h4>
                                <p className="text-xs text-slate-500 font-bold mt-1">
                                    {draft.error_message || 'A system conflict prevents this draft from syncing.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <AppButton variant="primary" fullWidth onClick={handleSaveAndSync}>
                                Force Retry Sync
                            </AppButton>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-white rounded-[32px] border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-5 border-b border-slate-50 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <Archive size={20} className="text-slate-800" />
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Resolve Draft Conflict</h3>
                            <span className="inline-block mt-1 px-2.5 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-rose-100">
                                {conflictType.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    {renderConflictBody()}
                </div>

            </div>
        </div>
    );
};

export default OfflineConflictModal;
