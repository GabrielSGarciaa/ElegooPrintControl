import React from 'react';
import { Printer, Cpu, Info, CpuIcon, Tag, Code } from 'lucide-react';

interface PrinterInfoProps {
  status: string;
  firmwareVersion?: string;
  protocolVersion?: string;
  model?: string;
  brandName?: string;
  ipAddress: string;
}

export const PrinterInfo: React.FC<PrinterInfoProps> = ({
  status,
  firmwareVersion = '--',
  protocolVersion = '--',
  model = 'Saturn 4 Ultra',
  brandName = 'ELEGOO',
  ipAddress,
}) => {
  // Map status to display text and color
  const getStatusInfo = (status: string) => {
    const isPrinting = [
      'printing', 'exposing', 'dropping', 'lifting', 'homing', 
      'pausing', 'paused', 'stopping', 'file_checking'
    ].includes(status);

    if (isPrinting) {
      return { text: 'Printing', color: 'bg-blue-500' };
    }
    
    if (status === 'error') {
      return { text: 'Error', color: 'bg-red-500' };
    }
    
    return { text: 'Idle', color: 'bg-gray-500' };
  };

  const statusInfo = getStatusInfo(status);

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 p-3 px-3">
      <h3 className="text-base font-semibold text-white mb-3 flex items-center">
        <Printer className="w-4 h-4 mr-2 text-blue-400" />
        Printer Information
      </h3>
      
      <div className="space-y-2">
        {/* Status */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center">
            <Info className="w-4 h-4 text-blue-300 mr-2" />
            <span className="text-blue-200 text-sm">Status</span>
          </div>
          <div className="flex items-center">
            <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.color} mr-2`}></span>
            <span className="text-white text-sm font-medium">{statusInfo.text}</span>
          </div>
        </div>
        
        {/* Brand Name */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center">
            <Tag className="w-4 h-4 text-blue-300 mr-2" />
            <span className="text-blue-200 text-sm">Brand</span>
          </div>
          <span className="text-white text-sm font-medium">{brandName}</span>
        </div>
        
        {/* Model */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center">
            <Printer className="w-4 h-4 text-blue-300 mr-2" />
            <span className="text-blue-200 text-sm">Model</span>
          </div>
          <span className="text-white text-sm font-medium">{model}</span>
        </div>
        
        {/* Firmware Version */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center">
            <Cpu className="w-4 h-4 text-blue-300 mr-2" />
            <span className="text-blue-200 text-sm">Firmware</span>
          </div>
          <span className="text-white text-sm font-medium">{firmwareVersion}</span>
        </div>
        
        {/* Protocol Version */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center">
            <Code className="w-4 h-4 text-blue-300 mr-2" />
            <span className="text-blue-200 text-sm">Protocol</span>
          </div>
          <span className="text-white text-sm font-medium">{protocolVersion}</span>
        </div>
        
        {/* IP Address */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-blue-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-blue-200 text-sm">IP Address</span>
          </div>
          <span className="text-white font-mono text-sm font-medium">{ipAddress}</span>
        </div>
      </div>
    </div>
  );
};

export default PrinterInfo;
