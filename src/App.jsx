function YMSApp() {
  const [zone, setZone] = React.useState('DOCK');
  const [locations, setLocations] = React.useState(() => {
    const saved = localStorage.getItem('yms_locs_final');
    if (saved) return JSON.parse(saved);
    const locs = [];
    for (let i = 1; i <= 44; i++) {
      locs.push({ 
        number: i, 
        status: i === 3 ? 'red' : i === 5 ? 'green' : i === 10 ? 'blue' : i === 7 ? 'amber' : 'gray',
        trailer: i === 3 ? 'W019815' : i === 5 ? '' : i === 10 ? 'W006856' : ''
      });
    }
    return locs;
  });

  return (
    <div className="min-h-screen bg-[#0b0a0e] text-white p-3 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#151221] p-3 rounded-2xl border border-purple-900/40">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 p-2 rounded-xl font-bold">🚛</div>
          <span className="font-extrabold text-lg">YMS Mobile</span>
        </div>
        <div className="bg-[#1f1a30] px-3 py-1.5 rounded-xl text-xs font-bold text-purple-300 border border-purple-800">
          🌐 ES / EN
        </div>
      </div>

      {/* Switch Rampa / Yarda */}
      <div className="bg-[#151221] p-2 rounded-2xl border border-purple-900/40 flex items-center justify-between text-xs font-bold">
        <span className="text-zinc-400 pl-2">RAMPAS / DOCKS</span>
        <button onClick={() => setZone(zone === 'DOCK' ? 'YARD' : 'DOCK')} className="w-14 h-7 bg-purple-600 rounded-full p-1 flex items-center justify-end">
          <div className="w-5 h-5 bg-white rounded-full shadow"></div>
        </button>
        <span className="text-zinc-400 pr-2">YARDA / PATIO</span>
      </div>

      {/* Botones de acción superior */}
      <div className="flex gap-2">
        <div className="flex-1 bg-amber-950/50 border border-amber-500/50 p-2.5 rounded-xl text-amber-300 font-bold text-xs flex items-center justify-center gap-1">
          ⚠️ SOBREFLUJO (2)
        </div>
        <button className="bg-purple-600 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-purple-600/30">
          + Sobreflujo
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-[#151221] p-2.5 rounded-xl border border-purple-900/40">
          <span className="text-[10px] text-zinc-400 block font-bold">Capacidad Total</span>
          <span className="text-lg font-black text-white">44</span>
        </div>
        <div className="bg-[#151221] p-2.5 rounded-xl border border-purple-900/40">
          <span className="text-[10px] text-emerald-400 block font-bold">Disponibles</span>
          <span className="text-lg font-black text-emerald-400">12</span>
        </div>
        <div className="bg-[#151221] p-2.5 rounded-xl border border-purple-900/40">
          <span className="text-[10px] text-blue-400 block font-bold">Ocupados</span>
          <span className="text-lg font-black text-blue-400">28</span>
        </div>
      </div>

      {/* Matriz de Rampas */}
      <div className="bg-[#151221] p-4 rounded-2xl border border-purple-900/40 space-y-3">
        <h2 className="font-extrabold text-xs text-purple-200 uppercase tracking-wider">
          BUILDING 4 — RAMPAS / DOCKS (1 - 44)
        </h2>
        
        <div className="grid grid-cols-6 gap-1.5">
          {locations.map(loc => {
            let bgClass = "bg-emerald-500 text-white";
            if (loc.status === 'red') bgClass = "bg-red-600 text-white";
            if (loc.status === 'blue') bgClass = "bg-blue-600 text-white";
            if (loc.status === 'amber') bgClass = "bg-amber-500 text-slate-950";
            if (loc.status === 'gray') bgClass = "bg-zinc-300 text-zinc-900";

            return (
              <div key={loc.number} className={`${bgClass} rounded-lg p-1.5 h-14 flex flex-col items-center justify-between font-bold shadow`}>
                <span className="text-xs font-black">{loc.number}</span>
                <span className="text-[8px] truncate max-w-full bg-black/30 px-1 rounded">
                  {loc.trailer || 'LIBRE'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

ReactDOM.render(<YMSApp />, document.getElementById('root'));
