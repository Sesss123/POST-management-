import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { superAdminApi } from '../../api/api';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Info, 
  Bell, 
  Calendar,
  ChevronRight,
  Send,
  X,
  History,
  ShieldAlert,
  Sparkles,
  Target,
  Clock,
  Eye,
  CheckCircle2,
  RefreshCcw,
  Zap,
  Star
} from 'lucide-react';
import { AppButton, useToast } from '../../components/ui';
import { cn } from '../../utils/cn';

const AnnouncementsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
    fetchShops();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data } = await superAdminApi.getAnnouncements();
      if (data.success) setAnnouncements(data.data);
    } catch (err) {
      toast.error('Intelligence synchronization failure');
    } finally {
      setLoading(false);
    }
  };

  const fetchShops = async () => {
     try {
       const { data } = await superAdminApi.getShops();
       if (data.success) setShops(data.data);
     } catch (err) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Decommission this broadcast protocol?')) return;
    try {
      await superAdminApi.deleteAnnouncement(id);
      toast.success('Broadcast Decommissioned');
      fetchAnnouncements();
    } catch (err) {
      toast.error('Termination failed');
    }
  };

  const getTypeConfig = (type) => {
    switch (type) {
      case 'urgent': return { 
          icon: ShieldAlert, 
          color: 'text-rose-500', 
          bg: 'bg-rose-500/10', 
          border: 'border-rose-500/20',
          glow: 'shadow-rose-900/20',
          label: 'Critical Alert'
      };
      case 'warning': return { 
          icon: AlertTriangle, 
          color: 'text-amber-500', 
          bg: 'bg-amber-500/10', 
          border: 'border-amber-500/20',
          glow: 'shadow-amber-900/20',
          label: 'System Warning'
      };
      case 'success': return { 
          icon: Zap, 
          color: 'text-emerald-500', 
          bg: 'bg-emerald-500/10', 
          border: 'border-emerald-500/20',
          glow: 'shadow-emerald-900/20',
          label: 'Evolution Update'
      };
      default: return { 
          icon: Info, 
          color: 'text-indigo-500', 
          bg: 'bg-indigo-500/10', 
          border: 'border-indigo-500/20',
          glow: 'shadow-indigo-900/20',
          label: 'Global Info'
      };
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Cyber Header */}
      <div className="relative overflow-hidden bg-slate-900/40 border border-white/5 p-12 rounded-[4rem] backdrop-blur-3xl">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full -mr-40 -mt-40 animate-pulse"></div>
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 h-full">
              <div>
                  <div className="flex items-center gap-4 mb-3">
                      <Megaphone className="text-indigo-500 animate-pulse" size={24} />
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Propulsion Broadcast Engine</p>
                  </div>
                  <h1 className="text-5xl font-black text-white tracking-tighter">Command Transmission</h1>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-3 leading-relaxed">
                      Managing {announcements.length} active protocols <span className="mx-2 text-slate-800">|</span> 
                      <span className="text-white"> Instant synchronization across entire node network</span>
                  </p>
              </div>
              <div className="flex items-center gap-4">
                  <button 
                    onClick={fetchAnnouncements}
                    className="p-5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-slate-400 hover:text-white transition-all shadow-xl shadow-black/20"
                  >
                      <RefreshCcw size={20} className={cn(loading && "animate-spin")} />
                  </button>
                  <AppButton 
                    variant="primary" 
                    icon={Send} 
                    onClick={() => navigate('/super-admin/announcements/new')}
                    className="rounded-[2rem] shadow-2xl shadow-indigo-900/40 h-16 px-10 uppercase text-xs font-black tracking-[0.2em]"
                  >
                    Initiate Broadcast
                  </AppButton>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* History / Active Broadcasts */}
        <div className="lg:col-span-8 space-y-8">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.4em] ml-4 flex items-center gap-3">
                <History size={16} className="text-indigo-500" />
                Transmission History
            </h2>
            
            <div className="space-y-6">
                {loading && announcements.length === 0 ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-slate-900/40 animate-pulse rounded-[3rem] border border-white/5" />
                    ))
                ) : announcements.length > 0 ? (
                    announcements.map(ann => {
                        const config = getTypeConfig(ann.type);
                        const Icon = config.icon;
                        return (
                            <div key={ann.id} className="group relative bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-8 flex flex-col md:flex-row gap-8 items-center transition-all duration-500 hover:border-indigo-500/30 hover:bg-slate-900/60 shadow-2xl">
                                <div className={cn("w-20 h-20 rounded-[2.2rem] flex items-center justify-center shrink-0 border transition-all duration-700 shadow-2xl", config.bg, config.border, config.color, "group-hover:scale-110 group-hover:rotate-6")}>
                                    <Icon size={32} />
                                </div>
                                
                                <div className="flex-1 space-y-3 text-center md:text-left">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                        <h3 className="text-2xl font-black text-white tracking-tight">{ann.title}</h3>
                                        <div className={cn("px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", config.bg, config.border, config.color)}>
                                            {config.label}
                                        </div>
                                        {ann.target_shop_id && (
                                            <div className="bg-white/5 border border-white/10 text-slate-400 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                                <Target size={10} className="text-indigo-500" />
                                                Targeted Node
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-slate-400 font-bold text-sm leading-relaxed max-w-2xl">{ann.message}</p>
                                    
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2">
                                        <div className="flex items-center gap-2 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                                            <Clock size={12} className="text-indigo-500" />
                                            Deployed: {new Date(ann.created_at).toLocaleDateString()}
                                        </div>
                                        {ann.expires_at && (
                                            <div className="flex items-center gap-2 text-rose-500/60 text-[10px] font-black uppercase tracking-widest">
                                                <Calendar size={12} />
                                                Expiring: {new Date(ann.expires_at).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleDelete(ann.id)}
                                    className="w-16 h-16 rounded-[2rem] bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 shadow-xl shadow-rose-950/20 active:scale-90"
                                >
                                    <Trash2 size={24} />
                                </button>
                            </div>
                        );
                    })
                ) : (
                    <div className="py-32 text-center bg-slate-900/20 rounded-[4rem] border-4 border-dashed border-white/5 flex flex-col items-center justify-center">
                        <Megaphone className="text-slate-800 mb-8" size={80} />
                        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">No Active Broadcasts</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Awaiting next command transmission...</p>
                    </div>
                )}
            </div>
        </div>

        {/* Global Statistics / Metrics */}
        <div className="lg:col-span-4 space-y-8">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.4em] ml-4">Network Telemetry</h2>
            
            <div className="bg-indigo-600 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl shadow-indigo-900/40">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-32 -mt-32"></div>
                <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-xl border border-white/20">
                            <Zap size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Total Transmissions</p>
                            <h3 className="text-4xl font-black text-white tracking-tighter tabular-nums">{announcements.length}</h3>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-3xl p-5 border border-white/10 backdrop-blur-md">
                            <p className="text-[8px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-1">Critical Alerts</p>
                            <p className="text-2xl font-black text-white tabular-nums">{announcements.filter(a => a.type === 'urgent').length}</p>
                        </div>
                        <div className="bg-white/10 rounded-3xl p-5 border border-white/10 backdrop-blur-md">
                            <p className="text-[8px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-1">Global Reach</p>
                            <p className="text-2xl font-black text-white tabular-nums">{shops.length}</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowModal(true)}
                        className="w-full h-16 bg-white text-indigo-600 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95"
                    >
                        Deploy New Protocol
                    </button>
                </div>
            </div>

            <div className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-8 space-y-6">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-500" />
                    Broadcast Guidelines
                </h4>
                <ul className="space-y-4">
                    {[
                        'Use "Urgent" only for critical downtime.',
                        'Target specific shops for invoice alerts.',
                        'Include expiry dates for temporary offers.',
                        'Keep messages concise for mobile dashboard.'
                    ].map((tip, i) => (
                        <li key={i} className="flex items-start gap-3 text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tighter">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40 mt-1" />
                            {tip}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>

    </div>
  );
};

export default AnnouncementsPage;
