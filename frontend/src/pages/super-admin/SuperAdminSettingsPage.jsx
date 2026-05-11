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
  Monitor
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
    primary_language: 'en'
  });
  const [activeTab, setActiveTab] = useState('billing');
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading platform configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Platform Settings</h1>
          <p className="text-slate-400 mt-1">Configure global SaaS rules and system parameters</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-900/30 group"
        >
          {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} className="group-hover:scale-110 transition-transform" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation / Sections */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'billing', label: 'Billing & Subscriptions', icon: DollarSign },
            { id: 'security', label: 'Security & Access', icon: Shield },
            { id: 'backups', label: 'Data & Backups', icon: Database },
            { id: 'notifications', label: 'System Comms', icon: Bell },
            { id: 'general', label: 'General Configuration', icon: Globe },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Billing Configuration */}
          {activeTab === 'billing' && (
          <section className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <DollarSign size={20} />
              </div>
              <h2 className="text-xl font-black text-white">Billing & Subscriptions</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Default Monthly Rate (Rs.)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="number" 
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
                    value={settings.default_monthly_amount}
                    onChange={(e) => handleChange('default_monthly_amount', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Grace Period (Days)</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="number" 
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
                    value={settings.grace_days}
                    onChange={(e) => handleChange('grace_days', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lock After Expire (Days)</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="number" 
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
                    value={settings.lock_days}
                    onChange={(e) => handleChange('lock_days', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Support Email Contact</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="email" 
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
                    value={settings.support_contact}
                    onChange={(e) => handleChange('support_contact', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>
          )}

          {/* Security & Access */}
          {activeTab === 'security' && (
          <section className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                <Shield size={20} />
              </div>
              <h2 className="text-xl font-black text-white">Security & Access</h2>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-950 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Security Level</h4>
                    <p className="text-xs text-slate-500 mt-1">Platform-wide strictness for sessions & API</p>
                  </div>
                </div>
                <select 
                  className="bg-slate-900 border border-white/10 rounded-xl py-2 px-4 text-white font-bold text-sm outline-none"
                  value={settings.system_security_level}
                  onChange={(e) => handleChange('system_security_level', e.target.value)}
                >
                  <option value="low">Standard</option>
                  <option value="medium">Enhanced</option>
                  <option value="high">Strict (Recommended)</option>
                </select>
              </div>
            </div>
          </section>
          )}

          {/* Data & Backups */}
          {activeTab === 'backups' && (
          <section className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Database size={20} />
              </div>
              <h2 className="text-xl font-black text-white">Data & Backups</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-950 border border-white/5 rounded-2xl">
                <div>
                  <h4 className="text-sm font-bold text-white">Backup Retention</h4>
                  <p className="text-xs text-slate-500 mt-1">Number of days to keep automated backups</p>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    className="w-20 bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-center text-white font-bold"
                    value={settings.backup_retention}
                    onChange={(e) => handleChange('backup_retention', e.target.value)}
                  />
                  <span className="text-xs font-bold text-slate-400">Days</span>
                </div>
              </div>
            </div>
          </section>
          )}

          {/* System Comms */}
          {activeTab === 'notifications' && (
          <section className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Bell size={20} />
              </div>
              <h2 className="text-xl font-black text-white">System Comms</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Provider</label>
                <div className="relative">
                  <Server className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <select 
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-bold appearance-none"
                    value={settings.email_provider}
                    onChange={(e) => handleChange('email_provider', e.target.value)}
                  >
                    <option value="smtp">Standard SMTP</option>
                    <option value="sendgrid">SendGrid API</option>
                    <option value="aws_ses">Amazon SES</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">SMS Gateway</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <select 
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-bold appearance-none"
                    value={settings.sms_gateway}
                    onChange={(e) => handleChange('sms_gateway', e.target.value)}
                  >
                    <option value="twilio">Twilio</option>
                    <option value="textlocal">TextLocal</option>
                    <option value="nexmo">Vonage (Nexmo)</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">System Sender Name</label>
                <div className="relative">
                  <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
                    value={settings.sender_name}
                    onChange={(e) => handleChange('sender_name', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">System Sender Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="email" 
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
                    value={settings.sender_email}
                    onChange={(e) => handleChange('sender_email', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>
          )}

          {/* General Configuration */}
          {activeTab === 'general' && (
          <section className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Globe size={20} />
              </div>
              <h2 className="text-xl font-black text-white">General Configuration</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Platform Brand Name</label>
                <div className="relative">
                  <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
                    value={settings.platform_name}
                    onChange={(e) => handleChange('platform_name', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Default Interface Language</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <select 
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-bold appearance-none"
                    value={settings.primary_language}
                    onChange={(e) => handleChange('primary_language', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="si">Sinhala</option>
                    <option value="ta">Tamil</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                <div>
                  <h4 className="text-sm font-bold text-rose-500">Maintenance Mode</h4>
                  <p className="text-xs text-rose-400/70 mt-1">Suspend access for all tenants (except Super Admins)</p>
                </div>
                <button 
                  onClick={() => handleChange('maintenance_mode', settings.maintenance_mode === 'true' ? 'false' : 'true')}
                  className={`flex items-center justify-center p-2 rounded-xl transition-all ${settings.maintenance_mode === 'true' ? 'text-rose-500 bg-rose-500/20' : 'text-slate-500 bg-slate-800'}`}
                >
                  {settings.maintenance_mode === 'true' ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
              </div>
            </div>
          </section>
          )}

          {/* Footer Info */}
          <div className="flex items-center gap-3 px-8 text-slate-500">
            <RefreshCw size={14} />
            <p className="text-[10px] font-black uppercase tracking-widest">
              Last synchronized: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettingsPage;
