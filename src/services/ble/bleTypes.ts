export type ConnectionState =
  | 'Disconnected'
  | 'Scanning'
  | 'DeviceFound'
  | 'Connecting'
  | 'Connected'
  | 'Monitoring'
  | 'ConnectionLost'
  | 'Reconnecting';

export type SignalQuality = 'Good' | 'Fair' | 'Poor' | 'NoSignal';

export interface HeartRateReading {
  bpm: number;
  timestamp: number;
}

export interface WearableDevice {
  id: string;
  name: string | null;
  rssi: number | null;
}

export interface DeviceStatus {
  batteryLevel?: number;
  signalQuality?: SignalQuality;
}

export interface BleManager {
  setOnStateChange: (callback: (state: ConnectionState) => void) => void;
  // Resolves once scanning has started; rejects if permissions or Bluetooth are unavailable
  scanForDevices: (onDeviceFound: (device: WearableDevice) => void) => Promise<void>;
  stopScan: () => void;
  connectToDevice: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  // Calling again while already monitoring replaces the previous subscription
  startMonitoring: (
    onReading: (reading: HeartRateReading) => void,
    onStatusUpdate?: (status: DeviceStatus) => void
  ) => void;
  stopMonitoring: () => void;
  getConnectionState: () => ConnectionState;
}
