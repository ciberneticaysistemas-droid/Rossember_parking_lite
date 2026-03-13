import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, CheckCircle, MapPin, User, Clock } from 'lucide-react';

interface ParkingTicketQRProps {
  recordId: string;
  plate: string;
  ownerId?: string;
  vehicleType: string;
  spotNumber: string;
  entryTime: number;
  onClose: () => void;
  printerConfig?: { name: string; connected: boolean } | null;
}

const QR_VERSION = 'POCHI-PARK-V1';

export const ParkingTicketQR: React.FC<ParkingTicketQRProps> = ({
  recordId,
  plate,
  ownerId,
  vehicleType,
  spotNumber,
  entryTime,
  onClose,
  printerConfig
}) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<SVGSVGElement>(null);

  // QR data encodes all info needed at exit
  const qrData = JSON.stringify({
    v: QR_VERSION,
    id: recordId,
    plate,
    ownerId: ownerId || '',
    vehicleType,
    entryTime,
  });

  const handlePrint = () => {
    if (!ticketRef.current) return;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    // Get the SVG element and its outerHTML - specifically the QR one
    const qrContainer = ticketRef.current.querySelector('.qr-code-container');
    const svgElement = qrContainer ? qrContainer.querySelector('svg') : null;
    const svgHTML = svgElement ? svgElement.outerHTML : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tiquete - ${plate}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', monospace;
              background: white;
              padding: 16px;
              max-width: 320px;
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
            .plate { font-size: 48px; font-weight: 900; letter-spacing: 0.05em; color: #ea580c; margin: 12px 0; font-family: 'Courier New', monospace; line-height: 1; }
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
        <body onload="setTimeout(function(){ window.print(); window.close(); }, 500);">
          <div class="ticket">
            <div class="logo-title">🅿 PochiParking</div>
            <div class="subtitle">TIQUETE DE ESTACIONAMIENTO</div>
            <div class="plate">${plate}</div>
            <div class="info-row"><span class="info-label">Tipo</span><span class="info-value">${vehicleType}</span></div>
            ${ownerId ? `<div class="info-row"><span class="info-label">Cédula</span><span class="info-value">${ownerId}</span></div>` : ''}
            <div class="info-row"><span class="info-label">Hora Entrada</span><span class="info-value">${new Date(entryTime).toLocaleTimeString('es-CO')}</span></div>
            <div class="info-row"><span class="info-label">Fecha</span><span class="info-value">${new Date(entryTime).toLocaleDateString('es-CO')}</span></div>
            
            <div class="qr-wrap">
              ${svgHTML}
            </div>
            
            <div class="footer">Conserve este tiquete.<br>Se requiere para registrar la salida.</div>
            <div class="hash">V: ${QR_VERSION} | ${recordId.substring(0, 8)}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
            <CheckCircle size={20} />
            <span className="font-bold">Tiquete Generado</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Ticket Body */}
        <div ref={ticketRef} className="p-6">
          <div className="text-center mb-6">
            <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">🅿 PochiParking</p>
            <h2 className="text-5xl font-black text-orange-600 tracking-widest font-mono line-height-1">{plate}</h2>
            <p className="text-sm font-bold text-gray-500 mt-2 uppercase tracking-wide">{vehicleType}</p>
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
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-200"
          >
            <Printer size={18} />
            {printerConfig?.connected ? `Imprimir en ${printerConfig.name}` : 'Imprimir / Ver PDF'}
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
