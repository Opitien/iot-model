import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useBLE } from '../hooks/useBLE';

type Props = NativeStackScreenProps<RootStackParamList, 'Monitoring'>;

export const MonitoringScreen = ({ navigation }: Props) => {
  const { 
    connectionState, 
    currentReading, 
    isLive, 
    deviceStatus, 
    startMonitoring, 
    stopMonitoring,
    disconnect
  } = useBLE();
  
  const [sessionDuration, setSessionDuration] = useState(0);

  // Start once when the screen opens. Leaving the screen (Disconnect button or
  // back navigation) stops monitoring and disconnects so the device isn't left connected.
  useEffect(() => {
    startMonitoring();
    return () => {
      stopMonitoring();
      disconnect();
    };
  }, [startMonitoring, stopMonitoring, disconnect]);

  useEffect(() => {
    if (connectionState !== 'Monitoring' || !isLive) return;
    const id = setInterval(() => {
      setSessionDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [connectionState, isLive]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    stopMonitoring();
  };
  
  const handleStart = () => {
    startMonitoring();
  };

  const handleDisconnect = async () => {
    await disconnect();
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Debug')} onLongPress={() => navigation.navigate('Debug')}>
          <Text style={styles.headerTitle}>Heart Monitor</Text>
        </TouchableOpacity>
        <View style={styles.statusBadge}>
          <View style={[
            styles.statusDot, 
            { backgroundColor: connectionState === 'Monitoring' || connectionState === 'Connected' ? '#10b981' : '#ef4444' }
          ]} />
          <Text style={styles.statusText}>{connectionState}</Text>
        </View>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.readingContainer}>
          <View style={styles.iconContainer}>
            <Heart 
              size={48} 
              color={isLive ? '#e11d48' : '#94a3b8'} 
              fill={isLive ? '#e11d48' : 'none'}
            />
          </View>
          <Text style={styles.bpmValue}>
            {currentReading ? currentReading.bpm : '--'}
          </Text>
          <Text style={styles.bpmLabel}>BPM</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Status</Text>
          <Text style={[styles.infoValue, !isLive && styles.staleText]}>
            {isLive ? 'Live data' : (currentReading ? 'No live reading' : 'Waiting for data')}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={[styles.infoBox, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.infoLabel}>Signal Quality</Text>
            <Text style={styles.infoValue}>
              {deviceStatus?.signalQuality || '--'}
            </Text>
          </View>
          <View style={[styles.infoBox, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.infoLabel}>Monitoring Duration</Text>
            <Text style={styles.infoValue}>{formatDuration(sessionDuration)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        {connectionState === 'Monitoring' ? (
          <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
            <Text style={styles.stopButtonText}>Stop Monitoring</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>Start Monitoring</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
          <Text style={styles.disconnectButtonText}>Disconnect</Text>
        </TouchableOpacity>
      </View>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  mainContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  readingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    marginBottom: 16,
  },
  bpmValue: {
    fontSize: 96,
    fontWeight: '300',
    color: '#0f172a',
    includeFontPadding: false,
  },
  bpmLabel: {
    fontSize: 24,
    fontWeight: '600',
    color: '#64748b',
    marginTop: -8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  infoBox: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  staleText: {
    color: '#f59e0b',
  },
  footer: {
    padding: 24,
  },
  stopButton: {
    backgroundColor: '#e11d48',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  stopButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disconnectButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  disconnectButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
});
