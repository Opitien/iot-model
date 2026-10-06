import { BleManager, ConnectionState, HeartRateReading, DeviceStatus, WearableDevice } from './bleTypes';

class BleMockServiceImpl implements BleManager {
  private connectionState: ConnectionState = 'Disconnected';
  private onStateChangeCallback: ((state: ConnectionState) => void) | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private scanTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private onReadingCallback: ((reading: HeartRateReading) => void) | null = null;

  private setState(state: ConnectionState) {
    this.connectionState = state;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(state);
    }
  }

  setOnStateChange(callback: (state: ConnectionState) => void) {
    this.onStateChangeCallback = callback;
  }

  async scanForDevices(onDeviceFound: (device: WearableDevice) => void): Promise<void> {
    this.clearScanTimeout();
    this.setState('Scanning');
    this.scanTimeoutId = setTimeout(() => {
      this.scanTimeoutId = null;
      onDeviceFound({
        id: 'mock-device-1234',
        name: 'ESP32 Wearable (Mock)',
        rssi: -45,
      });
      this.setState('DeviceFound');
    }, 1500);
  }

  private clearScanTimeout() {
    if (this.scanTimeoutId) {
      clearTimeout(this.scanTimeoutId);
      this.scanTimeoutId = null;
    }
  }

  stopScan() {
    this.clearScanTimeout();
    if (this.connectionState === 'Scanning' || this.connectionState === 'DeviceFound') {
      this.setState('Disconnected');
    }
  }

  async connectToDevice(deviceId: string): Promise<void> {
    this.clearScanTimeout();
    this.setState('Connecting');
    return new Promise((resolve) => {
      setTimeout(() => {
        this.setState('Connected');
        resolve();
      }, 1000);
    });
  }

  async disconnect(): Promise<void> {
    this.stopMonitoring();
    this.setState('Disconnected');
  }

  startMonitoring(
    onReading: (reading: HeartRateReading) => void,
    onStatusUpdate?: (status: DeviceStatus) => void
  ) {
    if (this.connectionState !== 'Connected' && this.connectionState !== 'Monitoring') return;

    // Never run two reading timers at once
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.setState('Monitoring');
    this.onReadingCallback = onReading;

    // Simulate sending heart rate readings every 1.5 seconds
    this.intervalId = setInterval(() => {
      if (this.onReadingCallback) {
        // Generate a random mock heart rate between 65 and 85
        const bpm = Math.floor(Math.random() * (85 - 65 + 1) + 65);
        this.onReadingCallback({
          bpm,
          timestamp: Date.now(),
        });
      }
    }, 1500);

    // Initial status update
    if (onStatusUpdate) {
      onStatusUpdate({
        batteryLevel: 85,
        signalQuality: 'Good',
      });
    }
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.onReadingCallback = null;
    if (this.connectionState === 'Monitoring') {
      this.setState('Connected');
    }
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }
}

export const BleMockService = new BleMockServiceImpl();
