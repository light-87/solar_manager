'use client';

import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import Quagga from '@ericblade/quagga2';
import { Html5Qrcode } from 'html5-qrcode';

interface ScanResult {
  library: string;
  result: string;
  timestamp: number;
  confidence?: number;
}

export default function BarcodeTestPage() {
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [activeScanner, setActiveScanner] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  // Refs for different scanners
  const zxingVideoRef = useRef<HTMLVideoElement>(null);
  const quaggaVideoRef = useRef<HTMLDivElement>(null);
  const html5QrcodeVideoRef = useRef<HTMLDivElement>(null);

  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  // Get available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          // Prefer back camera
          const backCamera = videoDevices.find(device =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('rear')
          );
          setSelectedDevice(backCamera?.deviceId || videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Error getting cameras:', err);
      }
    };
    getCameras();
  }, []);

  const addResult = (library: string, result: string, confidence?: number) => {
    setScanResults(prev => [{
      library,
      result,
      timestamp: Date.now(),
      confidence
    }, ...prev].slice(0, 20)); // Keep last 20 results
  };

  // ZXing Scanner
  const startZXing = async () => {
    if (!zxingVideoRef.current || !selectedDevice) return;

    stopAllScanners();
    setActiveScanner('zxing');

    try {
      if (!zxingReaderRef.current) {
        zxingReaderRef.current = new BrowserMultiFormatReader();
      }

      await zxingReaderRef.current.decodeFromVideoDevice(
        selectedDevice,
        zxingVideoRef.current,
        (result, err) => {
          if (result) {
            addResult('ZXing', result.getText());
          }
        }
      );
    } catch (err) {
      console.error('ZXing error:', err);
      alert('ZXing failed to start: ' + (err as Error).message);
    }
  };

  // Quagga Scanner
  const startQuagga = async () => {
    if (!quaggaVideoRef.current || !selectedDevice) return;

    stopAllScanners();
    setActiveScanner('quagga');

    try {
      await Quagga.init({
        inputStream: {
          type: 'LiveStream',
          target: quaggaVideoRef.current,
          constraints: {
            deviceId: selectedDevice,
            facingMode: 'environment'
          },
        },
        decoder: {
          readers: [
            'code_128_reader',
            'code_39_reader',
            'code_39_vin_reader',
            'ean_reader',
            'ean_8_reader',
            'upc_reader',
            'upc_e_reader',
            'codabar_reader',
            'i2of5_reader',
          ],
          multiple: false
        },
        locator: {
          patchSize: 'medium',
          halfSample: true
        },
        frequency: 10,
      }, (err) => {
        if (err) {
          console.error('Quagga initialization error:', err);
          alert('Quagga failed to start: ' + err.message);
          return;
        }

        Quagga.start();
      });

      Quagga.onDetected((result) => {
        if (result && result.codeResult && result.codeResult.code) {
          const confidence = result.codeResult.decodedCodes
            .reduce((sum, code) => sum + (code.error || 0), 0) / result.codeResult.decodedCodes.length;
          addResult('Quagga2', result.codeResult.code, 1 - confidence);
        }
      });
    } catch (err) {
      console.error('Quagga error:', err);
      alert('Quagga failed to start: ' + (err as Error).message);
    }
  };

  // Html5-QRCode Scanner
  const startHtml5Qrcode = async () => {
    if (!html5QrcodeVideoRef.current || !selectedDevice) return;

    stopAllScanners();
    setActiveScanner('html5qrcode');

    try {
      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode('html5qrcode-reader');
      }

      await html5QrcodeRef.current.start(
        selectedDevice,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          addResult('Html5-QRCode', decodedText);
        },
        (errorMessage) => {
          // Ignore "NotFoundException" which happens when no barcode is in view
        }
      );
    } catch (err) {
      console.error('Html5-QRCode error:', err);
      alert('Html5-QRCode failed to start: ' + (err as Error).message);
    }
  };

  const stopAllScanners = () => {
    // Stop ZXing
    if (zxingReaderRef.current) {
      zxingReaderRef.current.reset();
    }

    // Stop Quagga
    if (activeScanner === 'quagga') {
      Quagga.stop();
    }

    // Stop Html5-QRCode
    if (html5QrcodeRef.current) {
      html5QrcodeRef.current.stop().catch(err => {
        console.error('Error stopping Html5-QRCode:', err);
      });
    }

    setActiveScanner(null);
  };

  const clearResults = () => {
    setScanResults([]);
  };

  return (
    <div className="min-h-screen bg-stone-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">
            1D Barcode Scanner Testing
          </h1>
          <p className="text-stone-600 mb-4">
            Test different barcode scanning libraries to find the most accurate one for panel/inverter serial numbers.
          </p>

          {/* Camera Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Select Camera
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => {
                stopAllScanners();
                setSelectedDevice(e.target.value);
              }}
              className="w-full max-w-md px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                </option>
              ))}
            </select>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={startZXing}
              disabled={activeScanner === 'zxing'}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              {activeScanner === 'zxing' ? '✓ ZXing Active' : 'Start ZXing'}
            </button>
            <button
              onClick={startQuagga}
              disabled={activeScanner === 'quagga'}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
            >
              {activeScanner === 'quagga' ? '✓ Quagga2 Active' : 'Start Quagga2'}
            </button>
            <button
              onClick={startHtml5Qrcode}
              disabled={activeScanner === 'html5qrcode'}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
            >
              {activeScanner === 'html5qrcode' ? '✓ Html5-QRCode Active' : 'Start Html5-QRCode'}
            </button>
            <button
              onClick={stopAllScanners}
              disabled={!activeScanner}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-stone-300 text-white rounded-lg transition-colors"
            >
              Stop All
            </button>
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-stone-600 hover:bg-stone-700 text-white rounded-lg transition-colors"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* Scanner Views */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* ZXing */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-blue-600">ZXing</h3>
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <video
                ref={zxingVideoRef}
                className="w-full h-full object-cover"
                playsInline
                autoPlay
              />
              {activeScanner !== 'zxing' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                  <p className="text-white text-sm">Stopped</p>
                </div>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-2">General purpose, multiple formats</p>
          </div>

          {/* Quagga2 */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-green-600">Quagga2</h3>
            <div
              id="quagga-reader"
              ref={quaggaVideoRef}
              className="relative bg-black rounded-lg overflow-hidden"
              style={{ aspectRatio: '4/3' }}
            >
              {activeScanner !== 'quagga' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
                  <p className="text-white text-sm">Stopped</p>
                </div>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-2">Specialized for 1D barcodes</p>
          </div>

          {/* Html5-QRCode */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-purple-600">Html5-QRCode</h3>
            <div
              id="html5qrcode-reader"
              ref={html5QrcodeVideoRef}
              className="relative bg-black rounded-lg overflow-hidden"
              style={{ aspectRatio: '4/3' }}
            >
              {activeScanner !== 'html5qrcode' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
                  <p className="text-white text-sm">Stopped</p>
                </div>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-2">Supports QR and 1D barcodes</p>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Scan Results ({scanResults.length})</h2>

          {scanResults.length === 0 ? (
            <p className="text-stone-500 text-center py-8">
              No scans yet. Start a scanner and point it at a 1D barcode.
            </p>
          ) : (
            <div className="space-y-2">
              {scanResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 ${
                    result.library === 'ZXing' ? 'border-blue-200 bg-blue-50' :
                    result.library === 'Quagga2' ? 'border-green-200 bg-green-50' :
                    'border-purple-200 bg-purple-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          result.library === 'ZXing' ? 'bg-blue-600 text-white' :
                          result.library === 'Quagga2' ? 'bg-green-600 text-white' :
                          'bg-purple-600 text-white'
                        }`}>
                          {result.library}
                        </span>
                        <span className="text-xs text-stone-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                        {result.confidence && (
                          <span className="text-xs text-stone-600">
                            Confidence: {(result.confidence * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-lg font-semibold text-stone-900">
                        {result.result}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(result.result);
                        alert('Copied to clipboard!');
                      }}
                      className="ml-4 px-3 py-1 bg-stone-200 hover:bg-stone-300 rounded text-sm transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Testing Instructions */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-amber-900 mb-3">Testing Instructions</h3>
          <ul className="space-y-2 text-sm text-amber-800">
            <li>• Test each library with the same barcode to compare accuracy</li>
            <li>• Try different lighting conditions</li>
            <li>• Test with damaged or partially obscured barcodes</li>
            <li>• Test with different barcode formats (Code128, Code39, EAN, etc.)</li>
            <li>• Note which library gives the most consistent results</li>
            <li>• Pay attention to confidence scores (if shown)</li>
            <li>• This page will be deleted once testing is complete</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
