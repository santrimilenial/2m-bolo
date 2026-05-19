"use client";

import React, { useState, useEffect } from "react";
import { CalendarRange, CalendarDays, Calendar } from "lucide-react";
import { getFiscalPeriod, getFiscalYear, getFiscalRange } from "@/lib/fiscalPeriod";

export default function DateRangePicker({ onFilterChange, initialMode = "MONTH", defaultDate = new Date() }) {
  const [mode, setMode] = useState(initialMode); // "MONTH", "YEAR", "RANGE"
  const [singleMonth, setSingleMonth] = useState(defaultDate.getMonth() + 1);
  const [singleYear, setSingleYear] = useState(defaultDate.getFullYear());
  
  const [startMonth, setStartMonth] = useState(defaultDate.getMonth() + 1);
  const [startYear, setStartYear] = useState(defaultDate.getFullYear());
  const [endMonth, setEndMonth] = useState(defaultDate.getMonth() + 1);
  const [endYear, setEndYear] = useState(defaultDate.getFullYear());

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

  const getMonthName = (m) => new Date(0, m - 1).toLocaleString('id-ID', { month: 'long' });

  // Calculate fiscal period borders and broadcast to parent
  useEffect(() => {
    let start, end;
    if (mode === "MONTH") {
      ({ start, end } = getFiscalPeriod(singleMonth, singleYear));
    } else if (mode === "YEAR") {
      ({ start, end } = getFiscalYear(singleYear));
    } else if (mode === "RANGE") {
      ({ start, end } = getFiscalRange(startMonth, startYear, endMonth, endYear));
    }
    onFilterChange({ start: start.toISOString(), end: end.toISOString() });
  }, [mode, singleMonth, singleYear, startMonth, startYear, endMonth, endYear]);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-pos-panel border border-pos-border rounded-xl p-2 shadow-lg">
      {/* Mode Selector */}
      <div className="flex bg-[#0a0e17] rounded-lg p-1 border border-pos-border/50">
         <button onClick={() => setMode("MONTH")} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${mode === "MONTH" ? "bg-pos-accent text-white shadow-md" : "text-white/50 hover:text-white"}`}>
            <CalendarDays size={14} /> Bulan
         </button>
         <button onClick={() => setMode("YEAR")} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${mode === "YEAR" ? "bg-pos-accent text-white shadow-md" : "text-white/50 hover:text-white"}`}>
            <Calendar size={14} /> Tahun
         </button>
         <button onClick={() => setMode("RANGE")} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${mode === "RANGE" ? "bg-pos-accent text-white shadow-md" : "text-white/50 hover:text-white"}`}>
            <CalendarRange size={14} /> Kustom
         </button>
      </div>

      <div className="h-4 w-[1px] bg-white/10 hidden sm:block"></div>

      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-2">
        {mode === "MONTH" && (
          <>
            <select value={singleMonth} onChange={(e) => setSingleMonth(parseInt(e.target.value))} className="bg-[#0a0e17] border border-pos-border rounded text-white text-xs font-bold px-3 py-1.5 focus:border-pos-accent outline-none">
              {months.map(m => <option key={m} value={m}>{getMonthName(m)}</option>)}
            </select>
            <select value={singleYear} onChange={(e) => setSingleYear(parseInt(e.target.value))} className="bg-[#0a0e17] border border-pos-border rounded text-white text-xs font-bold px-3 py-1.5 focus:border-pos-accent outline-none">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </>
        )}

        {mode === "YEAR" && (
          <select value={singleYear} onChange={(e) => setSingleYear(parseInt(e.target.value))} className="bg-[#0a0e17] border border-pos-border rounded text-white text-xs font-bold px-3 py-1.5 focus:border-pos-accent outline-none">
            {years.map(y => <option key={y} value={y}>Sepanjang Tahun {y}</option>)}
          </select>
        )}

        {mode === "RANGE" && (
          <div className="flex items-center gap-2 bg-[#0a0e17] rounded border border-pos-border p-0.5">
            <select value={startMonth} onChange={(e) => setStartMonth(parseInt(e.target.value))} className="bg-transparent text-white text-xs font-bold pl-2 cursor-pointer outline-none">
              {months.map(m => <option className="bg-[#0a0e17]" key={m} value={m}>{getMonthName(m)}</option>)}
            </select>
            <select value={startYear} onChange={(e) => setStartYear(parseInt(e.target.value))} className="bg-transparent text-white text-xs font-bold pr-2 cursor-pointer outline-none">
              {years.map(y => <option className="bg-[#0a0e17]" key={y} value={y}>{y}</option>)}
            </select>
            
            <span className="text-pos-textMuted text-[10px] uppercase font-black px-1">s/d</span>
            
            <select value={endMonth} onChange={(e) => setEndMonth(parseInt(e.target.value))} className="bg-transparent text-white text-xs font-bold pl-2 cursor-pointer outline-none">
              {months.map(m => <option className="bg-[#0a0e17]" key={m} value={m}>{getMonthName(m)}</option>)}
            </select>
            <select value={endYear} onChange={(e) => setEndYear(parseInt(e.target.value))} className="bg-transparent text-white text-xs font-bold pr-2 cursor-pointer outline-none">
              {years.map(y => <option className="bg-[#0a0e17]" key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
