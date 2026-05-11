import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Phone, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  ChevronRight,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { reservationApi, tableApi } from '../api/api';
import { AppButton, AppCard, AppModal, FormInput, useToast, StatusBadge } from '../components/ui';
import { cn } from '../utils/cn';

const ReservationPage = () => {
  const toast = useToast();
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ date: new Date().toISOString().split('T')[0], status: '' });
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRes, setSelectedRes] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '',
    guests_count: 1,
    table_id: '',
    note: ''
  });

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resData, tableData] = await Promise.all([
        reservationApi.getAll(filter),
        tableApi.getAll()
      ]);
      setReservations(resData.data.data);
      setTables(tableData.data.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await reservationApi.create(formData);
      toast.success('Reservation created successfully');
      setShowAddModal(false);
      setFormData({
        customer_name: '',
        phone: '',
        reservation_date: new Date().toISOString().split('T')[0],
        reservation_time: '',
        guests_count: 1,
        table_id: '',
        note: ''
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create reservation');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
      try {
          await reservationApi.updateStatus(id, status);
          toast.success(`Reservation marked as ${status}`);
          fetchData();
      } catch (err) {
          toast.error('Failed to update status');
      }
  };

  const handleAssignTable = async (tableId) => {
      setProcessing(true);
      try {
          await reservationApi.assignTable(selectedRes.id, tableId);
          toast.success('Table assigned');
          setShowAssignModal(false);
          fetchData();
      } catch (err) {
          toast.error('Failed to assign table');
      } finally {
          setProcessing(false);
      }
  };

  const stats = {
      total: reservations.length,
      pending: reservations.filter(r => r.status === 'pending').length,
      confirmed: reservations.filter(r => r.status === 'confirmed').length,
      arrived: reservations.filter(r => r.status === 'arrived').length
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Reservations</h2>
          <p className="text-slate-500 font-medium mt-1">Manage guest bookings and table assignments</p>
        </div>
        <AppButton 
          variant="primary" 
          size="lg" 
          icon={Plus}
          onClick={() => setShowAddModal(true)}
        >
          NEW RESERVATION
        </AppButton>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <AppCard className="bg-white" bodyClassName="p-6">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                      <Calendar size={24} />
                  </div>
                  <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Today's Total</p>
                      <h3 className="text-2xl font-black text-slate-900">{stats.total}</h3>
                  </div>
              </div>
          </AppCard>
          <AppCard className="bg-white" bodyClassName="p-6">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                      <Clock size={24} />
                  </div>
                  <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending</p>
                      <h3 className="text-2xl font-black text-slate-900">{stats.pending}</h3>
                  </div>
              </div>
          </AppCard>
          <AppCard className="bg-white" bodyClassName="p-6">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <CheckCircle2 size={24} />
                  </div>
                  <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Confirmed</p>
                      <h3 className="text-2xl font-black text-slate-900">{stats.confirmed}</h3>
                  </div>
              </div>
          </AppCard>
          <AppCard className="bg-white" bodyClassName="p-6">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Users size={24} />
                  </div>
                  <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Arrived</p>
                      <h3 className="text-2xl font-black text-slate-900">{stats.arrived}</h3>
                  </div>
              </div>
          </AppCard>
      </div>

      {/* Filter Bar */}
      <AppCard bodyClassName="p-4 bg-slate-50/50">
        <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
                <FormInput 
                    type="date" 
                    value={filter.date} 
                    onChange={(e) => setFilter({...filter, date: e.target.value})} 
                />
            </div>
            <div className="w-48">
                <select 
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all shadow-sm"
                    value={filter.status}
                    onChange={(e) => setFilter({...filter, status: e.target.value})}
                >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="arrived">Arrived</option>
                    <option value="seated">Seated</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                </select>
            </div>
            <AppButton variant="secondary" icon={Filter} onClick={() => setFilter({ date: new Date().toISOString().split('T')[0], status: '' })}>
                Reset
            </AppButton>
        </div>
      </AppCard>

      {/* Reservation List */}
      <AppCard bodyClassName="p-0 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref / Guest</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Table</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {loading ? (
                          [...Array(3)].map((_, i) => (
                              <tr key={i} className="animate-pulse">
                                  <td colSpan={6} className="px-8 py-10 bg-slate-50/20"></td>
                              </tr>
                          ))
                      ) : reservations.length === 0 ? (
                          <tr>
                              <td colSpan={6} className="px-8 py-20 text-center text-slate-400 italic">
                                  No reservations found for this criteria.
                              </td>
                          </tr>
                      ) : (
                          reservations.map(res => (
                              <tr key={res.id} className="hover:bg-slate-50/50 transition-colors group">
                                  <td className="px-8 py-6">
                                      <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">{res.reservation_no}</p>
                                      <p className="font-bold text-slate-900">{res.customer_name}</p>
                                  </td>
                                  <td className="px-8 py-6">
                                      <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                              <Phone size={12} /> {res.phone}
                                          </div>
                                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                              <Users size={12} /> {res.guests_count} Guests
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-8 py-6">
                                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                                          <Clock size={14} className="text-indigo-500" />
                                          {res.reservation_time.slice(0, 5)}
                                      </div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase mt-1">
                                          {new Date(res.reservation_date).toLocaleDateString()}
                                      </p>
                                  </td>
                                  <td className="px-8 py-6">
                                      {res.table_no ? (
                                          <div className="flex items-center gap-2 text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl w-fit">
                                              <MapPin size={12} /> Table {res.table_no}
                                          </div>
                                      ) : (
                                          <button 
                                            onClick={() => {setSelectedRes(res); setShowAssignModal(true);}}
                                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 underline underline-offset-4"
                                          >
                                              Assign Table
                                          </button>
                                      )}
                                  </td>
                                  <td className="px-8 py-6">
                                      <StatusBadge status={res.status} />
                                  </td>
                                  <td className="px-8 py-6">
                                      <div className="flex items-center gap-2">
                                          {res.status === 'pending' && (
                                              <AppButton variant="secondary" size="sm" onClick={() => handleUpdateStatus(res.id, 'confirmed')}>
                                                  Confirm
                                              </AppButton>
                                          )}
                                          {res.status === 'confirmed' && (
                                              <AppButton variant="success" size="sm" onClick={() => handleUpdateStatus(res.id, 'arrived')}>
                                                  Mark Arrived
                                              </AppButton>
                                          )}
                                          {(res.status === 'pending' || res.status === 'confirmed') && (
                                              <AppButton variant="danger" size="sm" className="p-2 aspect-square" onClick={() => handleUpdateStatus(res.id, 'cancelled')}>
                                                  <XCircle size={14} />
                                              </AppButton>
                                          )}
                                          <div className="relative group/menu">
                                              <button className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                                                  <MoreVertical size={16} className="text-slate-400" />
                                              </button>
                                              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 p-2">
                                                  <button 
                                                    onClick={() => {setSelectedRes(res); setShowAssignModal(true);}}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700"
                                                  >
                                                      <MapPin size={14} /> {res.table_id ? 'Change Table' : 'Assign Table'}
                                                  </button>
                                                  <button 
                                                    onClick={() => handleUpdateStatus(res.id, 'no_show')}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 rounded-xl text-xs font-bold text-rose-600"
                                                  >
                                                      <AlertCircle size={14} /> Mark No Show
                                                  </button>
                                              </div>
                                          </div>
                                      </div>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </AppCard>

      {/* Add Reservation Modal */}
      <AppModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="New Reservation"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-6">
                <FormInput 
                    label="Customer Name" 
                    placeholder="Enter guest name" 
                    required 
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                />
                <FormInput 
                    label="Phone Number" 
                    placeholder="Enter contact number" 
                    required 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
            </div>
            <div className="grid grid-cols-3 gap-6">
                <FormInput 
                    label="Date" 
                    type="date" 
                    required 
                    value={formData.reservation_date}
                    onChange={(e) => setFormData({...formData, reservation_date: e.target.value})}
                />
                <FormInput 
                    label="Time" 
                    type="time" 
                    required 
                    value={formData.reservation_time}
                    onChange={(e) => setFormData({...formData, reservation_time: e.target.value})}
                />
                <FormInput 
                    label="Guests" 
                    type="number" 
                    min="1" 
                    required 
                    value={formData.guests_count}
                    onChange={(e) => setFormData({...formData, guests_count: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Assign Table (Optional)</label>
                <select 
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-sm"
                    value={formData.table_id}
                    onChange={(e) => setFormData({...formData, table_id: e.target.value})}
                >
                    <option value="">No Table Assigned</option>
                    {tables.map(t => (
                        <option key={t.id} value={t.id}>Table {t.table_no} ({t.capacity} seats)</option>
                    ))}
                </select>
            </div>
            <FormInput 
                label="Note" 
                placeholder="Special requests, allergy info, etc." 
                value={formData.note}
                onChange={(e) => setFormData({...formData, note: e.target.value})}
            />
            <div className="flex gap-4 pt-4">
                <AppButton variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</AppButton>
                <AppButton variant="primary" className="flex-[2]" loading={processing} type="submit">CREATE RESERVATION</AppButton>
            </div>
        </form>
      </AppModal>

      {/* Assign Table Modal */}
      <AppModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Table"
      >
        <div className="space-y-6 py-4">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Guest</p>
                <p className="text-lg font-black text-slate-900">{selectedRes?.customer_name}</p>
            </div>
            <div className="grid grid-cols-4 gap-3 max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
                {tables.map(t => (
                    <button
                        key={t.id}
                        onClick={() => handleAssignTable(t.id)}
                        className={cn(
                            "flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all group",
                            selectedRes?.table_id === t.id 
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" 
                                : "bg-white border-slate-100 text-slate-500 hover:border-indigo-200"
                        )}
                    >
                        <span className="text-sm font-black">{t.table_no}</span>
                        <span className={cn("text-[9px] font-bold uppercase", selectedRes?.table_id === t.id ? "text-white/70" : "text-slate-400")}>{t.capacity} Seats</span>
                    </button>
                ))}
            </div>
            <AppButton variant="secondary" className="w-full" onClick={() => setShowAssignModal(false)}>Close</AppButton>
        </div>
      </AppModal>
    </div>
  );
};

export default ReservationPage;
