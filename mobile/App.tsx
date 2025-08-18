import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

import HomeScreen from './src/screens/HomeScreen';
import FocusScreen from './src/screens/FocusScreen';
import JournalScreen from './src/screens/JournalScreen';
import StatsScreen from './src/screens/StatsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName: string;
                  
                  switch (route.name) {
                    case 'Home':
                      iconName = 'home';
                      break;
                    case 'Focus':
                      iconName = 'clock';
                      break;
                    case 'Journal':
                      iconName = 'book-open';
                      break;
                    case 'Stats':
                      iconName = 'bar-chart-2';
                      break;
                    case 'Profile':
                      iconName = 'user';
                      break;
                    default:
                      iconName = 'circle';
                  }
                  
                  return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#6366f1',
                tabBarInactiveTintColor: '#9ca3af',
                tabBarStyle: {
                  backgroundColor: '#ffffff',
                  borderTopWidth: 1,
                  borderTopColor: '#e5e7eb',
                  paddingBottom: 8,
                  paddingTop: 8,
                  height: 70,
                },
                headerShown: false,
              })}
            >
              <Tab.Screen name="Home" component={HomeScreen} />
              <Tab.Screen name="Focus" component={FocusScreen} />
              <Tab.Screen name="Journal" component={JournalScreen} />
              <Tab.Screen name="Stats" component={StatsScreen} />
              <Tab.Screen name="Profile" component={ProfileScreen} />
            </Tab.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}