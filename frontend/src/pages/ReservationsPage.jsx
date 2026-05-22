import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useToast, AppButton } from '../components/ui';
import { cn } from '../utils/cn';

const ReservationsPage = () => {
    const navigate = useNavigate();
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
            
            // Redirect to the table billing page
            if (res.data.data.session_uuid) {
                navigate(`/billing/tables/${res.data.data.session_uuid}`);
            }
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
        <div className="space-y-10 animate-in fade-in duration-700 pb-20 selection:bg-indigo-500/30">
            {/* Premium Neural Header */}
            <header className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 rounded-[48px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white p-10 rounded-[44px] border border-slate-100 shadow-2xl overflow-hidden">
                    {/* Background Accents */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:bg-indigo-100 transition-colors"></div>
                    
                    <div className="flex items-center gap-8 relative z-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 relative group-hover:scale-110 transition-transform duration-500 transform -rotate-3">
                            <CalendarIcon size={36} />
                            <div className="absolute -top-1 -right-1">
                                <span className="flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 shadow-sm border border-white/20"></span>
                                </span>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Guest Logistics</span>
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-none mb-1 uppercase">Bookings</h2>
                            <p className="text-sm font-medium text-slate-400">Manage table intelligence and guest arrival protocols</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto relative z-10">
                        <div className="bg-slate-900 rounded-[28px] px-8 py-5 text-white flex flex-col items-center justify-center shadow-xl shadow-slate-900/10 min-w-[140px]">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Live Count</p>
                            <p className="text-3xl font-black tabular-nums tracking-tighter">{reservations.length}</p>
                        </div>
                        <AppButton 
                            variant="primary" 
                            icon={Plus} 
                            size="lg" 
                            className="w-full sm:w-auto rounded-[24px] shadow-xl shadow-indigo-100 py-7 px-10 font-black uppercase tracking-[0.2em] text-[10px]" 
                            onClick={() => setShowAddModal(true)}
                        >
                            New Reservation
                        </AppButton>
                    </div>
                </div>
            </header>

            {/* Tactical Control Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 relative group">
                    <CalendarIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input 
                        type="date"
                        value={filters.date}
                        onChange={(e) => setFilters({...filters, date: e.target.value})}
                        className="w-full bg-white border border-slate-100 rounded-[32px] py-6 pl-16 pr-8 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-xl shadow-slate-200/50"
                    />
                </div>

                <div className="lg:col-span-4 relative group">
                    <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <select 
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                        className="w-full bg-white border border-slate-100 rounded-[32px] py-6 pl-16 pr-12 text-xs font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-xl shadow-slate-200/50 appearance-none uppercase tracking-widest"
                    >
                        <option value="">ALL STATUS PROTOCOLS</option>
                        <option value="pending">PENDING APPROVAL</option>
                        <option value="confirmed">CONFIRMED BOOKINGS</option>
                        <option value="arrived">GUESTS ARRIVED</option>
                        <option value="seated">TABLES OCCUPIED</option>
                        <option value="cancelled">TERMINATED</option>
                        <option value="no_show">MISSED WINDOW</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                        <ChevronRight size={18} className="rotate-90" />
                    </div>
                </div>

                <div className="lg:col-span-4">
                    <AppButton 
                        variant="secondary" 
                        size="lg" 
                        className="w-full h-full rounded-[32px] border-slate-100 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-200/50"
                        onClick={fetchData}
                    >
                        Synchronize Data
                    </AppButton>
                </div>
            </div>

            {/* Operational Intelligence Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-[450px] bg-white rounded-[44px] animate-pulse shadow-sm border border-slate-50" />
                    ))}
                </div>
            ) : reservations.length === 0 ? (
                <div className="bg-white rounded-[64px] border border-slate-50 p-32 text-center shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-slate-50/30 -z-10"></div>
                    <div className="w-32 h-32 bg-white rounded-[40px] shadow-2xl flex items-center justify-center text-slate-200 mx-auto mb-8 group-hover:scale-110 transition-transform duration-500 border border-slate-50">
                        <CalendarIcon size={64} />
                    </div>
                    <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">No Active Intel</h3>
                    <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Synchronize with another timeline to view bookings</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                    {reservations.map(res => (
                        <div 
                            key={res.uuid}
                            className={cn(
                                "group relative bg-white p-10 rounded-[48px] border border-slate-100 hover:border-indigo-600 shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col h-full",
                                res.status === 'seated' && "opacity-40 grayscale"
                            )}
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-16 h-16 rounded-[24px] bg-slate-900 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-slate-900/20 group-hover:bg-indigo-600 transition-colors duration-500">
                                    {res.customer_name.charAt(0)}
                                </div>
                                <div className={cn(
                                    "px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-sm border",
                                    getStatusColor(res.status)
                                )}>
                                    {res.status}
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2 truncate group-hover:text-indigo-600 transition-colors">{res.customer_name}</h3>
                                <div className="flex items-center gap-3 text-slate-400">
                                    <Phone size={14} className="text-indigo-400" />
                                    <span className="text-[10px] font-black tracking-[0.2em] uppercase">{res.phone || 'NO CONTACT DATA'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-slate-50 p-6 rounded-[32px] border border-transparent group-hover:bg-white group-hover:border-slate-100 transition-all duration-500">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Window</p>
                                    <div className="flex items-center gap-3">
                                        <Clock size={18} className="text-indigo-500" />
                                        <p className="text-xl font-black text-slate-900">{res.reservation_time.slice(0, 5)}</p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-[32px] border border-transparent group-hover:bg-white group-hover:border-slate-100 transition-all duration-500">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Manifest</p>
                                    <div className="flex items-center gap-3">
                                        <Users size={18} className="text-indigo-500" />
                                        <p className="text-xl font-black text-slate-900">{res.guests_count} Pax</p>
                                    </div>
                                </div>
                                <div className="col-span-2 bg-slate-900 p-8 rounded-[36px] text-white shadow-2xl shadow-slate-900/10 relative overflow-hidden group/box">
                                    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl group-hover/box:bg-indigo-500/20 transition-all duration-700"></div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 relative z-10">Assigned Intelligence</p>
                                    <div className="flex justify-between items-center relative z-10">
                                        <p className="text-3xl font-black tracking-tighter uppercase">{res.table_no || 'Pending Selection'}</p>
                                        <MapPin size={24} className="text-indigo-500" />
                                    </div>
                                </div>
                            </div>

                            {res.note && (
                                <div className="bg-amber-50/50 p-6 rounded-[32px] border border-amber-100/50 mb-8 flex gap-4">
                                    <StickyNote size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-900/70 font-bold leading-relaxed italic line-clamp-2">"{res.note}"</p>
                                </div>
                            )}

                            <div className="mt-auto pt-4 flex gap-4">
                                {res.status === 'pending' && (
                                    <AppButton 
                                        variant="primary"
                                        className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-[9px] shadow-lg shadow-indigo-100"
                                        onClick={() => handleStatusUpdate(res.uuid, 'confirmed')}
                                    >
                                        Confirm
                                    </AppButton>
                                )}
                                {(res.status === 'confirmed' || res.status === 'pending') && (
                                    <AppButton 
                                        variant="primary"
                                        className="flex-1 rounded-2xl h-14 bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest text-[9px] shadow-lg shadow-emerald-100"
                                        onClick={() => handleStatusUpdate(res.uuid, 'arrived')}
                                    >
                                        Arrived
                                    </AppButton>
                                )}
                                {res.status === 'arrived' && (
                                    <AppButton 
                                        variant="primary"
                                        className="flex-1 rounded-2xl h-14 bg-slate-900 font-black uppercase tracking-widest text-[9px] shadow-xl"
                                        onClick={() => {
                                            setSelectedReservation(res);
                                            setShowSeatModal(true);
                                        }}
                                    >
                                        Seat Guest
                                    </AppButton>
                                )}
                                {['pending', 'confirmed', 'arrived'].includes(res.status) && (
                                    <button 
                                        onClick={() => {
                                            if (window.confirm('Terminate this booking?')) {
                                                handleStatusUpdate(res.uuid, 'cancelled');
                                            }
                                        }}
                                        className="w-14 h-14 flex items-center justify-center bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                    >
                                        <XCircle size={22} />
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
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowAddModal(false)}></div>
                    <div className="relative w-full max-w-xl bg-white rounded-[60px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="px-12 pt-12 pb-8 bg-slate-900 text-white relative">
                            <div className="absolute top-0 right-0 p-12 opacity-10">
                                <CalendarIcon size={120} />
                            </div>
                            <h2 className="text-4xl font-black tracking-tighter uppercase leading-none mb-2">Schedule Guest</h2>
                            <p className="text-indigo-200/60 font-black uppercase tracking-[0.3em] text-[10px]">Reservation Intelligence Engine</p>
                        </div>
                        <form onSubmit={handleCreate} className="p-12 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input 
                                            required
                                            type="text"
                                            placeholder="Enter guest name..."
                                            className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-transparent rounded-[28px] font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all"
                                            value={formData.customer_name}
                                            onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input 
                                            type="text"
                                            placeholder="+94 ..."
                                            className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-transparent rounded-[28px] font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Guests</label>
                                    <div className="relative">
                                        <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input 
                                            required
                                            type="number"
                                            min="1"
                                            className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-transparent rounded-[28px] font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all"
                                            value={formData.guests_count}
                                            onChange={(e) => setFormData({...formData, guests_count: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Date</label>
                                    <input 
                                        required
                                        type="date"
                                        className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent rounded-[28px] font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all"
                                        value={formData.reservation_date}
                                        onChange={(e) => setFormData({...formData, reservation_date: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Time</label>
                                    <input 
                                        required
                                        type="time"
                                        className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent rounded-[28px] font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all"
                                        value={formData.reservation_time}
                                        onChange={(e) => setFormData({...formData, reservation_time: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Special Notes</label>
                                    <textarea 
                                        placeholder="Any special requests or allergies..."
                                        rows="2"
                                        className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent rounded-[28px] font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all resize-none"
                                        value={formData.note}
                                        onChange={(e) => setFormData({...formData, note: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-6 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 h-20 bg-slate-100 text-slate-500 rounded-[32px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Discard
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-[2] h-20 bg-slate-900 text-white rounded-[32px] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-200"
                                >
                                    Verify & Confirm Booking
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Seat Modal */}
            {showSeatModal && selectedReservation && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowSeatModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white rounded-[60px] shadow-2xl p-12 animate-in zoom-in-95 duration-500">
                        <div className="text-center mb-10">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-50">
                                <MapPin size={32} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">Seating Plan</h2>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Assign Table for {selectedReservation.customer_name}</p>
                        </div>
                        
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Select Availability</label>
                                <div className="relative">
                                    <select 
                                        className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent rounded-[28px] font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all appearance-none"
                                        value={selectedReservation.table_id || ''}
                                        onChange={(e) => setSelectedReservation({...selectedReservation, table_id: e.target.value})}
                                    >
                                        <option value="">Choose a Table...</option>
                                        {tables.map(t => (
                                            <option 
                                                key={t.id} 
                                                value={t.id}
                                                disabled={t.status !== 'available'}
                                            >
                                                {t.table_no} ({t.capacity} Pax) {t.status !== 'available' ? '• OCCUPIED' : '• READY'}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" size={18} />
                                </div>
                            </div>

                            <button 
                                onClick={() => handleSeat(selectedReservation.uuid, selectedReservation.table_id)}
                                className="w-full h-20 bg-emerald-600 text-white rounded-[32px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-2xl shadow-emerald-100 active:scale-95"
                            >
                                Open Session & Redirect
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationsPage;
