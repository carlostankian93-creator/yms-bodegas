import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, AlertTriangle, CheckCircle2, Lock, Plus, Search, 
  RefreshCw, Layers, LayoutGrid, Smartphone, User, Globe, 
  ArrowRightLeft, PackageOpen, ShieldAlert, Radio, Send
} from 'lucide-react';

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
    colorBg: 'bg-cyan-500',
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

const generateInitialLocations = () => {
  const locs = [];
  for (let i = 1; i <= 44; i++) {
    locs.push({ id: `B4-D-${i}`, building: 4, zone: 'DOCK', number: i, status: 'AVAILABLE', trailer: '', loadState: 'EMPTY', loadType: 'INBOUND', operator: '', discrepancyMsg: '', updatedBy: 'System', updatedAt: '' });
  }
  for (let i = 1; i <= 50; i++) {
    locs.push({ id: `B4-Y-${i}`, building: 4, zone: 'YARD', number: i, status: 'AVAILABLE', trailer: '', loadState: 'EMPTY', loadType: 'INBOUND', operator: '', discrepancyMsg: '', updatedBy: 'System', updatedAt: '' });
  }
  for (let i = 1001; i <= 1038; i++) {
    locs.push({ id: `B5-D-${i}`, building: 5, zone: 'DOCK', number: i, status: 'AVAILABLE', trailer: '', loadState: 'EMPTY', loadType: 'INBOUND', operator: '', discrepancyMsg: '', updatedBy: 'System', updatedAt: '' });
  }
  for (let i = 51; i <= 99; i++) {
    locs.push({ id: `B5-Y-${i}`, building: 5, zone: 'YARD', number: i, status: 'AVAILABLE', trailer: '', loadState: 'EMPTY', loadType: 'INBOUND', operator: '', discrepancyMsg: '', updatedBy: 'System', updatedAt: '' });
  }

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
  const [lang, setLang] = useState('ES');
  const [activeOperator, setActiveOperator] = useState('A. Pichardo (Sup)');
  const [building, setBuilding] = useState(4);
  const [zone, setZone] = useState('DOCK');
  const [viewMode, setViewMode] = useState('MOBILE');
  const [filterMode, setFilterMode] = useState('ALL');
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

  const [editingLoc, setEditingLoc] = useState(null);
  const [overflowModal, setOverflowModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('yms_locations_v2', JSON.stringify(locations));
    localStorage.setItem('yms_overflow_v2', JSON.stringify(overflowList));
  }, [locations, overflowList]);

  useEffect(() => {
    const channel = new BroadcastChannel('yms_realtime_sync_channel');
    channel.onmessage = (event) => {
      if (event.data.type === 'SYNC_LOCATIONS') setLocations(event.data.payload);
      if (event.data.type === 'SYNC_OVERFLOW') setOverflowList(event.data.payload);
    };
    return () => channel.close();
  }, []);

  const broadcastUpdate = (newLocs, logEntry) => {
    setLocations(newLocs);
    const channel = new BroadcastChannel('yms_realtime_sync_channel');
    channel.postMessage({ type: 'SYNC_LOCATIONS', payload: newLocs });
    channel.close();
  };

  const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

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

    broadcastUpdate(updatedLocs);
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
    broadcastUpdate(updatedLocs);
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
    broadcastUpdate(updatedLocs);
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
    setOverflowList(nextOv);
    const channel = new BroadcastChannel('yms_realtime_sync_channel');
    channel.postMessage({ type: 'SYNC_OVERFLOW', payload: nextOv });
    channel.close();
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

        <div className="bg-[#15131f] border border-zinc-800/90 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex f
