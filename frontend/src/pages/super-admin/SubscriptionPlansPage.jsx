import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { AppButton, useToast } from '../../components/ui';
import { cn } from '../../utils/cn';

const SubscriptionPlansPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="max-w-[1600px] mx-auto space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Cyber Header */}
      <div className="relative overflow-hidden bg-slate-900/40 border border-white/5 p-12 rounded-[4rem] backdrop-blur-3xl">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full -mr-40 -mt-40 animate-pulse"></div>
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 h-full">
              <div>
                  <div className="flex items-center gap-4 mb-3">
                      <Layers className="text-indigo-500 animate-pulse" size={24} />
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Subscription Engine</p>
                  </div>
                  <h1 className="text-5xl font-black text-white tracking-tighter">Pricing Tiers</h1>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-3 leading-relaxed">
                      Managing {plans.length} platform tiers <span className="mx-2 text-slate-800">|</span> 
                      <span className="text-white"> Configured for Global Provisioning</span>
                  </p>
              </div>
              <div className="flex items-center gap-4">
                  <button 
                    onClick={fetchPlans}
                    className="p-5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-slate-400 hover:text-white transition-all shadow-xl shadow-black/20"
                  >
                      <RefreshCcw size={20} className={cn(loading && "animate-spin")} />
                  </button>
                  <AppButton 
                    variant="primary" 
                    icon={Plus} 
                    onClick={() => navigate('/super-admin/plans/new')}
                    className="rounded-[2rem] shadow-2xl shadow-indigo-900/40 h-16 px-10 uppercase text-xs font-black tracking-[0.2em]"
                  >
                    Deploy New Tier
                  </AppButton>
              </div>
          </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading && plans.length === 0 ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-[600px] bg-slate-900/40 animate-pulse rounded-[4rem] border border-white/5" />
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
                  "group relative bg-slate-900/40 backdrop-blur-xl border-2 rounded-[4rem] p-12 transition-all duration-700 hover:scale-[1.02] hover:-translate-y-2 flex flex-col min-h-[620px] shadow-2xl",
                  plan.is_active ? config.accent : "border-white/5 opacity-50 grayscale"
                )}
              >
                {/* Glow Background */}
                <div className={cn("absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] opacity-10 transition-all group-hover:opacity-30", config.glow)} />
                
                {/* Status Badge */}
                {!plan.is_active && (
                  <div className="absolute top-10 right-10 bg-white/5 border border-white/10 text-slate-500 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Deactivated Registry
                  </div>
                )}

                {/* Plan Info */}
                <div className="relative z-10 mb-12">
                  <div className={cn("w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mb-10 shadow-2xl transition-transform group-hover:scale-110", config.iconColor)}>
                    <Icon size={40} />
                  </div>
                  <h3 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase">{plan.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-black text-emerald-500 uppercase">Rs.</span>
                    <span className="text-5xl font-black text-white tracking-tighter"> {Number(plan.price).toLocaleString()}</span>
                    <span className="text-slate-600 font-black text-[10px] uppercase tracking-widest mb-1">/{plan.billing_interval}</span>
                  </div>
                  {plan.setup_fee > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">+ Rs. {Number(plan.setup_fee).toLocaleString()} Setup Fee</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="relative z-10 flex-1 space-y-6 mb-12">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1">Protocol Entitlements</p>
                  <div className="space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar pr-4">
                    {features.map((f, i) => (
                      <div key={i} className="flex items-start gap-5 text-slate-400 font-bold text-sm group/item">
                        <div className={cn("w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 transition-all group-hover/item:scale-110", config.iconColor)}>
                          <Check size={14} strokeWidth={4} />
                        </div>
                        <span className="group-hover/item:text-white transition-colors capitalize leading-relaxed">{f.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                    {features.length === 0 && <p className="text-slate-700 italic text-xs font-black uppercase tracking-widest">Awaiting configuration...</p>}
                  </div>
                </div>

                {/* Actions */}
                <div className="relative z-10 flex gap-4 pt-10 border-t border-white/5 mt-auto">
                  <button 
                    onClick={() => navigate(`/super-admin/plans/${plan.id}/governance`)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-[2rem] h-16 font-black text-[10px] uppercase tracking-[0.3em] transition-all border border-white/5 active:scale-95"
                  >
                    Edit Tier Logic
                  </button>
                  <button 
                    onClick={() => handleDelete(plan.id)}
                    className="w-16 h-16 rounded-[2rem] bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 shadow-xl shadow-rose-950/20 active:scale-95"
                    title="Remove Protocol"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-40 text-center bg-slate-900/40 backdrop-blur-3xl rounded-[4rem] border-4 border-dashed border-white/5 flex flex-col items-center justify-center">
            <div className="w-28 h-28 bg-slate-800 rounded-[3rem] flex items-center justify-center text-slate-600 mb-10 shadow-2xl">
                <Layers size={56} />
            </div>
            <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">No Pricing Tiers Found</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-12 max-w-sm">Define your platform's subscription architecture to begin node provisioning.</p>
            <AppButton 
                variant="primary" 
                size="lg" 
                className="rounded-[2rem] h-20 px-12 uppercase text-xs font-black tracking-widest shadow-2xl shadow-indigo-900/40" 
                onClick={() => navigate('/super-admin/plans/new')}
            >
                Initialize First Protocol
            </AppButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPlansPage;
