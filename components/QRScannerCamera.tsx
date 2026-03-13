import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, AlertCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerCameraProps {
  onResult: (data: string) => void;
  onClose: () => void;
}

export const QRScannerCamera: React.FC<QRScannerCameraProps> = ({ onResult, onClose }) => {
  const qrRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "qr-reader-container";
  const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    startScanner();
    return () => {
      if (qrRef.current && qrRef.current.isScanning) {
        qrRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode(scannerId);
      qrRef.current = html5QrCode;

      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      // Intentar primero con cámara trasera, si falla ir a la frontal/por defecto
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            html5QrCode.stop().then(() => {
              onResult(decodedText);
            }).catch(() => {
              onResult(decodedText);
            });
          },
          () => {} // error callback ignorado para no saturar
        );
      } catch (e) {
        console.warn("Fallo cámara environment, intentando cualquier cámara...", e);
        await html5QrCode.start(
          { facingMode: "user" },
          config,
          (decodedText) => {
            html5QrCode.stop().then(() => {
              onResult(decodedText);
            }).catch(() => {
              onResult(decodedText);
            });
          },
          () => {}
        );
      }

      setStatus('scanning');
    } catch (err: any) {
      console.error("Error al iniciar escáner:", err);
      setStatus('error');
      setErrorMsg(
        err?.message?.includes('Permission') 
          ? 'Permiso denegado para acceder a la cámara.' 
          : 'No se pudo detectar o acceder a la cámara. Asegúrese de que no esté en uso por otra app.'
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[250] flex flex-col">
      {/* Header */}
      <div className="bg-black/80 p-4 flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-2 text-white">
          <Camera size={20} />
          <span className="font-bold">Escáner QR - Salida</span>
        </div>
        <button 
          onClick={onClose} 
          className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors"
        >
          <X size={22} />
        </button>
      </div>

      {/* Scanner View */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        <div id={scannerId} className="w-full h-full"></div>
        
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20 p-8">
            <div className="text-center">
              <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
              <p className="text-white font-bold mb-2">Error de Cámara</p>
              <p className="text-gray-400 text-sm max-w-xs">{errorMsg}</p>
              <button 
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {status === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/70 text-sm">Iniciando cámara...</p>
            </div>
          </div>
        )}

        {/* Status Text Overlay */}
        {status === 'scanning' && (
          <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none z-10">
            <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              Apunte al código QR del tiquete
            </div>
          </div>
        )}
      </div>

      <style>{`
        #qr-reader-container {
          background: black !important;
          border: none !important;
        }
        #qr-reader-container video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        /* Ocultar elementos internos de html5-qrcode */
        #qr-reader-container__dashboard, 
        #qr-reader-container__header_message {
          display: none !important;
        }
      `}</style>
    </div>
  );
};
