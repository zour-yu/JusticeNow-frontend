import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/features/auth/screens/LoginScreen';
import RegisterScreen from './src/features/auth/screens/RegisterScreen';
import PendingApprovalScreen from './src/features/auth/screens/PendingApprovalScreen';
import HomeScreen from './src/features/home/screens/HomeScreen';
import { SubmitComplaintScreen } from './src/features/complaints/screens/SubmitComplaintScreen';
import { MyComplaintsScreen } from './src/features/complaints/screens/MyComplaintsScreen';
import { ComplaintDetailScreen } from './src/features/complaints/screens/ComplaintDetailScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SubmitComplaint" component={SubmitComplaintScreen} />
        <Stack.Screen name="MyComplaints" component={MyComplaintsScreen} />
        <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
