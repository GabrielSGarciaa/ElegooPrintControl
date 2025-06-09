
import React from 'react';
import { Layers } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LayerInfoProps {
  currentLayer: number;
  totalLayers: number;
}

export const LayerInfo: React.FC<LayerInfoProps> = ({ currentLayer, totalLayers }) => {
  const layerProgress = (currentLayer / totalLayers) * 100;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-6 mx-4 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white text-lg font-semibold flex items-center">
          <Layers className="w-5 h-5 mr-2 text-purple-400" />
          Layer Information
        </h3>
        <div className="text-right">
          <div className="text-xl font-bold text-white">
            {currentLayer.toLocaleString()}
          </div>
          <div className="text-xs text-blue-200">
            of {totalLayers.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-blue-200 mb-2">
            <span>Layer Progress</span>
            <span>{layerProgress.toFixed(1)}%</span>
          </div>
          <Progress 
            value={layerProgress} 
            className="h-2 bg-white/10"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {currentLayer.toLocaleString()}
            </div>
            <div className="text-xs text-blue-200">Current Layer</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {(totalLayers - currentLayer).toLocaleString()}
            </div>
            <div className="text-xs text-blue-200">Remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
};
