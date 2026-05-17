import React from 'react';
import { useAuth } from '../../context/AuthContext';

const PaymentReceiptTemplate = ({ payment, settings }) => {
  const { user } = useAuth();
  if (!payment) return null;

  const shopName = settings?.shop_name || 'RestoLedger';
  const shopAddress = settings?.shop_address || '';
  const shopPhone = settings?.shop_phone || '';

  return (
    <div id="payment-receipt-print" className="bg-white text-slate-900 p-4 w-[80mm] mx-auto font-mono text-[12px] leading-tight">
      {/* Header */}
      <div className="text-center mb-4 border-b border-dashed border-slate-300 pb-2">
        <h2 className="text-[18px] font-black uppercase tracking-tight">{shopName}</h2>
        {shopAddress && <p className="mt-1">{shopAddress}</p>}
        {shopPhone && <p>Tel: {shopPhone}</p>}
      </div>

      <div className="text-center mb-4 border-b border-dashed border-slate-300 pb-2">
        <h3 className="text-[14px] font-bold uppercase underline">Payment Receipt</h3>
      </div>

      {/* Info Grid */}
      <div className="space-y-1 mb-4">
        <div className="flex justify-between">
          <span>Date:</span>
          <span className="font-bold">{new Date().toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Receipt No:</span>
          <span className="font-bold">PAY-{payment.payment_id || 'NEW'}</span>
        </div>
        <div className="flex justify-between">
          <span>Customer:</span>
          <span className="font-bold uppercase">{payment.customer_name || 'Customer'}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier:</span>
          <span className="font-bold">{user?.name}</span>
        </div>
      </div>

      {/* Payment Details */}
      <div className="border-y border-dashed border-slate-300 py-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-[14px] font-bold uppercase">Paid Amount:</span>
          <span className="text-[16px] font-black">Rs. {parseFloat(payment.paid_amount || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between mt-1 text-[10px] italic">
          <span>Method:</span>
          <span className="uppercase">{payment.payment_method || 'Cash'}</span>
        </div>
      </div>

      {/* Balance Summary */}
      <div className="space-y-1 mb-6">
        <div className="flex justify-between">
          <span>Previous Balance:</span>
          <span>Rs. {parseFloat(payment.previous_balance || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-black text-[14px] pt-1 border-t border-slate-100">
          <span>Current Balance:</span>
          <span>Rs. {parseFloat(payment.new_balance || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Note */}
      {payment.note && (
        <div className="mb-4 text-[10px] italic border-t border-slate-50 pt-2">
          <p>Note: {payment.note}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-8 border-t border-dashed border-slate-300 pt-4">
        <p className="font-bold">THANK YOU!</p>
        <p className="text-[8px] mt-1 opacity-50">Software by RestoLedger</p>
      </div>
      
      {/* Print Helpers */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #payment-receipt-print, #payment-receipt-print * { visibility: visible; }
          #payment-receipt-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 10mm;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentReceiptTemplate;
