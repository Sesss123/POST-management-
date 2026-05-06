import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  MessageSquare,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Filter,
  MoreVertical,
  ArrowRight
} from 'lucide-react';
import { 
  AppCard, 
  AppButton, 
  Badge, 
  Skeleton, 
  useToast, 
  FormInput, 
  FormSelect,
  StatCard
} from '../components/ui';
import { cn } from '../utils/cn';
import axios from 'axios';

const DeliveryOrdersPage = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [showManualModal, setShowManualModal] = useState(false);
  const [items, setItems] = useState([]); // All items for mapping

  useEffect(() => {
    fetchOrders();
    fetchItems();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/delivery-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(data.data);
    } catch (err) {
      toast.error('Failed to load delivery orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/items', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(data.data);
    } catch (err) {}
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/delivery-orders/sync-provider', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Orders synced successfully');
      fetchOrders();
    } catch (err) {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleAccept = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/delivery-orders/${orderId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Order accepted and sent to POS');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept order');
    }
  };

  const handleReject = async (orderId) => {
    const reason = window.prompt('Reason for rejection:');
    if (!reason) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/delivery-orders/${orderId}/reject`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Order rejected');
      fetchOrders();
    } catch (err) {
      toast.error('Failed to reject order');
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/delivery-orders/${orderId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Order marked as ${status}`);
      fetchOrders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pending', icon: Clock, count: orders.filter(o => o.order_status === 'pending').length },
    { id: 'active', label: 'In Progress', icon: RefreshCw, count: orders.filter(o => ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.order_status)).length },
    { id: 'completed', label: 'History', icon: CheckCircle, count: orders.filter(o => ['delivered', 'rejected', 'cancelled'].includes(o.order_status)).length }
  ];

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'pending') return o.order_status === 'pending';
    if (activeTab === 'active') return ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.order_status);
    if (activeTab === 'completed') return ['delivered', 'rejected', 'cancelled'].includes(o.order_status);
    return true;
  });

  const getSourceIcon = (source) => {
    switch (source) {
      case 'ubereats': return <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-[10px]">UE</div>;
      case 'pickme': return <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-[10px]">PM</div>;
      default: return <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center"><ShoppingBag size={14} /></div>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Truck size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Delivery Hub</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Multi-Source Integration</p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <AppButton 
            icon={RefreshCw} 
            variant="secondary" 
            onClick={handleSync}
            loading={syncing}
            className="flex-1 sm:flex-none px-6 py-4 rounded-2xl border-2"
          >
            Sync Orders
          </AppButton>
          <AppButton 
            icon={Plus} 
            variant="primary" 
            onClick={() => setShowManualModal(true)}
            className="flex-1 sm:flex-none px-8 py-4 rounded-2xl shadow-xl shadow-indigo-100"
          >
            Manual Order
          </AppButton>
        </div>
      </header>

      {/* Status Tabs */}
      <div className="flex bg-slate-100/50 p-1.5 rounded-[24px] gap-1 overflow-x-auto custom-scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap min-w-[140px]",
              activeTab === tab.id 
                ? "bg-white text-indigo-900 shadow-sm border border-slate-100" 
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <tab.icon size={16} className={activeTab === tab.id ? "text-indigo-600" : "text-slate-300"} />
            {tab.label}
            <Badge variant={activeTab === tab.id ? 'primary' : 'secondary'} className="ml-1 px-2 py-0.5">
              {tab.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {loading ? (
          [1,2,3,4].map(i => <Skeleton key={i} className="h-64 w-full rounded-[32px]" />)
        ) : filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col group transition-all hover:shadow-xl hover:border-indigo-100">
            <div className="p-6 flex items-start justify-between border-b border-slate-50">
              <div className="flex items-center gap-4">
                {getSourceIcon(order.source)}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900">{order.customer_name || 'Guest Customer'}</h3>
                    <Badge variant={order.source === 'manual_delivery' ? 'info' : 'primary'} className="uppercase text-[8px]">
                      {order.source.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">
                    Order #{order.external_order_id || order.uuid.slice(0, 8)} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                <p className="text-xl font-black text-indigo-900">Rs. {parseFloat(order.grand_total).toLocaleString()}</p>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 flex-1">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-slate-400 mt-0.5" />
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">{order.delivery_address || 'No address provided'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-slate-400" />
                  <p className="text-xs font-black text-slate-600">{order.customer_phone || 'N/A'}</p>
                </div>
                {order.note && (
                  <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 flex items-start gap-3">
                    <MessageSquare size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] font-bold text-amber-900 italic leading-tight">"{order.note}"</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Order Items</p>
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="px-1.5 py-0.5 text-[9px]">{Math.round(item.qty)}x</Badge>
                      <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">{item.item_name}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400">Rs. {parseFloat(item.total).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white flex flex-wrap gap-2 justify-end border-t border-slate-50">
              {order.order_status === 'pending' && (
                <>
                  <AppButton size="sm" variant="secondary" icon={XCircle} onClick={() => handleReject(order.id)} className="px-6 rounded-xl border-2 text-rose-600 border-rose-50 hover:bg-rose-50">
                    Reject
                  </AppButton>
                  <AppButton size="sm" variant="primary" icon={CheckCircle} onClick={() => handleAccept(order.id)} className="px-8 rounded-xl shadow-lg shadow-indigo-100">
                    Accept Order
                  </AppButton>
                </>
              )}
              
              {order.order_status === 'accepted' && (
                <AppButton size="sm" variant="primary" icon={RefreshCw} onClick={() => handleUpdateStatus(order.id, 'preparing')} className="px-8 rounded-xl">
                  Start Preparing
                </AppButton>
              )}
              
              {order.order_status === 'preparing' && (
                <AppButton size="sm" variant="primary" icon={CheckCircle} onClick={() => handleUpdateStatus(order.id, 'ready')} className="px-8 rounded-xl bg-emerald-600 border-emerald-600">
                  Mark Ready
                </AppButton>
              )}
              
              {order.order_status === 'ready' && (
                <AppButton size="sm" variant="primary" icon={Truck} onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')} className="px-8 rounded-xl bg-blue-600 border-blue-600">
                  Out for Delivery
                </AppButton>
              )}
              
              {order.order_status === 'out_for_delivery' && (
                <AppButton size="sm" variant="primary" icon={CheckCircle} onClick={() => handleUpdateStatus(order.id, 'delivered')} className="px-8 rounded-xl bg-indigo-900 border-indigo-900">
                  Mark Delivered
                </AppButton>
              )}

              {['delivered', 'rejected', 'cancelled'].includes(order.order_status) && (
                <div className="flex items-center gap-2 px-4 py-2">
                   <Badge variant={order.order_status === 'delivered' ? 'success' : 'danger'} className="uppercase text-[9px] py-1 px-4 rounded-lg">
                      {order.order_status}
                   </Badge>
                   {order.reject_reason && <p className="text-[10px] text-slate-400 italic">Reason: {order.reject_reason}</p>}
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && !loading && (
          <div className="col-span-full py-24 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 mb-4">
              <ShoppingBag size={40} />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">No {activeTab} orders</h3>
            <p className="text-slate-400 text-sm font-bold mt-1">Sit tight! Orders from your delivery partners will appear here.</p>
          </div>
        )}
      </div>

      {/* Manual Delivery Note (Quick Tip) */}
      <div className="bg-indigo-900 rounded-[40px] p-8 text-white relative overflow-hidden group shadow-2xl shadow-indigo-200">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
              <Truck size={160} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 space-y-4 text-center md:text-left">
                  <Badge className="bg-white/10 text-white border-white/20">Operational Tip</Badge>
                  <h3 className="text-3xl font-black tracking-tighter">Faster Acceptance Workflow</h3>
                  <p className="text-indigo-100 font-medium text-sm leading-relaxed max-w-md">
                      When you accept an order, it automatically creates a POS session and sends a KOT to the kitchen. You can then manage billing as a standard "Delivery" order type.
                  </p>
              </div>
              <div className="flex gap-4 shrink-0">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm text-center min-w-[120px]">
                      <p className="text-3xl font-black text-white">{orders.filter(o => o.order_status === 'pending').length}</p>
                      <p className="text-[10px] font-bold text-indigo-300 uppercase mt-1">Waitlist</p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm text-center min-w-[120px]">
                      <p className="text-3xl font-black text-white">{orders.filter(o => o.order_status === 'delivered').length}</p>
                      <p className="text-[10px] font-bold text-indigo-300 uppercase mt-1">Today</p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default DeliveryOrdersPage;
