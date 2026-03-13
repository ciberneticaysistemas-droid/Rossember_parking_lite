import React, { useRef, useEffect } from 'react';
import { Printer, X, CheckSquare, Receipt, DollarSign, Clock, Calendar } from 'lucide-react';

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
  };
  cost: number;
  subtotal: number;
  ivaAmount: number;
  ivaRate: number;
  paymentMethod: string;
  cashGiven?: number;
  change?: number;
  onClose: () => void;
  printerConfig?: { name: string; connected: boolean; autoprint?: boolean } | null;
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
  printerConfig
}) => {
  const ticketRef = useRef<HTMLDivElement>(null);

  const formatCOP = (val: number) =>
    val.toLocaleString('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).replace('COP', '$');

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=450,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
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
              padding: 20px;
              max-width: 380px;
              margin: 0 auto;
              font-size: 13px;
              color: #111;
            }
            .ticket {
              padding: 24px;
              text-align: center;
              border: 1px solid #ddd;
              border-radius: 8px;
            }
            .header { margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .logo { font-size: 24px; font-weight: 900; margin-bottom: 4px; }
            .legal-info { font-size: 10px; color: #555; margin-bottom: 5px; line-height: 1.3; }
            
            .invoice-title { font-size: 16px; font-weight: 800; text-transform: uppercase; margin: 15px 0; border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; padding: 5px 0; }
            
            .plate { font-size: 40px; font-weight: 900; letter-spacing: 0.1em; color: #000; margin: 10px 0; font-family: monospace; }
            
            .details { margin: 20px 0; text-align: left; }
            .detail-row { display: flex; justify-content: space-between; padding: 3px 0; }
            .label { font-weight: 500; color: #444; }
            .value { font-weight: 700; }
            
            .totals { margin: 20px 0; padding-top: 10px; border-top: 2px solid #000; }
            .total-row { display: flex; justify-content: space-between; padding: 4px 0; }
            .grand-total { font-size: 20px; font-weight: 900; border-top: 1px solid #000; margin-top: 5px; padding-top: 5px; }

            .cash-info { margin-top: 10px; padding: 10px; background: #f9f9f9; border-radius: 4px; }

            .footer { font-size: 10px; color: #777; margin-top: 30px; line-height: 1.4; border-top: 1px solid #eee; padding-top: 10px; }
            
            @media print { 
              body { padding: 0; }
              .ticket { border: none; }
            }
          </style>
        </head>
        <body onload="setTimeout(function(){ window.print(); window.close(); }, 700);">
          <div class="ticket">
            <div class="header">
              <div class="logo">🅿 PochiParking</div>
              <div class="legal-info">SISTEMA INTEGRAL DE GESTIÓN DE PARQUEADERO</div>
              <div class="legal-info">NIT: 860.024.796-6</div>
              <div class="legal-info">Ak. 1 #20-53, Bogotá, Colombia</div>
              <div class="legal-info">IVA Responsable: Régimen Simplificado</div>
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
              <div class="detail-row"><span class="label">Método:</span><span class="value">${paymentMethod}</span></div>
            </div>

            <div class="totals">
              <div class="total-row"><span class="label">Subtotal:</span><span class="value">${formatCOP(subtotal)}</span></div>
              <div class="total-row"><span class="label">IVA (${ivaRate}%):</span><span class="value">${formatCOP(ivaAmount)}</span></div>
              <div class="total-row grand-total"><span class="label">TOTAL PAGADO:</span><span class="value">${formatCOP(cost)}</span></div>
            </div>

            ${cashGiven ? `
            <div class="cash-info">
              <div class="detail-row"><span class="label">Recibido:</span><span class="value">${formatCOP(cashGiven)}</span></div>
              <div class="detail-row"><span class="label">Cambio:</span><span class="value">${formatCOP(change || 0)}</span></div>
            </div>
            ` : ''}

            <div class="footer">
              <p>Gracias por su visita al Parqueadero PochiParking.</p>
              <p>Este documento es equivalente a factura.</p>
              <p>Vigile sus objetos personales.</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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
      <div className="bg-white rounded-[2.5rem] shadow-premium max-w-sm w-full overflow-hidden animate-fade-in-up border border-orange-100">
        
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
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-orange-200 active:scale-95"
            >
              <Printer size={20} />
              Imprimir Factura
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
