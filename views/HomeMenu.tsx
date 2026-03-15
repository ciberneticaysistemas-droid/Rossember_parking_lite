import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightLeft, DollarSign, ShieldAlert, FileSearch } from 'lucide-react';

interface HomeMenuProps {
  clientLogo: string | null;
}

export const HomeMenu: React.FC<HomeMenuProps> = ({ clientLogo }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FFFBF7] flex flex-col font-sans">
      <header className="bg-gradient-to-r from-orange-500 to-amber-500 text-gray-800 shadow-md p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {clientLogo && (
              <div className="bg-white/20 p-1 rounded-lg backdrop-blur-md shadow-sm">
                <img src={clientLogo} alt="Client Logo" className="h-10 object-contain max-w-[120px]" />
              </div>
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-800 drop-shadow-sm flex items-center gap-2">
                ParkingCore
              </h1>
              <p className="text-orange-100 text-xs font-medium tracking-wider">SISTEMA INTEGRAL DE GESTIÓN</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-12 flex flex-col justify-center">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight mb-4">
            Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">ParkingCore</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">Selecciona el módulo al que deseas acceder para gestionar el parqueadero de forma rápida y eficiente.</p>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-8 max-w-4xl mx-auto w-full">
          <button
            onClick={() => navigate('/acceso')}
            className="flex-1 group relative bg-white p-10 rounded-[2.5rem] shadow-premium border border-orange-100/50 hover:shadow-orange-200/40 hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-24 h-24 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner border border-orange-100/50">
              <ArrowRightLeft size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">Control de Acceso</h3>
            <p className="text-gray-500 text-lg leading-relaxed">Gestión unificada de entradas y salidas de vehículos.</p>
          </button>

          <button
            onClick={() => navigate('/admin')}
            className="flex-1 group relative bg-white p-10 rounded-[2.5rem] shadow-premium border border-gray-100/50 hover:shadow-slate-200/40 hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-24 h-24 bg-gray-50 text-slate-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner border border-gray-100/50">
              <ShieldAlert size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">Administración</h3>
            <p className="text-gray-500 text-lg leading-relaxed">Configuración, tarifas, reportes y control total del sistema.</p>
          </button>
        </div>
      </main>
      <footer className="py-6 text-center text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} ParkingCore. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};
