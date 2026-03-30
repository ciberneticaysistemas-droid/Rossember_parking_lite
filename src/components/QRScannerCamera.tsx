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
  const [cameras, setCameras] = useState<any[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);

  useEffect(() => {
    initScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (qrRef.current && qrRef.current.isScanning) {
      try {
        await qrRef.current.stop();
      } catch (e) {
        console.warn("Error stopping scanner:", e);
      }
    }
  };

  const initScanner = async () => {
    try {
      // Get available cameras first
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      
      if (devices && devices.length > 0) {
        startScanner(devices[0].id);
      } else {
        // Fallback to anonymous facing mode if no device list available
        startScanner(null);
      }
    } catch (err) {
      console.warn("Detection error, trying default:", err);
      startScanner(null);
    }
  };

  const startScanner = async (deviceId: string | null) => {
    try {
      await stopScanner();
      
      const html5QrCode = new Html5Qrcode(scannerId);
      qrRef.current = html5QrCode;

      const config = { 
        fps: 25, // Aumentado para mayor fluidez y captura más rápida
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          // Aumentamos ligeramente el área de escaneo para que sea más fácil centrar el código
          const boxSize = Math.floor(minEdge * 0.82);
          return { width: boxSize, height: boxSize };
        },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      const startWith = deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "environment" };

      try {
        await html5QrCode.start(
          startWith,
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
        setActiveCameraId(deviceId);
        setStatus('scanning');
      } catch (e) {
        if (!deviceId) {
           // If environment failed and no deviceId was specified, try user
           await html5QrCode.start({ facingMode: "user" }, config, (decodedText) => {
             html5QrCode.stop().then(() => onResult(decodedText)).catch(() => onResult(decodedText));
           }, () => {});
           setStatus('scanning');
        } else {
           throw e;
        }
      }
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

  const handleSwitchCamera = () => {
    if (cameras.length < 2) return;
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    startScanner(cameras[nextIndex].id);
  };

  return (
    <div className="fixed inset-0 bg-black z-[250] flex flex-col">
      {/* Header */}
      <div className="bg-black/80 p-4 flex justify-between items-center z-20 relative">
        <div className="flex items-center gap-2 text-white">
          <Camera size={20} />
          <span className="font-bold uppercase tracking-tight text-sm">Escáner QR - Salida</span>
        </div>
        <div className="flex items-center gap-2">
           {cameras.length > 1 && (
             <button 
               onClick={handleSwitchCamera}
               className="text-xs bg-white/20 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-white/30 transition-all border border-white/10"
             >
               CAMBIAR CÁMARA
             </button>
           )}
          <button 
            onClick={onClose} 
            className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Scanner View */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        <div id={scannerId} className="w-full h-full"></div>
        
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-30 p-8">
            <div className="text-center bg-gray-900/80 p-8 rounded-[2rem] border border-white/10 backdrop-blur-md">
              <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
              <p className="text-white font-black text-xl mb-2">Error de Cámara</p>
              <p className="text-gray-400 text-sm max-w-xs">{errorMsg}</p>
              <button 
                onClick={initScanner}
                className="mt-6 w-full py-4 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-900/20"
              >
                Reintentar
              </button>
              <button 
                onClick={onClose}
                className="mt-3 w-full py-2 text-gray-400 text-xs font-bold"
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
              <p className="text-white/70 text-sm font-bold animate-pulse">Iniciando sistema óptico...</p>
            </div>
          </div>
        )}

        {/* Status Text Overlay */}
        {status === 'scanning' && (
          <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none z-10">
            <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              Apunte su tiquete a la cámara
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
