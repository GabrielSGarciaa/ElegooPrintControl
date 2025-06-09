
import React from 'react';
import { Wifi, WifiOff, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ConnectionHeaderProps {
  isConnected: boolean;
  printerIP: string;
  onConnect: () => void;
  onIPChange: (ip: string) => void;
}

export const ConnectionHeader: React.FC<ConnectionHeaderProps> = ({
  isConnected,
  printerIP,
  onConnect,
  onIPChange
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-6 mx-4 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl transition-all duration-300 ${
            isConnected 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {isConnected ? (
              <Wifi className="w-5 h-5" />
            ) : (
              <WifiOff className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {isConnected ? 'Connected' : 'Disconnected'}
            </h3>
            <p className="text-blue-200 text-sm">
              {isConnected ? `Connected to ${printerIP}` : 'Enter IP to connect'}
            </p>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
          isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
        }`} />
      </div>
      
      {!isConnected && (
        <div className="space-y-3">
          <Input
            value={printerIP}
            onChange={(e) => onIPChange(e.target.value)}
            placeholder="192.168.1.100"
            className="bg-white/10 border-white/20 text-white placeholder-blue-200 rounded-xl h-12"
          />
          <Button
            onClick={onConnect}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl h-12 font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            Connect to Printer
          </Button>
        </div>
      )}
    </div>
  );
};
