import React from 'react';
import { cn } from '../../utils/cn';

const ThermalReceiptTemplate = ({ invoice }) => {
  if (!invoice) return null;

  const {
    invoice_no,
    created_at,
    created_by_name,
    customer_name,
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
    <div className="thermal-receipt-template bg-white text-black font-mono p-4 w-[80mm] mx-auto shadow-sm">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold uppercase mb-1">{settings?.restaurant_name || 'RestoLedger'}</h1>
        <p className="text-[10px] leading-tight mb-1">{settings?.restaurant_address || '123 Restaurant Street, Colombo'}</p>
        <p className="text-[10px]">Tel: {settings?.restaurant_phone || '+94 11 234 5678'}</p>
      </div>

      <div className="border-t border-black border-dashed my-2"></div>

      {/* Basic Info */}
      <div className="text-[10px] space-y-1 mb-2">
        <div className="flex justify-between">
          <span>Bill No: {invoice_no}</span>
          <span>{new Date(created_at).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier: {created_by_name}</span>
          <span>{new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {table_no && (
          <div className="flex justify-between font-bold">
            <span>Table: {table_no}</span>
            <span className="uppercase">{payment_method}</span>
          </div>
        )}
        {customer_name && (
          <div className="text-[10px]">
            <span>Cust: {customer_name}</span>
          </div>
        )}
      </div>

      <div className="border-t border-black border-dashed my-2"></div>

      {/* Items */}
      <table className="w-full text-[10px] mb-2">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1">ITEM</th>
            <th className="text-center py-1">QTY</th>
            <th className="text-right py-1">PRICE</th>
            <th className="text-right py-1">TOTAL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black divide-dotted">
          {items && items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1 uppercase max-w-[40mm] truncate">{item.item_name}</td>
              <td className="text-center py-1">{item.qty}</td>
              <td className="text-right py-1">{parseFloat(item.unit_price).toFixed(0)}</td>
              <td className="text-right py-1 font-bold">{parseFloat(item.total).toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-black border-dashed my-2"></div>

      {/* Totals */}
      <div className="text-[11px] space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{parseFloat(subtotal).toFixed(2)}</span>
        </div>
        {parseFloat(discount) > 0 && (
          <div className="flex justify-between font-bold">
            <span>Discount:</span>
            <span>-{parseFloat(discount).toFixed(2)}</span>
          </div>
        )}
        {parseFloat(service_charge_amount) > 0 && (
          <div className="flex justify-between">
            <span>S.Charge ({service_charge_rate}%):</span>
            <span>{parseFloat(service_charge_amount).toFixed(2)}</span>
          </div>
        )}
        {parseFloat(tax_amount) > 0 && (
          <div className="flex justify-between">
            <span>Tax ({tax_rate}%):</span>
            <span>{parseFloat(tax_amount).toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-black border-double">
          <span>TOTAL:</span>
          <span>{currency} {parseFloat(grand_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="pt-2 space-y-1">
          <div className="flex justify-between text-[10px]">
            <span>Paid Amount:</span>
            <span>{parseFloat(paid_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[10px] font-bold">
            <span>{payment_status === 'unpaid' ? 'BALANCE DUE:' : 'CHANGE:'}</span>
            <span>{Math.abs(parseFloat(balance_amount)).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-black border-dashed my-4"></div>

      {/* Footer */}
      <div className="text-center text-[10px] space-y-1 mb-8">
        <p className="font-bold uppercase leading-tight">{settings?.receipt_footer_message || 'Thank You! Come Again'}</p>
        <p>RestoLedger POS System</p>
        <p>{new Date().toLocaleString()}</p>
      </div>

      {/* Padding for paper cut */}
      <div className="h-10"></div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .thermal-receipt-template {
            width: 80mm !important;
            margin: 0 !important;
            padding: 5mm !important;
            box-shadow: none !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}} />
    </div>
  );
};

export default ThermalReceiptTemplate;
