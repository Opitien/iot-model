import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useBLE } from '../hooks/useBLE';
import { WearableDevice } from '../services/ble/bleTypes';

type Props = NativeStackScreenProps<RootStackParamList, 'Scan'>;

export const ScanScreen = ({ navigation }: Props) => {
  const { scanForDevices, stopScan, connectToDevice, devices, connectionState, error: scanError } = useBLE();
  const [connectError, setConnectError] = useState<string | null>(null);
  const errorMsg = connectError ?? scanError;

  useEffect(() => {
    scanForDevices();
    return () => {
      stopScan();
    };
  }, [scanForDevices, stopScan]);

  const handleConnect = async (deviceId: string) => {
    try {
      setConnectError(null);
      await connectToDevice(deviceId);
      navigation.replace('Monitoring', { deviceId });
    } catch (e) {
      setConnectError('Unable to connect. Please make sure the wearable is powered on and nearby.');
    }
  };

  const renderItem = ({ item }: { item: WearableDevice }) => (
    <TouchableOpacity 
      style={styles.deviceCard}
      onPress={() => handleConnect(item.id)}
      disabled={connectionState === 'Connecting'}
    >
      <View>
        <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
        <Text style={styles.deviceId}>{item.id}</Text>
      </View>
      <Text style={styles.connectText}>Connect</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Wearables</Text>
        {connectionState === 'Scanning' && <ActivityIndicator color="#0f172a" />}
      </View>

      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity
            onPress={() => {
              setConnectError(null);
              scanForDevices();
            }}
          >
            <Text style={styles.retryText}>Retry Scan</Text>
          </TouchableOpacity>
        </View>
      )}

      {connectionState === 'Connecting' && (
        <View style={styles.connectingContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.connectingText}>Connecting to wearable...</Text>
        </View>
      )}

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          connectionState === 'Scanning' ? null : (
            <Text style={styles.emptyText}>No devices found.</Text>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  listContainer: {
    padding: 16,
  },
  deviceCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  deviceId: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  connectText: {
    color: '#0284c7',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#b91c1c',
    marginBottom: 8,
  },
  retryText: {
    color: '#0284c7',
    fontWeight: '600',
  },
  connectingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  connectingText: {
    marginTop: 16,
    color: '#475569',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 32,
  },
});
