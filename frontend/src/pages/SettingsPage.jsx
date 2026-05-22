import React, { useState, useEffect } from 'react';
import { settingApi, authApi } from '../api/api';
import { 
  Settings, 
  Store, 
  Percent, 
  Save,
  ShieldCheck,
  Printer,
  ChefHat,
  BookOpen,
  PauseCircle,
  Clock,
  Package,
  Grid3X3,
  Calendar,
  Database,
  History,
  ShoppingCart,
  Truck,
  LayoutDashboard,
  Users,
  UserCog,
  BarChart3,
  Utensils,
  QrCode,
  Star,
  Coins
} from 'lucide-react';
import { AppButton, AppCard, FormInput, FormSelect, useToast } from '../components/ui';
import { cn } from '../utils/cn';
import { useSettings } from '../context/SettingsContext';
import PermissionsTab from '../components/settings/PermissionsTab';

const SettingsPage = () => {
  const toast = useToast();
  const { refreshSettings } = useSettings();
  const [groupedSettings, setGroupedSettings] = useState({});
  const [activeTab, setActiveTab] = useState('business');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [securityForm, setSecurityForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [securityLoading, setSecurityLoading] = useState(false);

  const tabs = [
    { id: 'business', label: 'Business Info', icon: Store },
    { id: 'billing', label: 'Currency & Tax', icon: Coins },
    { id: 'receipt_print', label: 'Receipt & Print', icon: Printer },
    { id: 'kot', label: 'KOT & Kitchen', icon: ChefHat },
    { id: 'naya_book', label: 'Naya Book', icon: BookOpen },
    { id: 'held_bills', label: 'Held Bills', icon: PauseCircle },
    { id: 'shifts', label: 'Shifts', icon: Clock },
    { id: 'stock_menu', label: 'Stock & Menu', icon: Package },
    { id: 'orders_tables', label: 'Orders & Tables', icon: Grid3X3 },
    { id: 'reservations', label: 'Reservations', icon: Calendar },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'permissions', label: 'Employee Permissions', icon: UserCog },
    { id: 'backup', label: 'Backup', icon: Database },
    { id: 'public_menu', label: 'Digital Menu', icon: QrCode },
    { id: 'loyalty', label: 'Loyalty Rewards', icon: Star },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await settingApi.getAll();
      setGroupedSettings(data.data);
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (group, key, value) => {
    setGroupedSettings(prev => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: {
          ...prev[group][key],
          value: value
        }
      }
    }));
  };

  const handleSaveSection = async (groupName) => {
    setSaving(true);
    try {
      // Extract values from our state for the backend
      const settingsToUpdate = {};
      Object.entries(groupedSettings[groupName]).forEach(([key, data]) => {
        settingsToUpdate[key] = data.value;
      });

      await settingApi.update({
        group_name: groupName,
        settings: settingsToUpdate
      });
      
      toast.success(`${tabs.find(t => t.id === groupName)?.label} updated successfully`);
      await refreshSettings(); // Sync global state
    } catch (err) {
      toast.error(`Failed to update settings: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
        toast.error('New passwords do not match');
        return;
    }
    if (securityForm.newPassword.length < 6) {
        toast.error('New password must be at least 6 characters');
        return;
    }
    setSecurityLoading(true);
    try {
        const { data } = await authApi.changePassword({
            currentPassword: securityForm.currentPassword,
            newPassword: securityForm.newPassword
        });
        if (data.success) {
            toast.success('Password updated successfully');
            setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }
    } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
        setSecurityLoading(false);
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">Synchronizing System Config...</p>
        </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200">
                  <Settings size={24} />
              </div>
              <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Settings</h2>
                  <p className="text-slate-400 text-sm font-medium">Global configuration for RestoLedger POS</p>
              </div>
          </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
          {/* Tabs Sidebar */}
          <aside className="lg:w-72 shrink-0">
              <div className="bg-white rounded-3xl border border-slate-100 p-2 shadow-sm sticky top-24">
                  {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === tab.id 
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                        )}
                      >
                          <tab.icon size={16} />
                          {tab.label}
                      </button>
                  ))}
              </div>
          </aside>

          {/* Settings Content */}
          <main className="flex-1 max-w-4xl">
              <div className="space-y-8">
                  {tabs.map((tab) => (
                      activeTab === tab.id && (
                        <div key={tab.id} className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <AppCard 
                                title={tab.label} 
                                icon={tab.icon}
                                headerAction={
                                    tab.id !== 'security' && tab.id !== 'permissions' && (
                                        <AppButton 
                                            size="sm" 
                                            variant="primary" 
                                            icon={Save} 
                                            onClick={() => handleSaveSection(tab.id)}
                                            loading={saving}
                                            className="px-6 rounded-xl"
                                        >
                                            Save {tab.label}
                                        </AppButton>
                                    )
                                }
                            >
                                {tab.id === 'permissions' ? (
                                    <PermissionsTab />
                                ) : tab.id === 'security' ? (
                                    <form onSubmit={handleSecuritySubmit} className="space-y-8 max-w-xl p-4">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Password</label>
                                                <FormInput 
                                                    type="password"
                                                    required
                                                    value={securityForm.currentPassword}
                                                    onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                                                    placeholder="Enter your current password"
                                                    className="bg-slate-50 border-slate-100 focus:bg-white h-14 rounded-2xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Password</label>
                                                <FormInput 
                                                    type="password"
                                                    required
                                                    value={securityForm.newPassword}
                                                    onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                                                    placeholder="Enter your new password"
                                                    className="bg-slate-50 border-slate-100 focus:bg-white h-14 rounded-2xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm New Password</label>
                                                <FormInput 
                                                    type="password"
                                                    required
                                                    value={securityForm.confirmPassword}
                                                    onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                                                    placeholder="Retype your new password"
                                                    className="bg-slate-50 border-slate-100 focus:bg-white h-14 rounded-2xl"
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-4">
                                            <AppButton
                                                type="submit"
                                                variant="primary"
                                                loading={securityLoading}
                                                className="px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-100"
                                            >
                                                Update Password
                                            </AppButton>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                                        {Object.entries(groupedSettings[tab.id] || {}).map(([key, setting]) => (
                                        <div key={key} className={cn(
                                            "space-y-2",
                                            setting.type === 'string' && key.includes('message') ? "md:col-span-2" : ""
                                        )}>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    {setting.label}
                                                </label>
                                            </div>

                                            {setting.type === 'boolean' ? (
                                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors">
                                                    <span className="text-xs font-bold text-slate-700">{setting.description}</span>
                                                    <div 
                                                        onClick={() => handleInputChange(tab.id, key, !setting.value)}
                                                        className={cn(
                                                            "w-12 h-6 rounded-full p-1 cursor-pointer transition-all duration-300",
                                                            setting.value ? "bg-indigo-600" : "bg-slate-300"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300",
                                                            setting.value ? "translate-x-6" : "translate-x-0"
                                                        )} />
                                                    </div>
                                                </div>
                                            ) : setting.type === 'select' ? (
                                                <FormSelect 
                                                    value={setting.value}
                                                    onChange={(e) => handleInputChange(tab.id, key, e.target.value)}
                                                    options={setting.options.map(opt => ({
                                                        value: opt,
                                                        label: opt.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                                                    }))}
                                                />
                                            ) : (
                                                <FormInput 
                                                    type={setting.type === 'number' ? 'number' : 'text'}
                                                    value={setting.value}
                                                    onChange={(e) => handleInputChange(tab.id, key, e.target.value)}
                                                    placeholder={setting.description}
                                                    className="bg-slate-50 border-slate-100 focus:bg-white"
                                                    readOnly={key === 'system_version'}
                                                />
                                            )}
                                            <p className="text-[9px] text-slate-400 italic px-1">{setting.description}</p>
                                        </div>
                                    ))}
                                    {(!groupedSettings[tab.id] || Object.keys(groupedSettings[tab.id]).length === 0) && (
                                        <div className="md:col-span-2 py-12 text-center">
                                            <p className="text-slate-400 text-sm italic">No settings found in this group.</p>
                                        </div>
                                    )}
                                </div>
                                )}
                            </AppCard>
                        </div>
                      )
                  ))}
              </div>
          </main>
      </div>
    </div>
  );
};

export default SettingsPage;
