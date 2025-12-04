'use client';

import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/library';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (result: string) => void;
  title?: string;
}

export default function BarcodeScanner({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Scan Barcode',
}: BarcodeScannerProps) {
  const [scanMode, setScanMode] = useState<'choose' | 'camera' | 'upload'>('choose');
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Initialize code reader
  useEffect(() => {
    if (!codeReaderRef.current) {
      codeReaderRef.current = new BrowserMultiFormatReader();
    }

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setScanMode('choose');
      setError('');
      setIsScanning(false);
      setIsInitializing(false);
      setDevices([]);
      setSelectedDevice('');
    }
  }, [isOpen]);

  // Get available video devices when camera mode is selected
  useEffect(() => {
    if (scanMode === 'camera' && !devices.length) {
      getVideoDevices();
    }
  }, [scanMode]);

  // Start camera scanning when device is selected
  useEffect(() => {
    if (scanMode === 'camera' && selectedDevice && videoRef.current) {
      startCameraScanning(selectedDevice);
    }

    return () => {
      stopScanning();
    };
  }, [scanMode, selectedDevice]);

  const getVideoDevices = async () => {
    setIsInitializing(true);
    setError('');

    try {
      if (!codeReaderRef.current) return;

      const videoInputDevices = await codeReaderRef.current.listVideoInputDevices();
      setDevices(videoInputDevices);

      if (videoInputDevices.length > 0) {
        // Prefer back camera on mobile devices
        const backCamera = videoInputDevices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear')
        );
        setSelectedDevice(backCamera?.deviceId || videoInputDevices[0].deviceId);
      } else {
        setError('No camera found on this device.');
        setScanMode('choose');
      }
    } catch (err) {
      console.error('Error getting video devices:', err);
      setError('Could not access camera. Please check permissions and try again.');
      setScanMode('choose');
    } finally {
      setIsInitializing(false);
    }
  };

  const startCameraScanning = async (deviceId: string) => {
    if (!codeReaderRef.current || !videoRef.current) return;

    setIsScanning(true);
    setError('');

    try {
      await codeReaderRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result: Result | null, err?: Error) => {
          if (result) {
            const text = result.getText();
            handleScanSuccess(text);
          }
          if (err && !(err.name === 'NotFoundException')) {
            console.error('Scan error:', err);
          }
        }
      );
    } catch (err) {
      console.error('Camera scanning error:', err);
      setError('Failed to start camera. Please try uploading an image instead.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setIsScanning(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !codeReaderRef.current) {
      setScanMode('choose');
      return;
    }

    setIsScanning(true);
    setError('');
    setScanMode('upload');

    try {
      const result = await codeReaderRef.current.decodeFromImageUrl(
        URL.createObjectURL(file)
      );
      handleScanSuccess(result.getText());
    } catch (err) {
      console.error('Image scanning error:', err);
      setError('No barcode found in the image. Please try again with a clearer photo.');
      setIsScanning(false);
      // Return to choose mode after a delay so user can see the error
      setTimeout(() => {
        setScanMode('choose');
        setError('');
      }, 3000);
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleScanSuccess = (text: string) => {
    stopScanning();
    onScanSuccess(text);
    handleClose();
  };

  const handleClose = () => {
    stopScanning();
    setScanMode('choose');
    setError('');
    onClose();
  };

  const handleCameraClick = () => {
    setScanMode('camera');
  };

  const handleUploadClick = () => {
    setError('');
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
          <button
            onClick={handleClose}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {scanMode === 'choose' && (
            <div className="space-y-4">
              <p className="text-sm text-stone-600 mb-4">
                Choose how you want to scan the barcode:
              </p>

              <button
                onClick={handleCameraClick}
                className="w-full flex items-center gap-4 p-4 border-2 border-stone-300 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-stone-900">Take Photo</div>
                  <div className="text-sm text-stone-600">Use your device camera</div>
                </div>
              </button>

              <button
                onClick={handleUploadClick}
                className="w-full flex items-center gap-4 p-4 border-2 border-stone-300 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-stone-900">Upload Photo</div>
                  <div className="text-sm text-stone-600">Choose from gallery</div>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {scanMode === 'camera' && (
            <div className="space-y-4">
              {isInitializing ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
                  <p className="text-sm text-stone-600">Initializing camera...</p>
                </div>
              ) : (
                <>
                  {devices.length > 1 && (
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Select Camera
                      </label>
                      <select
                        value={selectedDevice}
                        onChange={(e) => setSelectedDevice(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
                      >
                        {devices.map((device) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      autoPlay
                    />

                    {isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="border-4 border-amber-500 rounded-lg" style={{ width: '80%', height: '30%' }}>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-0.5 bg-amber-500 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {!isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="text-white text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                          <p className="text-sm">Starting camera...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-center text-stone-600">
                    Position the barcode within the frame
                  </p>

                  <button
                    onClick={() => setScanMode('choose')}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    Back
                  </button>
                </>
              )}
            </div>
          )}

          {scanMode === 'upload' && isScanning && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
              <p className="text-sm text-stone-600">Scanning image...</p>
            </div>
          )}
        </div>

        {/* Error message - shown outside content div to always be visible */}
        {error && (
          <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
