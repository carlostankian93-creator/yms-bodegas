import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, AlertTriangle, Plus, Search, 
  LayoutGrid, Smartphone, User, Globe, 
  ArrowRightLeft, PackageOpen, Radio
} from 'lucide-react';
import { db, ref, onValue, set } from './firebase';

const STATUS_CONFIG = {
  AVAILABLE: {
    id: 'AVAILABLE',
    colorBg: 'bg-emerald-600',
    colorBorder: 'border-emerald-500',
    badgeBg: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300',
    labelES: 'Habilitada / Libre',
    labelEN: 'Available / Free'
  },
  OCCUPIED_LOADED: {
    id: 'OCCUPIED_LOADED',
    colorBg: 'bg-red-600',
    colorBorder: 'border-red-500',
    badgeBg: 'bg-red-950/80 border-red-500/50 text-red-300',
    labelES: 'Ocupado (Cargado)',
    labelEN: 'Occupied (Loaded)'
  },
  WORKING: {
    id: 'WORKING',
    colorBg: 'bg-blue-600',
    colorBorder: 'border-blue-400',
    badgeBg: 'bg-blue-950/80 border-blue-400/50 text-blue-300',
    labelES: 'En Operación (Carga/Descarga)',
    labelEN: 'In Progress (Load/Unload)'
  },
  OCCUPIED_EMPTY: {
    id: 'OCCUPIED_EMPTY',
    colorBg: 'bg-cyan-500',
    colorBorder: 'border-cyan-400',
    badgeBg: 'bg-cyan-950/90 border-cyan-400 text-cyan-200',
    labelES: 'VACÍO (Listo para Chofer MX)',
    labelEN: 'EMPTY (Ready for MX Driver)'
  },
  DISCREPANCY: {
    id: 'DISCREPANCY',
    colorBg: 'bg-amber-500',
    colorBorder: 'border-amber-400',
    badgeBg: 'bg-amber-950/90 border-amber-400 text-amber-200',
    labelES: 'Bloqueado por Discrepancia',
    labelEN: 'Hold / Discrepancy'
  },
  DISABLED: {
    id: 'DISABLED',
    colorBg: 'bg-zinc-200 text-zinc-900',
    colorBorder: 'border-zinc-400',
    badgeBg: 'bg-zinc-800 border-zinc-500 text-zinc-300',
    labelES: 'Inhabilitada / Mantenimiento',
    labelEN: 'Disabled / Maintenance'
  }
};

const LOAD_TYPES = [
  { id: 'INBOUND', es: 'Descarga (Inbound)', en: 'Inbound Unload' },
  { id: 'PRELOAD', es: 'Preload Trlr (Carga Previa)', en: 'Preload Trlr' },
  { id: 'LIVELOAD', es: 'Live Load (Carga en Vivo)', en: 'Live Load' }
];

const generateInitialLocations = () => {
  const locs = [];
  // Bodega 4: Rampas 1-44, Yarda 1-50
  for (let i = 1; i <= 44; i++) {
    locs.push({ id: `B4-D-${i}`, building: 4, zone: 'DOCK', number: i, status: 'AVAILABLE', trailer: '', loadState: 'EMPTY', loadType: 'INBOUND', operator: '', discrepancyMsg: '', updatedBy: 'System', updatedAt: '' });
  }
  for (let i = 1; i <= 50; i++) {
    locs.push({ id: `B4-Y-${i}`, building: 4, zone: 'YARD', number: i, status: 'AVAILABLE', trailer: '', loadState: 'EMPTY', loadType: 'INBOUND', operator: '', discrepancyMsg: '', updatedBy: 'System', updatedAt: '' });
  }
  // Bodega 5: Rampas 1001-1038, Yarda 51-99
  for (let i = 1001; i <= 1038; i++) {
    locs.push({ id: `B5-D-${i}`, building: 5, zone: 'DOCK', number: i, status: 'AVAILABLE', trailer: '', loadState: 'EMPTY', loadType: 'INBOUND', operator: '', discrepancyMsg: '', updatedBy: 'System', updatedAt: '' });
  }
  for (let i = 51; i <= 99; i++) {
    locs.push({ id: `B5-Y-${i}`, building: 5, zone: 'YARD', number: i, status: 'AVAILABLE', trailer: '', loadState: 'EMPTY', loadType: 'INBOUND', operator: '', discrepancyMsg: '', updatedBy: 'System', updatedAt: '' });
  }

  export default function App() {
  const [lang, setLang] = useState('ES');
  const [activeOperator, setActiveOperator] = useState('A. Pichardo (Sup)');
  const [building, setBuilding] = useState(4);
  const [zone, setZone] = useState('DOCK');
  const [viewMode, setViewMode] = useState('MOBILE');
  const [filterMode, setFilterMode] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [locations, setLocations] = useState(generateInitialLocations());
  const [overflowList, setOverflowList] = useState([]);
  const [editingLoc, setEditingLoc] = useState(null);
  const [overflowModal, setOverflowModal] = useState(false);

  // Escuchar cambios en tiempo real desde Firebase (Nodos Interconectados)
  useEffect(() => {
    const locsRef = ref(db, 'yms_locations');
    const overflowRef = ref(db, 'yms_overflow');

    const unsubscribeLocs = onValue(locsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setLocations(data);
    });

    const unsubscribeOverflow = onValue(overflowRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setOverflowList(data);
    });

    return () => {
      unsubscribeLocs();
      unsubscribeOverflow();
    };
  }, []);

  const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const syncToFirebase = (newLocations, newOverflow) => {
    if (newLocations) set(ref(db, 'yms_locations'), newLocations);
    if (newOverflow) set(ref(db, 'yms_overflow'), newOverflow);
  };

  const handleSaveLocation = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const trailer = formData.get('trailer').trim().toUpperCase();
    const loadState = formData.get('loadState');
    const loadType = formData.get('loadType');
    const opState = formData.get('opState');
    const operator = formData.get('operator').trim() || activeOperator;
    const discrepancyMsg = formData.get('discrepancyMsg')?.trim() || '';

    let newStatus = 'AVAILABLE';
    if (opState === 'DISABLED') newStatus = 'DISABLED';
    else if (opState === 'FREE' || !trailer) newStatus = 'AVAILABLE';
    else if (opState === 'DISCREPANCY') newStatus = 'DISCREPANCY';
    else if (opState === 'WORKING') newStatus = 'WORKING';
    else if (loadState === 'EMPTY') newStatus = 'OCCUPIED_EMPTY';
    else newStatus = 'OCCUPIED_LOADED';

    const updatedLocs = locations.map(loc => {
      if (loc.id !== editingLoc.id) return loc;
      return {
        ...loc,
        status: newStatus,
        trailer: newStatus === 'AVAILABLE' || newStatus === 'DISABLED' ? '' : trailer,
        loadState: newStatus === 'AVAILABLE' ? 'EMPTY' : loadState,
        loadType,
        operator: newStatus === 'AVAILABLE' ? '' : operator,
        discrepancyMsg: newStatus === 'DISCREPANCY' ? discrepancyMsg : '',
        updatedBy: activeOperator,
        updatedAt: nowTime()
      };
    });

    syncToFirebase(updatedLocs, null);
    setEditingLoc(null);
  };

  const quickMarkEmptyForMexico = (loc) => {
    const updatedLocs = locations.map(l => {
      if (l.id !== loc.id) return l;
      return {
        ...l,
        status: 'OCCUPIED_EMPTY',
        loadState: 'EMPTY',
        updatedBy: activeOperator,
        updatedAt: nowTime()
      };
    });
    syncToFirebase(updatedLocs, null);
  };

  const quickReleaseToDriver = (loc) => {
    const updatedLocs = locations.map(l => {
      if (l.id !== loc.id) return l;
      return {
        ...l,
        status: 'AVAILABLE',
        trailer: '',
        loadState: 'EMPTY',
        operator: '',
        discrepancyMsg: '',
        updatedBy: activeOperator,
        updatedAt: nowTime()
      };
    });
    syncToFirebase(updatedLocs, null);
  };

  const handleAddOverflow = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newOv = {
      id: `OV-${Date.now()}`,
      building,
      trailer: formData.get('trailer').trim().toUpperCase(),
      refPosition: formData.get('refPosition').trim(),
      loadState: formData.get('loadState'),
      loadType: formData.get('loadType'),
      updatedBy: activeOperator,
      updatedAt: nowTime()
    };
    const nextOv = [newOv, ...overflowList];
    syncToFirebase(null, nextOv);
    setOverflowModal(false);
  };

  const stats = useMemo(() => {
    const bLocs = locations.filter(l => l.building === building);
    return {
      totalEmptyMX: locations.filter(l => l.status === 'OCCUPIED_EMPTY').length,
      b4EmptyMX: locations.filter(l => l.building === 4 && l.status === 'OCCUPIED_EMPTY').length,
      b5EmptyMX: locations.filter(l => l.building === 5 && l.status === 'OCCUPIED_EMPTY').length,
      available: bLocs.filter(l => l.status === 'AVAILABLE').length,
      occupiedLoaded: bLocs.filter(l => l.status === 'OCCUPIED_LOADED').length,
      working: bLocs.filter(l => l.status === 'WORKING').length,
      emptyMX: bLocs.filter(l => l.status === 'OCCUPIED_EMPTY').length,
      discrepancy: bLocs.filter(l => l.status === 'DISCREPANCY').length,
      disabled: bLocs.filter(l => l.status === 'DISABLED').length,
    };
  }, [locations, building]);

    const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      if (loc.building !== building) return false;
      if (loc.zone !== zone) return false;
      if (filterMode === 'EMPTY_MX' && loc.status !== 'OCCUPIED_EMPTY') return false;
      if (filterMode === 'PRELOAD_LIVE' && !(loc.trailer && (loc.loadType === 'PRELOAD' || loc.loadType === 'LIVELOAD'))) return false;
      if (filterMode === 'DISCREPANCY' && loc.status !== 'DISCREPANCY') return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return String(loc.number).includes(q) || loc.trailer.toLowerCase().includes(q) || loc.operator.toLowerCase().includes(q);
      }
      return true;
    });
  }, [locations, building, zone, filterMode, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0b0a0e] text-white font-sans pb-24 select-none">
      <header className="sticky top-0 z-30 bg-[#12101b]/95 backdrop-blur border-b border-purple-900/40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-purple-700 flex items-center justify-center shadow-lg shadow-purple-700/30">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight">YMS Mobile & Dock Control</h1>
                <span className="flex items-center gap-1 text-[11px] bg-emerald-950 text-emerald-400 border border-emerald-700/60 px-2 py-0.5 rounded-full">
                  <Radio className="h-3 w-3 animate-pulse" /> LIVE SYNC
                </span>
              </div>
              <p className="text-xs text-zinc-400">146-El Paso • Multi-Node Forklift Network</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#1b1829] border border-purple-800/50 rounded-lg px-2.5 py-1.5 text-xs">
              <User className="h-3.5 w-3.5 text-purple-400 mr-1.5" />
              <select 
                value={activeOperator} 
                onChange={(e) => setActiveOperator(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="A. Pichardo (Sup)" className="bg-zinc-900">A. Pichardo (Sup)</option>
                <option value="J. Gómez (Montacargas)" className="bg-zinc-900">J. Gómez (Forklift)</option>
                <option value="C. Mendoza (Montacargas)" className="bg-zinc-900">C. Mendoza (Forklift)</option>
                <option value="R. Silva (Montacargas)" className="bg-zinc-900">R. Silva (Forklift)</option>
                <option value="Clerk Turno 1" className="bg-zinc-900">Clerk Turno 1</option>
              </select>
            </div>

            <button
              onClick={() => setLang(lang === 'ES' ? 'EN' : 'ES')}
              className="flex items-center gap-1 bg-[#1b1829] hover:bg-purple-950/60 border border-purple-700/50 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            >
              <Globe className="h-3.5 w-3.5 text-purple-400" />
              <span className={lang === 'ES' ? 'text-purple-400' : 'text-zinc-400'}>ES</span>
              <span>/</span>
              <span className={lang === 'EN' ? 'text-purple-400' : 'text-zinc-400'}>EN</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-4 space-y-4">
        {/* PANEL DE RETORNO MÉXICO (VACÍOS EN TURQUESA) */}
        <div className="bg-gradient-to-r from-cyan-950/70 via-[#151221] to-purple-950/50 border border-cyan-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shrink-0">
              <ArrowRightLeft className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  {lang === 'ES' ? 'Ciclo Retorno México (Cajas Vacías)' : 'Mexico Return Cycle (Empty Trailers)'}
                </span>
                <span className="bg-cyan-500 text-slate-950 font-extrabold text-xs px-2 py-0.5 rounded-md">
                  {stats.totalEmptyMX} {lang === 'ES' ? 'DISPONIBLES' : 'READY'}
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                {lang === 'ES' 
                  ? `Bodega 4: ${stats.b4EmptyMX} vacíos • Bodega 5: ${stats.b5EmptyMX} vacíos listos para enganchar` 
                  : `Building 4: ${stats.b4EmptyMX} empty • Building 5: ${stats.b5EmptyMX} empty ready for pickup`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setFilterMode(filterMode === 'EMPTY_MX' ? 'ALL' : 'EMPTY_MX')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              filterMode === 'EMPTY_MX'
                ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-900/60'
            }`}
          >
            <PackageOpen className="h-4 w-4" />
            {filterMode === 'EMPTY_MX'
              ? (lang === 'ES' ? 'Mostrando Solo Vacíos (Ver Todos)' : 'Showing Empty Only (Show All)')
              : (lang === 'ES' ? 'Filtrar Cajas Vacías (Chofer MX)' : 'Filter Empty Trailers (MX Driver)')}
          </button>
        </div>

        {/* SELECTORES DE BODEGA Y ZONA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-[#161321] p-1 rounded-xl border border-zinc-800 flex">
            <button onClick={() => setBuilding(4)} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition ${building === 4 ? 'bg-purple-600 text-white' : 'text-zinc-400'}`}>BODEGA 4</button>
            <button onClick={() => setBuilding(5)} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition ${building === 5 ? 'bg-purple-600 text-white' : 'text-zinc-400'}`}>BODEGA 5</button>
          </div>

          <div className="bg-[#161321] p-1 rounded-xl border border-zinc-800 flex">
            <button onClick={() => setZone('DOCK')} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition ${zone === 'DOCK' ? 'bg-zinc-800 text-purple-300 border border-purple-500/40' : 'text-zinc-400'}`}>RAMPAS / DOCKS</button>
            <button onClick={() => setZone('YARD')} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition ${zone === 'YARD' ? 'bg-zinc-800 text-purple-300 border border-purple-500/40' : 'text-zinc-400'}`}>YARDA / PATIO</button>
          </div>

          <div className="bg-[#161321] p-1 rounded-xl border border-zinc-800 flex">
            <button onClick={() => setViewMode('MOBILE')} className={`flex-1 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${viewMode === 'MOBILE' ? 'bg-purple-600 text-white' : 'text-zinc-400'}`}>
              <Smartphone className="h-4 w-4" /> Montacargas
            </button>
            <button onClick={() => setViewMode('MATRIX')} className={`flex-1 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${viewMode === 'MATRIX' ? 'bg-purple-600 text-white' : 'text-zinc-400'}`}>
              <LayoutGrid className="h-4 w-4" /> Location Center
            </button>
          </div>
        </div>

        {/* LEYENDA Y CONTROLES */}
        <div className="bg-[#15131f] border border-zinc-800/90 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-700"><span className="h-3 w-3 rounded-sm bg-emerald-600"></span> Libre: <b>{stats.available}</b></span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-700"><span className="h-3 w-3 rounded-sm bg-red-600"></span> Cargado: <b>{stats.occupiedLoaded}</b></span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-950/90 border border-cyan-400 text-cyan-200"><span className="h-3 w-3 rounded-sm bg-cyan-400"></span> VACÍO (Chofer MX): <b>{stats.emptyMX}</b></span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-700"><span className="h-3 w-3 rounded-sm bg-blue-600"></span> En Operación: <b>{stats.working}</b></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button onClick={() => setFilterMode(filterMode === 'PRELOAD_LIVE' ? 'ALL' : 'PRELOAD_LIVE')} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${filterMode === 'PRELOAD_LIVE' ? 'bg-purple-600 border-purple-400 text-white' : 'bg-[#1d192b] border-purple-800/50 text-purple-300'}`}>
              Preload / Live Load
            </button>
            <div className="relative flex-1 sm:w-48">
              <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar #Rampa, Trlr..." className="w-full bg-[#0e0c14] border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500" />
            </div>
          </div>
        </div>

        {/* VISTA LOCATION CENTER (MATRIZ DE COLORES) */}
        {viewMode === 'MATRIX' && (
          <div className="bg-[#151221] border border-zinc-800 rounded-2xl p-4 space-y-4">
            <h2 className="font-bold text-base uppercase text-zinc-200">BUILDING {building} — {zone} OVERVIEW</h2>
            <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-11 gap-2">
              {filteredLocations.map(loc => {
                const cfg = STATUS_CONFIG[loc.status];
                return (
                  <button key={loc.id} onClick={() => setEditingLoc(loc)} className={`${cfg.colorBg} rounded-lg p-2 flex flex-col items-center justify-between min-h-[70px] shadow-md hover:scale-105 transition relative border ${cfg.colorBorder}`}>
                    {loc.trailer && loc.loadType !== 'INBOUND' && <span className="text-[9px] font-black uppercase bg-black/60 text-purple-200 px-1 rounded">{loc.loadType}</span>}
                    <span className="font-black text-base my-auto">{loc.number}</span>
                    {loc.trailer ? <span className="text-[10px] font-bold bg-black/40 text-white px-1 rounded truncate max-w-full">{loc.trailer}</span> : <span className="text-[9px] opacity-75">{loc.status === 'DISABLED' ? 'BLOCK' : 'FREE'}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* VISTA MÓVIL (TARJETAS) */}
        {viewMode === 'MOBILE' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredLocations.map(loc => {
              const cfg = STATUS_CONFIG[loc.status];
              return (
                <div key={loc.id} className={`bg-[#151221] rounded-2xl p-4 border-2 transition shadow-lg ${loc.status === 'OCCUPIED_EMPTY' ? 'border-cyan-400/80' : loc.status === 'DISCREPANCY' ? 'border-amber-500/80' : 'border-purple-900/40'}`}>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-lg">{loc.zone === 'DOCK' ? 'RAMPA' : 'YARDA'} {loc.number}</span>
                      {loc.trailer && <span className="text-[10px] font-extrabold bg-purple-950 text-purple-300 border border-purple-500 px-2 py-0.5 rounded">{loc.loadType}</span>}
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${cfg.badgeBg}`}>● {cfg.labelES}</span>
                  </div>

                  {loc.status === 'AVAILABLE' ? (
                    <button onClick={() => setEditingLoc(loc)} className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 shadow-md">
                      <Plus className="h-4 w-4" /> Asignar Trailer
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs bg-[#0d0b14] p-2.5 rounded-xl border border-zinc-800">
                        <div><span className="text-zinc-400 block">Trailer #:</span><span className="font-extrabold text-sm">{loc.trailer || 'N/A'}</span></div>
                        <div><span className="text-zinc-400 block">Estado:</span><span className={`font-bold text-sm ${loc.loadState === 'EMPTY' ? 'text-cyan-300' : 'text-red-400'}`}>{loc.loadState === 'EMPTY' ? 'VACÍO (Chofer MX)' : 'CARGADO'}</span></div>
                        <div><span className="text-zinc-400 block">Asignado:</span><span className="font-semibold text-zinc-200">{loc.operator || 'Sin asignar'}</span></div>
                      </div>

                      {loc.discrepancyMsg && <div className="bg-amber-950/60 border border-amber-500 text-amber-200 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" />{loc.discrepancyMsg}</div>}

                      <div className="flex gap-1.5 pt-1">
                        <button onClick={() => setEditingLoc(loc)} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2 px-3 rounded-lg">Cambiar / Editar</button>
                        {loc.status !== 'OCCUPIED_EMPTY' && loc.status !== 'DISABLED' && (
                          <button onClick={() => quickMarkEmptyForMexico(loc)} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs py-2 px-3 rounded-lg">✓ Marcar VACÍO (MX)</button>
                        )}
                        {loc.status === 'OCCUPIED_EMPTY' && (
                          <button onClick={() => quickReleaseToDriver(loc)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-lg">Entregar a Chofer MX</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SECCIÓN SOBREFLUJO / DESBORDAMIENTO */}
        <div className="bg-[#18121e] border-2 border-amber-500/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-amber-400 uppercase">SOBREFLUJO / DESBORDAMIENTO (BODEGA {building})</h3>
            <button onClick={() => setOverflowModal(true)} className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5"><Plus className="h-4 w-4" /> Registrar Sobreflujo</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overflowList.filter(o => o.building === building).map(item => (
              <div key={item.id} className="bg-[#110e17] border border-amber-500/40 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white">{item.trailer}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.loadState === 'EMPTY' ? 'bg-cyan-950 text-cyan-300' : 'bg-red-950 text-red-300'}`}>{item.loadState === 'EMPTY' ? 'VACÍO' : 'CARGADO'}</span>
                  </div>
                  <p className="text-xs text-amber-300 mt-1">📍 {item.refPosition}</p>
                </div>
                <button onClick={() => syncToFirebase(null, overflowList.filter(o => o.id !== item.id))} className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg">Mover / Quitar</button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* MODAL DE EDICIÓN / ASIGNACIÓN */}
      {editingLoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveLocation} className="bg-[#161324] border border-purple-700/60 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-extrabold text-lg">Bodega {editingLoc.building} • {editingLoc.zone === 'DOCK' ? 'Rampa' : 'Yarda'} {editingLoc.number}</h3>
              <button type="button" onClick={() => setEditingLoc(null)} className="text-zinc-400 font-bold">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Número de Trailer / Caja:</label>
                <input name="trailer" defaultValue={editingLoc.trailer} placeholder="Ej. TRL-8842 o MX-4410" className="w-full bg-[#0d0b14] border border-zinc-700 rounded-lg px-3 py-2 text-white font-bold uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Estado de Carga:</label>
                  <select name="loadState" defaultValue={editingLoc.loadState} className="w-full bg-[#0d0b14] border border-zinc-700 rounded-lg px-2.5 py-2 text-white font-semibold">
                    <option value="LOADED">🔴 CARGADO</option>
                    <option value="EMPTY">🩵 VACÍO (Chofer MX)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Tipo Operación:</label>
                  <select name="loadType" defaultValue={editingLoc.loadType} className="w-full bg-[#0d0b14] border border-zinc-700 rounded-lg px-2.5 py-2 text-white font-semibold">
                    <option value="INBOUND">📥 Descarga (Inbound)</option>
                    <option value="PRELOAD">📦 Preload Trlr</option>
                    <option value="LIVELOAD">⚡ Live Load</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Estado Rampa / Lugar:</label>
                <select name="opState" defaultValue={editingLoc.status === 'WORKING' ? 'WORKING' : editingLoc.status === 'DISCREPANCY' ? 'DISCREPANCY' : editingLoc.status === 'DISABLED' ? 'DISABLED' : 'STATIC'} className="w-full bg-[#0d0b14] border border-zinc-700 rounded-lg px-3 py-2 text-white font-semibold">
                  <option value="STATIC">Estacionado en Posición</option>
                  <option value="WORKING">🔵 En Proceso Activo (Cargando / Descargando)</option>
                  <option value="DISCREPANCY">🟠 Bloqueado por Discrepancia</option>
                  <option value="FREE">🟢 Liberar Rampa (Quedó Libre)</option>
                  <option value="DISABLED">⚪ Inhabilitar Rampa (Mantenimiento)</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Montacarguista Asignado:</label>
                <input name="operator" defaultValue={editingLoc.operator || activeOperator} className="w-full bg-[#0d0b14] border border-zinc-700 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Nota de Discrepancia (Opcional):</label>
                <input name="discrepancyMsg" defaultValue={editingLoc.discrepancyMsg} placeholder="Ej. Sello roto" className="w-full bg-[#0d0b14] border border-zinc-700 rounded-lg px-3 py-2 text-white" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditingLoc(null)} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg">Guardar y Sincronizar</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL REGISTRAR SOBREFLUJO */}
      {overflowModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddOverflow} className="bg-[#161324] border border-amber-500/60 rounded-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="font-extrabold text-base text-amber-400">Registrar Trailer en Sobreflujo (Bodega {building})</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Trailer #:</label>
                <input name="trailer" required placeholder="Ej. TRL-9912" className="w-full bg-[#0d0b14] border border-zinc-700 rounded-lg px-3 py-2 text-white font-bold uppercase" />
              </div>
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Ubicación Física de Referencia:</label>
                <input name="refPosition" required placeholder="Ej. Frente a Rampa 12" className="w-full bg-[#0d0b14] border border-zinc-700 rounded-lg px-3 py-2 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select name="loadState" className="bg-[#0d0b14] border border-zinc-700 rounded-lg px-2.5 py-2 text-white font-semibold">
                  <option value="LOADED">Cargado</option>
                  <option value="EMPTY">Vacío (Chofer MX)</option>
                </select>
                <select name="loadType" className="bg-[#0d0b14] border border-zinc-700 rounded-lg px-2.5 py-2 text-white font-semibold">
                  <option value="INBOUND">Inbound</option>
                  <option value="PRELOAD">Preload Trlr</option>
                  <option value="LIVELOAD">Live Load</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setOverflowModal(false)} className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs">Cancelar</button>
              <button type="submit" className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs">Guardar Sobreflujo</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
  return locs;
};
