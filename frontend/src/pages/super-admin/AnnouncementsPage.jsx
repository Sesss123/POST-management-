import React, { useState, useEffect } from 'react';
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
  History
} from 'lucide-react';
import { AppButton, AppCard, AppModal, useToast, FormInput, FormSelect } from '../../components/ui';
import { cn } from '../../utils/cn';

const AnnouncementsPage = () => {
  const toast = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    target_shop_id: '',
    expires_at: ''
  });

  useEffect(() => {
    fetchAnnouncements();
    fetchShops();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data } = await superAdminApi.getAnnouncements();
      if (data.success) setAnnouncements(data.data);
    } catch (err) {
      toast.error('Failed to fetch announcements');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await superAdminApi.createAnnouncement({
        ...formData,
        target_shop_id: formData.target_shop_id || null,
        expires_at: formData.expires_at || null
      });
      toast.success('Announcement broadcasted!');
      setShowModal(false);
      setFormData({ title: '', message: '', type: 'info', target_shop_id: '', expires_at: '' });
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to send announcement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this announcement?')) return;
    try {
      await superAdminApi.deleteAnnouncement(id);
      toast.success('Announcement removed');
      fetchAnnouncements();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'urgent': return 'bg-rose-50 text-rose-600 border-rose-100 ring-rose-50';
      case 'warning': return 'bg-amber-50 text-amber-600 border-amber-100 ring-amber-50';
      case 'success': return 'bg-emerald-50 text-emerald-600 border-emerald-100 ring-emerald-50';
      default: return 'bg-indigo-50 text-indigo-600 border-indigo-100 ring-indigo-50';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Megaphone className="text-indigo-600" size={32} />
            Broadcast System
          </h1>
          <p className="text-slate-500 font-medium mt-1">Send notifications to all shop owners</p>
        </div>
        <AppButton 
          variant="primary" 
          icon={Send} 
          onClick={() => setShowModal(true)}
          className="rounded-2xl shadow-xl shadow-indigo-100 h-14 px-8 uppercase text-xs font-black tracking-widest"
        >
          New Broadcast
        </AppButton>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          [1, 2].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-[2rem]"></div>)
        ) : announcements.length > 0 ? (
          announcements.map(ann => (
            <div key={ann.id} className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-6 items-start transition-all hover:shadow-xl hover:shadow-slate-200/40">
              <div className={cn("w-16 h-16 rounded-[2rem] flex items-center justify-center shrink-0 border-2 ring-8", getTypeStyles(ann.type))}>
                {ann.type === 'urgent' ? <AlertTriangle size={28} /> : 
                 ann.type === 'warning' ? <Bell size={28} /> : <Info size={28} />}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                   <h3 className="text-xl font-black text-slate-900">{ann.title}</h3>
                   <span className={cn(
                     "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                     getTypeStyles(ann.type)
                   )}>{ann.type}</span>
                   {ann.target_shop_id && (
                     <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        Targeted
                     </span>
                   )}
                </div>
                <p className="text-slate-600 font-medium leading-relaxed">{ann.message}</p>
                <div className="flex items-center gap-4 pt-2">
                   <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <Calendar size={12} />
                      {new Date(ann.created_at).toLocaleDateString()}
                   </div>
                   {ann.expires_at && (
                     <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-black uppercase tracking-widest">
                        <History size={12} />
                        Expires: {new Date(ann.expires_at).toLocaleDateString()}
                     </div>
                   )}
                </div>
              </div>

              <button 
                onClick={() => handleDelete(ann.id)}
                className="p-4 rounded-2xl bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all self-center"
              >
                <Trash2 size={24} />
              </button>
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200">
            <Megaphone className="mx-auto text-slate-200 mb-4" size={64} />
            <p className="text-slate-400 font-bold text-lg">No active broadcasts</p>
          </div>
        )}
      </div>

      {/* Announcement Modal */}
      <AppModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Broadcast New Announcement"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput 
              label="Announcement Title"
              placeholder="e.g. System Maintenance"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alert Type</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all appearance-none cursor-pointer"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="info">Information (Indigo)</option>
                  <option value="success">Success / New Feature (Emerald)</option>
                  <option value="warning">Warning (Amber)</option>
                  <option value="urgent">Urgent / Alert (Rose)</option>
                </select>
            </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Content</label>
             <textarea 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all h-32 resize-none shadow-inner"
                placeholder="Type your message here for shop owners..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Shop (Optional)</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all appearance-none cursor-pointer"
                  value={formData.target_shop_id}
                  onChange={(e) => setFormData({ ...formData, target_shop_id: e.target.value })}
                >
                  <option value="">All Shops</option>
                  {shops.map(shop => (
                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                  ))}
                </select>
             </div>
             <FormInput 
               label="Expiry Date (Optional)"
               type="date"
               value={formData.expires_at}
               onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
             />
          </div>

          <div className="flex gap-4 pt-4">
            <AppButton variant="secondary" className="flex-1 rounded-2xl h-14" onClick={() => setShowModal(false)}>Discard</AppButton>
            <AppButton 
              type="submit" 
              variant="primary" 
              icon={Send}
              className="flex-[2] rounded-2xl h-14 shadow-xl shadow-indigo-100 uppercase font-black tracking-widest"
            >
              SEND BROADCAST
            </AppButton>
          </div>
        </form>
      </AppModal>
    </div>
  );
};

export default AnnouncementsPage;
