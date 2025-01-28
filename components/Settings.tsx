import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { firebase_auth } from '../firebase';
import { OneSignal } from 'react-native-onesignal';
import { Picker } from '@react-native-picker/picker';

function Settings() {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
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

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Select an Option:</Text>
        <Picker
          selectedValue={selectedValue}
          onValueChange={(itemValue) => setSelectedValue(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Done" value="done" />
          <Picker.Item label="Not Assigned" value="not_assigned" />
          <Picker.Item label="Assigned" value="assigned" />
        </Picker>
      </View>

      <TouchableOpacity style={styles.button} onPress={NotificationPermission}>
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
  pickerContainer: {
    marginBottom: 20,
    width: '80%',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  picker: {
    height: 50,
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
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
});
