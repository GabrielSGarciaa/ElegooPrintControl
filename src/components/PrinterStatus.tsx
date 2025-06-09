
import React from 'react';
import { Play, Pause, Square, Clock, Loader2, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface PrinterStatusProps {
  status: string;
  fileName: string;
  progress?: number;
  timeRemaining?: number;
}

// Map SDCP statuses to more user-friendly display text
const statusDisplayMap: Record<string, { text: string; description: string }> = {
  'printing': { text: 'Printing', description: 'Print in progress' },
  'paused': { text: 'Paused', description: 'Print paused' },
  'idle': { text: 'Ready', description: 'Printer is idle' },
  'homing': { text: 'Homing', description: 'Homing printer' },
  'exposing': { text: 'Exposing', description: 'Exposing layer' },
  'dropping': { text: 'Dropping', description: 'Lowering build plate' },
  'lifting': { text: 'Lifting', description: 'Raising build plate' },
  'pausing': { text: 'Pausing', description: 'Pausing print' },
  'stopping': { text: 'Stopping', description: 'Stopping print' },
  'stopped': { text: 'Stopped', description: 'Print stopped' },
  'complete': { text: 'Complete', description: 'Print completed' },
  'file_checking': { text: 'Processing', description: 'Checking file' },
  'error': { text: 'Error', description: 'Printer error' },
  'unknown': { text: 'Unknown', description: 'Unknown status' },
};

export const PrinterStatus: React.FC<PrinterStatusProps> = ({ 
  status, 
  fileName, 
  progress = 0,
  timeRemaining = 0 
}) => {
  // Get display text from map or use the status as fallback
  const displayStatus = statusDisplayMap[status] || { 
    text: status.charAt(0).toUpperCase() + status.slice(1), 
    description: status 
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'printing':
      case 'exposing':
      case 'dropping':
      case 'lifting':
        return <Play className="w-6 h-6 text-green-400 animate-pulse" />;
      case 'paused':
        return <Pause className="w-6 h-6 text-yellow-400" />;
      case 'idle':
      case 'complete':
        return <Square className="w-6 h-6 text-blue-400" />;
      case 'homing':
      case 'file_checking':
        return <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-400" />;
      case 'pausing':
      case 'stopping':
        return <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'printing':
      case 'exposing':
      case 'dropping':
      case 'lifting':
        return 'from-green-500/20 to-emerald-500/20 border-green-400/30';
      case 'paused':
      case 'pausing':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-400/30';
      case 'idle':
      case 'complete':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-400/30';
      case 'error':
      case 'stopped':
        return 'from-red-500/20 to-pink-500/20 border-red-400/30';
      case 'homing':
      case 'file_checking':
      case 'stopping':
        return 'from-blue-500/20 to-indigo-500/20 border-blue-400/30';
      default:
        return 'from-gray-500/20 to-slate-500/20 border-gray-400/30';
    }
  };

  return (
    <div className={`bg-gradient-to-r ${getStatusColor()} backdrop-blur-lg rounded-3xl border p-6 mx-4 shadow-xl`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/10 rounded-2xl">
            {getStatusIcon()}
          </div>
          <div className="min-w-0">
            <h3 className="text-white text-xl font-bold truncate">
              {displayStatus.text}
            </h3>
            <p className="text-blue-200 text-sm truncate max-w-48">
              {fileName || displayStatus.description}
            </p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
          status === 'printing' || status === 'exposing' || status === 'dropping' || status === 'lifting'
            ? 'bg-green-500/20 text-green-300' 
            : status === 'paused' || status === 'pausing'
            ? 'bg-yellow-500/20 text-yellow-300'
            : status === 'error' || status === 'stopped'
            ? 'bg-red-500/20 text-red-300'
            : 'bg-blue-500/20 text-blue-300'
        }`}>
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
};
