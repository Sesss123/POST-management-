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
    cash_received,
    change_amount,
    balance_amount,
    payment_method,
    payment_status,
    settings
  } = invoice;

  const parseNum = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  const currency = settings?.currency_symbol || 'Rs.';
  const dateStr = created_at ? new Date(created_at).toLocaleDateString() : new Date().toLocaleDateString();
  const timeStr = created_at ? new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="thermal-receipt-template bg-white text-black font-mono p-2 w-[80mm] mx-auto shadow-sm text-center">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-black uppercase mb-1 tracking-tight">{settings?.restaurant_name || 'RESTOLEDGER POS'}</h1>
        <p className="text-[10px] leading-tight mb-0.5">{settings?.restaurant_address || '123 POS Street, City'}</p>
        <p className="text-[10px]">TEL: {settings?.restaurant_phone || '0112345678'}</p>
        {payment_method === 'credit' && (
          <div className="mt-2 py-1 border-2 border-black font-black text-sm uppercase">
            *** CREDIT SALE ***
          </div>
        )}
      </div>

      <div className="border-t border-black border-dashed my-2"></div>

      {/* Basic Info */}
      <div className="text-[10px] space-y-0.5 text-left mb-2">
        <div className="flex justify-between">
          <span className="font-bold">BILL NO: {invoice_no || 'N/A'}</span>
          <span>{dateStr}</span>
        </div>
        <div className="flex justify-between">
          <span>CASHIER: {created_by_name || 'SYSTEM'}</span>
          <span>{timeStr}</span>
        </div>
        {table_no && (
          <div className="flex justify-between font-black border-y border-black border-dotted py-0.5 my-0.5">
            <span>TABLE: {table_no}</span>
            <span className="uppercase">{payment_method || 'CASH'}</span>
          </div>
        )}
        {customer_name && (
          <div className="text-[10px] italic">
            <span>CUSTOMER: {customer_name}</span>
          </div>
        )}
      </div>

      <div className="border-t border-black border-dashed my-2"></div>

      {/* Items */}
      <table className="w-full text-[10px] mb-2">
        <thead>
          <tr className="border-b border-black font-bold">
            <th className="text-left py-1">ITEM</th>
            <th className="text-center py-1">QTY</th>
            <th className="text-right py-1">PRICE</th>
            <th className="text-right py-1">TOTAL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black divide-dotted">
          {items && items.length > 0 ? items.map((item, idx) => (
            <tr key={idx} className="align-top">
              <td className="py-1 uppercase text-left pr-1 leading-tight">
                {item.item_name}
              </td>
              <td className="text-center py-1">{item.qty}</td>
              <td className="text-right py-1">{parseNum(item.unit_price).toFixed(0)}</td>
              <td className="text-right py-1 font-bold">{parseNum(item.total).toFixed(0)}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan="4" className="py-4 text-center italic">No items found</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="border-t border-black border-dashed my-2"></div>

      {/* Totals */}
      <div className="text-[11px] space-y-1 text-left">
        <div className="flex justify-between">
          <span>SUBTOTAL:</span>
          <span>{parseNum(subtotal).toFixed(2)}</span>
        </div>
        
        {parseNum(discount) > 0 && (
          <div className="flex justify-between font-bold">
            <span>DISCOUNT:</span>
            <span>-{parseNum(discount).toFixed(2)}</span>
          </div>
        )}

        {parseNum(service_charge_amount) > 0 && (
          <div className="flex justify-between">
            <span>S.CHARGE ({parseNum(service_charge_rate)}%):</span>
            <span>{parseNum(service_charge_amount).toFixed(2)}</span>
          </div>
        )}

        {parseNum(tax_amount) > 0 && (
          <div className="flex justify-between">
            <span>TAX ({parseNum(tax_rate)}%):</span>
            <span>{parseNum(tax_amount).toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-lg font-black mt-2 pt-2 border-t-2 border-black border-double">
          <span>TOTAL:</span>
          <span>{currency} {parseNum(grand_total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        <div className="pt-2 space-y-1 border-t border-black border-dotted mt-2">
          {payment_method === 'cash' ? (
            <>
              <div className="flex justify-between text-[10px]">
                <span>CASH RECEIVED:</span>
                <span>{parseNum(cash_received).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-black uppercase">
                <span>CHANGE:</span>
                <span>{parseNum(change_amount).toFixed(2)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-[10px]">
                <span>PAID AMOUNT:</span>
                <span>{parseNum(paid_amount || grand_total).toFixed(2)}</span>
              </div>
              {payment_method === 'credit' && (
                <div className="flex justify-between text-[11px] font-black uppercase">
                  <span>BALANCE DUE:</span>
                  <span>{Math.abs(parseNum(balance_amount)).toFixed(2)}</span>
                </div>
              )}
            </>
          )}
          <div className="text-[8px] font-bold text-center border-t border-black border-dotted mt-2 pt-1 uppercase">
            Payment Mode: {payment_method || 'CASH'}
          </div>
        </div>
      </div>

      <div className="border-t border-black border-dashed my-4"></div>

      {/* Footer */}
      <div className="text-center text-[10px] space-y-1 mb-6">
        <p className="font-black uppercase leading-tight tracking-tighter">
          {settings?.receipt_footer_message || 'THANK YOU FOR DINING WITH US!'}
        </p>
        <p className="text-[8px] text-slate-500">RestoLedger POS System v2.0</p>
        <p className="text-[9px]">{dateStr} {timeStr}</p>
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
