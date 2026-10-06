import { useSyncExternalStore } from 'react';
import { BleServiceProxy } from '../services/ble/BleManager';
import { ConnectionState, HeartRateReading, DeviceStatus, WearableDevice } from '../services/ble/bleTypes';
import { BLE_CONSTANTS } from '../services/ble/bleConstants';

// BLE state lives in one module-level store so every screen sees the same
// connection, readings and status. The store is the only subscriber to the service.
interface BleSnapshot {
  connectionState: ConnectionState;
  devices: WearableDevice[];
  currentReading: HeartRateReading | null;
  isLive: boolean;
  deviceStatus: DeviceStatus | null;
  error: string | null;
}

let snapshot: BleSnapshot = {
  connectionState: BleServiceProxy.getConnectionState(),
  devices: [],
  currentReading: null,
  isLive: false,
  deviceStatus: null,
  error: null,
};

const listeners = new Set<() => void>();
let staleDataTimer: ReturnType<typeof setTimeout> | null = null;

const update = (partial: Partial<BleSnapshot>) => {
  snapshot = { ...snapshot, ...partial };
  listeners.forEach((listener) => listener());
};

const clearStaleTimer = () => {
  if (staleDataTimer) {
    clearTimeout(staleDataTimer);
    staleDataTimer = null;
  }
};

BleServiceProxy.setOnStateChange((newState) => {
  if (newState !== 'Monitoring') {
    clearStaleTimer();
    update({ connectionState: newState, isLive: false });
  } else {
    update({ connectionState: newState });
  }
});

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => snapshot;

const scanForDevices = async () => {
  update({ devices: [], error: null });
  try {
    await BleServiceProxy.scanForDevices((device) => {
      // Prevent duplicates
      if (!snapshot.devices.find((d) => d.id === device.id)) {
        update({ devices: [...snapshot.devices, device] });
      }
    });
  } catch (e) {
    update({ error: e instanceof Error ? e.message : 'Unable to scan for devices.' });
  }
};

const stopScan = () => {
  BleServiceProxy.stopScan();
};

const connectToDevice = async (deviceId: string) => {
  update({ error: null });
  await BleServiceProxy.connectToDevice(deviceId);
};

const startMonitoring = () => {
  BleServiceProxy.startMonitoring(
    (reading) => {
      update({ currentReading: reading, isLive: true });

      // Reset the stale data timer
      clearStaleTimer();
      staleDataTimer = setTimeout(() => {
        staleDataTimer = null;
        update({ isLive: false });
      }, BLE_CONSTANTS.STALE_READING_TIMEOUT_MS);
    },
    (status) => {
      update({ deviceStatus: status });
    }
  );
};

const stopMonitoring = () => {
  BleServiceProxy.stopMonitoring();
  clearStaleTimer();
  update({ isLive: false });
};

const disconnect = async () => {
  clearStaleTimer();
  await BleServiceProxy.disconnect();
  update({ currentReading: null, isLive: false, deviceStatus: null });
};

const actions = {
  scanForDevices,
  stopScan,
  connectToDevice,
  disconnect,
  startMonitoring,
  stopMonitoring,
};

export const useBLE = () => {
  const state = useSyncExternalStore(subscribe, getSnapshot);
  return { ...state, ...actions };
};
