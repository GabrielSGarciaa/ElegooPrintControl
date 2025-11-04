import React, { useState, useEffect, useCallback } from 'react';
import { PrinterStatus } from '../components/PrinterStatus';
import { PrinterControls } from '../components/PrinterControls';
import { PrintProgress } from '../components/PrintProgress';
import { TemperatureMonitor } from '../components/TemperatureMonitor';
import { PrinterInfo } from '../components/PrinterInfo';
import { LayerInfo } from '../components/LayerInfo';
import { ConnectionHeader } from '../components/ConnectionHeader';
import PrintDetails from '../components/PrintDetails';
import { Printer, Wifi, WifiOff } from 'lucide-react';
import { usePrinter } from '../services/printerService';

const Index = () => {
  const [printerIP, setPrinterIP] = useState('10.205.117.244'); // Your printer's IP address
  
  // Use the printer service hook
  const {
    isConnected,
    printerData,
    connect,
    startPrint,
    pausePrint,
    stopPrint,
    resumePrint,
    updatePrinterSettings
  } = usePrinter(printerIP);

  const handleConnect = () => {
    if (!isConnected) {
      connect();
    }
  };

  const handlePrinterControl = async (action: 'pause' | 'resume' | 'cancel'): Promise<boolean> => {
    console.log(`Printer action: ${action}`);
    try {
      switch (action) {
        case 'pause':
          await pausePrint();
          return true;
        case 'resume':
          await resumePrint();
          return true;
        case 'cancel':
          await stopPrint();
          return true;
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error handling printer control (${action}):`, error);
      return false;
    }
  };

  const handleSaveSettings = useCallback((settings: {
    layerHeight: number;
    exposureTime: number;
    bottomExposureTime: number;
    bottomLayers: number;
    liftSpeed: number;
    retractSpeed: number;
    lightIntensity: number;
  }) => {
    console.log('Saving settings:', settings);
    updatePrinterSettings(settings);
    
    // Optional: Show a success message or notification here
    console.log('Settings saved successfully');
  }, [updatePrinterSettings]);

  // Debug info
  console.log('Rendering Index. isConnected:', isConnected);
  console.log('Printer data:', printerData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10 p-4 space-y-6">
        {/* Header */}
        <div className="text-center pt-8 pb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
              <Printer className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Elegoo Saturn 4 Ultra
          </h1>
          <p className="text-blue-200 text-sm">SLA 3D Printer Monitor</p>
        </div>

        {/* Connection Status */}
        <ConnectionHeader 
          isConnected={isConnected}
          printerIP={printerIP}
          onConnect={handleConnect}
          onIPChange={setPrinterIP}
        />

        {isConnected ? (
          <div className="space-y-6 animate-fade-in">
            {/* Printer Controls */}
            <PrinterControls 
              status={printerData.status}
              isConnected={isConnected}
              onControl={handlePrinterControl}
              onConnect={handleConnect}
            />

            {/* Printer Status */}
            <PrinterStatus 
              status={printerData.status}
              fileName={printerData.fileName}
              progress={printerData.progress}
              timeRemaining={printerData.timeRemaining}
            />

            {/* Print Progress */}
            <PrintProgress 
              currentLayer={printerData.currentLayer}
              totalLayers={printerData.totalLayers}
              progress={printerData.progress}
              timeRemaining={printerData.timeRemaining}
              estimatedTime={printerData.estimatedTime}
              exposureScreenUsageTime={printerData.exposureScreenUsageTime}
            />

            {/* System Monitor */}
            <div className="grid grid-cols-1 gap-4">
              <TemperatureMonitor 
                uvLedTemp={printerData.uvLedTemp}
                tempOfBox={printerData.tempOfBox}
                releaseFilmCount={printerData.releaseFilmCount}
                exposureScreenUsageTime={printerData.exposureScreenUsageTime}
                uvLightOn={printerData.uvLightOn}
              />

              <PrinterInfo 
                status={printerData.status}
                firmwareVersion={printerData.firmwareVersion}
                protocolVersion="V3.0.0"
                brandName="ELEGOO"
                model={printerData.model}
                ipAddress={printerIP}
              />

              <PrintDetails 
                {...printerData.printSettings}
                onSave={handleSaveSettings}
              />
            </div>

          </div>
        ) : (
          <div className="text-center py-16 animate-fade-in">
            <div className="p-6 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 mx-4">
              <WifiOff className="w-16 h-16 text-blue-300 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Not Connected
              </h3>
              <p className="text-blue-200 text-sm">
                Enter your printer's IP address and connect to start monitoring
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;