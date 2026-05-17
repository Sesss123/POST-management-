import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Check, 
  X, 
  Info, 
  ChefHat, 
  Calculator,
  PlusCircle,
  XCircle,
  UtensilsCrossed
} from 'lucide-react';
import { 
  AppModal, 
  AppButton, 
  Badge,
  FormInput,
  useToast
} from '../ui';
import { modifierApi } from '../../api/api';
import { cn } from '../../utils/cn';

const ItemModifierModal = ({ isOpen, onClose, item, onConfirm, initialData = null }) => {
  if (!isOpen || !item) return null;
  const toast = useToast();
  const [modifiers, setModifiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedModifiers, setSelectedModifiers] = useState(initialData?.modifiers || []);
  const [specialNote, setSpecialNote] = useState(initialData?.special_note || '');
  const [qty, setQty] = useState(initialData?.qty || 1);

  useEffect(() => {
    if (isOpen) {
      fetchModifiers();
      if (initialData) {
        setSelectedModifiers(initialData.modifiers || []);
        setSpecialNote(initialData.special_note || '');
        setQty(initialData.qty || 1);
      } else {
        setSelectedModifiers([]);
        setSpecialNote('');
        setQty(1);
      }
    }
  }, [isOpen, initialData]);

  const fetchModifiers = async () => {
    try {
      setLoading(true);
      const { data } = await modifierApi.getAll();
      setModifiers(data.data);
    } catch (err) {
      toast.error('Failed to load modifiers');
    } finally {
      setLoading(false);
    }
  };

  const toggleModifier = (mod) => {
    const exists = selectedModifiers.find(m => m.modifier_id === mod.id);
    if (exists) {
      setSelectedModifiers(selectedModifiers.filter(m => m.modifier_id !== mod.id));
    } else {
      setSelectedModifiers([...selectedModifiers, {
        modifier_id: mod.id,
        name: mod.name,
        type: mod.type,
        price_delta: parseFloat(mod.price_delta)
      }]);
    }
  };

  const calculateTotal = () => {
    const basePrice = parseFloat(item?.price || 0);
    const modTotal = selectedModifiers.reduce((acc, m) => acc + parseFloat(m.price_delta), 0);
    return (basePrice + modTotal) * qty;
  };

  const filteredModifiers = modifiers.filter(m => {
    if (!item) return false;
    const isRetailOrBeverage = ['beverage', 'retail', 'restricted_retail'].includes(item.item_type);
    
    // If it's a beverage or retail item, we should be very strict.
    // Only show if the modifier category matches the item category exactly.
    if (isRetailOrBeverage) {
      return m.category === item.category;
    }

    // For other items (food, etc.), show global modifiers AND category matches.
    if (!m.category || m.category === 'All' || m.category === 'Global' || m.category === '') return true;
    return m.category === item.category;
  });

  const modifierGroups = filteredModifiers.reduce((acc, mod) => {
    // If user has set a specific category like "Extra Options", use that.
    // Otherwise fall back to the type (add-on, remove, etc)
    const groupName = (mod.category && mod.category !== 'All' && mod.category !== 'Global' && mod.category !== '')
      ? mod.category 
      : mod.type.replace('_', ' ');
    
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(mod);
    return acc;
  }, {});

  const handleConfirm = () => {
    onConfirm({
      ...item,
      qty,
      modifiers: selectedModifiers,
      special_note: specialNote,
      modifier_total: selectedModifiers.reduce((acc, m) => acc + parseFloat(m.price_delta), 0),
      total: calculateTotal()
    });
    onClose();
  };

  if (!item) return null;

  return (
    <AppModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Customize: ${item.name}`}
      icon={ChefHat}
      size="lg"
    >
      <div className="space-y-6">
        {/* Item Summary Card */}
        <div className="p-4 sm:p-6 bg-slate-900 rounded-[24px] sm:rounded-[32px] text-white flex justify-between items-center shadow-xl shadow-slate-200">
           <div>
              <h4 className="text-xl font-black tracking-tight">{item.name}</h4>
              <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest">Base Price: Rs. {item.price}</p>
           </div>
           <div className="flex items-center gap-4 bg-white/10 p-2 rounded-2xl border border-white/5">
              <button 
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-rose-500 transition-colors"
              >
                <Minus size={18} />
              </button>
              <span className="text-xl font-black w-8 text-center">{qty}</span>
              <button 
                onClick={() => setQty(qty + 1)}
                className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-emerald-500 transition-colors"
              >
                <Plus size={18} />
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Left: Modifiers */}
           <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(modifierGroups).map(([type, group]) => (
                <div key={type} className="space-y-3">
                   <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">{type.replace('_', ' ')}s</h5>
                   <div className="grid grid-cols-1 gap-2">
                      {group.map(mod => {
                        const isSelected = selectedModifiers.some(m => m.modifier_id === mod.id);
                        return (
                          <button
                            key={mod.id}
                            onClick={() => toggleModifier(mod)}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-2xl border-2 transition-all group",
                              isSelected 
                                ? "bg-indigo-50 border-indigo-600 shadow-md" 
                                : "bg-white border-slate-100 hover:border-slate-200"
                            )}
                          >
                            <div className="flex items-center gap-3">
                               <div className={cn(
                                 "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                                 isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-300 group-hover:bg-slate-200"
                               )}>
                                  {isSelected ? <Check size={14} /> : <PlusCircle size={14} />}
                               </div>
                               <span className={cn("text-sm font-bold", isSelected ? "text-indigo-900" : "text-slate-600")}>
                                  {mod.name}
                               </span>
                            </div>
                            {parseFloat(mod.price_delta) > 0 && (
                              <span className={cn("text-xs font-black", isSelected ? "text-indigo-600" : "text-slate-400")}>
                                +Rs. {mod.price_delta}
                              </span>
                            )}
                          </button>
                        );
                      })}
                   </div>
                </div>
              ))}
           </div>

           {/* Right: Notes & Total */}
           <div className="space-y-6">
              <div className="space-y-3">
                 <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Special Instructions</h5>
                 <textarea
                   className="w-full h-32 p-4 rounded-[24px] border-2 border-slate-100 focus:border-indigo-600 focus:ring-0 transition-all text-sm font-medium resize-none placeholder:text-slate-300"
                   placeholder="e.g. Less oil, Separate gravy, serve quickly..."
                   value={specialNote}
                   onChange={(e) => setSpecialNote(e.target.value)}
                 />
              </div>

              <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-4">
                 <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span>Subtotal</span>
                    <span>Rs. {(item.price * qty).toLocaleString()}</span>
                 </div>
                 {selectedModifiers.length > 0 && (
                   <div className="flex justify-between items-center text-xs font-bold text-indigo-600">
                      <span>Modifiers</span>
                      <span>+Rs. {(selectedModifiers.reduce((acc, m) => acc + m.price_delta, 0) * qty).toLocaleString()}</span>
                   </div>
                 )}
                 <div className="h-px bg-slate-200" />
                 <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Price</span>
                       <span className="text-2xl font-black text-slate-900 tracking-tighter">Rs. {calculateTotal().toLocaleString()}</span>
                    </div>
                    <AppButton 
                      variant="primary" 
                      size="lg" 
                      icon={UtensilsCrossed} 
                      onClick={handleConfirm}
                      className="px-8 rounded-2xl"
                    >
                      {initialData ? 'Update Item' : 'Add to Cart'}
                    </AppButton>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </AppModal>
  );
};

export default ItemModifierModal;
