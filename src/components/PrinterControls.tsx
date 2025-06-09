import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Map of SDCP statuses to UI states
const statusMap = {
  // Printing states
  'printing': 'printing',
  'exposing': 'printing',
  'dropping': 'printing',
  'lifting': 'printing',
  'homing': 'printing',
  'pausing': 'pausing',
  'paused': 'paused',
  'stopping': 'stopping',
  'stopped': 'idle',
  'complete': 'idle',
  'file_checking': 'processing',
  'idle': 'idle',
  'error': 'error',
  'unknown': 'idle'
} as const;

type PrinterStatus = keyof typeof statusMap;
type UIStatus = typeof statusMap[PrinterStatus];
type ControlAction = 'resume' | 'pause' | 'cancel';

interface PrinterControlsProps {
  status: string;
  isConnected: boolean;
  onControl: (action: ControlAction) => Promise<boolean>;
  onConnect: () => void;
}

export const PrinterControls: React.FC<PrinterControlsProps> = ({ 
  status, 
  isConnected,
  onControl,
  onConnect 
}) => {
  const [isLoading, setIsLoading] = useState<Record<ControlAction, boolean>>({
    pause: false,
    resume: false,
    cancel: false
  });
  const [lastAction, setLastAction] = useState<ControlAction | null>(null);

  // Map the printer status to our UI states
  const uiStatus: UIStatus = statusMap[status as PrinterStatus] || 'idle';

  // Reset loading state when status changes
  useEffect(() => {
    if (lastAction) {
      setIsLoading(prev => ({ ...prev, [lastAction]: false }));
      setLastAction(null);
    }
  }, [status, lastAction]);

  const handleControl = async (action: ControlAction) => {
    if (isLoading[action]) return;
    
    setIsLoading(prev => ({ ...prev, [action]: true }));
    setLastAction(action);
    
    try {
      const success = await onControl(action);
      if (!success) {
        toast.error(`Failed to ${action} print`);
      } else {
        toast.success(`Print ${action}ed successfully`);
      }
    } catch (error) {
      console.error(`Error ${action}ing print:`, error);
      toast.error(`Error ${action}ing print: ${error.message}`);
    } finally {
      setIsLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  // Show connect button if not connected
  if (!isConnected) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-6 mx-4 shadow-xl">
        <h3 className="text-white text-lg font-semibold mb-4">
          Printer Controls
        </h3>
        <Button
          onClick={onConnect}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl h-16 font-medium transition-all duration-300"
        >
          Connect to Printer
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-6 mx-4 shadow-xl">
      <h3 className="text-white text-lg font-semibold mb-4">
        Printer Controls
      </h3>
      
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-2xl">
          <div className="grid grid-cols-3 gap-4 w-full">
            {/* Resume Button - Always show but disabled when not paused */}
            <Button
              onClick={() => handleControl('resume')}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl h-16 font-medium transition-all duration-300 flex flex-col items-center justify-center px-6 w-full"
              disabled={uiStatus !== 'paused' || isLoading.resume}
              variant={uiStatus === 'paused' ? 'default' : 'outline'}
            >
              {isLoading.resume ? (
                <Loader2 className="w-5 h-5 animate-spin mb-1" />
              ) : (
                <Play className="w-5 h-5 mb-1" />
              )}
              {isLoading.resume ? 'Resuming...' : 'Resume'}
            </Button>

            {/* Pause Button - Always show but disabled when not printing */}
            <Button
              onClick={() => handleControl('pause')}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white rounded-2xl h-16 font-medium transition-all duration-300 flex flex-col items-center justify-center px-6 w-full"
              disabled={uiStatus !== 'printing' || isLoading.pause}
              variant={uiStatus === 'printing' ? 'default' : 'outline'}
            >
              {isLoading.pause ? (
                <Loader2 className="w-5 h-5 animate-spin mb-1" />
              ) : (
                <Pause className="w-5 h-5 mb-1" />
              )}
              {isLoading.pause ? 'Pausing...' : 'Pause'}
            </Button>

            {/* Cancel Button - Always show but disabled when idle */}
            <Button
              onClick={() => handleControl('cancel')}
              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-2xl h-16 font-medium transition-all duration-300 flex flex-col items-center justify-center px-6 w-full"
              disabled={uiStatus === 'idle' || isLoading.cancel}
              variant={uiStatus !== 'idle' ? 'default' : 'outline'}
            >
              {isLoading.cancel ? (
                <Loader2 className="w-5 h-5 animate-spin mb-1" />
              ) : (
                <Square className="w-4 h-4 mb-1" />
              )}
              {isLoading.cancel ? 'Cancelling...' : 'Cancel'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
