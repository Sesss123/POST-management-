import React, { useState, useEffect } from 'react';
import { 
    Calendar as CalendarIcon, 
    Plus, 
    Search, 
    Filter, 
    Clock, 
    Users, 
    MoreVertical, 
    CheckCircle2, 
    XCircle, 
    ChevronRight,
    MapPin,
    AlertCircle,
    Phone,
    User,
    StickyNote
} from 'lucide-react';
import { reservationApi, tableApi } from '../api/api';
import { useToast } from '../components/ui';
import { cn } from '../utils/cn';

const ReservationsPage = () => {
    const toast = useToast();
    const [reservations, setReservations] = useState([]);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSeatModal, setShowSeatModal] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        status: ''
    });

    // New Reservation State
    const [formData, setFormData] = useState({
        customer_name: '',
        phone: '',
        reservation_date: new Date().toISOString().split('T')[0],
        reservation_time: '',
        guests_count: 2,
        table_id: '',
        note: ''
    });

    useEffect(() => {
        fetchData();
        fetchTables();
    }, [filters]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await reservationApi.getAll(filters);
            setReservations(res.data.data);
        } catch (error) {
            toast.error('Failed to fetch reservations');
        } finally {
            setLoading(false);
        }
    };

    const fetchTables = async () => {
        try {
            const res = await tableApi.getAll();
            setTables(res.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await reservationApi.create(formData);
            toast.success('Reservation created successfully');
            setShowAddModal(false);
            setFormData({
                customer_name: '',
                phone: '',
                reservation_date: new Date().toISOString().split('T')[0],
                reservation_time: '',
                guests_count: 2,
                table_id: '',
                note: ''
            });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create reservation');
        }
    };

    const handleStatusUpdate = async (uuid, status) => {
        try {
            await reservationApi.updateStatus(uuid, status);
            toast.success(`Status updated to ${status}`);
            fetchData();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleSeat = async (uuid, table_id) => {
        try {
            const res = await reservationApi.seat(uuid, { table_id });
            toast.success('Customer seated successfully');
            setShowSeatModal(false);
            fetchData();
            // Optional: navigate to the session?
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to seat customer');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'confirmed': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'arrived': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'seated': return 'bg-slate-50 text-slate-400 border-slate-100';
            case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'no_show': return 'bg-stone-50 text-stone-600 border-stone-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">TABLE RESERVATIONS</h1>
                    <p className="text-sm text-slate-500 font-medium italic">Manage guest bookings and table availability</p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
                >
                    <Plus size={18} />
                    New Booking
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px] relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="date"
                        value={filters.date}
                        onChange={(e) => setFilters({...filters, date: e.target.value})}
                        className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-slate-900/5 transition-all"
                    />
                </div>
                <div className="w-full sm:w-48 relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                        className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-slate-900/5 transition-all"
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
            </div>

            {/* List */}
            {loading ? (
                <div className="py-20 text-center">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Reservations...</p>
                </div>
            ) : reservations.length === 0 ? (
                <div className="bg-white rounded-[40px] border border-slate-100 p-20 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                        <CalendarIcon size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">No Bookings Found</h3>
                    <p className="text-slate-400 mt-2 font-medium">Try a different date or create a new reservation.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {reservations.map(res => (
                        <div 
                            key={res.uuid}
                            className={cn(
                                "bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden",
                                res.status === 'seated' && "opacity-60"
                            )}
                        >
                            {/* Status Badge */}
                            <div className="flex justify-between items-start mb-6">
                                <span className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    getStatusColor(res.status)
                                )}>
                                    {res.status}
                                </span>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Table</p>
                                    <p className="text-lg font-black text-slate-900 leading-none">{res.table_no || 'TBD'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{res.customer_name}</h3>
                                    <div className="flex items-center gap-2 mt-1 text-slate-400">
                                        <Phone size={14} />
                                        <span className="text-xs font-bold">{res.phone || 'No phone'}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Time</p>
                                            <p className="text-xs font-bold text-slate-700">{res.reservation_time.slice(0, 5)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                            <Users size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Guests</p>
                                            <p className="text-xs font-bold text-slate-700">{res.guests_count} Pax</p>
                                        </div>
                                    </div>
                                </div>

                                {res.note && (
                                    <div className="bg-slate-50 p-4 rounded-2xl flex gap-3">
                                        <StickyNote size={16} className="text-slate-400 shrink-0" />
                                        <p className="text-xs text-slate-600 italic leading-relaxed">{res.note}</p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-2">
                                {res.status === 'pending' && (
                                    <button 
                                        onClick={() => handleStatusUpdate(res.uuid, 'confirmed')}
                                        className="flex-1 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                                    >
                                        Confirm
                                    </button>
                                )}
                                {(res.status === 'confirmed' || res.status === 'pending') && (
                                    <button 
                                        onClick={() => handleStatusUpdate(res.uuid, 'arrived')}
                                        className="flex-1 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
                                    >
                                        Arrived
                                    </button>
                                )}
                                {res.status === 'arrived' && (
                                    <button 
                                        onClick={() => {
                                            setSelectedReservation(res);
                                            setShowSeatModal(true);
                                        }}
                                        className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                                    >
                                        Seat Guests
                                    </button>
                                )}
                                {['pending', 'confirmed', 'arrived'].includes(res.status) && (
                                    <button 
                                        onClick={() => {
                                            if (window.confirm('Cancel this reservation?')) {
                                                handleStatusUpdate(res.uuid, 'cancelled');
                                            }
                                        }}
                                        className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all"
                                    >
                                        <XCircle size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
                    <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 pt-8 pb-6 bg-slate-50 border-b border-slate-100">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">New Reservation</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Fill in the guest details</p>
                        </div>
                        <form onSubmit={handleCreate} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Name</label>
                                    <input 
                                        required
                                        type="text"
                                        placeholder="Enter full name"
                                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-slate-900/5 transition-all"
                                        value={formData.customer_name}
                                        onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                    <input 
                                        type="text"
                                        placeholder="Optional"
                                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-slate-900/5 transition-all"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guests Count</label>
                                    <input 
                                        required
                                        type="number"
                                        min="1"
                                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-slate-900/5 transition-all"
                                        value={formData.guests_count}
                                        onChange={(e) => setFormData({...formData, guests_count: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                                    <input 
                                        required
                                        type="date"
                                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-slate-900/5 transition-all"
                                        value={formData.reservation_date}
                                        onChange={(e) => setFormData({...formData, reservation_date: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time</label>
                                    <input 
                                        required
                                        type="time"
                                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-slate-900/5 transition-all"
                                        value={formData.reservation_time}
                                        onChange={(e) => setFormData({...formData, reservation_time: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Table (Optional)</label>
                                    <select 
                                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-slate-900/5 transition-all appearance-none"
                                        value={formData.table_id}
                                        onChange={(e) => setFormData({...formData, table_id: e.target.value})}
                                    >
                                        <option value="">Select a Table</option>
                                        {tables.map(t => (
                                            <option key={t.id} value={t.id}>{t.table_no} ({t.capacity} Seats)</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Special Notes</label>
                                    <textarea 
                                        placeholder="Any special requests..."
                                        rows="3"
                                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-slate-900/5 transition-all resize-none"
                                        value={formData.note}
                                        onChange={(e) => setFormData({...formData, note: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Discard
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200"
                                >
                                    Confirm Booking
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Seat Modal */}
            {showSeatModal && selectedReservation && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowSeatModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <MapPin size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Seat Guest</h2>
                            <p className="text-sm text-slate-500 font-medium mt-1">Assign a table to {selectedReservation.customer_name}</p>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Table</label>
                                <select 
                                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-slate-900/5 transition-all appearance-none"
                                    value={selectedReservation.table_id || ''}
                                    onChange={(e) => setSelectedReservation({...selectedReservation, table_id: e.target.value})}
                                >
                                    <option value="">Choose Table...</option>
                                    {tables.map(t => (
                                        <option 
                                            key={t.id} 
                                            value={t.id}
                                            disabled={t.status !== 'available'}
                                        >
                                            {t.table_no} ({t.capacity} Seats) {t.status !== 'available' ? '- Occupied' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button 
                                onClick={() => handleSeat(selectedReservation.uuid, selectedReservation.table_id)}
                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95"
                            >
                                Open Session & Occupy Table
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationsPage;
