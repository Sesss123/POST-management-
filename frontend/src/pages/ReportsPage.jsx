import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportApi } from '../api/api';
import { BarChart3, Calendar, Download, TrendingUp, DollarSign, Users, Package, ChevronRight } from 'lucide-react';
import { AppButton, AppCard, AppTable, StatCard, useToast } from '../components/ui';

const ReportsPage = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ daily: [], balances: [], items: [] });
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dRes, bRes, iRes] = await Promise.all([
        reportApi.getDailySales(date),
        reportApi.getCustomerBalances(),
        reportApi.getItemSales()
      ]);
      setStats({
        daily: dRes.data.data,
        balances: bRes.data.data,
        items: iRes.data.data
      });
    } catch (err) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                <BarChart3 size={24} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Intelligence</h1>
                <p className="text-slate-500 font-medium italic">Detailed analytics and sales performance</p>
            </div>
        </div>
        <div className="flex items-center gap-4 bg-white p-3 rounded-3xl shadow-lg shadow-slate-100 border border-slate-50">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl">
                <Calendar size={18} className="text-indigo-600" />
                <input 
                    type="date" 
                    className="bg-transparent font-bold text-sm outline-none"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>
            <AppButton variant="secondary" icon={Download} size="sm">Export CSV</AppButton>
            <Link to="/reports/eod">
                <AppButton variant="primary" icon={ChevronRight} size="sm">Full EOD Report</AppButton>
            </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AppCard title="Daily Sales Breakdown" icon={DollarSign} subtitle="Revenue summarized by payment method">
              <AppTable 
                headers={[{ label: 'Method' }, { label: 'Revenue', className: 'text-right' }]}
                data={stats.daily}
                loading={loading}
                renderRow={(row) => (
                    <tr key={row.payment_method} className="hover:bg-slate-50">
                        <td className="py-4 font-bold text-slate-700 uppercase tracking-widest text-xs">{row.payment_method}</td>
                        <td className="py-4 text-right font-black text-slate-900 text-lg">Rs. {parseFloat(row.total_amount).toLocaleString()}</td>
                    </tr>
                )}
              />
          </AppCard>

          <AppCard title="Best Selling Items" icon={Package} subtitle="Top performing products by revenue">
              <AppTable 
                headers={[{ label: 'Item Name' }, { label: 'Qty', className: 'text-right' }, { label: 'Revenue', className: 'text-right' }]}
                data={stats.items}
                loading={loading}
                renderRow={(row) => (
                    <tr key={row.item_name} className="hover:bg-slate-50">
                        <td className="py-4 font-bold text-slate-700">{row.item_name}</td>
                        <td className="py-4 text-right font-bold text-slate-400">{row.total_qty}</td>
                        <td className="py-4 text-right font-black text-indigo-600">Rs. {parseFloat(row.total_revenue).toLocaleString()}</td>
                    </tr>
                )}
              />
          </AppCard>

          <AppCard title="Credit Outstanding" icon={Users} subtitle="Top debtors and unpaid balances" className="lg:col-span-2">
              <AppTable 
                headers={[{ label: 'Customer Name' }, { label: 'Contact' }, { label: 'Balance', className: 'text-right' }]}
                data={stats.balances}
                loading={loading}
                renderRow={(row) => (
                    <tr key={row.phone} className="hover:bg-slate-50">
                        <td className="py-4 font-bold text-slate-900">{row.name}</td>
                        <td className="py-4 font-bold text-slate-400">{row.phone}</td>
                        <td className="py-4 text-right font-black text-rose-600 text-lg">Rs. {parseFloat(row.current_balance).toLocaleString()}</td>
                    </tr>
                )}
              />
          </AppCard>
      </div>
    </div>
  );
};

export default ReportsPage;
