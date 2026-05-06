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
  Check
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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Layers className="text-indigo-600" size={32} />
            Subscription Plans
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage platform pricing and features</p>
        </div>
        <AppButton 
          variant="primary" 
          icon={Plus} 
          onClick={() => handleOpenModal()}
          className="rounded-2xl shadow-xl shadow-indigo-100 h-14 px-8 uppercase text-xs font-black tracking-widest"
        >
          Create New Plan
        </AppButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-96 bg-slate-100 animate-pulse rounded-[2.5rem]"></div>)
        ) : plans.length > 0 ? (
          plans.map(plan => {
            const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []);
            return (
              <div key={plan.id} className={cn(
                "group relative bg-white border-2 rounded-[2.5rem] p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 flex flex-col",
                plan.is_active ? "border-slate-100" : "border-slate-100 opacity-60 grayscale"
              )}>
                {!plan.is_active && (
                  <div className="absolute top-6 right-6 bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Inactive</div>
                )}
                
                <div className="mb-8">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    {plan.price == 0 ? <Star size={32} /> : plan.price > 10000 ? <Zap size={32} /> : <CreditCard size={32} />}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-indigo-600">Rs. {parseFloat(plan.price).toLocaleString()}</span>
                    <span className="text-slate-400 font-bold text-sm">/{plan.billing_interval}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 mb-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Included Features</p>
                  <ul className="space-y-3">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-600 font-bold text-sm">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={12} strokeWidth={4} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3 pt-6 border-t border-slate-50">
                  <AppButton 
                    variant="secondary" 
                    icon={Edit3} 
                    block
                    onClick={() => handleOpenModal(plan)}
                    className="rounded-2xl font-black text-[10px] uppercase tracking-widest h-12"
                  >
                    Edit
                  </AppButton>
                  <button 
                    onClick={() => handleDelete(plan.id)}
                    className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200">
            <Layers className="mx-auto text-slate-200 mb-4" size={64} />
            <p className="text-slate-400 font-bold text-lg">No subscription plans found</p>
            <AppButton variant="primary" className="mt-6 rounded-2xl" onClick={() => handleOpenModal()}>Create Your First Plan</AppButton>
          </div>
        )}
      </div>

      {/* Plan Modal */}
      <AppModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPlan ? "Edit Plan Details" : "Create Subscription Plan"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput 
              label="Plan Name"
              placeholder="e.g. Pro Business"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <FormInput 
              label="Price (Rs.)"
              type="number"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Billing Interval</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all appearance-none cursor-pointer"
                  value={formData.billing_interval}
                  onChange={(e) => setFormData({ ...formData, billing_interval: e.target.value })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One Time / Lifetime</option>
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                <div className="flex gap-4">
                   <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: true })}
                    className={cn(
                      "flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                      formData.is_active ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-slate-100 text-slate-400"
                    )}
                   >
                     Active
                   </button>
                   <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: false })}
                    className={cn(
                      "flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                      !formData.is_active ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-white border-slate-100 text-slate-400"
                    )}
                   >
                     Inactive
                   </button>
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Features List</label>
             <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="e.g. Unlimited KOTs"
                  className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <button 
                  type="button"
                  onClick={addFeature}
                  className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-slate-800 transition-all"
                >
                  <Plus size={24} />
                </button>
             </div>

             <div className="flex flex-wrap gap-2 pt-2">
                {formData.features.map((f, i) => (
                  <div key={i} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl flex items-center gap-2 border border-indigo-100 animate-in zoom-in-95">
                    <span className="text-xs font-black uppercase tracking-tight">{f}</span>
                    <button type="button" onClick={() => removeFeature(i)} className="text-indigo-300 hover:text-rose-500 transition-colors">
                      <XCircle size={14} />
                    </button>
                  </div>
                ))}
                {formData.features.length === 0 && <p className="text-[10px] font-bold text-slate-400 italic">No features added yet</p>}
             </div>
          </div>

          <div className="flex gap-4 pt-4">
            <AppButton variant="secondary" className="flex-1 rounded-2xl h-14" onClick={() => setShowModal(false)}>Cancel</AppButton>
            <AppButton 
              type="submit" 
              variant="primary" 
              className="flex-[2] rounded-2xl h-14 shadow-xl shadow-indigo-100 uppercase font-black tracking-widest"
            >
              {editingPlan ? "Update Subscription Plan" : "Create Subscription Plan"}
            </AppButton>
          </div>
        </form>
      </AppModal>
    </div>
  );
};

export default SubscriptionPlansPage;
