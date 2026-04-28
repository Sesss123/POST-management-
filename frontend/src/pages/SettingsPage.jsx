import React, { useState, useEffect } from 'react';
import { settingApi } from '../api/api';
import { 
  Settings, 
  Store, 
  Percent, 
  MapPin, 
  Phone, 
  Save,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { AppButton, AppCard, FormInput, useToast } from '../components/ui';

const SettingsPage = () => {
  const toast = useToast();
  const [settings, setSettings] = useState({
    restaurant_name: '',
    restaurant_address: '',
    restaurant_phone: '',
    currency_symbol: 'Rs.',
    tax_enabled: 'false',
    tax_rate: '0',
    service_charge_enabled: 'true',
    service_charge_rate: '10',
    shift_enforcement_enabled: 'true',
    kot_printing_enabled: 'true',
    stock_tracking_enabled: 'true',
    discount_approval_limit: '1000',
    receipt_footer_message: 'Thank you for your visit!'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await settingApi.getAll();
      setSettings(prev => ({ ...prev, ...data.data }));
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingApi.update(settings);
      toast.success('Settings updated successfully');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold">Loading system configurations...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Settings size={24} />
              </div>
              <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">System Settings</h2>
                  <p className="text-slate-400 text-sm font-medium">Configure your restaurant identity and billing rules</p>
              </div>
          </div>
          <AppButton 
            variant="primary" 
            icon={Save} 
            onClick={handleUpdate} 
            loading={saving}
            className="px-8"
          >
              Save All Changes
          </AppButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Identity Section */}
          <AppCard title="Restaurant Identity" icon={Store}>
              <div className="space-y-6">
                  <FormInput 
                    label="Restaurant Name" 
                    placeholder="e.g. Blue Lagoon Restaurant"
                    icon={Store}
                    value={settings.restaurant_name}
                    onChange={(e) => setSettings({ ...settings, restaurant_name: e.target.value })}
                  />
                  <FormInput 
                    label="Address" 
                    placeholder="123 Main Street, Colombo"
                    icon={MapPin}
                    value={settings.restaurant_address}
                    onChange={(e) => setSettings({ ...settings, restaurant_address: e.target.value })}
                  />
                  <FormInput 
                    label="Contact Number" 
                    placeholder="+94 77 123 4567"
                    icon={Phone}
                    value={settings.restaurant_phone}
                    onChange={(e) => setSettings({ ...settings, restaurant_phone: e.target.value })}
                  />
                  <FormInput 
                    label="Receipt Footer Message" 
                    placeholder="Thank you for visiting us!"
                    value={settings.receipt_footer_message}
                    onChange={(e) => setSettings({ ...settings, receipt_footer_message: e.target.value })}
                  />
              </div>
          </AppCard>

          {/* Billing Rules */}
          <AppCard title="Billing & Tax Rules" icon={Percent}>
              <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700">Tax Settings</span>
                    <input 
                      type="checkbox"
                      checked={settings.tax_enabled === 'true' || settings.tax_enabled === true}
                      onChange={(e) => setSettings({ ...settings, tax_enabled: String(e.target.checked) })}
                      className="w-4 h-4 accent-indigo-600"
                    />
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <FormInput 
                        label="Tax Rate (%)" 
                        type="number"
                        placeholder="0"
                        icon={Percent}
                        value={settings.tax_rate}
                        disabled={settings.tax_enabled === 'false' || settings.tax_enabled === false}
                        onChange={(e) => setSettings({ ...settings, tax_rate: e.target.value })}
                      />
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700">Service Charge</span>
                    <input 
                      type="checkbox"
                      checked={settings.service_charge_enabled === 'true' || settings.service_charge_enabled === true}
                      onChange={(e) => setSettings({ ...settings, service_charge_enabled: String(e.target.checked) })}
                      className="w-4 h-4 accent-indigo-600"
                    />
                  </div>
                  <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                      <FormInput 
                        label="Service Charge Rate (%)" 
                        type="number"
                        placeholder="10"
                        icon={Percent}
                        value={settings.service_charge_rate}
                        disabled={settings.service_charge_enabled === 'false' || settings.service_charge_enabled === false}
                        onChange={(e) => setSettings({ ...settings, service_charge_rate: e.target.value })}
                      />
                  </div>

                  <FormInput 
                    label="Currency Symbol" 
                    placeholder="Rs."
                    value={settings.currency_symbol}
                    onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
                  />
              </div>
          </AppCard>

          {/* Security & Access */}
          <AppCard title="Security & Operations" icon={ShieldCheck}>
              <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                      <FormInput 
                        label="Max Discount without Approval (Fixed Amount)" 
                        type="number"
                        value={settings.discount_approval_limit}
                        onChange={(e) => setSettings({ ...settings, discount_approval_limit: e.target.value })}
                      />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <div className="flex items-center gap-3">
                          <ShieldCheck className="text-indigo-600" size={18} />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-indigo-900 leading-none">Enforce Shifts</span>
                            <span className="text-[10px] font-medium text-indigo-400 uppercase mt-1">Cashier cannot bill without open shift</span>
                          </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.shift_enforcement_enabled === 'true' || settings.shift_enforcement_enabled === true}
                        onChange={(e) => setSettings({ ...settings, shift_enforcement_enabled: String(e.target.checked) })}
                        className="w-5 h-5 accent-indigo-600 cursor-pointer"
                      />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                          <CheckCircle2 className="text-emerald-500" size={18} />
                          <span className="text-sm font-bold text-slate-700">KOT Printing</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.kot_printing_enabled === 'true' || settings.kot_printing_enabled === true}
                        onChange={(e) => setSettings({ ...settings, kot_printing_enabled: String(e.target.checked) })}
                        className="w-5 h-5 accent-indigo-600 cursor-pointer"
                      />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                          <CheckCircle2 className="text-emerald-500" size={18} />
                          <span className="text-sm font-bold text-slate-700">Stock Tracking</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.stock_tracking_enabled === 'true' || settings.stock_tracking_enabled === true}
                        onChange={(e) => setSettings({ ...settings, stock_tracking_enabled: String(e.target.checked) })}
                        className="w-5 h-5 accent-indigo-600 cursor-pointer"
                      />
                  </div>

                  <p className="text-[10px] font-medium text-slate-400 text-center uppercase tracking-widest mt-4">
                      V 2.1.0 - Real World Upgrade Ready
                  </p>
              </div>
          </AppCard>
      </div>
    </div>
  );
};

export default SettingsPage;
