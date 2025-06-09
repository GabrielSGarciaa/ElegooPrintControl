import React from 'react';
import { Clock, TrendingUp, Layers, Timer, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PrintProgressProps {
  currentLayer: number;
  totalLayers: number;
  progress: number;
  timeRemaining: number;
  estimatedTime: number;
  exposureScreenUsageTime: number;
}

export const PrintProgress: React.FC<PrintProgressProps> = ({ 
  currentLayer,
  totalLayers,
  progress, 
  timeRemaining, 
  estimatedTime,
  exposureScreenUsageTime
}) => {
  // Format time from milliseconds to HH:MM:SS
  const formatTime = (ms: number) => {
    if (isNaN(ms) || !isFinite(ms) || ms < 0) {
      return '--:--:--';
    }
    
    // Convert to seconds
    const totalSeconds = Math.floor(ms / 1000);
    
    // Calculate hours, minutes, seconds
    const hours = Math.floor(totalSeconds / 3600);
    const remainingAfterHours = totalSeconds % 3600;
    const minutes = Math.floor(remainingAfterHours / 60);
    const seconds = remainingAfterHours % 60;
    
    // Format as HH:MM:SS
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };

  // Calculate end time based on remaining time
  const calculateEndTime = () => {
    if (isNaN(timeRemaining) || !isFinite(timeRemaining) || timeRemaining <= 0) {
      return '--:--:--';
    }
    
    const now = new Date();
    const endTime = new Date(now.getTime() + timeRemaining);
    
    return endTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Format hours from milliseconds
  const formatHours = (ms: number) => {
    if (isNaN(ms) || !isFinite(ms) || ms < 0) {
      return '0.0';
    }
    // Convert to hours with one decimal place
    return (ms / (1000 * 3600)).toFixed(1);
  };

  // Calculate derived values
  const layerTimeMs = estimatedTime / totalLayers;
  const elapsedMs = estimatedTime - timeRemaining;
  const elapsedLayers = Math.floor((elapsedMs / estimatedTime) * totalLayers);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-6 mx-4 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Print Progress</h2>
        <div className="text-sm text-blue-200">
          Layer {currentLayer} of {totalLayers}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-blue-200">
          <span>{progress.toFixed(1)}% Complete</span>
        </div>
      </div>

      {/* Time Info */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 rounded-2xl p-4 text-center">
          <Clock className="w-5 h-5 text-orange-400 mx-auto mb-2" />
          <div className="text-lg font-semibold text-white">
            {formatTime(timeRemaining)}
          </div>
          <div className="text-xs text-blue-200">Time Remaining</div>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 text-center">
          <Calendar className="w-5 h-5 text-green-400 mx-auto mb-2" />
          <div className="text-lg font-semibold text-white">
            {formatTime(estimatedTime)}
          </div>
          <div className="text-xs text-blue-200">Estimated Total</div>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 text-center">
          <Clock className="w-5 h-5 text-purple-400 mx-auto mb-2" />
          <div className="text-lg font-semibold text-white">
            {calculateEndTime()}
          </div>
          <div className="text-xs text-blue-200">Ends At</div>
        </div>
      </div>

      {/* Layer Info */}
      <div className="bg-white/5 rounded-2xl p-4">
        <h3 className="text-center font-semibold text-white mb-3">Layer Info</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-sm text-blue-200 mb-1">Since Start</div>
            <div className="text-lg font-medium text-white">
              {formatTime(elapsedMs)}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-sm text-blue-200 mb-1">Progress</div>
            <div className="text-lg font-medium text-white">
              {progress.toFixed(1)}%
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-sm text-blue-200 mb-1">Current Layer</div>
            <div className="text-lg font-medium text-white">
              {currentLayer} / {totalLayers}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-sm text-blue-200 mb-1">Layers Left</div>
            <div className="text-lg font-medium text-white">
              {Math.max(0, totalLayers - currentLayer)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
