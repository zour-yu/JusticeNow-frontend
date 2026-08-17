import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';

const Stack = createNativeStackNavigator();

function LoadingScreen({ navigation }: any) {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text className="mt-6 text-xl font-semibold text-gray-800">JusticeNow</Text>
      <Text className="mt-2 text-sm text-gray-500 mb-8">Loading your experience...</Text>
      
      <TouchableOpacity 
        className="bg-indigo-600 px-6 py-3 rounded-xl shadow-sm"
        onPress={() => navigation.replace('Home')}
      >
        <Text className="text-white font-medium text-base">Skip Loading</Text>
      </TouchableOpacity>
    </View>
  );
}

function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50 px-6">
      <View className="bg-white p-8 rounded-2xl shadow-sm items-center w-full max-w-sm">
        <Text className="text-3xl font-bold text-gray-900 mb-3">Welcome</Text>
        <Text className="text-base text-gray-500 text-center mb-6">
          This is your temporary Home Screen while we build the authentication flow.
        </Text>
        <TouchableOpacity className="bg-indigo-600 px-8 py-3 rounded-xl shadow-sm w-full">
          <Text className="text-white font-medium text-base text-center">Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loading" component={LoadingScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
