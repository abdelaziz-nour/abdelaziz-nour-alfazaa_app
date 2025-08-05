'use client';

import {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Alert} from 'react-native';
import {VehicleProvider} from './src/context/VehicleContext';
import IntakeFormScreen from './src/screens/IntakeFormScreen';
import VehicleBodyScreen from './src/screens/VehicleBodyScreen';
import NotesSignatureScreen from './src/screens/NotesSignatureScreen';
import DatabaseService from './src/services/DatabaseService';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    // Initialize database when app starts
    const initApp = async () => {
      try {
        await DatabaseService.initDatabase();
        console.log('Database initialized successfully');
        console.log('App initialized successfully');
      } catch (error) {
        console.error('App initialization error:', error);
        Alert.alert('Error', 'Failed to initialize app database');
      }
    };

    initApp();
  }, []);

  return (
    <VehicleProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="IntakeForm"
          screenOptions={{
            headerStyle: {backgroundColor: '#d2de24'},
            headerTintColor: '#000',
            headerTitleStyle: {fontWeight: 'bold'},
            headerTitleAlign: 'center',
          }}>
          <Stack.Screen
            name="IntakeForm"
            component={IntakeFormScreen}
            options={{title: 'Vehicle Intake - Alfazaa Company'}}
          />
          <Stack.Screen
            name="VehicleBody"
            component={VehicleBodyScreen}
            options={{title: 'Vehicle Inspection'}}
          />
          <Stack.Screen
            name="NotesSignature"
            component={NotesSignatureScreen}
            options={{title: 'Notes & Signature'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </VehicleProvider>
  );
}
