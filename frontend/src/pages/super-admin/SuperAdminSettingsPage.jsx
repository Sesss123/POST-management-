import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Shield, 
  Database, 
  Bell, 
  Globe, 
  RefreshCw,
  Lock,
  Calendar,
  DollarSign,
  Mail,
  ShieldCheck,
  Server,
  MessageSquare,
  ToggleLeft,
  ToggleRight,
  Monitor,
  Info,
  ChevronRight,
  Activity,
  CreditCard,
  Key,
  ShieldAlert
} from 'lucide-react';
import { superAdminApi } from '../../api/api';
import { useToast } from '../../components/ui/Feedback';

const SuperAdminSettingsPage = () => {
  const [settings, setSettings] = useState({
    default_monthly_amount: '5000',
    grace_days: '7',
    lock_days: '14',
    support_contact: 'support@restoledger.com',
    backup_retention: '30',
    system_security_level: 'high',
    email_provider: 'smtp',
    sender_name: 'RestoLedger Notifications',
    sender_email: 'no-reply@restoledger.com',
    sms_gateway: 'twilio',
    platform_name: 'RestoLedger POS',
    maintenance_mode: 'false',
    primary_language: 'en',
    // API & Integration Keys
    genie_merchant_id: '',
    genie_api_key: '',
    genie_api_secret: '',
    sms_api_key: '',
    email_api_key: '',
    max_login_attempts: '5',
    session_expiry: '24',
    force_2fa_admins: 'false',
    // SMTP / Email Settings
    email_host: '',
    email_port: '587',
    email_user: '',
    email_pass: ''
  });
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await superAdminApi.getPlatformSettings();
      if (res.data.success) {
        setSettings(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (error) {
      showToast('Failed to fetch platform settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await superAdminApi.updatePlatformSettings(settings);
      if (res.data.success) {
        showToast('Platform settings updated successfully', 'success');
      }
    } catch (error) {
      showToast('Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <Settings className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 animate-pulse" size={24} />
        </div>
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Synchronizing Core Systems...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General Configuration', icon: Globe, color: 'indigo', desc: 'Brand identity & core interface' },
    { id: 'billing', label: 'Billing & Subscriptions', icon: DollarSign, color: 'emerald', desc: 'Pricing rules & grace periods' },
    { id: 'security', label: 'Security & Access', icon: Shield, color: 'rose', desc: 'Protection levels & authentication' },
    { id: 'notifications', label: 'System Comms', icon: Bell, color: 'purple', desc: 'Email, SMS & notification delivery' },
    { id: 'api', label: 'API & Integrations', icon: Key, color: 'blue', desc: 'External services & payment keys' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Glass Block */}
      <div className="relative overflow-hidden bg-slate-900/40 border border-white/5 p-10 rounded-[3rem] backdrop-blur-3xl group">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full -mr-40 -mt-40 group-hover:bg-indigo-600/10 transition-colors duration-1000"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                <Settings size={24} className="animate-spin-slow" />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">Platform Configuration</h1>
            </div>
            <p className="text-slate-400 font-medium text-lg ml-15">Architectural parameters for the RestoLedger SaaS ecosystem</p>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="group relative flex items-center gap-3 px-10 py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:opacity-50 text-white rounded-[2rem] font-black text-sm tracking-widest uppercase transition-all shadow-2xl shadow-indigo-900/40 active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
            {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} className="group-hover:scale-110 transition-transform" />}
            {saving ? 'Syncing...' : 'Deploy Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sleek Vertical Navigation */}
        <nav className="lg:col-span-4 xl:col-span-3 space-y-3">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-6 mb-6">Management Nodes</h3>
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full group flex items-start gap-4 p-5 rounded-[2rem] transition-all relative overflow-hidden ${
                activeTab === tab.id 
                ? 'bg-white/[0.03] border border-white/10 shadow-2xl' 
                : 'hover:bg-white/[0.02] border border-transparent hover:border-white/5'
              }`}
            >
              <div className={`mt-1 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                activeTab === tab.id 
                ? `bg-${tab.color}-500/20 text-${tab.color}-400 scale-110 shadow-lg shadow-${tab.color}-500/20` 
                : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300'
              }`}>
                <tab.icon size={22} />
              </div>
              <div className="text-left">
                <p className={`font-black text-sm tracking-tight transition-colors ${activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {tab.label}
                </p>
                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">{tab.desc}</p>
              </div>
              {activeTab === tab.id && (
                <div className={`absolute right-6 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-${tab.color}-500 shadow-[0_0_10px_rgba(var(--${tab.color}-500-rgb),0.8)]`}></div>
              )}
            </button>
          ))}
          
          <div className="mt-12 p-8 rounded-[2rem] bg-indigo-600/5 border border-indigo-500/10 flex items-center gap-4 group cursor-help">
             <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
               <Info size={20} />
             </div>
             <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-wider">
               Any changes made here take effect globally across all 120+ active restaurant nodes.
             </p>
          </div>
        </nav>

        {/* Dynamic Content Core */}
        <main className="lg:col-span-8 xl:col-span-9">
          <div className="bg-slate-900/40 border border-white/5 rounded-[3.5rem] p-12 backdrop-blur-xl relative min-h-[600px] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 opacity-20"></div>
            
            {/* Tab: General Configuration */}
            {activeTab === 'general' && (
              <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/10">
                    <Globe size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">General Configuration</h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Platform Identity & Localization</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Platform Global Alias</label>
                     <div className="relative group">
                       <Monitor className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={20} />
                       <input 
                         type="text" 
                         className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] py-5 pl-16 pr-8 text-white focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-all font-black text-lg tracking-tight"
                         value={settings.platform_name}
                         onChange={(e) => handleChange('platform_name', e.target.value)}
                         placeholder="Platform Name"
                       />
                     </div>
                   </div>

                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Root Interface Language</label>
                     <div className="relative group">
                       <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={20} />
                       <select 
                         className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] py-5 pl-16 pr-12 text-white focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-all font-black text-lg tracking-tight appearance-none cursor-pointer"
                         value={settings.primary_language}
                         onChange={(e) => handleChange('primary_language', e.target.value)}
                       >
                         <option value="en">English (Global Standard)</option>
                         <option value="si">Sinhala (Sri Lanka)</option>
                         <option value="ta">Tamil (Sri Lanka)</option>
                       </select>
                       <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 rotate-90" size={20} />
                     </div>
                   </div>
                </div>

                <div className="p-10 bg-rose-500/5 border border-rose-500/10 rounded-[2.5rem] flex items-center justify-between group">
                   <div className="space-y-2">
                     <div className="flex items-center gap-3">
                       <ShieldAlert size={20} className="text-rose-500" />
                       <h4 className="text-lg font-black text-white tracking-tight">Maintenance Engine</h4>
                     </div>
                     <p className="text-slate-400 font-medium max-w-md">Suspend all tenant access across the network for database migrations or upgrades.</p>
                   </div>
                   <button 
                     onClick={() => handleChange('maintenance_mode', settings.maintenance_mode === 'true' ? 'false' : 'true')}
                     className={`relative w-20 h-10 rounded-full transition-all duration-500 flex items-center px-1.5 ${
                       settings.maintenance_mode === 'true' ? 'bg-rose-500' : 'bg-slate-800'
                     }`}
                   >
                     <div className={`w-7 h-7 bg-white rounded-full shadow-lg transition-all duration-500 ${
                       settings.maintenance_mode === 'true' ? 'translate-x-10' : 'translate-x-0'
                     }`}></div>
                   </button>
                </div>
              </div>
            )}

            {/* Tab: Billing Configuration */}
            {activeTab === 'billing' && (
              <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/10">
                    <CreditCard size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Billing & Monetization</h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">SaaS Revenue & Retention Rules</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Default Base Rate (LKR)</label>
                     <div className="relative group">
                       <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                       <input 
                         type="number" 
                         className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] py-5 pl-16 pr-8 text-white focus:outline-none focus:border-emerald-500 focus:bg-slate-950 transition-all font-black text-lg tracking-tight"
                         value={settings.default_monthly_amount}
                         onChange={(e) => handleChange('default_monthly_amount', e.target.value)}
                       />
                     </div>
                   </div>

                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Grace Interval (Days)</label>
                     <div className="relative group">
                       <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                       <input 
                         type="number" 
                         className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] py-5 pl-16 pr-8 text-white focus:outline-none focus:border-emerald-500 focus:bg-slate-950 transition-all font-black text-lg tracking-tight"
                         value={settings.grace_days}
                         onChange={(e) => handleChange('grace_days', e.target.value)}
                       />
                     </div>
                   </div>

                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Termination Lock (Days)</label>
                     <div className="relative group">
                       <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                       <input 
                         type="number" 
                         className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] py-5 pl-16 pr-8 text-white focus:outline-none focus:border-emerald-500 focus:bg-slate-950 transition-all font-black text-lg tracking-tight"
                         value={settings.lock_days}
                         onChange={(e) => handleChange('lock_days', e.target.value)}
                       />
                     </div>
                   </div>

                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Billing Support Contact</label>
                     <div className="relative group">
                       <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                       <input 
                         type="email" 
                         className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] py-5 pl-16 pr-8 text-white focus:outline-none focus:border-emerald-500 focus:bg-slate-950 transition-all font-black text-lg tracking-tight"
                         value={settings.support_contact}
                         onChange={(e) => handleChange('support_contact', e.target.value)}
                       />
                     </div>
                   </div>
                </div>
              </div>
            )}

            {/* Tab: Security & Access */}
            {activeTab === 'security' && (
              <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 border border-rose-500/10">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Security & Access</h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Platform Hardening & Auth Policies</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Global Protection Level</label>
                        <div className="relative group">
                          <Shield size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-rose-500 transition-colors" />
                          <select 
                            className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] py-5 pl-16 pr-12 text-white focus:outline-none focus:border-rose-500 focus:bg-slate-950 transition-all font-black text-lg tracking-tight appearance-none"
                            value={settings.system_security_level}
                            onChange={(e) => handleChange('system_security_level', e.target.value)}
                          >
                            <option value="low">Basic Protocol (Low)</option>
                            <option value="medium">Standard Shield (Medium)</option>
                            <option value="high">Strict Lockdown (High)</option>
                          </select>
                          <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 rotate-90" size={20} />
                        </div>
                      </div>

                      <div className="p-8 bg-rose-500/5 border border-rose-500/10 rounded-[2.5rem] flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-white">Force Admin 2FA</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Requires OTP for all Root Accounts</p>
                        </div>
                        <button 
                          onClick={() => handleChange('force_2fa_admins', settings.force_2fa_admins === 'true' ? 'false' : 'true')}
                          className={`w-14 h-8 rounded-full transition-all duration-300 flex items-center px-1 ${
                            settings.force_2fa_admins === 'true' ? 'bg-rose-500' : 'bg-slate-800'
                          }`}
                        >
                          <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${
                            settings.force_2fa_admins === 'true' ? 'translate-x-6' : 'translate-x-0'
                          }`}></div>
                        </button>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Max Login Retries</label>
                          <input 
                            type="number" 
                            className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] py-5 px-8 text-white focus:outline-none focus:border-rose-500 focus:bg-slate-950 transition-all font-black text-lg tracking-tight"
                            value={settings.max_login_attempts}
                            onChange={(e) => handleChange('max_login_attempts', e.target.value)}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Session Expiry (Hrs)</label>
                          <input 
                            type="number" 
                            className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] py-5 px-8 text-white focus:outline-none focus:border-rose-500 focus:bg-slate-950 transition-all font-black text-lg tracking-tight"
                            value={settings.session_expiry}
                            onChange={(e) => handleChange('session_expiry', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="p-6 bg-slate-950 border border-white/5 rounded-[2rem] flex gap-4">
                        <Activity size={20} className="text-slate-600 shrink-0 mt-1" />
                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-widest">
                          High security level doubles rate limiting triggers and enables advanced behavioral monitoring on all endpoints.
                        </p>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* Tab: System Comms */}
            {activeTab === 'notifications' && (
              <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/10">
                    <Bell size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Communication Hub</h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">SMTP & Messaging Infrastructure</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Email Relay Node</label>
                     <div className="relative group">
                       <Server className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-500 transition-colors" size={20} />
                       <select 
                         className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] py-5 pl-16 pr-12 text-white focus:outline-none focus:border-purple-500 focus:bg-slate-950 transition-all font-black text-lg tracking-tight appearance-none"
                         value={settings.email_provider}
                         onChange={(e) => handleChange('email_provider', e.target.value)}
                       >
                         <option value="smtp">Standard SMTP Relay</option>
                         <option value="sendgrid">Twilio SendGrid API</option>
                         <option value="aws_ses">Amazon Simple Email</option>
                       </select>
                       <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 rotate-90" size={20} />
                     </div>
                   </div>

                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">SMS Integration Gateway</label>
                     <div className="relative group">
                       <MessageSquare className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-500 transition-colors" size={20} />
                       <select 
                         className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] py-5 pl-16 pr-12 text-white focus:outline-none focus:border-purple-500 focus:bg-slate-950 transition-all font-black text-lg tracking-tight appearance-none"
                         value={settings.sms_gateway}
                         onChange={(e) => handleChange('sms_gateway', e.target.value)}
                       >
                         <option value="twilio">Twilio (US/Global)</option>
                         <option value="textlocal">TextLocal (UK/IN)</option>
                         <option value="nexmo">Vonage Nexmo</option>
                         <option value="disabled">System Disabled</option>
                       </select>
                       <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 rotate-90" size={20} />
                     </div>
                   </div>

                   {settings.email_provider === 'smtp' && (
                     <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 p-10 bg-slate-950/50 border border-white/5 rounded-[2.5rem] animate-in slide-in-from-top-4 duration-500 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                          <Server size={80} className="text-purple-500" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Host Endpoint</label>
                          <input type="text" className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold" value={settings.email_host} onChange={(e) => handleChange('email_host', e.target.value)} placeholder="smtp.provider.com" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Port Protocol</label>
                          <input type="text" className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold" value={settings.email_port} onChange={(e) => handleChange('email_port', e.target.value)} placeholder="587" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Access Credentials (User)</label>
                          <input type="text" className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold" value={settings.email_user} onChange={(e) => handleChange('email_user', e.target.value)} />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Security Secret (Pass)</label>
                          <input type="password" className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold" value={settings.email_pass} onChange={(e) => handleChange('email_pass', e.target.value)} />
                        </div>
                     </div>
                   )}

                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Broadcast Sender Name</label>
                     <input 
                       type="text" 
                       className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] py-5 px-8 text-white focus:outline-none focus:border-purple-500 focus:bg-slate-950 transition-all font-black text-lg tracking-tight"
                       value={settings.sender_name}
                       onChange={(e) => handleChange('sender_name', e.target.value)}
                     />
                   </div>

                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Broadcast Origin Email</label>
                     <input 
                       type="email" 
                       className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] py-5 px-8 text-white focus:outline-none focus:border-purple-500 focus:bg-slate-950 transition-all font-black text-lg tracking-tight"
                       value={settings.sender_email}
                       onChange={(e) => handleChange('sender_email', e.target.value)}
                     />
                   </div>
                </div>
              </div>
            )}

            {/* Tab: API & Integrations */}
            {activeTab === 'api' && (
              <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/10">
                    <Key size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Deep Integrations</h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Payment Gateways & External Handlers</p>
                  </div>
                </div>

                <div className="space-y-12">
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] border-l-2 border-blue-500 pl-4">Dialog Genie Protocol</h3>
                        <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] font-black text-blue-500 uppercase tracking-widest">Active Link</div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Merchant Identifier</label>
                           <input type="text" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 text-white font-mono text-sm" value={settings.genie_merchant_id} onChange={(e) => handleChange('genie_merchant_id', e.target.value)} />
                         </div>
                         <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Internal API Access Key</label>
                           <input type="password" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 text-white font-mono text-sm" value={settings.genie_api_key} onChange={(e) => handleChange('genie_api_key', e.target.value)} />
                         </div>
                         <div className="md:col-span-2 space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Encrypted Security Secret</label>
                           <input type="password" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 text-white font-mono text-sm" value={settings.genie_api_secret} onChange={(e) => handleChange('genie_api_secret', e.target.value)} />
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] border-l-2 border-indigo-500 pl-4">External Handlers</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">SMS Cluster Authorization</label>
                           <input type="password" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 text-white font-mono text-sm" value={settings.sms_api_key} onChange={(e) => handleChange('sms_api_key', e.target.value)} />
                         </div>
                         <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Email Node Authorization</label>
                           <input type="password" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 text-white font-mono text-sm" value={settings.email_api_key} onChange={(e) => handleChange('email_api_key', e.target.value)} />
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}
            
            {/* Background Aesthetic Elements */}
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full -mb-32 -mr-32"></div>
          </div>

          <div className="mt-8 flex items-center justify-between px-10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Core Status: Operational</p>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <RefreshCw size={12} className="animate-spin-slow" />
              <p className="text-[9px] font-bold uppercase tracking-widest">Node Synced: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminSettingsPage;
