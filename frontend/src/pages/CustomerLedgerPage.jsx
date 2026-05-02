import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerApi, paymentApi, invoiceApi, settingApi } from '../api/api';
import { 
  ArrowLeft,
  User,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Eye,
  Printer,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  RefreshCcw
} from 'lucide-react';
import { AppButton, useToast, AppModal, FormInput, FormSelect } from '../components/ui';
import InvoicePrintModal from '../components/invoice/InvoicePrintModal';
import { cn } from '../utils/cn';

const CustomerLedgerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [accountData, setAccountData] = useState({
    customer: null,
    summary: {
        current_balance: 0,
        unpaid_invoice_total: 0,
        unpaid_invoice_count: 0,
        last_payment_date: null
    },
    ledger: [],
    unpaid_invoices: [],
    payments: []
  });
  
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  const [paymentData, setPaymentData] = useState({
      amount: '',
      method: 'cash',
      note: ''
  });

  useEffect(() => {
    fetchSettings();
    if (id) {
        fetchAccountDetails();
    }
  }, [id]);

  const fetchSettings = async () => {
    try {
        const { data } = await settingApi.getAll();
        setSettings(data.data);
    } catch (err) {
        console.error('Failed to fetch settings');
    }
  };

  const fetchAccountDetails = async () => {
    setLoading(true);
    try {
        const { data } = await customerApi.getAccount(id);
        if (data.success) {
            setAccountData(data.data);
        }
    } catch (err) {
        toast.error('Failed to load account details');
    } finally {
        setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAccountDetails();
  };

  const handleViewInvoice = async (invoice) => {
    try {
        const { data } = await invoiceApi.getDetails(invoice.uuid || invoice.id);
        setSelectedInvoice({ ...data.data, settings });
        setShowPrintModal(true);
    } catch (err) {
        toast.error('Failed to load invoice');
    }
  };

  const handlePayment = async (e) => {
      e.preventDefault();
      const amountNum = parseFloat(paymentData.amount);
      if (!amountNum || amountNum <= 0) return toast.error('Enter a valid amount');
      
      setProcessing(true);
      try {
          await paymentApi.recordCustomerPayment({
              customer_id: customer.uuid || customer.id,
              amount: amountNum,
              payment_method: paymentData.method,
              note: paymentData.note
          });
          
          toast.success('Payment recorded successfully!');
          setShowPaymentModal(false);
          setPaymentData({ amount: '', method: 'cash', note: '' });
          
          fetchAccountDetails();
      } catch (err) {
          toast.error(err.response?.data?.message || 'Payment failed');
      } finally {
          setProcessing(false);
      }
  };

  const customer = accountData.customer;
  const isOverLimit = customer && parseFloat(customer.current_balance) > parseFloat(customer.credit_limit) && parseFloat(customer.credit_limit) > 0;

  if (loading && !customer) {
      return (
          <div className="h-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
      );
  }

  if (!customer) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-center">
              <AlertCircle size={48} className="text-slate-300 mb-4" />
              <h2 className="text-xl font-bold text-slate-700">Customer not found</h2>
              <AppButton className="mt-4" onClick={() => navigate('/customers')}>Back to Customers</AppButton>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-h-screen overflow-hidden flex flex-col">
      <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
              <button 
                  onClick={() => navigate('/customers')}
                  className="p-2 bg-white rounded-xl shadow hover:shadow-md transition-all text-slate-600"
              >
                  <ArrowLeft size={20} />
              </button>
              <div>
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Customer Ledger</h1>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{customer.name}</p>
              </div>
          </div>
          <button 
              onClick={handleRefresh}
              className="p-2 bg-white rounded-xl shadow hover:shadow-md transition-all text-slate-600"
              title="Refresh"
          >
              <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          </button>
      </div>

      <div className="flex flex-col flex-1 min-h-0 space-y-6 overflow-hidden">
          {/* Account Header */}
          <div className={cn(
              "rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl transition-all shrink-0",
              isOverLimit ? "bg-rose-900 shadow-rose-900/40" : "bg-slate-900 shadow-slate-900/40"
          )}>
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
                  <div className="flex items-center gap-4 lg:gap-6">
                      <div className={cn(
                          "w-16 h-16 lg:w-20 lg:h-20 rounded-[28px] lg:rounded-[32px] flex items-center justify-center shadow-2xl shrink-0",
                          isOverLimit ? "bg-rose-600 shadow-rose-900/50" : "bg-purple-600 shadow-purple-900/50"
                      )}>
                          <User size={32} className="lg:w-10 lg:h-10" />
                      </div>
                      <div className="min-w-0">
                          <div className="flex items-center gap-2 lg:gap-3 mb-1">
                              <h2 className="text-xl lg:text-3xl font-black tracking-tight truncate">{customer.name}</h2>
                              {customer.status === 'blocked' && (
                                  <span className="bg-rose-500 text-white text-[7px] lg:text-[8px] font-black px-1.5 lg:px-2 py-0.5 rounded uppercase shrink-0">Blocked</span>
                              )}
                          </div>
                          <div className="flex flex-wrap gap-x-3 lg:gap-x-4 gap-y-1 text-[9px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">
                              <span className="flex items-center gap-1"><User size={10} className="lg:w-3 lg:h-3" /> {customer.phone}</span>
                              <span className={cn("px-1.5 lg:px-2 py-0.5 rounded bg-white/5", isOverLimit ? "text-rose-400" : "text-emerald-400")}>
                                  Limit: Rs. {parseFloat(customer.credit_limit).toLocaleString()}
                              </span>
                          </div>
                      </div>
                  </div>
                  <div className="flex flex-col items-start lg:items-end">
                      <p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] lg:tracking-[0.3em] mb-0.5 lg:mb-1">Outstanding Balance</p>
                      <p className="text-3xl lg:text-5xl font-black tracking-tighter text-white">Rs. {parseFloat(customer.current_balance).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 lg:gap-3 shrink-0">
                      <AppButton 
                          variant="secondary" 
                          size="sm" 
                          className="flex-1 lg:flex-none lg:px-6 lg:py-5 rounded-xl lg:rounded-[28px] uppercase tracking-widest font-black bg-white/10 text-white border-transparent hover:bg-white/20 transition-all text-[8px] lg:text-base"
                          onClick={() => toast.info('Statement generation coming soon')}
                          icon={FileText}
                      >
                          STMT
                      </AppButton>
                      <AppButton 
                          variant="success" 
                          size="lg" 
                          className="flex-[2] lg:flex-none lg:px-8 lg:py-5 rounded-xl lg:rounded-[28px] uppercase tracking-widest font-black shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 text-[10px] lg:text-base"
                          onClick={() => setShowPaymentModal(true)}
                          disabled={parseFloat(customer.current_balance) <= 0 || processing}
                          icon={Wallet}
                      >
                          PAY
                      </AppButton>
                  </div>
              </div>
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px]" />
          </div>

          {/* Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 shrink-0">
              <div className="bg-white p-6 rounded-[32px] shadow-lg shadow-slate-100 border border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unpaid Invoices</p>
                  <p className="text-2xl font-black text-slate-900">{accountData.summary.unpaid_invoice_count}</p>
              </div>
              <div className="bg-white p-6 rounded-[32px] shadow-lg shadow-slate-100 border border-slate-50 relative group">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Amount</p>
                  <div className="flex items-center gap-2">
                      <p className="text-2xl font-black text-rose-500">Rs. {parseFloat(accountData.summary.unpaid_invoice_total).toLocaleString()}</p>
                      {Math.abs(parseFloat(accountData.summary.current_balance) - parseFloat(accountData.summary.unpaid_invoice_total)) > 0.01 && (
                          <div className="text-amber-500 hover:text-amber-600 transition-colors cursor-help" title={`Account balance mismatch! Current: Rs. ${parseFloat(accountData.summary.current_balance).toLocaleString()}`}>
                              <AlertCircle size={16} />
                          </div>
                      )}
                  </div>
              </div>
              <div className="bg-white p-6 rounded-[32px] shadow-lg shadow-slate-100 border border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Credit Limit Left</p>
                  <p className="text-2xl font-black text-emerald-500">Rs. {parseFloat(customer.remaining_credit || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-[32px] shadow-lg shadow-slate-100 border border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Payment</p>
                  <p className="text-lg font-black text-slate-700">
                      {accountData.summary.last_payment_date ? new Date(accountData.summary.last_payment_date).toLocaleDateString() : 'Never'}
                  </p>
              </div>
          </div>

          {/* Tabbed Content */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden pb-4">
              {/* Left Column: Unpaid Invoices */}
              <div className="lg:col-span-7 flex flex-col gap-6 min-h-0 overflow-hidden">
                  <div className="flex-1 bg-white rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col overflow-hidden">
                      <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-3">
                              <Receipt className="text-rose-500" size={20} />
                              <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Outstanding Invoices</h3>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase">Oldest First</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                          <table className="w-full text-left border-separate border-spacing-y-3">
                              <thead className="sticky top-0 bg-white z-10">
                                  <tr>
                                      <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Invoice</th>
                                      <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] hidden sm:table-cell">Date</th>
                                      <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] hidden md:table-cell">Total</th>
                                      <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Balance</th>
                                      <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {[...accountData.unpaid_invoices].reverse().map(inv => (
                                      <tr key={inv.id} className="group hover:bg-slate-50 transition-colors">
                                          <td className="px-4 py-4 rounded-l-2xl border-y border-l border-slate-50">
                                              <p className="text-xs font-black text-slate-900 uppercase tracking-tighter truncate max-w-[100px]">{inv.invoice_no}</p>
                                              <span className="text-[7px] font-bold text-slate-400 uppercase sm:hidden">{new Date(inv.created_at).toLocaleDateString()}</span>
                                          </td>
                                          <td className="px-4 py-4 border-y border-slate-50 hidden sm:table-cell">
                                              <p className="text-[10px] font-bold text-slate-600">{new Date(inv.created_at).toLocaleDateString()}</p>
                                          </td>
                                          <td className="px-4 py-4 border-y border-slate-50 hidden md:table-cell">
                                              <p className="text-[10px] font-bold text-slate-400 italic">Rs. {parseFloat(inv.grand_total).toLocaleString()}</p>
                                          </td>
                                          <td className="px-4 py-4 border-y border-slate-50">
                                              <p className="text-xs lg:text-sm font-black text-rose-500">Rs. {parseFloat(inv.balance_amount).toLocaleString()}</p>
                                          </td>
                                          <td className="px-4 py-4 rounded-r-2xl border-y border-r border-slate-50 text-right">
                                              <div className="flex justify-end gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                  <button 
                                                      onClick={() => handleViewInvoice(inv)}
                                                      className="p-1.5 lg:p-2 bg-white rounded-lg lg:rounded-xl text-purple-600 hover:bg-purple-50 shadow-sm transition-all"
                                                      title="View"
                                                  >
                                                      <Eye size={12} className="lg:w-3.5 lg:h-3.5" />
                                                  </button>
                                                  <button 
                                                      onClick={() => handleViewInvoice(inv)}
                                                      className="p-1.5 lg:p-2 bg-white rounded-lg lg:rounded-xl text-purple-600 hover:bg-purple-50 shadow-sm transition-all hidden sm:block"
                                                      title="Print"
                                                  >
                                                      <Printer size={12} className="lg:w-3.5 lg:h-3.5" />
                                                  </button>
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                          {accountData.unpaid_invoices.length === 0 && (
                              <div className="py-12 lg:py-20 text-center opacity-30 flex flex-col items-center">
                                  <CheckCircle2 size={32} className="mb-3 lg:mb-4 text-emerald-500 lg:w-12 lg:h-12" />
                                  <p className="text-[10px] lg:text-sm font-black uppercase tracking-widest">No outstanding invoices</p>
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* Right Column: Ledger History */}
              <div className="lg:col-span-5 flex flex-col gap-6 min-h-0 overflow-hidden">
                  <div className="flex-1 bg-slate-900 rounded-[40px] shadow-2xl shadow-slate-900/20 flex flex-col overflow-hidden border border-white/5">
                      <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-3 text-white">
                              <History size={20} className="text-purple-400" />
                              <h3 className="font-black uppercase tracking-tight text-sm">Account Ledger</h3>
                          </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                          {accountData.ledger.map((entry, idx) => (
                              <div key={entry.id} className="flex gap-4 relative">
                                  {idx !== accountData.ledger.length - 1 && (
                                      <div className="absolute left-[19px] top-10 bottom-[-24px] w-[2px] bg-white/5" />
                                  )}
                                  <div className={cn(
                                      "w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 z-10 shadow-lg border",
                                      entry.type === 'debit' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                  )}>
                                      {entry.type === 'debit' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-start mb-1">
                                          <div>
                                              <h5 className="font-black text-white text-sm truncate uppercase tracking-tighter">
                                                  {entry.type === 'debit' ? 'Credit Bill' : 'Account Payment'}
                                              </h5>
                                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                  {new Date(entry.created_at).toLocaleString()}
                                              </p>
                                          </div>
                                          <div className="text-right">
                                              <p className={cn(
                                                  "text-sm font-black tracking-tighter",
                                                  entry.type === 'debit' ? "text-rose-400" : "text-emerald-400"
                                              )}>
                                                  {entry.type === 'debit' ? '+' : '-'} Rs. {parseFloat(entry.amount).toLocaleString()}
                                              </p>
                                              <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Bal: Rs. {parseFloat(entry.balance_after).toLocaleString()}</p>
                                          </div>
                                      </div>
                                      <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center group">
                                          <p className="text-[10px] text-slate-400 font-medium italic truncate pr-2">{entry.description}</p>
                                          {entry.invoice_id && (
                                              <button 
                                                  onClick={() => handleViewInvoice({ id: entry.invoice_id, uuid: entry.invoice_uuid })}
                                                  className="p-1.5 bg-white/5 text-purple-400 hover:bg-white/10 rounded-lg transition-colors"
                                                  title="View Linked Invoice"
                                              >
                                                  <FileText size={12} />
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          ))}
                          {accountData.ledger.length === 0 && (
                              <div className="py-20 text-center text-slate-600 italic text-sm font-medium uppercase tracking-widest">No activity found</div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Payment Modal */}
      <AppModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Account Payment"
        description={`Record a payment for ${customer?.name}`}
        size="md"
      >
        <div className="space-y-8 py-4">
            <div className="p-8 bg-slate-900 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Outstanding Balance</p>
                        <p className="text-4xl font-black text-rose-500 tracking-tighter">Rs. {parseFloat(customer?.current_balance || 0).toLocaleString()}</p>
                    </div>
                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-rose-500 border border-white/5">
                        <Wallet size={32} />
                    </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-purple-600/10 rounded-full blur-[60px]" />
            </div>

            <form onSubmit={handlePayment} className="space-y-6">
                <FormInput 
                    label="Payment Amount"
                    type="number"
                    required
                    placeholder="Enter amount to pay"
                    icon={Wallet}
                    value={paymentData.amount}
                    onChange={e => setPaymentData({...paymentData, amount: e.target.value})}
                    className="text-2xl font-black"
                    autoFocus
                />
                <FormSelect 
                    label="Payment Method"
                    value={paymentData.method}
                    onChange={e => setPaymentData({...paymentData, method: e.target.value})}
                    options={[
                        { value: 'cash', label: 'Cash Payment' },
                        { value: 'bank_transfer', label: 'Bank Transfer / Deposit' },
                        { value: 'card', label: 'Credit/Debit Card' },
                        { value: 'qr', label: 'QR Scan Payment' }
                    ]}
                />
                <FormInput 
                    label="Reference / Description"
                    placeholder="e.g. Paid by cash at counter"
                    icon={FileText}
                    value={paymentData.note}
                    onChange={e => setPaymentData({...paymentData, note: e.target.value})}
                />
                
                {parseFloat(paymentData.amount) > 0 && (
                    <div className="p-6 bg-emerald-50 rounded-[32px] border-2 border-emerald-100 flex justify-between items-center animate-in slide-in-from-top-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center">
                                <ArrowDownLeft size={20} />
                            </div>
                            <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">New Balance</span>
                        </div>
                        <span className="font-black text-2xl text-emerald-600 tracking-tighter">Rs. {(parseFloat(customer?.current_balance || 0) - parseFloat(paymentData.amount)).toLocaleString()}</span>
                    </div>
                )}

                <div className="flex gap-4 pt-4">
                    <AppButton variant="secondary" className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest" type="button" onClick={() => setShowPaymentModal(false)}>Cancel</AppButton>
                    <AppButton variant="success" className="flex-[2] py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20" loading={processing} type="submit">Record Payment</AppButton>
                </div>
            </form>
        </div>
      </AppModal>

      <InvoicePrintModal 
        isOpen={showPrintModal} 
        onClose={() => setShowPrintModal(false)} 
        invoice={selectedInvoice} 
      />
    </div>
  );
};

export default CustomerLedgerPage;
