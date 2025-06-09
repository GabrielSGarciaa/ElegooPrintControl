import React, { useState, useEffect } from 'react';
import { Layers, Clock, Gauge, Zap, Save } from 'lucide-react';

type PrintSettings = {
  layerHeight: number;
  exposureTime: number;
  bottomExposureTime: number;
  bottomLayers: number;
  liftSpeed: number;
  retractSpeed: number;
  lightIntensity: number;
};

interface PrintDetailsProps {
  initialSettings?: Partial<PrintSettings>;
  onSave?: (settings: PrintSettings) => void;
}

const defaultSettings: PrintSettings = {
  layerHeight: 0.05,
  exposureTime: 2.5,
  bottomExposureTime: 30,
  bottomLayers: 6,
  liftSpeed: 60,
  retractSpeed: 180,
  lightIntensity: 100
};

const PrintDetails: React.FC<PrintDetailsProps> = ({
  initialSettings = {},
  onSave
}) => {
  const [settings, setSettings] = useState<PrintSettings>({
    ...defaultSettings,
    ...initialSettings
  });
  const [isEditing, setIsEditing] = useState(false);

  // Update local state when initialSettings change
  useEffect(() => {
    // Only update if there are actual changes to prevent unnecessary re-renders
    const hasChanges = Object.entries(initialSettings).some(
      ([key, value]) => settings[key as keyof PrintSettings] !== value
    );
    
    if (hasChanges) {
      setSettings(prev => ({
        ...prev,
        ...initialSettings
      }));
    }
  }, [initialSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('printDetailsSettings', JSON.stringify(settings));
    setIsEditing(false);
    if (onSave) {
      onSave(settings);
    }
  };

  const formatValue = (value: number | undefined, unit: string = '') => {
    return value !== undefined ? `${value} ${unit}` : '--';
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 p-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-semibold text-white flex items-center">
          <Layers className="w-4 h-4 mr-2 text-blue-400" />
          Print Details
        </h3>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
          >
            Edit
          </button>
        ) : (
          <button 
            onClick={handleSave}
            className="text-green-400 hover:text-green-300 text-sm flex items-center"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </button>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Layer Height (mm)</label>
              <input
                type="number"
                name="layerHeight"
                value={settings.layerHeight}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Exposure (s)</label>
              <input
                type="number"
                name="exposureTime"
                value={settings.exposureTime}
                onChange={handleChange}
                step="0.1"
                min="0.1"
                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Bottom Exposure (s)</label>
              <input
                type="number"
                name="bottomExposureTime"
                value={settings.bottomExposureTime}
                onChange={handleChange}
                step="1"
                min="1"
                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Bottom Layers</label>
              <input
                type="number"
                name="bottomLayers"
                value={settings.bottomLayers}
                onChange={handleChange}
                step="1"
                min="1"
                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Lift Speed (mm/min)</label>
              <input
                type="number"
                name="liftSpeed"
                value={settings.liftSpeed}
                onChange={handleChange}
                step="1"
                min="1"
                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Retract Speed (mm/min)</label>
              <input
                type="number"
                name="retractSpeed"
                value={settings.retractSpeed}
                onChange={handleChange}
                step="1"
                min="1"
                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs text-gray-400">Light Intensity (%)</label>
            <input
              type="number"
              name="lightIntensity"
              value={settings.lightIntensity}
              onChange={handleChange}
              step="1"
              min="0"
              max="100"
              className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Layer Height</div>
              <div className="text-sm font-medium text-white">
                {formatValue(settings.layerHeight, 'mm')}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Exposure Time</div>
              <div className="text-sm font-medium text-white">
                {formatValue(settings.exposureTime, 's')}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Bottom Exposure</div>
              <div className="text-sm font-medium text-white">
                {formatValue(settings.bottomExposureTime, 's')}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Bottom Layers</div>
              <div className="text-sm font-medium text-white">
                {settings.bottomLayers}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Lift Speed</div>
              <div className="text-sm font-medium text-white">
                {formatValue(settings.liftSpeed, 'mm/min')}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Retract Speed</div>
              <div className="text-sm font-medium text-white">
                {formatValue(settings.retractSpeed, 'mm/min')}
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Light Intensity</div>
            <div className="text-sm font-medium text-white">
              {formatValue(settings.lightIntensity, '%')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintDetails;
