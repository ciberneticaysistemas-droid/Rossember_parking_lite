/**
 * BarcodeDisplay.tsx
 * Renderiza un código de barras Code 128 usando jsbarcode sobre un elemento <svg>.
 *
 * Se expone como forwardRef para que el componente padre pueda acceder al SVG
 * y obtener su outerHTML para incrustar en la ventana de impresión.
 *
 * Formato de datos: idéntico al QR → "PC1|{recordId}"
 * Code 128 soporta todos los caracteres ASCII incluyendo '|'.
 */

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeDisplayProps {
  /** Valor a codificar — debe usar el mismo formato que el QR: "PC1|{recordId}" */
  value: string;
  /** Alto de las barras en px (sin contar texto). Default: 60 */
  barHeight?: number;
  /** Mostrar el valor legible debajo. Default: false */
  displayValue?: boolean;
}

export interface BarcodeDisplayHandle {
  getSvgHtml: () => string;
}

export const BarcodeDisplay = forwardRef<BarcodeDisplayHandle, BarcodeDisplayProps>(
  ({ value, barHeight = 60, displayValue = false }, ref) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useImperativeHandle(ref, () => ({
      getSvgHtml: () => svgRef.current?.outerHTML ?? '',
    }));

    useEffect(() => {
      if (!svgRef.current) return;
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          lineColor: '#000000',
          background: '#ffffff',
          width: 1.5,       // ancho por módulo — 2 era el doble del necesario para 80mm
          height: barHeight,
          displayValue,
          margin: 4,
          fontSize: 11,
          fontOptions: 'bold',
        });
      } catch (err) {
        console.error('[BarcodeDisplay] Error generando barcode:', err);
      }
    }, [value, barHeight, displayValue]);

    return (
      <svg
        ref={svgRef}
        className="w-full max-w-[280px]"
        aria-label={`Código de barras: ${value}`}
      />
    );
  }
);

BarcodeDisplay.displayName = 'BarcodeDisplay';
