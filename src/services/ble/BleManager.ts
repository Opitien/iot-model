import { BLE_CONSTANTS } from './bleConstants';
import { BleMockService } from './BleMockService';
import { RealBleService } from './BleService';

// For V1, we route through a proxy that checks MOCK_MODE
export const BleServiceProxy = BLE_CONSTANTS.MOCK_MODE ? BleMockService : RealBleService;
