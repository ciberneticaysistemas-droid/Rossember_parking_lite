import React, { useRef, useEffect } from 'react';
import { Printer, X, CheckSquare, DollarSign, Clock, Calendar, Building2 } from 'lucide-react';
import { DocumentConfig, KeyboardShortcutsConfig } from '../types';

interface InvoiceTicketProps {
  record: {
    id: string;
    plate: string;
    ownerId?: string;
    vehicleType: string;
    entryTime: number;
    exitTime: number;
    vehicleState?: string;
    leavesHelmet?: boolean;
    helmetLocation?: string;
  };
  cost: number;
  subtotal: number;
  ivaAmount: number;
  ivaRate: number;
  paymentMethod: string;
  cashGiven?: number;
  change?: number;
  onClose: () => void;
  printerConfig?: { name: string; connected: boolean; autoprint?: boolean; paperFormat?: string; paperWidth?: number } | null;
  documentConfig?: DocumentConfig;
  keyboardShortcuts?: KeyboardShortcutsConfig;
}

export const InvoiceTicket: React.FC<InvoiceTicketProps> = ({
  record,
  cost,
  subtotal,
  ivaAmount,
  ivaRate,
  paymentMethod,
  cashGiven,
  change,
  onClose,
  printerConfig,
  documentConfig,
  keyboardShortcuts
}) => {
  const ticketRef = useRef<HTMLDivElement>(null);

  const formatCOP = (val: number) =>
    val.toLocaleString('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).replace('COP', '$');

  const handlePrint = () => {
    const fmt = printerConfig?.paperFormat;
    const isThermal = fmt === 'TICKET' || fmt === 'TICKET_WIDE' || !fmt;

    // Ancho de vista previa en pantalla (no afecta la impresión real)
    let cssMaxWidth = '380px';
    let bodyPadding = '20px';
    if (fmt === 'TICKET') { cssMaxWidth = '302px'; bodyPadding = '8px'; }
    else if (fmt === 'TICKET_WIDE') { cssMaxWidth = '302px'; bodyPadding = '8px'; }
    else if (fmt === 'HALF') { cssMaxWidth = '390px'; bodyPadding = '20px'; }
    else if (fmt === 'LETTER') { cssMaxWidth = '740px'; bodyPadding = '30px'; }

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Factura de Venta - ${record.plate}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', sans-serif;
              background: white;
              padding: ${bodyPadding};
              max-width: ${cssMaxWidth};
              margin: 0 auto;
              font-size: ${isThermal ? '11px' : '13px'};
              color: #111;
            }
            .ticket {
              padding: ${isThermal ? '8px' : '16px'};
              text-align: center;
              ${isThermal ? '' : 'border: 1px solid #ddd; border-radius: 8px;'}
            }
            .header { margin-bottom: ${isThermal ? '6px' : '12px'}; border-bottom: 2px solid #000; padding-bottom: ${isThermal ? '6px' : '10px'}; }
            .logo { font-size: ${isThermal ? '14px' : '24px'}; font-weight: 900; margin-bottom: 2px; }
            .legal-info { font-size: 9px; color: #555; margin-bottom: 3px; line-height: 1.3; }

            .invoice-title { font-size: ${isThermal ? '12px' : '16px'}; font-weight: 800; text-transform: uppercase; margin: ${isThermal ? '6px' : '10px'} 0; border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; padding: 4px 0; }

            .plate { font-size: ${isThermal ? '28px' : '40px'}; font-weight: 900; letter-spacing: 0.1em; color: #000; margin: ${isThermal ? '5px' : '8px'} 0; font-family: monospace; }

            .details { margin: ${isThermal ? '6px' : '12px'} 0; text-align: left; }
            .detail-row { display: flex; justify-content: space-between; padding: ${isThermal ? '2px' : '3px'} 0; }
            .label { font-weight: 500; color: #444; }
            .value { font-weight: 700; }

            .totals { margin: ${isThermal ? '6px' : '12px'} 0; padding-top: ${isThermal ? '6px' : '10px'}; border-top: 2px solid #000; }
            .total-row { display: flex; justify-content: space-between; padding: ${isThermal ? '2px' : '4px'} 0; }
            .grand-total { border-top: 1px solid #000; margin-top: 4px; padding-top: 6px; display: block; text-align: center; }
            .grand-total-label { font-size: 9px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.08em; }
            .grand-total-value { font-size: ${isThermal ? '18px' : '22px'}; font-weight: 900; color: #000; margin-top: 2px; }

            .cash-info { margin-top: 4px; padding: ${isThermal ? '4px' : '8px'}; background: #f9f9f9; }

            .footer { font-size: 9px; color: #777; margin-top: ${isThermal ? '8px' : '15px'}; line-height: 1.4; border-top: 1px solid #eee; padding-top: 8px; }

            ${isThermal ? `@page { size: 80mm auto; margin: 2mm 4mm; }` : `@page { margin: 10mm; }`}
            @media print {
              body { padding: 0; ${isThermal ? 'width: 72mm; font-size: 10px;' : ''} }
              .ticket { border: none; border-radius: 0; }
              .cash-info { background: none; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <div class="logo">🅿 ${documentConfig?.businessName || 'ParkingCore'}</div>
              ${documentConfig?.nit ? `<div class="legal-info">NIT: ${documentConfig.nit}</div>` : ''}
              ${documentConfig?.address ? `<div class="legal-info">${documentConfig.address}</div>` : ''}
              ${documentConfig?.phone ? `<div class="legal-info">Tel: ${documentConfig.phone}</div>` : ''}
              ${documentConfig?.legalInfo ? `<div class="legal-info" style="margin-top: 5px; border-top: 1px solid #eee; padding-top: 5px;">${documentConfig.legalInfo}</div>` : ''}
            </div>

            <div class="invoice-title">Factura de Venta</div>
            <div class="legal-info text-center">Factura No: ${record.id.substring(0, 8).toUpperCase()}</div>
            <div class="plate">${record.plate}</div>
            
            <div class="details">
              <div class="detail-row"><span class="label">Fecha:</span><span class="value">${new Date(record.exitTime).toLocaleDateString('es-CO')}</span></div>
              <div class="detail-row"><span class="label">Entrada:</span><span class="value">${new Date(record.entryTime).toLocaleTimeString('es-CO')}</span></div>
              <div class="detail-row"><span class="label">Salida:</span><span class="value">${new Date(record.exitTime).toLocaleTimeString('es-CO')}</span></div>
              <div class="detail-row"><span class="label">Tipo:</span><span class="value">${record.vehicleType}</span></div>
              ${record.ownerId ? `<div class="detail-row"><span class="label">Cédula:</span><span class="value">${record.ownerId}</span></div>` : ''}
              ${record.leavesHelmet ? `<div class="detail-row" style="margin-top: 5px; color: #c2410c;"><span class="label">Casco:</span><span class="value">ENTREGADO (${record.helmetLocation || 'S/E'})</span></div>` : ''}
              <div class="detail-row"><span class="label">Método:</span><span class="value">${paymentMethod}</span></div>
            </div>

            <div class="totals">
              <div class="total-row"><span class="label">Subtotal:</span><span class="value">${formatCOP(subtotal)}</span></div>
              <div class="total-row"><span class="label">IVA (${ivaRate}%):</span><span class="value">${formatCOP(ivaAmount)}</span></div>
              <div class="grand-total">
                <div class="grand-total-label">Total Pagado</div>
                <div class="grand-total-value">${formatCOP(cost)}</div>
              </div>
            </div>

            ${cashGiven ? `
            <div class="cash-info">
              <div class="detail-row"><span class="label">Recibido:</span><span class="value">${formatCOP(cashGiven)}</span></div>
              <div class="detail-row"><span class="label">Cambio:</span><span class="value">${formatCOP(change || 0)}</span></div>
            </div>
            ` : ''}

            <div class="footer">
              <p>${documentConfig?.invoiceFooter || 'Gracias por su visita al Parqueadero.'}</p>
              <p>Vigile sus objetos personales.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(content);
      doc.close();
      
      // Wait for print and cleanup
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  // Keyboard Shortcuts for Printing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const printKey = keyboardShortcuts?.printDocument || 'F11';
        if (e.key === printKey) {
            e.preventDefault();
            handlePrint();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcuts, onClose]);

  // Auto-print effect
  useEffect(() => {
    if (printerConfig?.autoprint) {
      setTimeout(() => {
        handlePrint();
      }, 500);
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[400] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-premium max-w-sm w-full overflow-hidden animate-fade-in-up border border-orange-100 p-1 relative">
        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
          <button onClick={onClose} className="bg-emerald-700/30 hover:bg-emerald-700/50 p-2 rounded-full backdrop-blur-md transition-all text-white">
            <X size={18} />
          </button>
          <span className="text-[9px] font-black bg-emerald-700/30 px-2 py-0.5 rounded border border-white/10 uppercase tracking-widest text-emerald-50">ESC salir</span>
        </div>
        
        {/* Success Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-8 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30">
            <CheckSquare size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-black mb-1">Pago Exitoso</h2>
          <p className="text-emerald-100 font-medium">Transacción registrada correctamente</p>
        </div>

        <div className="p-8">
          <div className="text-center mb-6">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Placa Vehículo</span>
            <span className="text-5xl font-black text-gray-800 font-mono tracking-tight">{record.plate}</span>
          </div>

          <div className="bg-gray-50 rounded-3xl p-6 mb-6 space-y-3">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-gray-500 flex items-center gap-2"><DollarSign size={16} /> Total Pagado</span>
              <span className="text-2xl font-black text-emerald-600">{formatCOP(cost)}</span>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 uppercase tracking-widest font-bold">Método</span>
              <span className="font-bold text-gray-700">{paymentMethod}</span>
            </div>

            {record.leavesHelmet && (
              <div className="flex justify-between items-center text-[10px] bg-orange-100/50 p-2 rounded-lg border border-orange-200">
                <span className="text-orange-600 font-black uppercase tracking-widest">Casco Entregado</span>
                <span className="font-black text-orange-900 border-l border-orange-200 pl-2">{record.helmetLocation || 'S/E'}</span>
              </div>
            )}

            {cashGiven && (
              <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-200">
                <span className="text-gray-400 uppercase tracking-widest font-bold">Cambio</span>
                <span className="font-black text-emerald-600">{formatCOP(change || 0)}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
             <button
              onClick={handlePrint}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-orange-200 active:scale-95 group relative"
            >
              <Printer size={20} />
              Imprimir Factura
              <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] ml-2 font-black">
                {keyboardShortcuts?.printDocument || 'F11'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-black py-3 rounded-2xl transition-colors text-sm"
            >
              Finalizar y Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
