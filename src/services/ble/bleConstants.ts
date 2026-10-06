export const BLE_CONSTANTS = {
  // Flag to enable/disable mock mode
  MOCK_MODE: true, // Set to true by default for UI development

  // These will be provided by the hardware team later
  // Example standard Heart Rate UUIDs
  HEART_RATE_SERVICE_UUID: '0000180d-0000-1000-8000-00805f9b34fb',
  HEART_RATE_CHARACTERISTIC_UUID: '00002a37-0000-1000-8000-00805f9b34fb',
  
  // Stale data configuration
  STALE_READING_TIMEOUT_MS: 5000,
};
