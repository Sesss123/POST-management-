import React from 'react';

const KOTTemplate = ({ kot }) => {
  if (!kot) return null;

  const {
    kot_no,
    table_no,
    order_type,
    status,
    note: orderNote,
    created_at,
    created_by_name,
    items,
    settings
  } = kot;

  return (
    <div className="kot-template bg-white text-black font-mono p-4 w-[80mm] mx-auto shadow-sm">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-black uppercase mb-1">{settings?.restaurant_name || 'RestoLedger'}</h1>
        <div className="bg-black text-white py-1 px-2 inline-block font-bold text-lg mb-2">
          KITCHEN ORDER TICKET
        </div>
      </div>

      <div className="border-t-2 border-black border-dashed my-2"></div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
        <div className="font-bold">KOT: {kot_no}</div>
        <div className="text-right">{new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
        
        <div className="text-lg font-black uppercase">
          {table_no ? `Table: ${table_no}` : 'Takeaway'}
        </div>
        <div className="text-right font-bold uppercase">{order_type?.replace('_', ' ')}</div>
      </div>

      <div className="text-xs space-y-1 mb-2">
        <div className="flex justify-between">
          <span>Date: {new Date(created_at).toLocaleDateString()}</span>
          <span>By: {created_by_name}</span>
        </div>
        <div className="font-bold uppercase">Status: {status}</div>
      </div>

      <div className="border-t-2 border-black border-dashed my-2"></div>

      {/* Items Table */}
      <table className="w-full mb-2">
        <thead>
          <tr className="border-b-2 border-black text-left">
            <th className="py-2 text-2xl">QTY</th>
            <th className="py-2 text-lg pl-4">ITEM</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black divide-dotted">
          {items && items.map((item, idx) => (
            <tr key={idx} className="align-top">
              <td className="py-3 text-4xl font-black">{item.qty}</td>
              <td className="py-3 pl-4">
                <div className="text-xl font-bold uppercase leading-tight">{item.item_name}</div>
                {item.note && (
                  <div className="text-sm font-black bg-slate-100 p-1 mt-1 border-l-4 border-black">
                    NOTE: {item.note}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {orderNote && (
        <div className="mt-4 p-3 border-2 border-black border-double">
          <div className="text-[10px] font-black uppercase mb-1">Special Order Note:</div>
          <p className="text-sm font-bold uppercase leading-tight">{orderNote}</p>
        </div>
      )}

      <div className="border-t-2 border-black border-dashed my-4"></div>

      {/* Footer */}
      <div className="text-center space-y-1 mb-8">
        <p className="font-black text-lg uppercase tracking-widest">--- KITCHEN COPY ---</p>
        <p className="text-[10px]">RestoLedger POS System • {new Date().toLocaleString()}</p>
      </div>

      {/* Padding for paper cut */}
      <div className="h-10"></div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .kot-template {
            width: 80mm !important;
            margin: 0 !important;
            padding: 5mm !important;
            box-shadow: none !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
          /* Custom sizes for print if needed */
          .text-4xl { font-size: 2.25rem !important; }
          .text-2xl { font-size: 1.5rem !important; }
          .text-xl { font-size: 1.25rem !important; }
        }
      `}} />
    </div>
  );
};

export default KOTTemplate;
