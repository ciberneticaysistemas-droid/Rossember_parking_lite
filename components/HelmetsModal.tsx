import React, { useMemo, useState, useEffect } from 'react';
import { X, HardHat, Bike, Search, CheckCircle, XCircle, Clock, Calendar, MapPin, Keyboard } from 'lucide-react';
import { ParkingRecord, VehicleType } from '../types';

interface HelmetsModalProps {
  records: ParkingRecord[];
  onClose: () => void;
}

export const HelmetsModal: React.FC<HelmetsModalProps> = ({ records, onClose }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      
      // Only if not typing in search
      const isInput = (e.target as HTMLElement).tagName === 'INPUT';
      if (!isInput) {
        if (e.key === '1') setFilter('ALL');
        if (e.key === '2') setFilter('ACTIVE');
        if (e.key === '3') setFilter('COMPLETED');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Only motorcycle records that left a helmet
  const helmetRecords = useMemo(() => {
    return records
      .filter(r =>
        r.vehicleType === VehicleType.MOTORCYCLE &&
        r.leavesHelmet === true &&
        (filter === 'ALL' || (filter === 'ACTIVE' && r.status === 'ACTIVE') || (filter === 'COMPLETED' && r.status === 'COMPLETED')) &&
        (search === '' || r.plate.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => b.entryTime - a.entryTime);
  }, [records, filter, search]);

  const activeCount = records.filter(r => r.vehicleType === VehicleType.MOTORCYCLE && r.leavesHelmet && r.status === 'ACTIVE').length;
  const completedCount = records.filter(r => r.vehicleType === VehicleType.MOTORCYCLE && r.leavesHelmet && r.status === 'COMPLETED').length;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-orange-100 animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-2xl border border-white/20">
                <HardHat size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black flex items-center gap-2">
                   <Keyboard size={20} className="opacity-50" /> Gestión de Cascos
                </h2>
                <p className="text-orange-100 text-sm font-medium">Motos que dejaron casco en custodia</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={onClose} className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={22} />
              </button>
              <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm border border-white/10 uppercase tracking-widest">ESC para salir</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-2xl p-3 text-center transition-all hover:bg-white/20">
              <p className="text-3xl font-black">{helmetRecords.length}</p>
              <p className="text-[11px] text-orange-100 uppercase tracking-wider font-bold">Mostrando</p>
            </div>
            <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-2xl p-3 text-center transition-all hover:bg-white/20">
              <p className="text-3xl font-black text-green-300">{activeCount}</p>
              <p className="text-[11px] text-orange-100 uppercase tracking-wider font-bold">En Parqueadero</p>
            </div>
            <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-2xl p-3 text-center transition-all hover:bg-white/20">
              <p className="text-3xl font-black text-orange-200">{completedCount}</p>
              <p className="text-[11px] text-orange-100 uppercase tracking-wider font-bold">Ya Salieron</p>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="p-4 border-b border-orange-50 bg-orange-50/50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-300" size={18} />
            <input
              type="text"
              placeholder="Buscar por placa..."
              value={search}
              onChange={e => setSearch(e.target.value.toUpperCase())}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-orange-200 rounded-xl focus:border-orange-500 outline-none text-sm font-bold tracking-widest shadow-sm"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            {([
              { id: 'ALL', label: 'Todos', key: '1' },
              { id: 'ACTIVE', label: 'Activos', key: '2' },
              { id: 'COMPLETED', label: 'Completados', key: '3' }
            ] as const).map(({ id, label, key }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border flex flex-col items-center gap-0.5
                  ${filter === id
                    ? 'bg-orange-600 text-white border-orange-600 shadow-md'
                    : 'bg-white text-orange-600 border-orange-200 hover:border-orange-400'}`}
              >
                {label}
                <span className={`text-[8px] opacity-60 ${filter === id ? 'text-white' : 'text-orange-400'}`}>[{key}]</span>
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {helmetRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="bg-orange-50 p-6 rounded-full mb-4 border border-orange-100">
                <HardHat size={48} className="text-orange-200" />
              </div>
              <p className="text-lg font-bold text-slate-600">Sin cascos registrados</p>
              <p className="text-sm text-slate-400 mt-1">No hay motos con casco bajo el filtro actual</p>
            </div>
          ) : (
            <div className="space-y-3">
              {helmetRecords.map(record => {
                const durationMs = Date.now() - record.entryTime;
                const minutes = Math.floor(durationMs / 60000);
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

                return (
                  <div
                    key={record.id}
                    className={`bg-white rounded-2xl border p-4 flex gap-4 items-start transition-all hover:shadow-md group
                      ${record.status === 'ACTIVE'
                        ? 'border-green-200 shadow-sm'
                        : 'border-slate-200 opacity-70'}`}
                  >
                    {/* Icon + Status */}
                    <div className={`p-3 rounded-xl shrink-0 transition-transform group-hover:scale-110 ${record.status === 'ACTIVE' ? 'bg-orange-100' : 'bg-slate-100'}`}>
                      <Bike size={24} className={record.status === 'ACTIVE' ? 'text-orange-600' : 'text-slate-400'} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <span className="text-2xl font-black text-gray-800 font-mono tracking-widest">{record.plate}</span>
                        {record.status === 'ACTIVE' ? (
                          <span className="flex items-center gap-1.5 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full border border-green-200">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            En Parqueadero
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full border border-slate-200">
                            <CheckCircle size={10} />
                            Ya Salió
                          </span>
                        )}
                      </div>

                      {/* Helmet description & Location */}
                      {(record.helmetDescription || record.helmetLocation) ? (
                        <div className="flex flex-col gap-2 bg-orange-50 rounded-xl p-3 border border-orange-100 mb-2">
                          {record.helmetDescription && (
                            <div className="flex items-start gap-2">
                               <HardHat size={14} className="text-orange-500 mt-0.5 shrink-0" />
                               <p className="text-sm font-semibold text-orange-900 leading-tight">
                                 {record.helmetDescription}
                               </p>
                            </div>
                          )}
                          {record.helmetLocation && (
                            <div className="flex items-center gap-2 pt-2 border-t border-orange-200/50">
                               <MapPin size={14} className="text-orange-600 shrink-0" />
                               <p className="text-sm font-black text-orange-700 uppercase tracking-wide">
                                 Ubicación: <span className="text-orange-950 underline decoration-2 decoration-orange-300 underline-offset-2">{record.helmetLocation}</span>
                               </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-2">
                          <HardHat size={12} />
                          <span className="italic">Sin descripción registrada</span>
                        </div>
                      )}

                      {/* Times */}
                      <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(record.entryTime).toLocaleDateString('es-CO')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(record.entryTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {record.status === 'ACTIVE' && (
                          <span className="flex items-center gap-1 text-orange-600 font-black">
                            <Clock size={11} />
                            {durationStr} en parqueadero
                          </span>
                        )}
                        {record.ownerId && (
                          <span>CC: {record.ownerId}</span>
                        )}
                      </div>
                    </div>

                    {/* Helmet indicator pill */}
                    <div className="shrink-0 pt-2">
                      <div className="bg-orange-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-orange-200">
                        <HardHat size={11} />
                        CASCO
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-orange-100 bg-orange-50/30 flex justify-between items-center">
          <p className="text-xs text-slate-500 font-medium">
            💡 Los cascos se registran al momento de la entrada de la moto
          </p>
          <button
            onClick={onClose}
            className="bg-orange-600 text-white font-black px-8 py-3 rounded-2xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 text-sm active:scale-95"
          >
            Cerrar [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
