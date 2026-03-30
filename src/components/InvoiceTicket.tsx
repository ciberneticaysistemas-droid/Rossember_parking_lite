import React, { useEffect } from 'react';
import { Printer, X, CheckSquare, DollarSign, FileText } from 'lucide-react';
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
  const [printing, setPrinting] = React.useState(false);
  const [pdfing,   setPdfing]   = React.useState(false);

  const formatCOP = (val: number) =>
    val.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
       .replace('COP', '$');

  // Construye el HTML de la factura — compartido entre imprimir y Ver PDF
  const buildContent = (): string => {
    const fmt            = printerConfig?.paperFormat;
    const paperWidth     = printerConfig?.paperWidth || 80;
    const isThermal      = fmt === 'TICKET' || fmt === 'TICKET_WIDE' || !fmt;
    const isSmallThermal = isThermal && paperWidth < 65;
    // Para carta/media carta usamos ancho en px; para térmicas en mm directamente
    const pageW          = isThermal ? `${paperWidth}mm` : 'auto';
    const innerPad       = isThermal ? '2mm' : '8mm';
    const fontSize       = isSmallThermal ? '9pt' : isThermal ? '10pt' : '11pt';
    const logoSize       = isSmallThermal ? '11pt' : isThermal ? '13pt' : '20pt';
    const plateSize      = isSmallThermal ? '24pt' : isThermal ? '28pt' : '40pt';
    const totalSize      = isSmallThermal ? '16pt' : isThermal ? '18pt' : '22pt';
    const legalSize      = isSmallThermal ? '7pt' : '8pt';

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Factura - ${record.plate}</title>
      /* Estilo v14: Retorno a la estabilidad */
      html, body {
        width: 100%;
        margin: 0; padding: 0;
        background: #fff; color: #000;
        font-size: ${fontSize}; line-height: 1.3;
      }

      .ticket {
        width: 280px; /* Ancho seguro para XP-58 */
        margin: 0 auto;
        padding: 4px;
        text-align: center;
      }

      .header            { margin-bottom: 6px; border-bottom: 1px dashed #000; padding-bottom: 6px; }
      .logo              { font-size: ${logoSize}; font-weight: bold; margin-bottom: 2px; }
      .legal-info        { font-size: ${legalSize}; line-height: 1.2; }
      .invoice-title     { font-size: ${isSmallThermal ? '10pt' : '11pt'}; font-weight: bold; text-transform: uppercase; margin: 6px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 2px 0; }
      .plate             { font-size: ${plateSize}; font-weight: bold; margin: 4px 0; line-height: 1; }
      .details           { margin: 6px 0; text-align: left; }
      .detail-row        { display: flex; justify-content: space-between; padding: 1px 0; }
      .label             { font-weight: normal; }
      .value             { font-weight: bold; }
      .divider           { border: none; border-top: 1px dashed #000; margin: 4px 0; }
      .totals            { margin: 6px 0; padding-top: 4px; border-top: 1px dashed #000; }
      .total-row         { display: flex; justify-content: space-between; padding: 1px 0; }
      .grand-total       { border-top: 1px solid #000; margin-top: 2px; padding-top: 4px; text-align: center; }
      .grand-total-label { font-size: 8pt; font-weight: bold; text-transform: uppercase; }
      .grand-total-value { font-size: ${totalSize}; font-weight: bold; margin-top: 1px; }
      .cash-info         { margin-top: 4px; padding: 4px; border: 1px solid #000; }
      .footer            { font-size: 7pt; margin-top: 8px; font-weight: bold; border-top: 1px dashed #000; padding-top: 4px; }

      @page { size: auto; margin: 0mm; }

      @media print {
        body { width: 280px !important; margin: 0 !important; padding: 0 !important; }
        .ticket { width: 100% !important; padding: 4px 0 !important; }
      }
  </head>
  <body>
    <div class="ticket">
      <div class="header">
        <div class="logo">P ${documentConfig?.businessName || 'ParkingCore'}</div>
        ${documentConfig?.nit      ? `<div class="legal-info">NIT: ${documentConfig.nit}</div>` : ''}
        ${documentConfig?.address  ? `<div class="legal-info">${documentConfig.address}</div>` : ''}
        ${documentConfig?.phone    ? `<div class="legal-info">Tel: ${documentConfig.phone}</div>` : ''}
        ${documentConfig?.legalInfo ? `<div class="legal-info" style="margin-top:3px;">${documentConfig.legalInfo}</div>` : ''}
      </div>
      <div class="invoice-title">Factura de Venta</div>
      <div class="legal-info" style="text-align:center;">No: ${record.id.substring(0, 8).toUpperCase()}</div>
      <div class="plate">${record.plate}</div>
      <hr class="divider">
      <div class="details">
        <div class="detail-row"><span class="label">Fecha:</span><span class="value">${new Date(record.exitTime).toLocaleDateString('es-CO')}</span></div>
        <div class="detail-row"><span class="label">Entrada:</span><span class="value">${new Date(record.entryTime).toLocaleTimeString('es-CO')}</span></div>
        <div class="detail-row"><span class="label">Salida:</span><span class="value">${new Date(record.exitTime).toLocaleTimeString('es-CO')}</span></div>
        <div class="detail-row"><span class="label">Tipo:</span><span class="value">${record.vehicleType}</span></div>
        ${record.ownerId ? `<div class="detail-row"><span class="label">Cédula:</span><span class="value">${record.ownerId}</span></div>` : ''}
        ${record.leavesHelmet ? `<div class="detail-row" style="margin-top:3px;border:1px solid #000;padding:2px;"><span class="label">CASCO:</span><span class="value">${record.helmetLocation || 'S/E'}</span></div>` : ''}
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
      </div>` : ''}
      <div class="footer">
        <p>${documentConfig?.invoiceFooter || 'Gracias por su visita.'}</p>
        <p>Vigile sus objetos personales.</p>
      </div>
    </div>
  </body>
</html>`;
  };

  const handlePrint = () => {
    if (printing) return;
    setPrinting(true);
    const content    = buildContent();
    const paperWidth = printerConfig?.paperWidth || 80;

    if ((window as any).electronAPI?.print) {
      (window as any).electronAPI.print(content, {
        deviceName: printerConfig?.name || '',
        paperWidth,
      }).then((res: any) => {
        if (!res.ok) console.error('Error en impresión nativa:', res.error);
      }).finally(() => setPrinting(false));
    } else {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;opacity:0;';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open(); doc.write(content); doc.close();
        iframe.onload = () => {
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); setPrinting(false); }, 1000);
          }, 300);
        };
      } else { setPrinting(false); }
    }
  };

  const handleViewPDF = () => {
    if (pdfing) return;
    setPdfing(true);
    const content    = buildContent();
    const paperWidth = printerConfig?.paperWidth || 80;

    if ((window as any).electronAPI?.printToPDF) {
      (window as any).electronAPI.printToPDF(content, { paperWidth })
        .then((res: any) => { if (!res.ok) console.error('Error generando PDF:', res.error); })
        .finally(() => setPdfing(false));
    } else {
      const blob = new Blob([content], { type: 'text/html' });
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setPdfing(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const printKey = keyboardShortcuts?.printDocument || 'F11';
      if (e.key === printKey) { e.preventDefault(); handlePrint(); }
      if (e.key === 'Escape') { onClose(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcuts, onClose]);

  useEffect(() => {
    if (printerConfig?.autoprint) {
      setTimeout(() => { handlePrint(); }, 500);
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
              disabled={printing}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-orange-200 active:scale-95"
            >
              <Printer size={20} />
              {printing ? 'Imprimiendo...' : 'Imprimir Factura'}
              {!printing && (
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] ml-2 font-black">
                  {keyboardShortcuts?.printDocument || 'F11'}
                </span>
              )}
            </button>

            <button
              onClick={handleViewPDF}
              disabled={pdfing}
              className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-white font-black py-3 rounded-2xl flex items-center justify-center gap-3 transition-all"
            >
              <FileText size={18} />
              {pdfing ? 'Generando PDF...' : 'Ver PDF'}
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
