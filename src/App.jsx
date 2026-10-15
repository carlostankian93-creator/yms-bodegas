import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, AlertTriangle, Plus, Search, Smartphone, Globe, 
  ArrowRightLeft, PackageOpen, Radio, LayoutGrid
} from 'lucide-react';

const STATUS_CONFIG = {
  AVAILABLE: { id: 'AVAILABLE', bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'Disponible' },
  OCCUPIED_LOADED: { id: 'OCCUPIED_LOADED', bg: 'bg-red-500', text: 'text-red-400', label: 'Ocupado' },
  WORKING: { id: 'WORKING', bg: 'bg-blue-600', text: 'text-blue-400', label: 'Descargando' },
  OCCUPIED_EMPTY: { id: 'OCCUPIED_EMPTY', bg: 'bg-cyan-500', text: 'text-cyan-300', label: 'Vacío (MX)' },
  DISCREPANCY: { id: 'DISCREPANCY', bg: 'bg-amber-500', text: 'text-amber-300', label: 'Discrepancia' },
  DISABLED: { id: 'DISABLED', bg: 'bg-zinc-300 text-zinc-900', text: 'text-zinc-400', label: 'Inhabilitada' }
};

const generateInitialLocations = () => {
  const locs = [];
  for (let i = 1; i <= 44; i++) {
    locs.push({ id: `B4-D-${i}`, building: 4, zone: 'DOCK', number: i, status: i % 3 === 0 ? 'AVAILABLE' : 'OCCUPIED_LOADED', trailer: i % 3 === 0 ? '' : `TRL-${1000 + i}`, loadState: i % 3 === 0 ? 'EMPTY' : 'LOADED', loadType: 'INBOUND', operator: 'J. Gómez' });
  }
  for (let i = 1001; i <= 1038; i++) {
    locs.push({ id: `B5-D-${i}`, building: 5, zone: 'DOCK', number: i, status: 'AVAILABLE', trailer: '', loadState: 'EMPTY', loadType: 'INBOUND', operator: '' });
  }
  return locs;
};

export default function YMSApp() {
  const [lang, setLang] = useState('ES');
  const [activeOperator, setActiveOperator] = useState('A. Pichardo (Sup)');
  const [zone, setZone] = useState('DOCK');
  const [locations, setLocations] = useState(() => JSON.parse(localStorage.getItem('yms_locs_v3')) || generateInitialLocations());
  const [overflowList, setOverflowList] = useState([]);
  const [editingLoc, setEditingLoc] = useState(null);

  useEffect(() => {
    localStorage.setItem('yms_locs_v3', JSON.stringify(locations));
  }, [locations]);

  const b4Docks = useMemo(() => locations.filter(l => l.building === 4 && l.zone === zone), [locations, zone]);
  const b5Docks = useMemo(() => locations.filter(l => l.building === 5 && l.zone === zone), [locations, zone]);

  const b4Stats = useMemo(() => ({
    total: 44,
    available: b4Docks.filter(l => l.status === 'AVAILABLE').length,
    occupied: b4Docks.filter(l => l.status === 'OCCUPIED_LOADED' || l.status === 'OCCUPIED_EMPTY').length,
    working: b4Docks.filter(l => l.status === 'WORKING').length,
    disabled: b4Docks.filter(l => l.status === 'DISABLED').length
  }), [b4Docks]);

  const handleSave = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const trailer = fd.get('trailer').trim().toUpperCase();
    const loadState = fd.get('loadState');
    const opState = fd.get('opState');

    let newStatus = 'AVAILABLE';
    if (opState === 'DISABLED') newStatus = 'DISABLED';
    else if (opState === 'FREE' || !trailer) newStatus = 'AVAILABLE';
    else if (opState === 'WORKING') newStatus = 'WORKING';
    else if (loadState === 'EMPTY') newStatus = 'OCCUPIED_EMPTY';
    else newStatus = 'OCCUPIED_LOADED';

    setLocations(locations.map(l => l.id === editingLoc.id ? { ...l, status: newStatus, trailer, loadState } : l));
    setEditingLoc(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0812] text-white p-3 space-y-4 font-sans">
      {/* Header Estilo YMS Mobile */}
      <div className="flex items-center justify-between bg-[#151026] p-3 rounded-2xl border border-purple-900/40">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 p-2 rounded-xl">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-wide">YMS Mobile</span>
        </div>

        <button onClick={() => setLang(lang === 'ES' ? 'EN' : 'ES')} className="bg-[#211a3b] border border-purple-700/50 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-300">
          🌐 {lang}
        </button>
      </div>

      {/* Selector Docks / Yarda */}
      <div className="bg-[#151026] p-1.5 rounded-2xl border border-purple-900/30 flex items-center justify-between text-xs font-bold">
        <span className="pl-3 text-zinc-400">RAMPAS / DOCKS</span>
        <button onClick={() => setZone(zone === 'DOCK' ? 'YARD' : 'DOCK')} className="w-12 h-6 bg-purple-600 rounded-full p-1 transition flex items-center justify-end">
          <div className="w-4 h-4 bg-white rounded-full"></div>
        </button>
        <span className="pr-3 text-zinc-400">YARDA / PATIO</span>
      </div>

      {/* Botones de Sobreflujo */}
      <div className="flex gap-2">
        <div className="flex-1 bg-amber-950/40 border border-amber-500/50 p-2.5 rounded-xl text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5">
          <AlertTriangle className="h-4 w-4" /> SOBREFLUJO ({overflowList.length})
        </div>
        <button className="bg-purple-600 hover:bg-purple-500 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1">
          <Plus className="h-4 w-4" /> Sobreflujo
        </button>
      </div>

      {/* Dashboard Tarjetas Metricas */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-[#151026] p-2.5 rounded-xl border border-purple-900/30">
          <span className="text-[10px] text-zinc-400 font-bold block">Capacidad Total</span>
          <span className="text-lg font-black text-white">44</span>
        </div>
        <div className="bg-[#151026] p-2.5 rounded-xl border border-purple-900/30">
          <span className="text-[10px] text-emerald-400 font-bold block">Disponibles</span>
          <span className="text-lg font-black text-emerald-400">{b4Stats.available}</span>
        </div>
        <div className="bg-[#151026] p-2.5 rounded-xl border border-purple-900/30">
          <span className="text-[10px] text-blue-400 font-bold block">Ocupados</span>
          <span className="text-lg font-black text-blue-400">{b4Stats.occupied}</span>
        </div>
      </div>

      {/* BODEGA 4 MATRIZ VISUAL */}
      <div className="bg-[#151026] p-3.5 rounded-2xl border border-purple-900/40 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-extrabold text-xs text-purple-200 tracking-wider">
            BUILDING 4 — RAMPAS / DOCKS (1 - 44)
          </h2>
        </div>

        <div className="grid grid-cols-6 gap-1.5">
          {b4Docks.map(loc => {
            const cfg = STATUS_CONFIG[loc.status];
            return (
              <button
                key={loc.id}
                onClick={() => setEditingLoc(loc)}
                className={`${cfg.bg} rounded-lg p-1.5 h-14 flex flex-col items-center justify-between text-white shadow font-bold transition transform active:scale-95`}
              >
                <span className="text-xs font-black">{loc.number}</span>
                {loc.trailer && (
                  <span className="text-[8px] truncate max-w-full bg-black/40 px-1 rounded">
                    {loc.trailer}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      {/* Modal de edición al tocar rampa */}
      {editingLoc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSave} className="bg-[#1b1532] border border-purple-500 rounded-2xl max-w-xs w-full p-4 space-y-3">
            <h3 className="font-bold text-sm text-purple-200">Editar Rampa {editingLoc.number}</h3>
            <div>
              <label className="text-[11px] text-zinc-300 block mb-1">Trailer #:</label>
              <input name="trailer" defaultValue={editingLoc.trailer} className="w-full bg-[#0c0a12] border border-zinc-700 rounded-lg p-2 text-xs font-bold uppercase text-white" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1">Estado Caja:</label>
                <select name="loadState" defaultValue={editingLoc.loadState} className="w-full bg-[#0c0a12] border border-zinc-700 rounded-lg p-2 text-white">
                  <option value="LOADED">CARGADO</option>
                  <option value="EMPTY">VACÍO (MX)</option>
                </select>
              </div>
              <div>
                <label className="text-zinc-300 block mb-1">Acción Rampa:</label>
                <select name="opState" defaultValue="STATIC" className="w-full bg-[#0c0a12] border border-zinc-700 rounded-lg p-2 text-white">
                  <option value="STATIC">Ocupado</option>
                  <option value="WORKING">Descargando</option>
                  <option value="FREE">Liberar Rampa</option>
                  <option value="DISABLED">Inhabilitar</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditingLoc(null)} className="flex-1 bg-zinc-800 py-2 rounded-xl text-xs font-bold">Cancelar</button>
              <button type="submit" className="flex-1 bg-purple-600 py-2 rounded-xl text-xs font-bold">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
