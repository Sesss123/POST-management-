import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '../api/api';
import { Receipt, Search, Filter, Printer, Eye, Calendar, User, Wallet } from 'lucide-react';
import { AppButton, AppCard, AppTable, StatusBadge, useToast, FormInput, ResponsiveDataList } from '../components/ui';
import { cn } from '../utils/cn';

const InvoicePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data } = await invoiceApi.getAll();
      setInvoices(data.data);
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoice_no.toLowerCase().includes(search.toLowerCase()) || 
    (inv.customer_name && inv.customer_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 lg:gap-0">
        <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 shrink-0">
                <Receipt size={20} className="lg:w-6 lg:h-6" />
            </div>
            <div>
                <h1 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tight uppercase lg:normal-case">Invoice History</h1>
                <p className="text-slate-500 font-medium italic text-[10px] lg:text-sm">Track and reprint all sales transactions</p>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <AppCard className="p-4 lg:p-6" bodyClassName="p-0">
              <div className="flex items-center gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-50 rounded-xl lg:rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                      <Search size={18} className="lg:w-5 lg:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                      <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Search Records</p>
                      <input 
                        type="text" 
                        placeholder="Invoice # or Customer" 
                        className="w-full bg-transparent font-bold outline-none placeholder:text-slate-300 text-xs lg:text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                  </div>
              </div>
          </AppCard>
          <AppCard className="p-4 lg:p-6" bodyClassName="p-0">
              <div className="flex items-center gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-50 rounded-xl lg:rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                      <Calendar size={18} className="lg:w-5 lg:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                      <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Period</p>
                      <p className="text-xs lg:text-sm font-black text-slate-900">Today</p>
                  </div>
                  <Filter size={14} className="text-slate-300" />
              </div>
          </AppCard>
          {/* Summary Mini Stats */}
          <div className="sm:col-span-2 grid grid-cols-2 gap-4 lg:gap-6">
              <div className="bg-indigo-600 rounded-2xl lg:rounded-[32px] p-4 lg:p-6 text-white flex items-center justify-between shadow-lg shadow-indigo-100">
                  <div className="min-w-0">
                      <p className="text-[9px] lg:text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-1">Total Sales</p>
                      <p className="text-sm lg:text-2xl font-black tracking-tight truncate">Rs. {invoices.reduce((s, i) => s + parseFloat(i.grand_total), 0).toLocaleString()}</p>
                  </div>
                  <Wallet size={24} className="opacity-20 hidden lg:block" />
              </div>
              <div className="bg-slate-900 rounded-2xl lg:rounded-[32px] p-4 lg:p-6 text-white flex items-center justify-between shadow-lg shadow-slate-100">
                  <div className="min-w-0">
                      <p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Count</p>
                      <p className="text-sm lg:text-2xl font-black tracking-tight truncate">{invoices.length} Invoices</p>
                  </div>
                  <Receipt size={24} className="opacity-20 hidden lg:block" />
              </div>
          </div>
      </div>

      <AppCard>
        <ResponsiveDataList 
            loading={loading}
            data={filteredInvoices}
            headers={[
                { label: 'Invoice No' },
                { label: 'Date & Time' },
                { label: 'Type' },
                { label: 'Customer / Table' },
                { label: 'Grand Total', className: 'text-right' },
                { label: 'Status', className: 'text-right' },
                { label: 'Actions', className: 'text-right' }
            ]}
            renderRow={(inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-5 font-black text-slate-900">{inv.invoice_no}</td>
                    <td className="py-5">
                        <p className="text-sm font-bold text-slate-700">{new Date(inv.created_at).toLocaleDateString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="py-5">
                        <div className="flex flex-col gap-1 items-start">
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight",
                                inv.type === 'cash' ? "bg-indigo-50 text-indigo-600" : "bg-purple-50 text-purple-600"
                            )}>
                                {inv.type} Sale
                            </span>
                            {inv.sale_channel === 'quick_no_receipt' && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[8px] font-black uppercase tracking-widest">
                                    Quick
                                </span>
                            )}
                        </div>
                    </td>
                    <td className="py-5">
                        <div className="flex items-center gap-2">
                            {inv.customer_name ? (
                                <>
                                    <User size={14} className="text-slate-300" />
                                    <span className="text-sm font-bold text-slate-700">{inv.customer_name}</span>
                                </>
                            ) : inv.table_no ? (
                                <>
                                    <Wallet size={14} className="text-slate-300" />
                                    <span className="text-sm font-bold text-slate-700">Table {inv.table_no}</span>
                                </>
                            ) : (
                                <span className="text-sm font-bold text-slate-400 italic">Walk-in Guest</span>
                            )}
                        </div>
                    </td>
                    <td className="py-5 text-right font-black text-slate-900">Rs. {parseFloat(inv.grand_total).toLocaleString()}</td>
                    <td className="py-5 text-right"><StatusBadge status={inv.payment_status} /></td>
                    <td className="py-5 text-right flex gap-2 justify-end">
                        <AppButton variant="ghost" size="sm" icon={Eye} onClick={() => navigate(`/invoices/${inv.uuid || inv.id}`)}>Details</AppButton>
                        <AppButton variant="secondary" size="sm" icon={Printer} onClick={() => window.print()}>Print</AppButton>
                    </td>
                </tr>
            )}
            renderCard={(inv) => (
                <div key={inv.id} className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{inv.invoice_no}</p>
                                {inv.sale_channel === 'quick_no_receipt' && (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[8px] font-black uppercase tracking-widest">
                                        Quick
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(inv.created_at).toLocaleDateString()} • {new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <StatusBadge status={inv.payment_status} />
                    </div>
                    
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer / Table</p>
                            <div className="flex items-center gap-2">
                                {inv.customer_name ? (
                                    <span className="text-xs font-bold text-slate-700">{inv.customer_name}</span>
                                ) : inv.table_no ? (
                                    <span className="text-xs font-bold text-slate-700">Table {inv.table_no}</span>
                                ) : (
                                    <span className="text-xs font-bold text-slate-400 italic">Walk-in Guest</span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Grand Total</p>
                            <p className="text-lg font-black text-indigo-600">Rs. {parseFloat(inv.grand_total).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <AppButton variant="secondary" size="sm" className="flex-1" icon={Eye} onClick={() => navigate(`/invoices/${inv.uuid || inv.id}`)}>Details</AppButton>
                        <AppButton variant="ghost" size="sm" className="flex-1" icon={Printer} onClick={() => window.print()}>Print</AppButton>
                    </div>
                </div>
            )}
        />
      </AppCard>
    </div>
  );
};

export default InvoicePage;
