import React, { useState } from 'react';
import { X, Save, FileText, Info, Building2, MapPin, Phone, ShieldCheck, Waves } from 'lucide-react';
import { DocumentConfig } from '../types';

interface DocumentCustomizationModalProps {
  currentConfig: DocumentConfig;
  onSave: (config: DocumentConfig) => void;
  onClose: () => void;
}

export const DocumentCustomizationModal: React.FC<DocumentCustomizationModalProps> = ({
  currentConfig,
  onSave,
  onClose
}) => {
  const [config, setConfig] = useState<DocumentConfig>({ ...currentConfig });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setConfig(prev => ({ ...prev, [name]: checked }));
    } else {
      setConfig(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    onSave(config);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up border border-orange-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/30">
                <FileText size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-[900] tracking-tighter uppercase italic">Personalización</h2>
                <p className="text-orange-100 text-sm font-bold opacity-80 uppercase tracking-widest">Tiquetes y Facturas</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors backdrop-blur-md"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[70vh] overflow-y-auto bg-[#FFFBF7]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Info Negocio */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                <Building2 size={16} /> Información del Negocio
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nombre del Parqueadero</label>
                  <input
                    type="text"
                    name="businessName"
                    value={config.businessName}
                    onChange={handleChange}
                    className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-orange-500 outline-none transition-all shadow-sm"
                    placeholder="Ej: Rossember Parking"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">NIT / Documento</label>
                  <input
                    type="text"
                    name="nit"
                    value={config.nit}
                    onChange={handleChange}
                    className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-orange-500 outline-none transition-all shadow-sm"
                    placeholder="Ej: 900.xxx.xxx-x"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Dirección</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-gray-400" size={16} />
                    <input
                      type="text"
                      name="address"
                      value={config.address}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold focus:border-orange-500 outline-none transition-all shadow-sm"
                      placeholder="Dirección física"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-gray-400" size={16} />
                    <input
                      type="text"
                      name="phone"
                      value={config.phone}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold focus:border-orange-500 outline-none transition-all shadow-sm"
                      placeholder="Contacto comercial"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Config Documentos */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={16} /> Aspectos Legales y Estilo
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Información Legal (NIT/Régimen)</label>
                  <textarea
                    name="legalInfo"
                    value={config.legalInfo}
                    onChange={handleChange}
                    rows={2}
                    className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-orange-500 outline-none transition-all shadow-sm resize-none"
                    placeholder="Ej: Régimen simplificado..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Pie de Página - Tiquete</label>
                  <textarea
                    name="ticketFooter"
                    value={config.ticketFooter}
                    onChange={handleChange}
                    rows={2}
                    className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-orange-500 outline-none transition-all shadow-sm resize-none"
                    placeholder="Mensaje al recibir el vehículo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Pie de Página - Factura</label>
                  <textarea
                    name="invoiceFooter"
                    value={config.invoiceFooter}
                    onChange={handleChange}
                    rows={2}
                    className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-orange-500 outline-none transition-all shadow-sm resize-none"
                    placeholder="Mensaje de agradecimiento"
                  />
                </div>
                
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <Waves size={18} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-800">Marca de Agua</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Incluir logo de fondo</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="showWatermark"
                      checked={config.showWatermark}
                      onChange={(e) => setConfig(prev => ({ ...prev, showWatermark: e.target.checked }))}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 bg-blue-50 p-4 rounded-3xl border border-blue-100 flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
              <Info size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-blue-900 uppercase mb-1">Nota Importante</p>
              <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                Los cambios realizados aquí se verán reflejados en todos los tiquetes y facturas generados a partir de este momento. El código QR siempre se mantendrá visible para asegurar la funcionalidad del sistema.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-white border-t border-gray-100 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all border-2 border-transparent"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-orange-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
