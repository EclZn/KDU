import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { firebase_auth, db } from '../firebase';
import { OneSignal } from 'react-native-onesignal';


function Settings() {
  const [email, setEmail] = useState('');


  const auth = firebase_auth;

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email) {
      setEmail(currentUser.email);
    } else {
      Alert.alert('Error', 'No user is currently logged in.');
    }
    
  }, []);

  const NotificationPermission = () => {
    OneSignal.Notifications.requestPermission(true);
    OneSignal.login(email);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>
      <TouchableOpacity style={[styles.button,{backgroundColor:'#73706f'}]} onPress={NotificationPermission}>
        <Text style={styles.buttonText}>Notifications Permission</Text>
      </TouchableOpacity>
    </View>
  );
}

export default Settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    padding: 12,
    backgroundColor: '#007BFF',
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  dropdown: {
    width: '70%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
  },
});