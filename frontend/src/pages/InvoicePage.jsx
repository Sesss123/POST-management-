import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '../api/api';
import { Receipt, Search, Filter, Printer, Eye, Calendar, User, Wallet } from 'lucide-react';
import { AppButton, AppCard, AppTable, StatusBadge, useToast, FormInput } from '../components/ui';
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
      <header className="flex justify-between items-end">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                <Receipt size={24} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Invoice History</h1>
                <p className="text-slate-500 font-medium italic">Track and reprint all sales transactions</p>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <AppCard className="p-6" bodyClassName="p-0">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                      <Search size={20} />
                  </div>
                  <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Search Records</p>
                      <input 
                        type="text" 
                        placeholder="Invoice # or Customer" 
                        className="w-full bg-transparent font-bold outline-none placeholder:text-slate-300 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                  </div>
              </div>
          </AppCard>
          <AppCard className="p-6" bodyClassName="p-0">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                      <Calendar size={20} />
                  </div>
                  <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Period</p>
                      <p className="text-sm font-black text-slate-900">Today</p>
                  </div>
                  <Filter size={14} className="text-slate-300" />
              </div>
          </AppCard>
          {/* Summary Mini Stats */}
          <div className="col-span-2 grid grid-cols-2 gap-6">
              <div className="bg-indigo-600 rounded-[32px] p-6 text-white flex items-center justify-between">
                  <div>
                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-1">Total Sales</p>
                      <p className="text-2xl font-black tracking-tight">Rs. {invoices.reduce((s, i) => s + parseFloat(i.grand_total), 0).toLocaleString()}</p>
                  </div>
                  <Wallet size={32} className="opacity-20" />
              </div>
              <div className="bg-slate-900 rounded-[32px] p-6 text-white flex items-center justify-between">
                  <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Invoice Count</p>
                      <p className="text-2xl font-black tracking-tight">{invoices.length}</p>
                  </div>
                  <Receipt size={32} className="opacity-20" />
              </div>
          </div>
      </div>

      <AppCard>
        <AppTable 
            headers={[
                { label: 'Invoice No' },
                { label: 'Date & Time' },
                { label: 'Type' },
                { label: 'Customer / Table' },
                { label: 'Grand Total', className: 'text-right' },
                { label: 'Status', className: 'text-right' },
                { label: 'Actions', className: 'text-right' }
            ]}
            data={filteredInvoices}
            loading={loading}
            renderRow={(inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-5 font-black text-slate-900">{inv.invoice_no}</td>
                    <td className="py-5">
                        <p className="text-sm font-bold text-slate-700">{new Date(inv.created_at).toLocaleDateString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="py-5">
                        <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight",
                            inv.type === 'cash' ? "bg-indigo-50 text-indigo-600" : "bg-purple-50 text-purple-600"
                        )}>
                            {inv.type} Sale
                        </span>
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
                        <AppButton variant="ghost" size="sm" icon={Eye} onClick={() => navigate(`/invoices/${inv.id}`)}>Details</AppButton>
                        <AppButton variant="secondary" size="sm" icon={Printer} onClick={() => window.print()}>Print</AppButton>
                    </td>
                </tr>
            )}
        />
      </AppCard>
    </div>
  );
};

export default InvoicePage;
