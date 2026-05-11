import React, { useState, useEffect } from 'react';
import { superAdminApi } from '../../api/api';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  CreditCard, 
  Activity,
  ChevronRight,
  Zap,
  Star,
  Check,
  RefreshCcw,
  ShieldCheck,
  Award
} from 'lucide-react';
import { AppButton, AppCard, AppModal, useToast, FormInput } from '../../components/ui';
import { cn } from '../../utils/cn';

const SubscriptionPlansPage = () => {
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    billing_interval: 'monthly',
    features: [],
    is_active: true
  });
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data } = await superAdminApi.getPlans();
      if (data.success) setPlans(data.data);
    } catch (err) {
      toast.error('Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        price: plan.price,
        billing_interval: plan.billing_interval,
        features: typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []),
        is_active: plan.is_active
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        price: '',
        billing_interval: 'monthly',
        features: [],
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await superAdminApi.updatePlan(editingPlan.id, formData);
        toast.success('Plan updated successfully');
      } else {
        await superAdminApi.createPlan(formData);
        toast.success('Plan created successfully');
      }
      setShowModal(false);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await superAdminApi.deletePlan(id);
      toast.success('Plan deleted');
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setFormData({ ...formData, features: [...formData.features, newFeature.trim()] });
    setNewFeature('');
  };

  const removeFeature = (idx) => {
    const updated = formData.features.filter((_, i) => i !== idx);
    setFormData({ ...formData, features: updated });
  };

  const getTierConfig = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('premium') || lowerName.includes('pro') || lowerName.includes('gold')) {
      return { 
        accent: 'border-amber-500/50', 
        bg: 'from-amber-500/10 to-transparent',
        glow: 'bg-amber-500/20',
        icon: Award,
        iconColor: 'text-amber-400'
      };
    }
    if (lowerName.includes('standard') || lowerName.includes('business')) {
      return { 
        accent: 'border-indigo-500/50', 
        bg: 'from-indigo-500/10 to-transparent',
        glow: 'bg-indigo-500/20',
        icon: Zap,
        iconColor: 'text-indigo-400'
      };
    }
    return { 
      accent: 'border-slate-500/30', 
      bg: 'from-slate-500/5 to-transparent',
      glow: 'bg-slate-500/10',
      icon: Star,
      iconColor: 'text-slate-400'
    };
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Layers className="text-indigo-500" size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Subscription Engine</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">Pricing Plans</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchPlans}
            className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all hover:bg-white/5"
          >
            <RefreshCcw size={20} className={cn(loading && "animate-spin")} />
          </button>
          <AppButton 
            variant="primary" 
            icon={Plus} 
            onClick={() => handleOpenModal()}
            className="rounded-[1.5rem] shadow-xl shadow-indigo-900/40 h-14 px-8 uppercase text-xs font-black tracking-widest"
          >
            Create New Tier
          </AppButton>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading && plans.length === 0 ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-[550px] bg-slate-900/40 animate-pulse rounded-[3rem] border border-white/5" />
          ))
        ) : plans.length > 0 ? (
          plans.map(plan => {
            const config = getTierConfig(plan.name);
            const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []);
            const Icon = config.icon;

            return (
              <div 
                key={plan.id} 
                className={cn(
                  "group relative bg-slate-900/40 backdrop-blur-xl border-2 rounded-[3.5rem] p-10 transition-all duration-500 hover:scale-[1.02] flex flex-col min-h-[580px]",
                  plan.is_active ? config.accent : "border-white/5 opacity-50 grayscale"
                )}
              >
                {/* Glow Background */}
                <div className={cn("absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-10 transition-all group-hover:opacity-20", config.glow)} />
                
                {/* Status Badge */}
                {!plan.is_active && (
                  <div className="absolute top-8 right-8 bg-white/5 border border-white/10 text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Deactivated
                  </div>
                )}

                {/* Plan Info */}
                <div className="relative z-10 mb-10">
                  <div className={cn("w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-2xl", config.iconColor)}>
                    <Icon size={40} />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">{plan.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white tracking-tighter">Rs. {Number(plan.price).toLocaleString()}</span>
                    <span className="text-slate-500 font-black text-xs uppercase tracking-widest">/{plan.billing_interval}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="relative z-10 flex-1 space-y-5 mb-10">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Module Permissions</p>
                  <div className="space-y-4 max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
                    {features.map((f, i) => (
                      <div key={i} className="flex items-start gap-4 text-slate-300 font-bold text-sm group/item">
                        <div className={cn("w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 transition-colors", config.iconColor)}>
                          <Check size={14} strokeWidth={4} />
                        </div>
                        <span className="group-hover/item:text-white transition-colors capitalize">{f.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                    {features.length === 0 && <p className="text-slate-600 italic text-xs">No features defined</p>}
                  </div>
                </div>

                {/* Actions */}
                <div className="relative z-10 flex gap-4 pt-8 border-t border-white/5 mt-auto">
                  <AppButton 
                    variant="ghost" 
                    icon={Edit3} 
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-2xl h-14 font-black text-[10px] uppercase tracking-widest"
                    onClick={() => handleOpenModal(plan)}
                  >
                    Edit Tier
                  </AppButton>
                  <button 
                    onClick={() => handleDelete(plan.id)}
                    className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
                    title="Remove Plan"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-32 text-center bg-slate-900/40 backdrop-blur-md rounded-[4rem] border-4 border-dashed border-white/5 flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 mb-8">
                <Layers size={48} />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 uppercase">No Pricing Tiers</h2>
            <p className="text-slate-500 font-medium mb-10 max-w-sm">Define your platform's subscription structure to start onboarding shops.</p>
            <AppButton variant="primary" size="lg" className="rounded-3xl h-16 px-10" onClick={() => handleOpenModal()}>
                Create Your First Plan
            </AppButton>
          </div>
        )}
      </div>

      {/* Plan Modal - Dark Theme Styled */}
      <AppModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPlan ? "Edit Tier Logic" : "New Subscription Tier"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-10 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Plan Identity</label>
                <input 
                    placeholder="e.g. Enterprise Elite"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] py-4 px-6 text-slate-900 font-black focus:border-indigo-600 outline-none transition-all shadow-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Monthly Pricing (LKR)</label>
                <input 
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] py-4 px-6 text-slate-900 font-black focus:border-indigo-600 outline-none transition-all shadow-sm"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Billing Cycle</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 py-4 text-sm font-black text-slate-900 outline-none focus:border-indigo-600 transition-all appearance-none cursor-pointer"
                  value={formData.billing_interval}
                  onChange={(e) => setFormData({ ...formData, billing_interval: e.target.value })}
                >
                  <option value="monthly">Monthly Recurring</option>
                  <option value="yearly">Yearly Commitment</option>
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Availability</label>
                <div className="flex gap-4">
                   <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: true })}
                    className={cn(
                      "flex-1 py-4 rounded-[1.25rem] border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                      formData.is_active ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400 hover:border-indigo-200"
                    )}
                   >
                     Public
                   </button>
                   <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: false })}
                    className={cn(
                      "flex-1 py-4 rounded-[1.25rem] border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                      !formData.is_active ? "bg-rose-500 border-rose-500 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400 hover:border-rose-200"
                    )}
                   >
                     Hidden
                   </button>
                </div>
             </div>
          </div>

          <div className="space-y-4 p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Entitlements & Features</label>
             <div className="flex gap-3">
                <input 
                  type="text"
                  placeholder="e.g. Multi-Terminal Support"
                  className="flex-1 bg-white border-2 border-slate-200 rounded-[1.25rem] px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <button 
                  type="button"
                  onClick={addFeature}
                  className="w-14 h-14 bg-slate-900 text-white rounded-[1.25rem] flex items-center justify-center hover:bg-slate-800 transition-all shrink-0 shadow-lg shadow-slate-200"
                >
                  <Plus size={24} />
                </button>
             </div>

             <div className="flex flex-wrap gap-2 pt-4">
                {formData.features.map((f, i) => (
                  <div key={i} className="bg-white text-slate-900 px-4 py-2 rounded-xl flex items-center gap-3 border-2 border-slate-100 shadow-sm animate-in zoom-in-95">
                    <span className="text-[10px] font-black uppercase tracking-tight">{f}</span>
                    <button type="button" onClick={() => removeFeature(i)} className="text-slate-300 hover:text-rose-500 transition-colors">
                      <XCircle size={16} />
                    </button>
                  </div>
                ))}
                {formData.features.length === 0 && <p className="text-[10px] font-bold text-slate-400 italic">No features defined for this tier.</p>}
             </div>
          </div>

          <div className="flex gap-4 pt-4">
            <AppButton variant="secondary" className="flex-1 rounded-[1.5rem] h-16 uppercase text-[10px] font-black tracking-widest" onClick={() => setShowModal(false)}>Discard</AppButton>
            <AppButton 
              type="submit" 
              variant="primary" 
              className="flex-[2] rounded-[1.5rem] h-16 shadow-2xl shadow-indigo-200 uppercase font-black tracking-widest"
            >
              {editingPlan ? "Confirm Intelligence Update" : "Deploy Subscription Tier"}
            </AppButton>
          </div>
        </form>
      </AppModal>
    </div>
  );
};

export default SubscriptionPlansPage;
