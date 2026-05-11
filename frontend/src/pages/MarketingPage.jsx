import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Send, 
  History, 
  Users, 
  MessageSquare, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock,
  Info,
  ArrowUpRight,
  UserPlus,
  AlertCircle
} from 'lucide-react';
import { 
  AppCard, 
  StatCard, 
  AppButton, 
  AppTable, 
  FormInput, 
  FormSelect, 
  Badge, 
  Skeleton,
  useToast
} from '../components/ui';
import { cn } from '../utils/cn';
import apiClient from '../api/apiClient';

const MarketingPage = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    message: '',
    targetGroup: 'all'
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/marketing/campaigns');
      setCampaigns(data.data);
    } catch (err) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await apiClient.post('/marketing/campaigns', newCampaign);
      toast.success('Campaign initiated successfully');
      setShowCreate(false);
      setNewCampaign({ name: '', message: '', targetGroup: 'all' });
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create campaign');
    } finally {
      setSending(false);
    }
  };

  if (loading && campaigns.length === 0) {
    return <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Megaphone size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Marketing Center</h2>
            <p className="text-xs font-bold text-slate-400">Engage your customers with SMS campaigns</p>
          </div>
        </div>
        <AppButton 
          icon={Plus} 
          variant="primary" 
          onClick={() => setShowCreate(true)}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl shadow-xl shadow-indigo-100"
        >
          Create New Campaign
        </AppButton>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Campaigns" value={campaigns.length} icon={Megaphone} variant="primary" />
        <StatCard title="Total Sent" value={campaigns.reduce((acc, c) => acc + (c.successful_sends || 0), 0)} icon={Send} variant="success" />
        <StatCard title="Success Rate" value={`${Math.round((campaigns.reduce((acc, c) => acc + (c.successful_sends || 0), 0) / (campaigns.reduce((acc, c) => acc + (c.total_recipients || 1), 0) || 1)) * 100)}%`} icon={CheckCircle} variant="info" />
        <StatCard title="Active Audience" value="-" icon={Users} variant="default" subtitle="Auto-calculated" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Campaign Creation Form */}
        {showCreate && (
          <div className="lg:col-span-1 animate-in slide-in-from-left-4 duration-300">
            <AppCard title="Design Campaign" icon={Plus} footerAction={
              <div className="flex gap-2 w-full">
                <AppButton variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">Cancel</AppButton>
                <AppButton variant="primary" onClick={handleCreate} loading={sending} className="flex-1">Launch</AppButton>
              </div>
            }>
              <form className="space-y-4">
                <FormInput 
                  label="Campaign Name" 
                  placeholder="e.g. Weekend Discount Offer" 
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                />
                <FormSelect 
                  label="Target Audience" 
                  options={[
                    { value: 'all', label: 'All Customers' },
                    { value: 'debtors', label: 'Outstanding Debtors' },
                    { value: 'loyalty_members', label: 'Loyalty Members Only' }
                  ]}
                  value={newCampaign.targetGroup}
                  onChange={(e) => setNewCampaign({...newCampaign, targetGroup: e.target.value})}
                />
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Message Content</label>
                  <textarea 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-600 focus:bg-white transition-all outline-none min-h-[120px]"
                    placeholder="Hello {name}, enjoy 20% off today at RestoLedger!"
                    value={newCampaign.message}
                    onChange={(e) => setNewCampaign({...newCampaign, message: e.target.value})}
                  />
                  <div className="flex items-center gap-2 px-1">
                    <Badge variant="info" className="text-[8px] py-0.5">Tip</Badge>
                    <p className="text-[10px] font-bold text-slate-400 italic">Use {'{name}'} for personalized messages</p>
                  </div>
                </div>
              </form>
            </AppCard>
          </div>
        )}

        {/* Campaign History */}
        <div className={cn("space-y-6", showCreate ? "lg:col-span-2" : "lg:col-span-3")}>
          <AppCard title="Campaign History" icon={History} subtitle="Track performance of past blasts">
             <div className="space-y-4 mt-4">
                {campaigns.map((camp) => (
                  <div key={camp.id} className="p-5 bg-slate-50 rounded-[28px] border border-slate-100 flex flex-col sm:flex-row justify-between gap-6 transition-all hover:bg-white hover:shadow-xl hover:border-indigo-100 group">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-black text-slate-900 tracking-tight">{camp.name}</h4>
                        <Badge variant={
                          camp.status === 'completed' ? 'success' : 
                          camp.status === 'failed' ? 'danger' : 
                          camp.status === 'sending' ? 'warning' : 'default'
                        }>
                          {camp.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs font-bold text-slate-500 leading-relaxed italic border-l-4 border-indigo-200 pl-3">
                        "{camp.message}"
                      </p>
                      <div className="flex flex-wrap gap-4 pt-2">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Users size={14} />
                          <span className="text-[10px] font-black uppercase">{camp.target_group} Group</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock size={14} />
                          <span className="text-[10px] font-black uppercase">{new Date(camp.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 sm:border-l border-slate-200 sm:pl-8">
                       <div className="text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Success</p>
                          <p className="text-xl font-black text-emerald-600">{camp.successful_sends}</p>
                       </div>
                       <div className="text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Failed</p>
                          <p className="text-xl font-black text-rose-600">{camp.failed_sends}</p>
                       </div>
                       <div className="flex flex-col items-center justify-center">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                            camp.status === 'completed' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                          )}>
                             {camp.status === 'completed' ? <CheckCircle size={24} /> : <Clock size={24} />}
                          </div>
                       </div>
                    </div>
                  </div>
                ))}

                {campaigns.length === 0 && (
                  <div className="py-20 text-center space-y-4">
                     <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                        <MessageSquare size={40} />
                     </div>
                     <p className="text-slate-400 font-bold text-sm italic">No marketing campaigns found. Start reaching your customers today!</p>
                  </div>
                )}
             </div>
          </AppCard>
        </div>
      </div>
      
      {/* Quick Actions / Integration Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-indigo-900 rounded-[40px] p-8 text-white relative overflow-hidden group shadow-2xl shadow-indigo-200">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
                  <Megaphone size={160} />
              </div>
              <div className="relative z-10 space-y-4">
                  <Badge className="bg-white/10 text-white border-white/20">SMS Feature</Badge>
                  <h3 className="text-3xl font-black tracking-tighter">Automate Naya Reminders</h3>
                  <p className="text-indigo-100 font-medium text-sm leading-relaxed max-w-md">
                      Reduce outstanding credit by automatically sending polite SMS reminders to your debtors. Enable this in System Settings.
                  </p>
                  <AppButton variant="secondary" className="bg-white text-indigo-900 border-none px-8">Configure Reminders</AppButton>
              </div>
          </div>

          <div className="bg-emerald-900 rounded-[40px] p-8 text-white relative overflow-hidden group shadow-2xl shadow-emerald-200">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
                  <Star size={160} />
              </div>
              <div className="relative z-10 space-y-4">
                  <Badge className="bg-white/10 text-white border-white/20">Loyalty Perk</Badge>
                  <h3 className="text-3xl font-black tracking-tighter">Engage Loyal Fans</h3>
                  <p className="text-emerald-100 font-medium text-sm leading-relaxed max-w-md">
                      Send exclusive promotional offers to your loyalty members. High-conversion marketing made simple.
                  </p>
                  <AppButton variant="secondary" className="bg-white text-emerald-900 border-none px-8">View Loyalty Members</AppButton>
              </div>
          </div>
      </div>
    </div>
  );
};

const Star = ({ size, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default MarketingPage;
