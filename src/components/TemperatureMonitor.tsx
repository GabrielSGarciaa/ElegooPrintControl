import React from 'react';
import { Thermometer, Zap, Film, Clock, Sun } from 'lucide-react';

interface TemperatureMonitorProps {
  uvLedTemp: number;
  tempOfBox: number;
  releaseFilmCount: number;
  exposureScreenUsageTime: number;
  uvLightOn: boolean;
}

export const TemperatureMonitor: React.FC<TemperatureMonitorProps> = ({ 
  uvLedTemp, 
  tempOfBox,
  releaseFilmCount,
  exposureScreenUsageTime,
  uvLightOn
}) => {
  const formatUsageTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-6 mx-4 shadow-xl">
      <h3 className="text-white text-lg font-semibold flex items-center mb-6">
        <Thermometer className="w-5 h-5 mr-2 text-red-400" />
        System Monitor
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-400/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            {uvLightOn ? <Sun className="w-6 h-6 text-purple-400" /> : <Zap className="w-6 h-6 text-purple-400" />}
            <div className="text-xs text-purple-200 bg-purple-500/20 px-2 py-1 rounded-full">
              UV LED
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {uvLedTemp.toFixed(2)}°C
          </div>
          <div className="text-xs text-purple-200">
            Operating Temp
          </div>
          <div className="mt-2 h-1 bg-purple-500/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-400 to-indigo-400 transition-all duration-500"
              style={{ width: `${Math.min((uvLedTemp / 60) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <Sun className="w-6 h-6 text-blue-400" />
            <div className="text-xs text-blue-200 bg-blue-500/20 px-2 py-1 rounded-full">
              UV LIGHT
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {uvLightOn ? 'ON' : 'OFF'}
          </div>
          <div className="text-xs text-blue-200">
            Current Status
          </div>
          <div className="mt-2 h-1 bg-blue-500/20 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${uvLightOn ? 'bg-gradient-to-r from-yellow-400 to-amber-400 w-full' : 'bg-gradient-to-r from-blue-400 to-cyan-400 w-0'}`}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <Film className="w-6 h-6 text-green-400" />
            <div className="text-xs text-green-200 bg-green-500/20 px-2 py-1 rounded-full">
              FILM COUNT
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {releaseFilmCount.toLocaleString()}
          </div>
          <div className="text-xs text-green-200">
            Release Cycles
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-6 h-6 text-yellow-400" />
            <div className="text-xs text-yellow-200 bg-yellow-500/20 px-2 py-1 rounded-full">
              SCREEN TIME
            </div>
          </div>
          <div className="text-lg font-bold text-white mb-1">
            {formatUsageTime(exposureScreenUsageTime)}
          </div>
          <div className="text-xs text-yellow-200">
            Total Usage
          </div>
        </div>
      </div>
    </div>
  );
};
