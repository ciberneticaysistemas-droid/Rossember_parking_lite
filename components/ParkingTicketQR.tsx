import React, { useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, CheckCircle, User, Clock, Building2 } from 'lucide-react';
import { DocumentConfig, KeyboardShortcutsConfig } from '../types';

interface ParkingTicketQRProps {
  recordId: string;
  plate: string;
  ownerId?: string;
  vehicleType: string;
  spotNumber: string;
  entryTime: number;
  onClose: () => void;
  printerConfig?: { name: string; connected: boolean; autoprint?: boolean; paperFormat?: string; paperWidth?: number } | null;
  documentConfig?: DocumentConfig;
  keyboardShortcuts?: KeyboardShortcutsConfig;
  helmetLocation?: string;
}

const QR_VERSION = 'PC-PARK-V1';

export const ParkingTicketQR: React.FC<ParkingTicketQRProps> = ({
  recordId,
  plate,
  ownerId,
  vehicleType,
  spotNumber,
  entryTime,
  onClose,
  printerConfig,
  documentConfig,
  keyboardShortcuts,
  helmetLocation
}) => {
  const ticketRef = useRef<HTMLDivElement>(null);

  // Datos del QR simplificados para que los puntos sean más grandes y fáciles de leer
  const qrData = `PC1|${recordId}`;

  const handlePrint = () => {
    if (!ticketRef.current) return;

    // Determine paper width based on printer format
    const fmt = printerConfig?.paperFormat;
    let cssMaxWidth = '310px';
    let bodyPadding = '16px';
    if (fmt === 'TICKET') { cssMaxWidth = '220px'; bodyPadding = '10px'; }
    else if (fmt === 'TICKET_WIDE') { cssMaxWidth = '300px'; bodyPadding = '14px'; }
    else if (fmt === 'HALF') { cssMaxWidth = '390px'; bodyPadding = '20px'; }
    else if (fmt === 'LETTER') { cssMaxWidth = '740px'; bodyPadding = '30px'; }

    // Get the SVG element and its outerHTML - specifically the QR one
    const qrContainer = ticketRef.current.querySelector('.qr-code-container');
    const svgElement = qrContainer ? qrContainer.querySelector('svg') : null;
    const svgHTML = svgElement ? svgElement.outerHTML : '';

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tiquete - ${plate}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', sans-serif;
              background: white;
              padding: ${bodyPadding};
              max-width: ${cssMaxWidth};
              margin: 0 auto;
            }
            .ticket {
              border: 2px dashed #9ca3af;
              border-radius: 16px;
              padding: 24px;
              text-align: center;
              background: #fff;
            }
            .logo-title { font-size: 24px; font-weight: 900; color: #111827; margin-bottom: 4px; }
            .subtitle { font-size: 11px; color: #4b5563; letter-spacing: 0.1em; margin-bottom: 20px; font-weight: bold; }
            .plate { font-size: 48px; font-weight: 900; letter-spacing: 0.05em; color: #ea580c; margin: 12px 0; font-family: monospace; line-height: 1; }
            .info-row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px solid #f3f4f6; }
            .info-label { color: #6b7280; font-weight: 500; }
            .info-value { font-weight: 800; color: #111827; }
            .qr-wrap { display: flex; justify-content: center; margin: 24px 0; }
            .qr-wrap svg { width: 180px; height: 180px; color: #000; }
            .footer { font-size: 11px; color: #6b7280; margin-top: 16px; font-weight: 600; }
            .hash { font-size: 8px; color: #9ca3af; margin-top: 8px; font-family: monospace; }
            @media print { 
              body { margin: 0; padding: 10px; }
              .ticket { border: 2px dashed #000; }
            }
          </style>
        </head>
        <body onload="window.print();">
          <div class="ticket">
            <div class="logo-title">🅿 ${documentConfig?.businessName || 'ParkingCore'}</div>
            <div class="subtitle">TIQUETE DE ESTACIONAMIENTO</div>
            
            ${documentConfig?.nit ? `<div class="info-row"><span class="info-label">NIT</span><span class="info-value">${documentConfig.nit}</span></div>` : ''}
            ${documentConfig?.address ? `<div class="info-row"><span class="info-label">Dir</span><span class="info-value">${documentConfig.address}</span></div>` : ''}
            
            <div class="plate">${plate}</div>
            <div class="info-row"><span class="info-label">Tipo</span><span class="info-value">${vehicleType}</span></div>
            ${ownerId ? `<div class="info-row"><span class="info-label">Cédula</span><span class="info-value">${ownerId}</span></div>` : ''}
            <div class="info-row"><span class="info-label">Entrada</span><span class="info-value">${new Date(entryTime).toLocaleTimeString('es-CO')}</span></div>
            <div class="info-row"><span class="info-label">Fecha</span><span class="info-value">${new Date(entryTime).toLocaleDateString('es-CO')}</span></div>
            ${helmetLocation ? `<div class="info-row" style="background: #fff7ed; padding: 10px; border: 1px solid #fdba74; border-radius: 8px; margin-top: 10px;"><span class="info-label" style="color: #c2410c;">UBICACIÓN CASCO</span><span class="info-value" style="color: #9a3412; font-size: 18px;">${helmetLocation}</span></div>` : ''}
            
            <div class="qr-wrap">
              ${svgHTML}
            </div>
            
            <div class="footer">${documentConfig?.ticketFooter || 'Conserve este tiquete.<br>Se requiere para registrar la salida.'}</div>
            ${documentConfig?.legalInfo ? `<div class="hash" style="margin-top: 10px; font-size: 9px;">${documentConfig.legalInfo}</div>` : ''}
            <div class="hash">V: ${QR_VERSION} | ${recordId.substring(0, 8)}</div>
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
      }, 800);
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-sm overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} />
            <span className="font-bold">Tiquete Generado</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm border border-white/10 uppercase tracking-widest hidden sm:block">ESC para salir</span>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Ticket Body */}
        <div ref={ticketRef} className="p-6 relative">
          {documentConfig?.showWatermark && (
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-12">
               <Building2 size={250} />
            </div>
          )}
          
          <div className="text-center mb-6 relative z-10">
            <p className="text-xs font-black uppercase tracking-widest text-orange-600 mb-1">🅿 {documentConfig?.businessName || 'ParkingCore'}</p>
            {documentConfig?.nit && <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">NIT: {documentConfig.nit}</p>}
            <h2 className="text-5xl font-black text-gray-800 tracking-widest font-mono line-height-1 my-4">{plate}</h2>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">{vehicleType}</p>
          </div>

          <div className="space-y-2 mb-6 text-sm">
            {ownerId && (
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="flex items-center gap-2 text-gray-500 font-medium"><User size={14} /> Cédula</span>
                <span className="font-black text-gray-800">{ownerId}</span>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="flex items-center gap-2 text-gray-500 font-medium"><Clock size={14} /> Hora Entrada</span>
              <span className="font-black text-gray-800">{new Date(entryTime).toLocaleTimeString('es-CO')}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500 font-medium ml-6">Fecha</span>
              <span className="font-black text-gray-800">{new Date(entryTime).toLocaleDateString('es-CO')}</span>
            </div>
            {helmetLocation && (
              <div className="flex justify-between py-2 border-2 border-orange-200 bg-orange-50 rounded-xl px-3 mt-2">
                <span className="flex items-center gap-2 text-orange-600 font-black text-xs uppercase tracking-wider">UBICACIÓN CASCO</span>
                <span className="font-black text-orange-900 text-lg">{helmetLocation}</span>
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="qr-code-container flex flex-col items-center gap-2 p-2 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <QRCodeSVG
              value={qrData}
              size={180}
              level="H"
              includeMargin={true}
              className="rounded-lg"
            />
            <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest">Escanee para salir</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <button
            onClick={handlePrint}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-200 group relative"
          >
            <Printer size={18} />
            {printerConfig?.connected ? `Imprimir en ${printerConfig.name}` : 'Imprimir / Ver PDF'}
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] ml-2 font-black">
                {keyboardShortcuts?.printDocument || 'F11'}
            </span>
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl transition-colors text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
