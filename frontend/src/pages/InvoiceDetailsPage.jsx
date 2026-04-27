import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Mail, 
  Trash2, 
  CheckCircle2, 
  ShoppingCart,
  Calendar,
  User,
  CreditCard
} from 'lucide-react';
import { cn } from '../utils/cn';

const InvoiceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const { data } = await apiClient.get(`/invoices/${id}`);
      setInvoice(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div>Loading invoice details...</div>;
  if (!invoice) return <div>Invoice not found.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="no-print flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Invoices
        </button>
        <div className="flex gap-3">
            <button className="btn-secondary flex items-center gap-2 px-6">
                <Download size={18} />
                Download PDF
            </button>
            <button 
                onClick={handlePrint}
                className="btn-primary flex items-center gap-2 px-8"
            >
                <Printer size={18} />
                Print Invoice
            </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden shadow-2xl border-none" id="invoice-render">
        {/* Invoice Header */}
        <div className="p-12 bg-slate-900 text-white relative">
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
                            <ShoppingCart size={24} />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">RestoLedger</h1>
                    </div>
                    <div className="space-y-1 text-slate-400 text-sm font-medium">
                        <p>123 Restaurant Street, Colombo 03</p>
                        <p>Tel: +94 11 234 5678</p>
                        <p>Email: hello@restoledger.com</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-5xl font-black text-white/10 uppercase absolute top-8 right-8 pointer-events-none">Invoice</h2>
                    <div className="mt-12">
                        <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">Invoice Number</p>
                        <p className="text-2xl font-black">#{invoice.invoice_no}</p>
                    </div>
                </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
        </div>

        {/* Invoice Body */}
        <div className="p-12 bg-white">
            <div className="grid grid-cols-2 gap-12 mb-12">
                <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Billed To</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                <User size={16} />
                            </div>
                            <span className="font-bold text-slate-900">{invoice.customer_name || 'Walk-in Guest'}</span>
                        </div>
                        {invoice.customer_phone && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                    <Mail size={16} />
                                </div>
                                <span className="text-slate-500 font-medium">{invoice.customer_phone}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Invoice Date</h4>
                        <p className="font-bold text-slate-900 flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" />
                            {new Date(invoice.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Payment Method</h4>
                        <p className="font-bold text-slate-900 flex items-center gap-2">
                            <CreditCard size={16} className="text-slate-400" />
                            {invoice.payment_method.toUpperCase()}
                        </p>
                    </div>
                </div>
            </div>

            <table className="w-full text-left mb-12">
                <thead>
                    <tr className="border-b-2 border-slate-900">
                        <th className="py-4 text-xs font-black text-slate-900 uppercase tracking-widest">Item Description</th>
                        <th className="py-4 text-xs font-black text-slate-900 uppercase tracking-widest text-center">Qty</th>
                        <th className="py-4 text-xs font-black text-slate-900 uppercase tracking-widest text-right">Price</th>
                        <th className="py-4 text-xs font-black text-slate-900 uppercase tracking-widest text-right">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {invoice.items.map((item) => (
                        <tr key={item.id}>
                            <td className="py-5">
                                <p className="font-bold text-slate-900">{item.item_name}</p>
                            </td>
                            <td className="py-5 text-center font-medium text-slate-600">{item.qty}</td>
                            <td className="py-5 text-right font-medium text-slate-600">Rs. {parseFloat(item.unit_price).toLocaleString()}</td>
                            <td className="py-5 text-right font-bold text-slate-900">Rs. {parseFloat(item.total).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-3">
                    <div className="flex justify-between text-slate-500 font-medium">
                        <span>Subtotal</span>
                        <span>Rs. {parseFloat(invoice.subtotal).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-medium">
                        <span>Discount</span>
                        <span className="text-rose-500">- Rs. {parseFloat(invoice.discount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-t-2 border-slate-900">
                        <span className="text-lg font-black text-slate-900 uppercase tracking-tight">Total Paid</span>
                        <span className="text-3xl font-black text-indigo-600">Rs. {parseFloat(invoice.grand_total).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-12 bg-slate-50 border-t border-slate-100 text-center">
            <h4 className="font-bold text-slate-900 mb-2">Thank you for your business!</h4>
            <p className="text-xs text-slate-400 font-medium">This is a computer-generated invoice from RestoLedger POS.</p>
        </div>
      </div>
      
      {/* Thermal Print Hidden Version */}
      <div className="print-only thermal-receipt font-mono text-[10px] w-[80mm] p-2 leading-tight">
          <div className="text-center mb-2">
              <h1 className="font-bold uppercase text-sm">RestoLedger</h1>
              <p>123 Restaurant St, Colombo</p>
              <p>+94 11 234 5678</p>
          </div>
          <div className="border-t border-dashed my-1"></div>
          <div className="flex justify-between">
              <span>INV: {invoice.invoice_no}</span>
              <span>{new Date(invoice.created_at).toLocaleDateString()}</span>
          </div>
          <div className="border-t border-dashed my-1"></div>
          <table className="w-full text-left">
              <thead>
                  <tr>
                      <th className="font-normal">ITEM</th>
                      <th className="text-center font-normal">QTY</th>
                      <th className="text-right font-normal">AMT</th>
                  </tr>
              </thead>
              <tbody>
                  {invoice.items.map(item => (
                      <tr key={item.id}>
                          <td>{item.item_name}</td>
                          <td className="text-center">{item.qty}</td>
                          <td className="text-right">{item.total}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
          <div className="border-t border-dashed my-1"></div>
          <div className="flex justify-between font-bold">
              <span>TOTAL</span>
              <span>RS. {invoice.grand_total}</span>
          </div>
          <div className="text-center mt-4 italic">
              <p>Thank You!</p>
              <p>Powered by RestoLedger</p>
          </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
            .no-print { display: none !important; }
            body { background: white !important; margin: 0; padding: 0; }
            #invoice-render { 
                box-shadow: none !important; 
                border: 1px solid #eee !important;
                display: block !important;
            }
            .thermal-receipt { display: none !important; } /* Default print to A4 style */
        }
        
        /* If user wants thermal specific print, we can toggle classes or use another media query */
      ` }} />
    </div>
  );
};

export default InvoiceDetailsPage;
