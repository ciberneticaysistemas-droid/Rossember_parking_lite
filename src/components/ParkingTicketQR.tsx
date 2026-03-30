import React, { useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, CheckCircle, User, Clock, Building2, FileText } from 'lucide-react';
import { DocumentConfig, KeyboardShortcutsConfig } from '../types';
import { BarcodeDisplay, BarcodeDisplayHandle } from './BarcodeDisplay';

interface ParkingTicketQRProps {
  recordId: string;
  plate: string;
  ownerId?: string;
  vehicleType: string;
  spotNumber: string;
  entryTime: number;
  onClose: () => void;
  printerConfig?: { name: string; connected: boolean; autoprint?: boolean; paperFormat?: string; paperWidth?: number; ticketCodeType?: 'QR' | 'BARCODE' } | null;
  documentConfig?: DocumentConfig;
  keyboardShortcuts?: KeyboardShortcutsConfig;
  helmetLocation?: string;
}

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
  const ticketRef  = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<BarcodeDisplayHandle>(null);
  const [printing, setPrinting] = React.useState(false);
  const [pdfing,   setPdfing]   = React.useState(false);

  const useBarcode = printerConfig?.ticketCodeType === 'BARCODE';

  const ticketData = useBarcode
    ? `PB1|${recordId.replace(/-/g, '').substring(0, 8)}`
    : `PC1|${recordId}`;

  // Construye el HTML del tiquete — compartido entre imprimir y Ver PDF
  const buildContent = (): string => {
    if (!ticketRef.current) return '';
    const paperWidth = printerConfig?.paperWidth || 80;

    let codeHTML = '';
    if (useBarcode) {
      codeHTML = barcodeRef.current?.getSvgHtml() ?? '';
    } else {
      const qrContainer = ticketRef.current.querySelector('.qr-code-container');
      const svgElement  = qrContainer ? qrContainer.querySelector('svg') : null;
      codeHTML = svgElement ? svgElement.outerHTML : '';
    }

    const isSmall     = paperWidth <= 65;
    // Margen interno visual: 2mm a cada lado dentro del papel
    const innerPad    = 2;
    const innerWidth  = paperWidth - innerPad * 2;   // ancho útil para QR/barcode
    const qrSizeMm    = Math.floor(innerWidth * 0.80);
    const barcodeMm   = Math.floor(innerWidth * 0.92);
    const platePt     = isSmall ? 18 : paperWidth <= 72 ? 22 : 28;
    const logoTitlePt = isSmall ?  9 : paperWidth <= 72 ? 11 : 14;
    const subtitlePt  = isSmall ?  6 : 7;
    const infoFontPt  = isSmall ?  7 : 8;
    const footerPt    = isSmall ?  6 : 7;

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Tiquete - ${plate}</title>
    <style>
      html, body {
        width: 100%;
        height: auto !important;
        margin: 0; padding: 0;
        background: #fff; color: #000;
        font-size: ${infoFontPt}pt; line-height: 1.3;
        overflow: hidden !important;
      }

      .ticket {
        display: inline-block; /* Blindaje v20: evita rellenar toda la página */
        width: 48mm; /* Área de impresión real solicitada (4.8cm) */
        max-width: 48mm;
        margin: 0 0 0 2mm; 
        padding: 5px 0;
        background: #fff;
        text-align: left;
      }

      .logo-title  { font-size: ${logoTitlePt}pt; font-weight: bold; margin-bottom: 2px; text-align: center; }
      .subtitle    { font-size: ${subtitlePt}pt; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; text-align: center; }
      .plate       { font-size: ${platePt}pt; font-weight: bold; margin: 4px 0; text-align: center; }
      .vehicle-type{ font-size: ${infoFontPt}pt; font-weight: bold; text-align: center; }
      .divider     { border: none; border-top: 1px dashed #000; margin: 4px 0; width: 100%; }
      .info-row    { display: flex; justify-content: space-between; font-size: ${infoFontPt}pt; padding: 2px 0; }
      .info-label  { font-weight: normal; }
      .info-value  { font-weight: bold; }
      .code-wrap   { text-align: center; margin: 8px 0; width: 100%; }
      .code-wrap svg { 
        display: inline-block; 
        width: 40mm !important; 
        height: auto !important; 
      }
      .footer      { font-size: ${footerPt}pt; font-weight: bold; margin-top: 4px; text-align: center; }
      .hash        { font-size: 6pt; margin-top: 4px; opacity: 0.5; text-align: center; }

      @page { size: auto; margin: 0mm; }

      @media print {
        body { width: 100% !important; margin: 0 !important; padding: 0 !important; }
        .ticket { width: ${paperWidth}mm !important; margin: 0 0 0 2mm !important; }
      }
    </style>
  </head>
  <body>
    <div class="ticket">
      <div class="logo-title">P ${documentConfig?.businessName || 'ParkingCore'}</div>
      <div class="subtitle">TIQUETE DE ESTACIONAMIENTO</div>
      <hr class="divider">
      ${documentConfig?.nit     ? `<div class="info-row"><span class="info-label">NIT:</span><span class="info-value">${documentConfig.nit}</span></div>` : ''}
      ${documentConfig?.address ? `<div class="info-row"><span class="info-label">Dir:</span><span class="info-value">${documentConfig.address}</span></div>` : ''}
      <div class="plate">${plate}</div>
      <div class="vehicle-type">${vehicleType}</div>
      <hr class="divider">
      ${ownerId ? `<div class="info-row"><span class="info-label">Cedula:</span><span class="info-value">${ownerId}</span></div>` : ''}
      <div class="info-row"><span class="info-label">Entrada:</span><span class="info-value">${new Date(entryTime).toLocaleTimeString('es-CO')}</span></div>
      <div class="info-row"><span class="info-label">Fecha:</span><span class="info-value">${new Date(entryTime).toLocaleDateString('es-CO')}</span></div>
      ${helmetLocation ? `<div class="info-row" style="margin-top:4px;border:1px solid #000;padding:3px;"><span class="info-label">CASCO:</span><span class="info-value">${helmetLocation}</span></div>` : ''}
      <hr class="divider">
      <div class="code-wrap">${codeHTML}</div>
      <hr class="divider">
      <div class="footer">${documentConfig?.ticketFooter || 'Conserve este tiquete. Se requiere para registrar la salida.'}</div>
      ${documentConfig?.legalInfo ? `<div class="hash">${documentConfig.legalInfo}</div>` : ''}
      <div class="hash">${recordId.substring(0, 8).toUpperCase()}</div>
    </div>
  </body>
</html>`;
  };

  const handlePrint = () => {
    if (!ticketRef.current || printing) return;
    setPrinting(true);
    const content    = buildContent();
    const paperWidth = printerConfig?.paperWidth || 80;

    if ((window as any).electronAPI?.print) {
      (window as any).electronAPI.print(content, {
        deviceName: printerConfig?.name || '',
        paperWidth,
      }).then((res: any) => {
        if (!res.ok) {
          console.error('Error en impresión nativa:', res.error);
          alert(`❌ Error al imprimir: ${res.error}\n\nVerifica que la impresora esté encendida y conectada.`);
        }
      }).finally(() => setPrinting(false));
    } else {
      // Fallback navegador
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
    if (!ticketRef.current || pdfing) return;
    setPdfing(true);
    const content    = buildContent();
    const paperWidth = printerConfig?.paperWidth || 80;

    if ((window as any).electronAPI?.printToPDF) {
      (window as any).electronAPI.printToPDF(content, { paperWidth })
        .then((res: any) => { if (!res.ok) console.error('Error generando PDF:', res.error); })
        .finally(() => setPdfing(false));
    } else {
      // Fallback navegador: abre en nueva pestaña para imprimir/guardar como PDF
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
      setTimeout(() => { handlePrint(); }, 800);
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

          {/* QR / Barcode */}
          <div className="qr-code-container flex flex-col items-center gap-2 p-2 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            {useBarcode ? (
              <BarcodeDisplay ref={barcodeRef} value={ticketData} barHeight={60} displayValue={false} />
            ) : (
              <QRCodeSVG value={ticketData} size={180} level="H" includeMargin={true} className="rounded-lg" />
            )}
            <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest">
              {useBarcode ? 'Código de Barras — Escanee para salir' : 'Escanee para salir'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <button
            onClick={handlePrint}
            disabled={printing}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-200"
          >
            <Printer size={18} />
            {printing ? 'Imprimiendo...' : printerConfig?.connected ? `Imprimir en ${printerConfig.name}` : 'Imprimir'}
            {!printing && (
              <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] ml-2 font-black">
                {keyboardShortcuts?.printDocument || 'F11'}
              </span>
            )}
          </button>
          <button
            onClick={handleViewPDF}
            disabled={pdfing}
            className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <FileText size={18} />
            {pdfing ? 'Generando PDF...' : 'Ver PDF'}
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
