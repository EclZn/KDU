import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { firebase_auth } from '../firebase';
import { OneSignal } from 'react-native-onesignal';
import { Dropdown } from 'react-native-element-dropdown';

const data = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
  { label: 'Option 3', value: '3' },
];

function Settings() {
  const [email, setEmail] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
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

      <Dropdown
        style={styles.dropdown}
        data={data}
        labelField="label"
        valueField="value"
        placeholder="Select an option"
        value={selectedOption}
        onChange={item => {
          setSelectedOption(item.value);
        }}
      />

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
  dropdown: {
    width: '50%',
    height: '6%',
    marginBottom: 20,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
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