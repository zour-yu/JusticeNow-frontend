import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/features/auth/screens/LoginScreen';
import RegisterScreen from './src/features/auth/screens/RegisterScreen';
import ForgotPasswordScreen from './src/features/auth/screens/ForgotPasswordScreen';
import PendingApprovalScreen from './src/features/auth/screens/PendingApprovalScreen';
import HomeScreen from './src/features/home/screens/HomeScreen';
import { SubmitComplaintScreen } from './src/features/complaints/screens/SubmitComplaintScreen';
import { MyComplaintsScreen } from './src/features/complaints/screens/MyComplaintsScreen';
import { ComplaintDetailScreen } from './src/features/complaints/screens/ComplaintDetailScreen';
import { ProfileScreen } from './src/features/profile/screens/ProfileScreen';
import PersonalInformationScreen from './src/features/profile/screens/PersonalInformationScreen';
import { AdminComplaintsListScreen } from './src/features/admin/screens/AdminComplaintsListScreen';
import { AdminComplaintReviewScreen } from './src/features/admin/screens/AdminComplaintReviewScreen';
import { AdminCategorizationListScreen } from './src/features/admin/screens/AdminCategorizationListScreen';
import { AdminCategorizationDetailScreen } from './src/features/admin/screens/AdminCategorizationDetailScreen';
import { AdminAssignInvestigatorScreen } from './src/features/admin/screens/AdminAssignInvestigatorScreen';
import { AdminInvestigatorApprovalScreen } from './src/features/admin/screens/AdminInvestigatorApprovalScreen';
import { AssignedCasesScreen } from './src/features/cases/screens/AssignedCasesScreen';
import { CaseDetailScreen } from './src/features/cases/screens/CaseDetailScreen';
import SecurityScreen from './src/features/profile/screens/SecurityScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="SubmitComplaint" component={SubmitComplaintScreen} />
          <Stack.Screen name="MyComplaints" component={MyComplaintsScreen} />
          <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
          <Stack.Screen name="AssignedCases" component={AssignedCasesScreen} />
          <Stack.Screen name="CaseDetail" component={CaseDetailScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="PersonalInformation" component={PersonalInformationScreen} />
          <Stack.Screen name="AdminComplaintsList" component={AdminComplaintsListScreen} />
          <Stack.Screen name="AdminComplaintReview" component={AdminComplaintReviewScreen} />
          <Stack.Screen name="AdminCategorizationList" component={AdminCategorizationListScreen} />
          <Stack.Screen name="AdminCategorizationDetail" component={AdminCategorizationDetailScreen} />
          <Stack.Screen name="AdminAssignInvestigator" component={AdminAssignInvestigatorScreen} />
          <Stack.Screen name="Security" component={SecurityScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
