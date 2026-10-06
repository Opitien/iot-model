import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useBLE } from '../hooks/useBLE';
import { BLE_CONSTANTS } from '../services/ble/bleConstants';

type Props = NativeStackScreenProps<RootStackParamList, 'Debug'>;

export const DebugScreen = ({ navigation }: Props) => {
  const { connectionState, currentReading, isLive, deviceStatus } = useBLE();

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <Text style={styles.text}>Mock Mode: {BLE_CONSTANTS.MOCK_MODE ? 'Enabled' : 'Disabled'}</Text>
          <Text style={styles.text}>HR Service UUID: {BLE_CONSTANTS.HEART_RATE_SERVICE_UUID}</Text>
          <Text style={styles.text}>HR Char UUID: {BLE_CONSTANTS.HEART_RATE_CHARACTERISTIC_UUID}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>State</Text>
          <Text style={styles.text}>Connection State: {connectionState}</Text>
          <Text style={styles.text}>Is Live Data: {isLive ? 'Yes' : 'No'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Reading Payload</Text>
          <Text style={styles.text}>
            {currentReading 
              ? JSON.stringify(currentReading, null, 2) 
              : 'No reading received yet.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Status</Text>
          <Text style={styles.text}>
            {deviceStatus 
              ? JSON.stringify(deviceStatus, null, 2) 
              : 'No status received yet.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 12,
  },
  text: {
    color: '#f1f5f9',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
});
