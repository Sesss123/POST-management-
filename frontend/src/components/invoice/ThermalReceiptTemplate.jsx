import React from 'react';
import { cn } from '../../utils/cn';

const ThermalReceiptTemplate = ({ invoice }) => {
  console.log('ThermalReceiptTemplate Data:', invoice);
  if (!invoice) return null;

  const {
    invoice_no,
    created_at,
    created_by_name,
    customer_name,
    table_no,
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
    currency_code,
    currency_symbol,
    tax_name,
    tax_inclusive,
    settings
  } = invoice;

  const items = invoice.items || invoice.invoice_items || [];

  const parseNum = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  const currency = currency_symbol || settings?.currency_symbol || 'Rs.';
  const taxName = tax_name || settings?.tax_name || 'TAX';
  const dateStr = created_at ? new Date(created_at).toLocaleDateString() : new Date().toLocaleDateString();
  const timeStr = created_at ? new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Safe items check
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="thermal-receipt-template bg-white text-black font-mono p-2 w-[80mm] mx-auto shadow-sm text-center">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-black uppercase mb-1 tracking-tight">{invoice.receipt_restaurant_name || settings?.restaurant_name || 'RESTOLEDGER POS'}</h1>
        <p className="text-[10px] leading-tight mb-0.5">{invoice.receipt_restaurant_address || settings?.restaurant_address || 'Address Not Set'}</p>
        <p className="text-[10px]">TEL: {invoice.receipt_restaurant_phone || settings?.restaurant_phone || 'N/A'}</p>
        {payment_method === 'credit' && (
          <div className="mt-2 py-1 border-2 border-black font-black text-sm uppercase">
            *** CREDIT SALE ***
          </div>
        )}
      </div>

      <div className="border-t border-black border-dashed my-2"></div>

      {/* Basic Info */}
      <div className="text-[12px] space-y-0.5 text-left mb-2">
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

      {/* Items List */}
      <div className="w-full text-[12px] mb-2">
        <div className="flex justify-between border-b border-black font-bold py-1 uppercase text-[10px] tracking-widest">
          <span className="w-1/2 text-left">Item</span>
          <span className="w-1/6 text-center">Qty</span>
          <span className="w-1/3 text-right">Total</span>
        </div>
        <div className="divide-y divide-black divide-dotted">
          {safeItems.length > 0 ? safeItems.map((item, idx) => (
            <div key={idx} className="py-2">
              <div className="flex justify-between items-start gap-1">
                <span className="w-1/2 text-left uppercase leading-tight font-bold">
                  {item.item_name}
                  {item.modifier_names && (
                    <div className="text-[9px] font-normal normal-case italic opacity-80 leading-none mt-0.5">
                      {item.modifier_names}
                    </div>
                  )}
                  {item.special_note && (
                    <div className="text-[9px] font-normal italic opacity-70 leading-none mt-0.5">
                      Note: {item.special_note}
                    </div>
                  )}
                </span>
                <span className="w-1/6 text-center">{item.qty}</span>
                <span className="w-1/3 text-right font-black">
                  {parseNum(item.total).toFixed(0)}
                </span>
              </div>
            </div>
          )) : (
            <div className="py-8 text-center italic font-bold bg-slate-50 border-2 border-dashed border-slate-200">
              [DATA ERROR: NO ITEMS FOUND]
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-black border-dashed my-2"></div>

      {/* Totals */}
      <div className="text-[12px] space-y-1 text-left">
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
            <span>{taxName} ({parseNum(tax_rate)}%){tax_inclusive ? ' [INC]' : ''}:</span>
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
            min-height: 100mm !important;
            margin: 0 !important;
            padding: 2mm !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            text-align: center !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}} />
      <div className="hidden">Print-Debug: Items={safeItems.length}, Settings={!!settings}</div>
    </div>
  );
};

export default ThermalReceiptTemplate;
