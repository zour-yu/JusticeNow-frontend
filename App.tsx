import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SubmitComplaintScreen } from './src/features/complaints/screens/SubmitComplaintScreen';
import { MyComplaintsScreen } from './src/features/complaints/screens/MyComplaintsScreen';
import { ComplaintDetailScreen } from './src/features/complaints/screens/ComplaintDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CitizenHomeScreen({ navigation }: any) {
  return (
    <View style={styles.homeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0B132B" />
      
      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>⚖️ JUSTICE NOW</Text>
        </View>
        <Text style={styles.heroTitle}>Human Rights Case Tracking System</Text>
        <Text style={styles.heroSubtitle}>
          Empowering citizens to report violations, track investigations in real-time, and ensure institutional accountability.
        </Text>

        <View style={styles.heroActionRow}>
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => navigation.navigate('SubmitTab')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionText}>＋ File New Complaint</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Action Tiles */}
      <View style={styles.tilesGrid}>
        <TouchableOpacity
          style={styles.tile}
          onPress={() => navigation.navigate('ComplaintsTab')}
          activeOpacity={0.8}
        >
          <Text style={styles.tileIcon}>📑</Text>
          <Text style={styles.tileTitle}>Track My Cases</Text>
          <Text style={styles.tileDescription}>
            View status updates, review timelines, and follow investigation progress.
          </Text>
          <Text style={styles.tileLink}>View Case History →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tile}
          onPress={() => navigation.navigate('SubmitTab')}
          activeOpacity={0.8}
        >
          <Text style={styles.tileIcon}>🔒</Text>
          <Text style={styles.tileTitle}>Anonymous Reporting</Text>
          <Text style={styles.tileDescription}>
            Report incidents with end-to-end identity protection and safe reference codes.
          </Text>
          <Text style={styles.tileLink}>Submit Anonymously →</Text>
        </TouchableOpacity>
      </View>

      {/* Trust & Safety Info */}
      <View style={styles.trustBanner}>
        <Text style={styles.trustIcon}>🛡️</Text>
        <View style={styles.trustTextWrap}>
          <Text style={styles.trustTitle}>Citizen Protection Standard</Text>
          <Text style={styles.trustSubtitle}>
            Every report is logged with an immutable audit timeline and assigned to verified human rights officers.
          </Text>
        </View>
      </View>
    </View>
  );
}

function CitizenTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1C2541',
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: '#0B132B',
          borderTopColor: '#1C2541',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#60A5FA',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={CitizenHomeScreen}
        options={{
          title: 'Home',
          headerTitle: 'Justice Now',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="SubmitTab"
        component={SubmitComplaintScreen}
        options={{
          title: 'Report Violation',
          headerTitle: 'Submit Human Rights Complaint',
          tabBarLabel: 'Report',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📝</Text>,
        }}
      />
      <Tab.Screen
        name="ComplaintsTab"
        component={MyComplaintsScreen}
        options={{
          title: 'My Complaints',
          headerTitle: 'Case Tracking',
          tabBarLabel: 'My Cases',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📊</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1C2541',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: '700',
            },
          }}
        >
          <Stack.Screen
            name="MainTabs"
            component={CitizenTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SubmitComplaint"
            component={SubmitComplaintScreen}
            options={{ title: 'Report Violation' }}
          />
          <Stack.Screen
            name="ComplaintDetail"
            component={ComplaintDetailScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    backgroundColor: '#0B132B',
    padding: 16,
  },
  heroCard: {
    backgroundColor: '#1C2541',
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3A506B',
  },
  logoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0B132B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3A506B',
  },
  logoBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 18,
  },
  heroActionRow: {
    flexDirection: 'row',
  },
  primaryActionBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  tilesGrid: {
    gap: 12,
    marginBottom: 16,
  },
  tile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tileIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  tileTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  tileDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  tileLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C2541',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3A506B',
  },
  trustIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  trustTextWrap: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  trustSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
  },
});
