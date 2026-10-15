import React, { useState, useMemo } from 'react';

const STATUS_CONFIG = {
  AVAILABLE: { bg: 'bg-emerald-600', text: 'text-emerald-400', label: 'Disponible' },
  OCCUPIED_LOADED: { bg: 'bg-red-600', text: 'text-red-400', label: 'Cargado' },
  WORKING: { bg: 'bg-blue-600', text: 'text-blue-400', label: 'Descargando' },
  OCCUPIED_EMPTY: { bg: 'bg-cyan-500', text: 'text-cyan-300', label: 'Vacío (MX)' },
  DISCREPANCY: { bg: 'bg-amber-500', text: 'text-amber-300', label: 'Discrepancia' },
  DISABLED: { bg: 'bg-zinc-300 text-zinc-900', text: 'text-zinc-400', label: 'Inhabilitada' }
};

const generateLocations = () => {
  const locs = [];
  // Bodega 4: 1-44 Docks
  for (let i = 1; i <= 44; i++) {
    let st = 'AVAILABLE';
    let tr = '';
    if (i === 3 || i === 4 || i === 6 || i === 7 || i === 8 || i === 10 || i === 11 || i === 12) {
      st = 'OCCUPIED_LOADED';
      tr = `TRL-${3000 + i}`;
    } else if (i === 5 || i === 14 || i === 19 || i === 20) {
      st = 'AVAILABLE';
    } else if (i === 1 || i === 2) {
      st = 'DISABLED';
    }
    locs.push({ id: `B4-D-${i}`, building: 4, zone: 'DOCK', number: i, status: st, trailer: tr, loadState: st === 'OCCUPIED_EMPTY' ? 'EMPTY' : 'LOADED' });
  }
  // Bodega 5: 1001-1038 Docks
  for (let i = 1001; i <= 1038; i++) {
    let st = 'AVAILABLE';
    let tr = '';
    if (i === 1005 || i === 1010) {
      st = 'WORKING';
      tr = `MX-${i}`;
    } else if (i === 1007) {
      st = 'DISCREPANCY';
      tr = 'DISC-99';
    }
    locs.push({ id: `B5-D-${i}`, building: 5, zone: 'DOCK', number: i, status: st, trailer: tr, loadState: 'LOADED' });
  }
  return locs;
};

export default function App() {
  const [lang, setLang] = useState('ES');
  const [activeOperator, setActiveOperator] = useState('A. Pichardo (Sup)');
  const [building, setBuilding] = useState(4);
  const [locations, setLocations] = useState(() => {
    const saved = localStorage.getItem('yms_final_db');
    return saved ? JSON.parse(saved) : generateLocations();
  });
  const [editingLoc, setEditingLoc] = useState(null);

  const currentDocks = useMemo(() => {
    return locations.filter(l => l.building === building);
  }, [locations, building]);

  const stats = useMemo(() => {
    return {
      available: currentDocks.filter(l => l.status === 'AVAILABLE').length,
      occupied: currentDocks.filter(l => l.status === 'OCCUPIED_LOADED' || l.status === 'OCCUPIED_EMPTY').length,
      working: currentDocks.filter(l => l.status === 'WORKING').length,
      disabled: currentDocks.filter(l => l.status === 'DISABLED').length,
      discrepancy: currentDocks.filter(l => l.status === 'DISCREPANCY').length,
    };
  }, [currentDocks]);

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
    else if (opState === 'DISCREPANCY') newStatus = 'DISCREPANCY';
    else if (loadState === 'EMPTY') newStatus = 'OCCUPIED_EMPTY';
    else newStatus = 'OCCUPIED_LOADED';

    const updated = locations.map(l => l.id === editingLoc.id ? { ...l, status: newStatus, trailer, loadState } : l);
    setLocations(updated);
    localStorage.setItem('yms_final_db', JSON.stringify(updated));
    setEditingLoc(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0812] text-white p-3 space-y-3 font-sans max-w-lg mx-auto">
      {/* Header Estilo YMS Mobile */}
      <div className="flex items-center justify-between bg-[#151026] p-3 rounded-2xl border border-purple-900/40">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 px-2.5 py-1.5 rounded-xl font-bold text-sm">🚛</div>
          <span className="font-extrabold text-lg tracking-tight">YMS Mobile</span>
        </div>
        <button onClick={() => setLang(lang === 'ES' ? 'EN' : 'ES')} className="bg-[#211a3b] border border-purple-700/50 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-300">
          🌐 {lang}
        </button>
      </div>

      {/* Selector Bodega 4 / Bodega 5 */}
      <div className="grid grid-cols-2 gap-2 bg-[#151026] p-1.5 rounded-2xl border border-purple-900/40">
        <button onClick={() => setBuilding(4)} className={`py-2 rounded-xl font-bold text-xs ${building === 4 ? 'bg-purple-600 text-white shadow' : 'text-zinc-400'}`}>
          BODEGA 4 (1-44)
        </button>
        <button onClick={() => setBuilding(5)} className={`py-2 rounded-xl font-bold text-xs ${building === 5 ? 'bg-purple-600 text-white shadow' : 'text-zinc-400'}`}>
          BODEGA 5 (1001-1038)
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-[#151026] p-2 rounded-xl border border-purple-900/30">
          <span className="text-[10px] text-zinc-400 font-bold block">Capacidad</span>
          <span className="text-base font-black text-white">{building === 4 ? 44 : 38}</span>
        </div>
        <div className="bg-[#151026] p-2 rounded-xl border border-purple-900/30">
          <span className="text-[10px] text-emerald-400 font-bold block">Disponibles</span>
          <span className="text-base font-black text-emerald-400">{stats.available}</span>
        </div>
        <div className="bg-[#151026] p-2 rounded-xl border border-purple-900/30">
          <span className="text-[10px] text-red-400 font-bold block">Ocupados</span>
          <span className="text-base font-black text-red-400">{stats.occupied}</span>
        </div>
      </div>

      {/* Matriz Visual */}
      <div className="bg-[#151026] p-3.5 rounded-2xl border border-purple-900/40 space-y-3">
        <div className="flex justify-between items-center border-b border-purple-900/30 pb-2">
          <h2 className="font-extrabold text-xs text-purple-200 tracking-wider">
            BUILDING {building} — RAMPAS / DOCKS
          </h2>
          <span className="text-[10px] text-zinc-400">Toca para editar</span>
        </div>

        <div className="grid grid-cols-6 gap-1.5">
          {currentDocks.map(loc => {
            const cfg = STATUS_CONFIG[loc.status] || STATUS_CONFIG.AVAILABLE;
            return (
              <button
                key={loc.id}
                onClick={() => setEditingLoc(loc)}
                className={`${cfg.bg} rounded-xl p-1.5 h-14 flex flex-col items-center justify-between text-white shadow-md font-bold active:scale-95 transition`}
              >
                <span className="text-xs font-black">{loc.number}</span>
                <span className="text-[8px] truncate max-w-full bg-black/40 px-1 rounded">
                  {loc.trailer || 'LIBRE'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal emergente */}
      {editingLoc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSave} className="bg-[#1b1532] border border-purple-500 rounded-2xl max-w-xs w-full p-4 space-y-3 shadow-2xl">
            <h3 className="font-bold text-sm text-purple-200">Editar Rampa {editingLoc.number}</h3>
            <div>
              <label className="text-[11px] text-zinc-300 block mb-1">Trailer #:</label>
              <input name="trailer" defaultValue={editingLoc.trailer} placeholder="Ej. TRL-8842" className="w-full bg-[#0c0a12] border border-zinc-700 rounded-lg p-2 text-xs font-bold uppercase text-white" />
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
                <label className="text-zinc-300 block mb-1">Acción:</label>
                <select name="opState" defaultValue="STATIC" className="w-full bg-[#0c0a12] border border-zinc-700 rounded-lg p-2 text-white">
                  <option value="STATIC">Ocupado</option>
                  <option value="WORKING">Descargando</option>
                  <option value="DISCREPANCY">Discrepancia</option>
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
