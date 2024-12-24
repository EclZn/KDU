import React, { useEffect, useState } from 'react';

import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import Home from './components/Home';
import Settings from './components/Settings';
import Login from './components/Login';
import { onAuthStateChanged, User } from 'firebase/auth';
import { firebase_auth } from './firebase';


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

export default function App(){
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    onAuthStateChanged(firebase_auth, (user) => {
      console.log('user', user);
      setUser(user);
    });
  }, []);
  
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {user ? (
          <Stack.Screen name="DrawerNavigator" component={DrawerNavigator} options={{headerShown:false}} />
        ) :
        (
        <Stack.Screen name="Login" component={Login} options={{headerShown:false}} />
        )
        }
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}

