import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootStackParamList } from './src/navigation/types';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { MonitoringScreen } from './src/screens/MonitoringScreen';
import { DebugScreen } from './src/screens/DebugScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Welcome"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen 
            name="Welcome" 
            component={WelcomeScreen} 
          />
          <Stack.Screen 
            name="Scan" 
            component={ScanScreen} 
          />
          <Stack.Screen 
            name="Monitoring" 
            component={MonitoringScreen} 
          />
          <Stack.Screen 
            name="Debug" 
            component={DebugScreen} 
            options={{ presentation: 'modal', headerShown: true, headerTitle: 'Developer Debug' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
