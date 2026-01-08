import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PersonalScreen from './src/screens/PersonalScreen';
import CreateWorkoutScreen from './src/screens/CreateWorkoutScreen';
import WorkoutLogScreen from './src/screens/WorkoutLogScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="CreateWorkout">
          <Stack.Screen name="Personal" component={PersonalScreen} />
          <Stack.Screen name="CreateWorkout" component={CreateWorkoutScreen} />
          <Stack.Screen name="LogWorkout" component={WorkoutLogScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
