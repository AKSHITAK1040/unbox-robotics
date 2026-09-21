import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import SpeedometerGauge from './components/SpeedometerGauge';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [speedData, setSpeedData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected'); // Connected, Reconnecting, Disconnected
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // 1. Initial fetch from PostgreSQL database via REST API
    const fetchInitialData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/speed/latest`);
        if (response.ok) {
          const data = await response.json();
          setSpeedData(data);
        }
      } catch (err) {
        console.error('Error fetching initial speed:', err);
      }

      try {
        const resHistory = await fetch(`${API_URL}/api/speed/history?limit=8`);
        if (resHistory.ok) {
          const histData = await resHistory.json();
          setHistory(histData);
        }
      } catch (err) {
        console.error('Error fetching history:', err);
      }
    };

    fetchInitialData();

    // 2. Establish live WebSocket connection
    const socket = io(API_URL, {
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => setConnectionStatus('Connected'));
    socket.on('disconnect', () => setConnectionStatus('Disconnected'));
    socket.on('connect_error', () => setConnectionStatus('Reconnecting'));

    // 3. Receive real-time speed telemetry emitted strictly after PostgreSQL persistence
    socket.on('speed_update', (data) => {
      setSpeedData(data);
      setHistory((prev) => [data, ...prev].slice(0, 8));
    });

    return () => socket.disconnect();
  }, []);

  const currentSpeed = speedData?.speed ?? 0;
  
  // Format last recorded timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--:--';
    try {
      return format(new Date(timestamp), 'HH:mm:ss');
    } catch {
      return '--:--:--';
    }
  };

  const lastRecordedTime = formatTime(speedData?.recordedAt);
  const isOnline = connectionStatus === 'Connected';

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-200 font-sans flex flex-col justify-between selection:bg-cyan-500/30">
      {/* Centered Main Application Container */}
      <div className="w-full max-w-[1120px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 flex-1 flex flex-col justify-between">
        
        {/* ======================================================= */}
        {/* 1. CLEAN SINGLE-ROW HEADER                              */}
        {/* ======================================================= */}
        <header className="flex items-center justify-between pb-5 border-b border-[#191f2b]">
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black tracking-[0.18em] text-white select-none">
              UNBOX ROBOTICS
            </h1>
            <span className="text-[10px] md:text-[11px] font-bold tracking-[0.22em] text-slate-400 uppercase mt-0.5">
              REAL-TIME ROBOT SPEED MONITOR
            </span>
          </div>

          {/* System Online Status Badge */}
          <div className="flex items-center">
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider select-none transition-all ${
                isOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : connectionStatus === 'Reconnecting'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline
                    ? 'bg-emerald-400 shadow-[0_0_8px_#22c55e] animate-pulse'
                    : connectionStatus === 'Reconnecting'
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
              />
              <span>
                {isOnline
                  ? 'SYSTEM ONLINE'
                  : connectionStatus === 'Reconnecting'
                  ? 'RECONNECTING...'
                  : 'SYSTEM OFFLINE'}
              </span>
            </div>
          </div>
        </header>

        {/* ======================================================= */}
        {/* 2. TOP METADATA STRIP (Single row, clean layout)         */}
        {/* ======================================================= */}
        <div className="mt-5 bg-[#121620]/90 border border-[#1e2536] rounded-xl px-6 py-3.5 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8 items-center font-mono text-xs">
            {/* Sensor Status */}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                Sensor
              </span>
              <span className="text-xs md:text-sm font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                {isOnline ? 'Active' : 'Offline'}
              </span>
            </div>

            {/* Database Status */}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                Database
              </span>
              <span className="text-xs md:text-sm font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                {isOnline ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* WebSocket Status */}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                WebSocket
              </span>
              <span className="text-xs md:text-sm font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOnline
                      ? 'bg-emerald-400'
                      : connectionStatus === 'Reconnecting'
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                />
                {connectionStatus}
              </span>
            </div>

            {/* Update Rate */}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                Update Rate
              </span>
              <span className="text-xs md:text-sm font-semibold text-slate-200 mt-0.5">
                ~1 sec
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* 3. MAIN CENTERPIECE: SPEEDOMETER & SUB-GAUGE STATUS     */}
        {/* ======================================================= */}
        <main className="my-auto py-6 flex flex-col items-center justify-center relative">
          {/* Subtle Ambient Radial Glow behind the gauge */}
          <div className="absolute w-[440px] h-[440px] bg-cyan-500/[0.04] rounded-full blur-3xl pointer-events-none" />

          {/* Precision Speedometer Gauge */}
          <div className="relative z-10 w-full flex justify-center">
            <SpeedometerGauge speed={currentSpeed} maxSpeed={120} />
          </div>

          {/* Sub-Gauge Status Strip (Concise: LIVE & Last Update) */}
          <div className="flex items-center justify-center gap-3 text-xs font-mono text-slate-400 mt-3 select-none">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
            <span className="text-slate-600">|</span>
            <span>
              Last update:{' '}
              <span className="text-slate-200 font-medium">
                {lastRecordedTime}
              </span>
            </span>
          </div>
        </main>

        {/* ======================================================= */}
        {/* 4. RECENT READINGS (Properly contained table)           */}
        {/* ======================================================= */}
        <section className="w-full max-w-[520px] mx-auto mt-2 pb-2">
          <div className="text-center text-xs uppercase tracking-[0.22em] text-slate-400 font-bold mb-2.5 select-none">
            Recent Readings
          </div>

          <div className="bg-[#121620]/90 border border-[#1e2536] rounded-xl overflow-hidden shadow-lg">
            {/* Table Column Headers */}
            <div className="grid grid-cols-2 px-6 py-2 bg-[#171d2b] border-b border-[#21293c] text-[11px] font-bold tracking-wider text-slate-400 uppercase select-none">
              <span>TIME</span>
              <span className="text-right">SPEED</span>
            </div>

            {/* Table Rows */}
            {history.length > 0 ? (
              <div className="divide-y divide-[#1b2233]/60 text-xs font-mono">
                {history.slice(0, 6).map((record, index) => (
                  <div
                    key={record.id || index}
                    className="grid grid-cols-2 px-6 py-2.5 items-center hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-slate-400">
                      {formatTime(record.recordedAt)}
                    </span>
                    <span className="text-right text-white font-bold tabular-nums">
                      {Number(record.speed).toFixed(1)}{' '}
                      <span className="text-slate-500 font-normal">km/h</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-5 text-center text-xs text-slate-500 font-mono">
                Waiting for incoming sensor telemetry...
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

export default App;
