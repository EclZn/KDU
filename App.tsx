import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import Home from './components/Home';
import Settings from './components/Settings';
import Login from './components/Login';
import { onAuthStateChanged, User } from 'firebase/auth';
import { firebase_auth } from './firebase';
import { LogLevel, OneSignal } from 'react-native-onesignal';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function DrawerNavigator() {
  return (
    <Drawer.Navigator initialRouteName="Home">
      <Drawer.Screen name="Home" component={Home} />
      <Drawer.Screen name="Settings" component={Settings} />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Set up OneSignal
    
    OneSignal.Debug.setLogLevel(LogLevel.Verbose); // Enable debugging (optional)

    OneSignal.initialize("39fff652-f0bc-4dcd-a264-50b549e04557");

    // Request permissions for notifications
    OneSignal.Notifications.requestPermission(true);

    // Handle notification received
    OneSignal.Notifications.addEventListener('click', (event) => {
      console.log('OneSignal: notification clicked:', event);
    });


  },[]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebase_auth, (currentUser) => {
      console.log('user', currentUser);
      setUser(currentUser);
    });
    return () => unsubscribe(); // Clean up the subscription
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
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
