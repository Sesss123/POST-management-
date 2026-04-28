import React from 'react';
import { ShoppingCart, Calendar, User, CreditCard, Phone, MapPin } from 'lucide-react';
import { cn } from '../../utils/cn';

const A4InvoiceTemplate = ({ invoice }) => {
  if (!invoice) return null;

  const {
    invoice_no,
    created_at,
    created_by_name,
    customer_name,
    customer_phone,
    table_no,
    items,
    subtotal,
    discount,
    tax_amount,
    tax_rate,
    service_charge_amount,
    service_charge_rate,
    grand_total,
    paid_amount,
    balance_amount,
    payment_method,
    payment_status,
    settings
  } = invoice;

  const currency = settings?.currency_symbol || 'Rs.';

  return (
    <div className="a4-invoice-template bg-white text-slate-900 font-sans p-8 max-w-[210mm] mx-auto min-h-[297mm] shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
              <ShoppingCart size={24} />
            </div>
            <h1 className="text-3xl font-black tracking-tight uppercase">{settings?.restaurant_name || 'RestoLedger'}</h1>
          </div>
          <div className="space-y-1 text-slate-500 text-sm font-bold">
            <div className="flex items-center gap-2">
                <MapPin size={14} />
                <p>{settings?.restaurant_address || '123 Restaurant Street, Colombo'}</p>
            </div>
            <div className="flex items-center gap-2">
                <Phone size={14} />
                <p>{settings?.restaurant_phone || '+94 11 234 5678'}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-5xl font-black text-slate-100 uppercase mb-4">Invoice</h2>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Number</p>
            <p className="text-2xl font-black">#{invoice_no}</p>
          </div>
        </div>
      </div>

      {/* Details Bar */}
      <div className="grid grid-cols-4 gap-8 mb-12 py-6 border-b border-slate-100">
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Date & Time</h4>
          <p className="font-bold text-sm flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            {new Date(created_at).toLocaleString()}
          </p>
        </div>
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cashier</h4>
          <p className="font-bold text-sm flex items-center gap-2">
            <User size={14} className="text-slate-400" />
            {created_by_name}
          </p>
        </div>
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment</h4>
          <p className="font-bold text-sm flex items-center gap-2">
            <CreditCard size={14} className="text-slate-400" />
            <span className="uppercase">{payment_method}</span>
          </p>
        </div>
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</h4>
          <span className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
              payment_status === 'paid' ? "bg-emerald-100 text-emerald-700" : 
              payment_status === 'unpaid' ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"
          )}>
            {payment_status}
          </span>
        </div>
      </div>

      {/* Customer & Table */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Billed To</h4>
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <p className="text-xl font-black text-slate-900 mb-1">{customer_name || 'Walk-in Guest'}</p>
            {customer_phone && <p className="text-sm font-bold text-slate-500">{customer_phone}</p>}
          </div>
        </div>
        {table_no && (
            <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Reference</h4>
                <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Table Number</p>
                    <p className="text-2xl font-black text-indigo-600">Table {table_no}</p>
                </div>
            </div>
        )}
      </div>

      {/* Items Table */}
      <table className="w-full text-left mb-12">
        <thead>
          <tr className="border-b-2 border-slate-900">
            <th className="py-4 text-xs font-black text-slate-900 uppercase tracking-widest">Item Description</th>
            <th className="py-4 text-xs font-black text-slate-900 uppercase tracking-widest text-center">Qty</th>
            <th className="py-4 text-xs font-black text-slate-900 uppercase tracking-widest text-right">Unit Price</th>
            <th className="py-4 text-xs font-black text-slate-900 uppercase tracking-widest text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items && items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-5">
                <p className="font-bold text-slate-900">{item.item_name}</p>
              </td>
              <td className="py-5 text-center font-medium text-slate-600">{item.qty}</td>
              <td className="py-5 text-right font-medium text-slate-600">{currency} {parseFloat(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="py-5 text-right font-bold text-slate-900">{currency} {parseFloat(item.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="flex justify-end mb-12">
        <div className="w-full max-w-xs space-y-3">
          <div className="flex justify-between text-slate-500 font-bold text-sm">
            <span>Subtotal</span>
            <span>{currency} {parseFloat(subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          
          {parseFloat(discount) > 0 && (
            <div className="flex justify-between text-rose-500 font-bold text-sm">
              <span>Discount</span>
              <span>- {currency} {parseFloat(discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          
          {parseFloat(service_charge_amount) > 0 && (
            <div className="flex justify-between text-slate-500 font-bold text-sm">
              <span>Service Charge ({service_charge_rate}%)</span>
              <span>{currency} {parseFloat(service_charge_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          
          {parseFloat(tax_amount) > 0 && (
            <div className="flex justify-between text-slate-500 font-bold text-sm">
              <span>Tax ({tax_rate}%)</span>
              <span>{currency} {parseFloat(tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center py-4 border-t-2 border-slate-900">
            <span className="text-lg font-black text-slate-900 uppercase tracking-tight">Grand Total</span>
            <span className="text-3xl font-black text-slate-900">{currency} {parseFloat(grand_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="pt-4 space-y-2 border-t border-slate-100">
            <div className="flex justify-between text-slate-500 font-bold text-xs">
                <span>Amount Paid</span>
                <span>{currency} {parseFloat(paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-black text-sm">
                <span>{payment_status === 'unpaid' ? 'Balance Due' : 'Balance Returned'}</span>
                <span className={cn(payment_status === 'unpaid' ? "text-rose-600" : "text-emerald-600")}>
                    {currency} {Math.abs(parseFloat(balance_amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-12 text-center border-t border-slate-100">
        <p className="font-black text-slate-900 uppercase tracking-widest mb-2">{settings?.receipt_footer_message || 'Thank you for your business!'}</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Powered by RestoLedger POS</p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .a4-invoice-template {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 20mm !important;
            width: 210mm !important;
            height: 297mm !important;
          }
          body {
            background: white !important;
          }
        }
      `}} />
    </div>
  );
};

export default A4InvoiceTemplate;
