import React, { useState, useEffect } from 'react';
import { X, Search, Car, Bike, Clock, MapPin, Calendar, DollarSign, Keyboard } from 'lucide-react';
import { ParkingRecord, VehicleType } from '../types';

interface PlateSearchModalProps {
    records: ParkingRecord[];
    onClose: () => void;
}

export const PlateSearchModal: React.FC<PlateSearchModalProps> = ({ records, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<ParkingRecord[]>([]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleSearch = () => {
        if (!searchTerm.trim()) {
            setResults([]);
            return;
        }

        const filtered = records.filter(r =>
            r.plate.toUpperCase().includes(searchTerm.toUpperCase())
        );
        setResults(filtered);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('es-CO', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    const getStatusBadge = (status: string) => {
        if (status === 'ACTIVE') {
            return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">ACTIVO</span>;
        }
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">COMPLETADO</span>;
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up border border-blue-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2">
                           <Keyboard size={24} className="opacity-50" /> Buscador de Placas
                        </h2>
                        <p className="text-blue-100 text-sm mt-1 font-medium">Busca en toda la base de datos de parqueo</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                            <X size={24} />
                        </button>
                        <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm border border-white/10 uppercase tracking-widest">ESC para salir</span>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Ingresa placa (ej: ABC123)"
                                maxLength={7}
                                autoFocus
                                className="w-full text-xl font-mono font-bold uppercase py-3.5 pl-12 pr-4 bg-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-200 flex items-center gap-2 active:scale-95"
                        >
                            <Search size={20} />
                            Buscar [Enter]
                        </button>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                            Total Registros: <span className="text-blue-600">{records.length}</span> | Activos: <span className="text-emerald-600">{records.filter(r => r.status === 'ACTIVE').length}</span>
                        </p>
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
                    {results.length === 0 && searchTerm === '' && (
                        <div className="text-center py-16">
                            <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-100">
                                <Search size={48} className="text-blue-200" />
                            </div>
                            <p className="text-gray-400 text-lg font-bold">Ingresa una placa para buscar</p>
                            <p className="text-gray-300 text-sm mt-1">Busca historiales y registros actuales</p>
                        </div>
                    )}

                    {results.length === 0 && searchTerm !== '' && (
                        <div className="text-center py-16">
                            <div className="bg-red-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
                                <Search size={48} className="text-red-200" />
                            </div>
                            <p className="text-gray-900 text-lg font-black mb-2">No se encontraron resultados</p>
                            <p className="text-gray-500 font-medium">No hay registros con la placa "{searchTerm}"</p>
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-md">{results.length}</span>
                                <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">
                                    Resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            {results.map((record) => (
                                <div
                                    key={record.id}
                                    className="bg-white border-2 border-gray-100 rounded-3xl p-5 hover:border-blue-400 hover:shadow-xl transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 ${record.vehicleType === VehicleType.MOTORCYCLE ? 'bg-orange-100' : 'bg-blue-100'}`}>
                                                {record.vehicleType === VehicleType.MOTORCYCLE ? (
                                                    <Bike size={24} className="text-orange-600" />
                                                ) : (
                                                    <Car size={24} className="text-blue-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-3xl font-black text-gray-900 font-mono tracking-tighter">{record.plate}</p>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{record.vehicleType}</p>
                                            </div>
                                        </div>
                                        {getStatusBadge(record.status)}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold">
                                        <div className="bg-gray-50 p-3 rounded-2xl flex flex-col gap-1 border border-gray-100">
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Entrada</span>
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Calendar size={14} className="text-blue-500" />
                                                <span>{formatDate(record.entryTime)}</span>
                                            </div>
                                        </div>

                                        {record.exitTime && (
                                            <div className="bg-gray-50 p-3 rounded-2xl flex flex-col gap-1 border border-gray-100">
                                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Salida</span>
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <Clock size={14} className="text-emerald-500" />
                                                    <span>{formatDate(record.exitTime)}</span>
                                                </div>
                                            </div>
                                        )}

                                        {record.cost !== undefined && (
                                            <div className="bg-emerald-50 p-3 rounded-2xl flex flex-col gap-1 border border-emerald-100">
                                                <span className="text-[10px] text-emerald-400 uppercase tracking-wider">Total Cobrado</span>
                                                <div className="flex items-center gap-1 text-emerald-700 text-lg font-black leading-none">
                                                    <DollarSign size={16} />
                                                    <span>{record.cost.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        )}

                                        {record.paymentMethod && (
                                            <div className="bg-gray-50 p-3 rounded-2xl flex flex-col gap-1 border border-gray-100">
                                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Método Pago</span>
                                                <span className="text-gray-700 font-black uppercase text-[10px] truncate">{record.paymentMethod}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
