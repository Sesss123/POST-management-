import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Plus, 
  Search, 
  MoreVertical, 
  ExternalLink, 
  Shield, 
  AlertTriangle,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { cn } from '../../utils/cn';

const ShopsPage = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const { data } = await apiClient.get('/super-admin/shops');
      if (data.success) {
        setShops(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredShops = shops.filter(shop => 
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    shop.identifier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Manage Shops</h1>
          <p className="text-slate-400 mt-2">Oversee all restaurant instances on the platform.</p>
        </div>
        <Link 
          to="/super-admin/shops/new"
          className="px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-900/40 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Onboard New Shop
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-indigo-400" size={20} />
          <input 
            type="text"
            placeholder="Search by shop name or identifier..."
            className="w-full pl-12 pr-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all flex items-center gap-2">
          <Filter size={20} />
          Filters
        </button>
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Shop & Instance</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Identifier</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Created</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
                      Loading shops...
                    </div>
                  </td>
                </tr>
              ) : filteredShops.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-slate-500 font-medium">
                    No shops found.
                  </td>
                </tr>
              ) : filteredShops.map((shop) => (
                <tr key={shop.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border transition-all",
                        shop.status === 'active' 
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/10 group-hover:bg-indigo-600 group-hover:text-white" 
                          : "bg-rose-500/10 text-rose-500 border-rose-500/10"
                      )}>
                        {shop.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">{shop.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Instance ID: #{shop.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-mono text-slate-400 bg-white/5 px-2 py-1 rounded-md">
                      {shop.identifier}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        shop.status === 'active' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                      )} />
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        shop.status === 'active' ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {shop.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm text-slate-400">
                    {new Date(shop.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
                        <Shield size={18} />
                      </button>
                      <Link 
                        to={`/super-admin/shops/${shop.id}/menu`}
                        className="p-2.5 bg-emerald-600/10 hover:bg-emerald-600 rounded-xl text-emerald-400 hover:text-white transition-all"
                        title="Manage Menu"
                      >
                        <List size={18} />
                      </Link>
                      <Link 
                        to={`/super-admin/shops/${shop.identifier}`}
                        className="p-2.5 bg-indigo-600/10 hover:bg-indigo-600 rounded-xl text-indigo-400 hover:text-white transition-all"
                        title="Shop Details"
                      >
                        <ArrowUpRight size={18} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShopsPage;
