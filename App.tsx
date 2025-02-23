import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import Home from './components/Home';
import Settings from './components/Settings';
import Login from './components/Login';
import Blank from './components/Blank';
import { onAuthStateChanged, User } from 'firebase/auth';
import { firebase_auth } from './firebase';
import { LogLevel, OneSignal } from 'react-native-onesignal';
import Clients from './components/Clients';
import CompletedTask from './components/CompletedTask';
import Orders from './components/Orders';
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function DrawerNavigator() {
  return (
    <Drawer.Navigator initialRouteName="Servisler">
      <Drawer.Screen name="Tasks" component={Home} />
      <Drawer.Screen name="Profile" component={Blank} />
      <Drawer.Screen name="Clients" component={Clients} />
      <Drawer.Screen name="Settings" component={Settings} />
      <Drawer.Screen name="Done Tasks" component={CompletedTask} />
      <Drawer.Screen name="Orders" component={Orders} />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // OneSignal setup
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    OneSignal.initialize("39fff652-f0bc-4dcd-a264-50b549e04557");
    OneSignal.Notifications.requestPermission(true);
    OneSignal.Notifications.addEventListener('click', (event) => {
      console.log('OneSignal: notification clicked:', event);
    });
  }, []);

  useEffect(() => {
    // Check authentication state
    const unsubscribe = onAuthStateChanged(firebase_auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <Stack.Screen
            name="DrawerNavigator"
            component={DrawerNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    marginBottom: 10,
  },
});
