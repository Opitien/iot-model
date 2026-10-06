import { PermissionsAndroid, Platform } from 'react-native';
import {
  BleManager as PlxBleManager,
  Device,
  BleError,
  Characteristic,
  State,
  Subscription,
} from 'react-native-ble-plx';
import { BleManager, ConnectionState, HeartRateReading, DeviceStatus, WearableDevice } from './bleTypes';
import { BLE_CONSTANTS } from './bleConstants';

// Decodes a standard BLE Heart Rate Measurement (0x2A37) payload.
// Byte 0 is flags; bit 0 set means BPM is uint16 little-endian, otherwise uint8.
const parseHeartRate = (base64Value: string): number | null => {
  const raw = atob(base64Value);
  if (raw.length < 2) return null;
  const flags = raw.charCodeAt(0);
  if (flags & 0x01) {
    if (raw.length < 3) return null;
    return raw.charCodeAt(1) | (raw.charCodeAt(2) << 8);
  }
  return raw.charCodeAt(1);
};

const requestAndroidPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  if (Platform.Version >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return Object.values(result).every((r) => r === PermissionsAndroid.RESULTS.GRANTED);
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
};

class RealBleServiceImpl implements BleManager {
  private _manager: PlxBleManager | null = null;
  private connectedDevice: Device | null = null;
  private connectionState: ConnectionState = 'Disconnected';
  private onStateChangeCallback: ((state: ConnectionState) => void) | null = null;
  private monitorSubscription: Subscription | null = null;
  private disconnectSubscription: Subscription | null = null;

  private get manager(): PlxBleManager {
    if (!this._manager) {
      this._manager = new PlxBleManager();
    }
    return this._manager;
  }

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
    const granted = await requestAndroidPermissions();
    if (!granted) {
      throw new Error('Bluetooth permission was denied. Enable it in Settings to find your wearable.');
    }

    const bluetoothState = await this.manager.state();
    if (bluetoothState !== State.PoweredOn) {
      throw new Error('Bluetooth is turned off. Turn it on and try again.');
    }

    this.setState('Scanning');
    await this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
        this.stopScan();
        return;
      }
      if (device && device.name) {
        onDeviceFound({
          id: device.id,
          name: device.name,
          rssi: device.rssi,
        });
      }
    });
  }

  stopScan() {
    this.manager.stopDeviceScan();
    if (this.connectionState === 'Scanning') {
      this.setState('Disconnected');
    }
  }

  async connectToDevice(deviceId: string): Promise<void> {
    // Connecting while a scan is running is unreliable on Android
    this.manager.stopDeviceScan();
    this.removeDisconnectSubscription();

    try {
      this.setState('Connecting');
      const device = await this.manager.connectToDevice(deviceId);
      this.connectedDevice = device;

      await device.discoverAllServicesAndCharacteristics();
      this.setState('Connected');

      this.disconnectSubscription = this.manager.onDeviceDisconnected(deviceId, () => {
        this.removeMonitorSubscription();
        this.removeDisconnectSubscription();
        this.connectedDevice = null;
        this.setState('ConnectionLost');
      });
    } catch (e) {
      console.error('Failed to connect', e);
      this.connectedDevice = null;
      this.setState('Disconnected');
      throw e;
    }
  }

  async disconnect(): Promise<void> {
    this.removeMonitorSubscription();
    // Remove before cancelling so an intentional disconnect isn't reported as ConnectionLost
    this.removeDisconnectSubscription();
    if (this.connectedDevice) {
      const deviceId = this.connectedDevice.id;
      this.connectedDevice = null;
      try {
        await this.manager.cancelDeviceConnection(deviceId);
      } catch (e) {
        console.error('Failed to disconnect', e);
      }
    }
    this.setState('Disconnected');
  }

  startMonitoring(
    onReading: (reading: HeartRateReading) => void,
    onStatusUpdate?: (status: DeviceStatus) => void
  ) {
    if (!this.connectedDevice) return;

    // Never hold two subscriptions to the same characteristic
    this.removeMonitorSubscription();
    this.setState('Monitoring');

    this.monitorSubscription = this.connectedDevice.monitorCharacteristicForService(
      BLE_CONSTANTS.HEART_RATE_SERVICE_UUID,
      BLE_CONSTANTS.HEART_RATE_CHARACTERISTIC_UUID,
      (error: BleError | null, characteristic: Characteristic | null) => {
        if (error) {
          console.error(error);
          return;
        }
        if (characteristic && characteristic.value) {
          const bpm = parseHeartRate(characteristic.value);
          if (bpm !== null) {
            onReading({ bpm, timestamp: Date.now() });
          }
        }
      }
    );
  }

  stopMonitoring() {
    this.removeMonitorSubscription();
    if (this.connectionState === 'Monitoring') {
      this.setState('Connected');
    }
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  private removeMonitorSubscription() {
    if (this.monitorSubscription) {
      this.monitorSubscription.remove();
      this.monitorSubscription = null;
    }
  }

  private removeDisconnectSubscription() {
    if (this.disconnectSubscription) {
      this.disconnectSubscription.remove();
      this.disconnectSubscription = null;
    }
  }
}

export const RealBleService = new RealBleServiceImpl();
