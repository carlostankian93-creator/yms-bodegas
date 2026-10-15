import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, AlertTriangle, CheckCircle2, Lock, Plus, Search, 
  RefreshCw, Layers, LayoutGrid, Smartphone, User, Globe, 
  ArrowRightLeft, PackageOpen, ShieldAlert, Radio, Send
} from 'lucide-react';

// --- CONFIGURACIÓN DE COLORES Y ESTADOS OPERATIVOS ---
// Matriz de colores diseñada para contraste inmediato en piso y monitor
const STATUS_CONFIG = {
  AVAILABLE: {
    id: 'AVAILABLE',
    colorBg: 'bg-emerald-600',
    colorBorder: 'border-emerald-500',
    colorText: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300',
    labelES: 'Habilitada / Libre',
    labelEN: 'Available / Free'
  },
  OCCUPIED_LOADED: {
    id: 'OCCUPIED_LOADED',
    colorBg: 'bg-red-600',
    colorBorder: 'border-red-500',
    colorText: 'text-red-400',
    badgeBg: 'bg-red-950/80 border-red-500/50 text-red-300',
    labelES: 'Ocupado (Cargado)',
    labelEN: 'Occupied (Loaded)'
  },
  WORKING: {
    id: 'WORKING',
    colorBg: 'bg-blue-600',
    colorBorder: 'border-blue-400',
    colorText: 'text-blue-400',
    badgeBg: 'bg-blue-950/80 border-blue-400/50 text-blue-300',
    labelES: 'En Operación (Carga/Descarga)',
    labelEN: 'In Progress (Load/Unload)'
  },
  OCCUPIED_EMPTY: {
    id: 'OCCUPIED_EMPTY',
    colorBg: 'bg-cyan-500', // Color distintivo de alta visibilidad para retorno a México
    colorBorder: 'border-cyan-400',
    colorText: 'text-cyan-300',
    badgeBg: 'bg-cyan-950/90 border-cyan-400 text-cyan-200',
    labelES: 'VACÍO (Listo para Chofer MX)',
    labelEN: 'EMPTY (Ready for MX Driver)'
  },
  DISCREPANCY: {
    id: 'DISCREPANCY',
    colorBg: 'bg-amber-500',
    colorBorder: 'border-amber-400',
    colorText: 'text-amber-300',
    badgeBg: 'bg-amber-950/90 border-amber-400 text-amber-200',
    labelES: 'Bloqueado por Discrepancia',
    labelEN: 'Hold / Discrepancy'
  },
  DISABLED: {
    id: 'DISABLED',
    colorBg: 'bg-zinc-200 text-zinc-900',
    colorBorder: 'border-zinc-400',
    colorText: 'text-zinc-400',
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

// Generador de estructura inicial de Bodegas 4 y 5
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

  // Datos de demostración realistas para visualizar todos los estados inmediatamente
  const demoOverrides = [
    { id: 'B4-D-1', status: 'WORKING', trailer: 'TRL-8842', loadState: 'LOADED', loadType: 'INBOUND', operator: 'J. Gómez', updatedBy: 'J. Gómez', updatedAt: '16:15' },
    { id: 'B4-D-3', status: 'DISABLED', trailer: '', loadState: 'EMPTY', loadType: 'INBOUND', operator: '', updatedBy: 'A. Pichardo', updatedAt: '14:00' },
    { id: 'B4-D-4', status: 'OCCUPIED_EMPTY', trailer: 'MX-4410', loadState: 'EMPTY', loadType: 'INBOUND', operator: 'C. Mendoza', updatedBy: 'C. Mendoza', updatedAt: '16:30' },
    { id: 'B4-D-5', status: 'WORKING', trailer: 'TRL-1092', loadState: 'LOADED', loadType: 'LIVELOAD', operator: 'R. Silva', updatedBy: 'R. Silva', updatedAt: '16:20' },
    { id: 'B4-D-6', status: 'OCCUPIED_LOADED', trailer: 'PRE-7721', loadState: 'LOADED', loadType: 'PRELOAD', operator: 'M. Torres', updatedBy: 'M. Torres', updatedAt: '15:50' },
    { id: 'B4-D-7', status: 'DISCREPANCY', trailer: 'MX-9011', loadState: 'LOADED', loadType: 'INBOUND', operator: 'J. Gómez', discrepancyMsg: 'Pallets dañados / Sello roto', updatedBy: 'J. Gómez', updatedAt: '16:05' },
    { id: 'B4-Y-1', status: 'OCCUPIED_EMPTY', trailer: 'MX-3302', loadState: 'EMPTY', loadType: 'INBOUND', operator: 'L. Vargas', updatedBy: 'L. Vargas', updatedAt: '15:10' },
    { id: 'B5-D-1001', status: 'OCCUPIED_EMPTY', trailer: 'MX-8819', loadState: 'EMPTY', loadType: 'INBOUND', operator: 'D. Ríos', updatedBy: 'D. Ríos', updatedAt: '16:35' },
    { id: 'B5-D-1002', status: 'WORKING', trailer: 'PRE-5501', loadState: 'LOADED', loadType: 'PRELOAD', operator: 'A. Castro', updatedBy: 'A. Castro', updatedAt: '16:40' },
  ];

  return locs.map(loc => {
    const found = demoOverrides.find(d => d.id === loc.id);
    return found ? { ...loc, ...found } : loc;
  });
};

export default function YMSApp() {
  // --- ESTADOS GLOBALES Y MULTI-NODO ---
  const [lang, setLang] = useState('ES');
  const [activeOperator, setActiveOperator] = useState('A. Pichardo (Sup)');
  const [building, setBuilding] = useState(4);
  const [zone, setZone] = useState('DOCK'); // 'DOCK' | 'YARD'
  const [viewMode, setViewMode] = useState('MOBILE'); // 'MOBILE' | 'MATRIX'
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'EMPTY_MX' | 'PRELOAD_LIVE' | 'DISCREPANCY'
  const [searchQuery, setSearchQuery] = useState('');

  const [locations, setLocations] = useState(() => {
    const saved = localStorage.getItem('yms_locations_v2');
    return saved ? JSON.parse(saved) : generateInitialLocations();
  });

  const [overflowList, setOverflowList] = useState(() => {
    const saved = localStorage.getItem('yms_overflow_v2');
    return saved ? JSON.parse(saved) : [
      { id: 'OV-1', building: 4, trailer: 'TRL-9912', refPosition: 'En frente de Rampa 5', loadState: 'LOADED', loadType: 'INBOUND', updatedBy: 'J. Gómez', updatedAt: '16:12' },
      { id: 'OV-2', building: 4, trailer: 'MX-2049', refPosition: 'Pasillo Central Yarda 12', loadState: 'EMPTY', loadType: 'PRELOAD', updatedBy: 'R. Silva', updatedAt: '16:28' }
    ];
  });

  const [activityLog, setActivityLog] = useState([
    { time: '16:40', user: 'A. Castro', action: 'Rampa 1002 -> En Operación (Preload Trlr)' },
    { time: '16:35', user: 'D. Ríos', action: 'Rampa 1001 -> VACÍO (Listo para Chofer MX)' }
  ]);

  // Modal de Edición / Asignación
  const [editingLoc, setEditingLoc] = useState(null);
  const [overflowModal, setOverflowModal] = useState(false);

  // --- MOTOR DE SINCRONIZACIÓN EN TIEMPO REAL (BROADCAST CHANNEL + STORAGE) ---
  // Permite que múltiples pestañas/dispositivos en la misma red o base de datos se actualicen al instante
  useEffect(() => {
    localStorage.setItem('yms_locations_v2', JSON.stringify(locations));
    localStorage.setItem('yms_overflow_v2', JSON.stringify(overflowList));
  }, [locations, overflowList]);

  useEffect(() => {
    const channel = new BroadcastChannel('yms_realtime_sync_channel');
    channel.onmessage = (event) => {
      if (event.data.type === 'SYNC_LOCATIONS') setLocations(event.data.payload);
      if (event.data.type === 'SYNC_OVERFLOW') setOverflowList(event.data.payload);
      if (event.data.type === 'SYNC_LOG') setActivityLog(prev => [event.data.payload, ...prev.slice(0, 19)]);
    };
    return () => channel.close();
  }, []);

  const broadcastUpdate = (newLocs, logEntry) => {
    setLocations(newLocs);
    const channel = new BroadcastChannel('yms_realtime_sync_channel');
    channel.postMessage({ type: 'SYNC_LOCATIONS', payload: newLocs });
    if (logEntry) {
      setActivityLog(prev => [logEntry, ...prev.slice(0, 19)]);
      channel.postMessage({ type: 'SYNC_LOG', payload: logEntry });
    }
    channel.close();
  };

  // --- FUNCIONES DE ACTUALIZACIÓN DE ESTADO DE TRAILERS ---
  const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const handleSaveLocation = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const trailer = formData.get('trailer').trim().toUpperCase();
    const loadState = formData.get('loadState'); // 'LOADED' | 'EMPTY'
    const loadType = formData.get('loadType');   // 'INBOUND' | 'PRELOAD' | 'LIVELOAD'
    const opState = formData.get('opState');     // 'STATIC' | 'WORKING' | 'DISCREPANCY' | 'DISABLED' | 'FREE'
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

    const logEntry = {
      time: nowTime(),
      user: activeOperator,
      action: `${editingLoc.zone} ${editingLoc.number} (B${editingLoc.building}): ${trailer || 'Libre'} -> ${STATUS_CONFIG[newStatus].labelES}`
    };

    broadcastUpdate(updatedLocs, logEntry);
    setEditingLoc(null);
  };

  // Acción rápida de 1 toque para marcar Trailer como VACÍO (Listo para Chofer México)
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
    broadcastUpdate(updatedLocs, {
      time: nowTime(),
      user: activeOperator,
      action: `${loc.zone} ${loc.number}: ${loc.trailer} marcado VACÍO para Chofer MX`
    });
  };

  // Acción rápida para despachar/liberar un trailer vacío que se lleva el chofer de México
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
    broadcastUpdate(updatedLocs, {
      time: nowTime(),
      user: activeOperator,
      action: `${loc.zone} ${loc.number}: Trailer ${loc.trailer} entregado a Chofer MX (Lugar Libre)`
    });
  };

  // Agregar trailer en Sobreflujo / Desbordamiento
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
    setOverflowList(nextOv);
    const channel = new BroadcastChannel('yms_realtime_sync_channel');
    channel.postMessage({ type: 'SYNC_OVERFLOW', payload: nextOv });
    channel.close();
    setOverflowModal(false);
  };

  // --- MÉTRICAS Y FILTRADO OPERATIVO ---
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
        const matchNum = String(loc.number).includes(q);
        const matchTrl = loc.trailer.toLowerCase().includes(q);
        const matchOp = loc.operator.toLowerCase().includes(q);
        return matchNum || matchTrl || matchOp;
      }
      return true;
    });
  }, [locations, building, zone, filterMode, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0b0a0e] text-white font-sans pb-24 select-none">
      {/* BARRA SUPERIOR: NODO ACTIVO, SINCRONIZACIÓN E IDIOMA */}
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

          {/* Selector de Operador / Montacarguista Activo + Idioma */}
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
        {/* PANEL CRÍTICO DE DESPACHO: TRAILERS VACÍOS LISTOS PARA CHOFERES DE MÉXICO */}
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

        {/* CONTROLES DE BODEGA, ZONA (DOCKS / YARDA) Y MODO DE VISTA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Selector Bodega 4 / Bodega 5 */}
          <div className="bg-[#161321] p-1 rounded-xl border border-zinc-800 flex">
            <button
              onClick={() => setBuilding(4)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition ${
                building === 4 ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-zinc-400 hover:text-white'
              }`}
            >
              BODEGA 4 <span className="text-xs font-normal opacity-80">(D:1-44 | Y:1-50)</span>
            </button>
            <button
              onClick={() => setBuilding(5)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition ${
                building === 5 ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-zinc-400 hover:text-white'
              }`}
            >
              BODEGA 5 <span className="text-xs font-normal opacity-80">(D:1001-1038 | Y:51-99)</span>
            </button>
          </div>

          {/* Selector Rampas / Yarda */}
          <div className="bg-[#161321] p-1 rounded-xl border border-zinc-800 flex">
            <button
              onClick={() => setZone('DOCK')}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition ${
                zone === 'DOCK' ? 'bg-zinc-800 text-purple-300 border border-purple-500/40' : 'text-zinc-400 hover:text-white'
              }`}
            >
              RAMPAS / DOCKS
            </button>
            <button
              onClick={() => setZone('YARD')}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition ${
                zone === 'YARD' ? 'bg-zinc-800 text-purple-300 border border-purple-500/40' : 'text-zinc-400 hover:text-white'
              }`}
            >
              YARDA / PATIO
            </button>
          </div>

          {/* Selector Vista Tarjetas (Celular) vs Matriz (Location Center) */}
          <div className="bg-[#161321] p-1 rounded-xl border border-zinc-800 flex">
            <button
              onClick={() => setViewMode('MOBILE')}
              className={`flex-1 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                viewMode === 'MOBILE' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              {lang === 'ES' ? 'Vista Montacargas (Tarjetas)' : 'Forklift View (Cards)'}
            </button>
            <button
              onClick={() => setViewMode('MATRIX')}
              className={`flex-1 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                viewMode === 'MATRIX' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              {lang === 'ES' ? 'Location Center (Matriz)' : 'Location Center (Matrix)'}
            </button>
          </div>
        </div>

        {/* LEYENDA DE COLORES Y FILTROS RÁPIDOS (DIFERENCIACIÓN DE CAJAS VACÍAS Y PRELOAD/LIVE LOAD) */}
        <div className="bg-[#15131f] border border-zinc-800/90 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-700">
              <span className="h-3 w-3 rounded-sm bg-emerald-600 inline-block"></span>
              {lang === 'ES' ? 'Libre' : 'Available'}: <b>{stats.available}</b>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-700">
              <span className="h-3 w-3 rounded-sm bg-red-600 inline-block"></span>
              {lang === 'ES' ? 'Ocupado (Cargado)' : 'Occupied (Loaded)'}: <b>{stats.occupiedLoaded}</b>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/90 border border-cyan-400 text-cyan-200 font-semibold">
              <span className="h-3 w-3 rounded-sm bg-cyan-400 inline-block"></span>
              {lang === 'ES' ? 'VACÍO (Para Chofer MX)' : 'EMPTY (For MX Driver)'}: <b>{stats.emptyMX}</b>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-700">
              <span className="h-3 w-3 rounded-sm bg-blue-600 inline-block"></span>
              {lang === 'ES' ? 'Cargando / Descargando' : 'Working'}: <b>{stats.working}</b>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-700">
              <span className="h-3 w-3 rounded-sm bg-amber-500 inline-block"></span>
              {lang === 'ES' ? 'Discrepancia' : 'Discrepancy'}: <b>{stats.discrepancy}</b>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-700">
              <span className="h-3 w-3 rounded-sm bg-zinc-200 inline-block"></span>
              {lang === 'ES' ? 'Inhabilitada' : 'Disabled'}: <b>{stats.disabled}</b>
            </span>
          </div>

          {/* Buscador + Filtro Preload / Live Load */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterMode(filterMode === 'PRELOAD_LIVE' ? 'ALL' : 'PRELOAD_LIVE')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                filterMode === 'PRELOAD_LIVE'
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : 'bg-[#1d192b] border-purple-800/50 text-purple-300 hover:bg-purple-950'
              }`}
            >
              Preload / Live Load
            </button>
            <div className="relative flex-1 sm:w-52">
              <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'ES' ? 'Buscar #Rampa, Trlr, Operador...' : 'Search Dock, Trlr, Operator...'}
                className="w-full bg-[#0e0c14] border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* VISTA 1: MATRIZ VISUAL (LOCATION CENTER CON DIFERENCIACIÓN DE VACÍOS EN CYAN) */}
        {viewMode === 'MATRIX' && (
          <div className="bg-[#151221] border border-zinc-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base tracking-wide uppercase text-zinc-200">
                BUILDING {building} — {zone === 'DOCK' ? 'DOCK OVERVIEW' : 'YARD OVERVIEW'}
              </h2>
              <span className="text-xs text-zinc-400">
                {lang === 'ES' ? 'Toca cualquier cuadro para actualizar trailer o estado' : 'Tap any square to update trailer or status'}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-11 gap-2">
              {filteredLocations.map(loc => {
                const cfg = STATUS_CONFIG[loc.status];
                return (
                  <button
                    key={loc.id}
                    onClick={() => setEditingLoc(loc)}
                    className={`${cfg.colorBg} rounded-lg p-2 flex flex-col items-center justify-between min-h-[70px] shadow-md hover:scale-105 transition relative overflow-hidden border ${cfg.colorBorder}`}
                  >
                    {/* Etiqueta superior de modalidad si es Preload o Live Load */}
                    {loc.trailer && loc.loadType !== 'INBOUND' && (
                      <span className="text-[9px] font-black uppercase tracking-tighter bg-black/60 text-purple-200 px-1.5 py-0.2 rounded">
                        {loc.loadType}
                      </span>
                    )}
                    <span className="font-black text-base leading-none my-auto">{loc.number}</span>
                    {loc.trailer ? (
                      <span className="text-[10px] font-bold truncate max-w-full bg-black/40 text-white px-1 rounded">
                        {loc.trailer}
                      </span>
                    ) : (
                      <span className="text-[9px] opacity-75">
                        {loc.status === 'DISABLED' ? 'BLOCK' : 'FREE'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* VISTA 2: TARJETAS MÓVILES PARA MONTACARGUISTAS */}
        {viewMode === 'MOBILE' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredLocations.map(loc => {
              const cfg = STATUS_CONFIG[loc.status];
              const loadTypeObj = LOAD_TYPES.find(t => t.id === loc.loadType);
              return (
                <div
                  key={loc.id}
                  className={`bg-[#151221] rounded-2xl p-4 border-2 transition shadow-lg ${
                    loc.status === 'OCCUPIED_EMPTY'
                      ? 'border-cyan-400/80 shadow-cyan-950/50'
                      : loc.status === 'DISCREPANCY'
                      ? 'border-amber-500/80'
                      : 'border-purple-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-lg tracking-tight">
                        {loc.zone === 'DOCK' ? (lang === 'ES' ? 'RAMPA' : 'DOCK') : (lang === 'ES' ? 'YARDA' : 'YARD')} {loc.number}
                      </span>
                      {loc.trailer && (
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                          loc.loadType === 'PRELOAD' 
                            ? 'bg-purple-950 text-purple-300 border-purple-500' 
                            : loc.loadType === 'LIVELOAD'
                            ? 'bg-indigo-950 text-indigo-300 border-indigo-400'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-600'
                        }`}>
                          {loc.loadType === 'PRELOAD' ? 'PRELOAD TRLR' : loc.loadType === 'LIVELOAD' ? 'LIVE LOAD' : 'INBOUND'}
                        </span>
                      )}
                    </div>

                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${cfg.badgeBg}`}>
                      ● {lang === 'ES' ? cfg.labelES : cfg.labelEN}
                    </span>
                  </div>

                  {loc.status === 'AVAILABLE' ? (
                    <div className="space-y-3">
                      <p className="text-xs text-emerald-400 font-medium">
                        {lang === 'ES' ? 'Estado: Habilitada / Libre para asignar' : 'Status: Available / Ready to assign'}
                      </p>
                      <button
                        onClick={() => setEditingLoc(loc)}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 transition"
                      >
                        <Plus className="h-4 w-4" />
                        {lang === 'ES' ? 'Asignar Trailer (Carga / Descarga)' : 'Assign Trailer (Load / Unload)'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs bg-[#0d0b14] p-2.5 rounded-xl border border-zinc-800/80">
                        <div>
                          <span className="text-zinc-400 block">{lang === 'ES' ? 'Trailer #:' : 'Trailer #:'}</span>
                          <span className="font-extrabold text-sm text-white">{loc.trailer || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block">{lang === 'ES' ? 'Estado Caja:' : 'Box State:'}</span>
                          <span className={`font-bold text-sm ${loc.loadState === 'EMPTY' ? 'text-cyan-300' : 'text-red-400'}`}>
                            {loc.loadState === 'EMPTY' 
                              ? (lang === 'ES' ? 'VACÍO (Retorno MX)' : 'EMPTY (MX Return)') 
                              : (lang === 'ES' ? 'CARGADO' : 'LOADED')}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block">{lang === 'ES' ? 'Modalidad:' : 'Mode:'}</span>
                          <span className="font-semibold text-purple-300">
                            {lang === 'ES' ? loadTypeObj?.es : loadTypeObj?.en}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block">{lang === 'ES' ? 'Asignado a:' : 'Assigned to:'}</span>
                          <span className="font-semibold text-zinc-200">{loc.operator || 'Sin asignar'}</span>
                        </div>
                      </div>

                      {loc.discrepancyMsg && (
                        <div className="bg-amber-950/60 border border-amber-500/60 text-amber-200 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                          <span><b>Discrepancia:</b> {loc.discrepancyMsg}</span>
                        </div>
                      )}

                      {/* Botones de Acción Rápida para Montacarguistas */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <button
                          onClick={() => setEditingLoc(loc)}
                          className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2 px-3 rounded-lg transition"
                        >
                          {lang === 'ES' ? 'Cambiar / Editar' : 'Change / Edit'}
                        </button>

                        {loc.status !== 'OCCUPIED_EMPTY' && loc.status !== 'DISABLED' && (
                          <button
                            onClick={() => quickMarkEmptyForMexico(loc)}
                            className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs py-2 px-3 rounded-lg transition"
                            title="Marcar trailer como descargado y vacío listo para chofer de México"
                          >
                            {lang === 'ES' ? '✓ Marcar VACÍO (MX)' : '✓ Mark EMPTY (MX)'}
                          </button>
                        )}

                        {loc.status === 'OCCUPIED_EMPTY' && (
                          <button
                            onClick={() => quickReleaseToDriver(loc)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-lg transition"
                          >
                            {lang === 'ES' ? 'Entregar a Chofer MX (Liberar)' : 'Release to MX Driver'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SECCIÓN DE SOBREFLUJO / DESBORDAMIENTO EN YARDA */}
        <div className="bg-[#18121e] border-2 border-amber-500/60 rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-base text-amber-400 uppercase tracking-wide">
                {lang === 'ES' 
                  ? `SOBREFLUJO / DESBORDAMIENTO (YARDA BODEGA ${building})` 
                  : `YARD OVERFLOW (BUILDING ${building})`}
              </h3>
              <p className="text-xs text-zinc-400">
                {lang === 'ES'
                  ? 'Trailers estacionados frente a otros lugares ocupados o en pasillos sin cajón asignado'
                  : 'Trailers parked in front of occupied spots or aisles without an assigned slot'}
              </p>
            </div>
            <button
              onClick={() => setOverflowModal(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md"
            >
              <Plus className="h-4 w-4" />
              {lang === 'ES' ? 'Registrar Trailer en Sobreflujo' : 'Register Overflow Trailer'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overflowList.filter(o => o.building === building).map(item => (
              <div key={item.id} className="bg-[#110e17] border border-amber-500/40 rounded-xl p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white">{item.trailer}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.loadState === 'EMPTY' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50' : 'bg-red-950 text-red-300 border border-red-500/50'
                    }`}>
                      {item.loadState === 'EMPTY' ? 'VACÍO (MX)' : 'CARGADO'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300">
                      {item.loadType}
                    </span>
                  </div>
                  <p className="text-xs text-amber-300 font-medium mt-1">📍 {item.refPosition}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Por: {item.updatedBy} a las {item.updatedAt}</p>
                </div>
                <button
                  onClick={() => setOverflowList(overflowList.filter(o => o.id !== item.id))}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700"
                >
                  {lang === 'ES' ? 'Mover / Quitar' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* MODAL PARA ASIGNAR / EDITAR RAMPA O LUGAR DE YARDA */}
      {editingLoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveLocation} className="bg-[#161324] border border-purple-700/60 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-extrabold text-lg">
                Bodega {editingLoc.building} • {editingLoc.zone === 'DOCK' ? 'Rampa' : 'Yarda'} {editingLoc.number}
              </h3>
              <button type="button" onClick={() => setEditingLoc(null)} className="text-zinc-400 hover:text-white text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Número de Trailer / Caja:</label>
                <input
                  name="trailer"
                  defaultValue={editingLoc.trailer}
                  placeholder="Ej. TRL-8842 o MX-4410"
                  className="w-full bg-[#0d0b14] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Estado de Carga:</label>
                  <select
                    name="loadState"
                    defaultValue={editingLoc.loadState}
                    className="w-full bg-[#0d0b14] border border-zinc-700 rounded-lg px-2.5 py-2 text-white font-semibold"
                  >
                    <option value="LOADED">🔴 CARGADO (Loaded)</option>
                    <option value="EMPTY">🩵 VACÍO (Listo Chofer MX)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Tipo de Operación:</label>
                  <select
                    name="loadType"
                    defaultValue={editingLoc.loadType}
                    className="w-full bg-[#0d0b14] border border-zinc-700 rounded-lg px-2.5 py-2 text-white font-semibold"
                  >
                    <option value="INBOUND">📥 Descarga (Inbound)</option>
                    <option value="PRELOAD">📦 Preload Trlr</option>
                    <option value="LIVELOAD">⚡ Live Load</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Estado de la Rampa / Lugar:</label>
                <select
                  name="opState"
                  defaultValue={
                    editingLoc.status === 'WORKING' ? 'WORKING' :
                    editingLoc.status === 'DISCREPANCY' ? 'DISCREPANCY' :
                    editingLoc.status === 'DISABLED' ? 'DISABLED' :
                    editingLoc.status === 'AVAILABLE' ? 'STATIC' : 'STATIC'
                  }
                  className="w-full bg-[#0d0b14] border border-zinc-700 rounded-lg px-3 py-2 text-white font-semibold"
                >
                  <option value="STATIC">Estacionado en Posición (Cargado o Vacío)</option>
                  <option value="WORKING">🔵 En Proceso Activo (Cargando / Descargando)</option>
                  <option value="DISCREPANCY">🟠 Bloqueado por Discrepancia (No tocar)</option>
                  <option value="FREE">🟢 Liberar Rampa / Lugar (Quedó Libre)</option>
                  <option value="DISABLED">⚪ Inhabilitar Rampa (Mantenimiento / Dañada)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Montacarguista Asignado:</label>
                <input
                  name="operator"
                  defaultValue={editingLoc.operator || activeOperator}
                  placeholder="Nombre del operador"
                  className="w-full bg-[#0d0b14] border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Nota de Discrepancia (Opcional):</label>
                <input
                  name="discrepancyMsg"
                  defaultValue={editingLoc.discrepancyMsg}
                  placeholder="Ej. Sello no coincide con BOL / Mercancía caída"
                  className="w-full bg-[#0d0b14] border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingLoc(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30"
              >
                Guardar y Sincronizar Nodos
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL PARA REGISTRAR SOBREFLUJO */}
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
                <input name="refPosition" required placeholder="Ej. En frente de Rampa 12 / Pasillo Yarda 30" className="w-full bg-[#0d0b14] border border-zinc-700 rounded-lg px-3 py-2 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select name="loadState" className="bg-[#0d0b14] border border-zinc-700 rounded-lg px-2.5 py-2 text-white font-semibold">
                  <option value="LOADED">Cargado</option>
                  <option value="EMPTY">Vacío (Para Chofer MX)</option>
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
          </div>
        )}
    </div>
  );
}
