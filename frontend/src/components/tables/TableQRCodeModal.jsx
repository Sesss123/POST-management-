import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { AppModal, AppButton } from '../ui';
import { Download, Printer, ExternalLink, QrCode } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TableQRCodeModal = ({ isOpen, onClose, table, restaurantName }) => {
    const { user } = useAuth();
    const qrRef = useRef();

    if (!table) return null;

    const baseUrl = window.location.origin;
    const shopSlug = user?.shopIdentifier || 'default';
    const menuUrl = `${baseUrl}/menu/${shopSlug}/table/${table.table_no}`;

    const downloadQR = () => {
        const canvas = document.getElementById('table-qr-code');
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `QR_Table_${table.table_no}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const printQR = () => {
        const printWindow = window.open('', '_blank');
        const canvas = document.getElementById('table-qr-code');
        const qrImage = canvas.toDataURL('image/png');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print QR - Table ${table.table_no}</title>
                    <style>
                        body { 
                            font-family: 'Inter', sans-serif; 
                            display: flex; 
                            flex-direction: column; 
                            align-items: center; 
                            justify-content: center; 
                            height: 100vh; 
                            margin: 0;
                            text-align: center;
                        }
                        .container {
                            border: 2px solid #e2e8f0;
                            padding: 40px;
                            border-radius: 24px;
                            background: white;
                        }
                        h1 { font-size: 24px; margin-bottom: 5px; color: #1e293b; }
                        h2 { font-size: 48px; margin: 10px 0; color: #4f46e5; font-weight: 900; }
                        p { font-size: 18px; color: #64748b; margin-bottom: 30px; }
                        img { width: 300px; height: 300px; }
                        .footer { margin-top: 30px; font-weight: bold; color: #94a3b8; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>${restaurantName || 'RestoLedger'}</h1>
                        <p>Digital Menu</p>
                        <h2>TABLE ${table.table_no}</h2>
                        <img src="${qrImage}" />
                        <p class="footer">Scan to view our menu</p>
                    </div>
                    <script>
                        window.onload = () => {
                            window.print();
                            window.onafterprint = () => window.close();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <AppModal
            isOpen={isOpen}
            onClose={onClose}
            title="Table QR Code"
            size="md"
        >
            <div className="flex flex-col items-center text-center p-4">
                <div className="mb-6 p-6 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                    <QRCodeCanvas
                        id="table-qr-code"
                        value={menuUrl}
                        size={256}
                        level="H"
                        includeMargin={true}
                        imageSettings={{
                            src: "/logo.png",
                            x: undefined,
                            y: undefined,
                            height: 40,
                            width: 40,
                            excavate: true,
                        }}
                    />
                </div>

                <div className="mb-8">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Table {table.table_no}</h3>
                    <p className="text-slate-500 font-medium italic mt-1">Scan this code to view the digital menu</p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black">
                        <ExternalLink size={14} />
                        <span className="truncate max-w-[250px]">{menuUrl}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                    <AppButton 
                        variant="secondary" 
                        icon={Download} 
                        className="flex-1 py-4 uppercase tracking-widest text-[10px] font-black"
                        onClick={downloadQR}
                    >
                        Download PNG
                    </AppButton>
                    <AppButton 
                        variant="primary" 
                        icon={Printer} 
                        className="flex-1 py-4 uppercase tracking-widest text-[10px] font-black"
                        onClick={printQR}
                    >
                        Print Tag
                    </AppButton>
                </div>
                
                <AppButton 
                    variant="ghost" 
                    className="mt-4 w-full text-slate-400 hover:text-slate-600"
                    onClick={onClose}
                >
                    Close
                </AppButton>
            </div>
        </AppModal>
    );
};

export default TableQRCodeModal;
