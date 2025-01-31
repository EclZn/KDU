import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { firebase_auth, db } from '../firebase';
import { OneSignal } from 'react-native-onesignal';
import { Dropdown } from 'react-native-element-dropdown';
import { ref, onValue } from 'firebase/database';


function Settings() {
  const [email, setEmail] = useState('');
  const [users, setUsers] = useState<{ label: string; value: string }[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const auth = firebase_auth;

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email) {
      setEmail(currentUser.email);
    } else {
      Alert.alert('Error', 'No user is currently logged in.');
    }
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = Object.keys(data).map((key) => ({
          label: data[key].email, // Assuming your database has an 'email' field
          value: data[key].email,
        }));
        setUsers(userList);
      }
    });
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
        data={users}
        labelField="label"
        valueField="value"
        placeholder="Select an email"
        value={selectedEmail}
        onChange={(item) => setSelectedEmail(item.value)}
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