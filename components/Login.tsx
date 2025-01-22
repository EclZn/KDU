import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { firebase_auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase';
import { ref, set } from 'firebase/database';
import { OneSignal } from 'react-native-onesignal';

declare var alert: (message?: any) => void;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const auth = firebase_auth;

  const saveUserToDatabase = async (userEmail: string) => {
    try {
      const userRef = ref(db, `users/${auth.currentUser?.uid}`);
      await set(userRef, {
        email: userEmail,
        uid: auth.currentUser?.uid,
      });
    } catch (error) {
      console.error("Failed to save user to database:", error);
    }
  };

  const signIn = async () => {
    setLoading(true);
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in response:', response);

      if (rememberMe) {
        await AsyncStorage.setItem('email', email);
        await AsyncStorage.setItem('password', password);
      } else {
        await AsyncStorage.removeItem('email');
        await AsyncStorage.removeItem('password');
      }
      
      OneSignal.login(email);

      // Save user to the database
      await saveUserToDatabase(email);

    } catch (error: any) {
      console.error(error);
      alert('Sign in failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    setLoading(true);
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);
      console.log(response);
      alert('Check your emails');
    } catch (error: any) {
      console.log(error);
      alert('Sign up failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  useEffect(() => {
    const loadEmail = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('email');
        const storedPassword = await AsyncStorage.getItem('password');
        if (storedEmail && storedPassword) {
          setEmail(storedEmail);
          setPassword(storedPassword);
          setRememberMe(true);
        }
      } catch (error) {
        console.error("Failed to load email", error);
      }
    };
    loadEmail();
  }, []);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        autoCapitalize="none"
        value={email}
        onChangeText={(text) => setEmail(text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry={true}
        value={password}
        onChangeText={(text) => setPassword(text)}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={signIn}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={signUp}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.rememberMeContainer}>
        <TouchableOpacity onPress={toggleRememberMe} style={styles.rememberMeButton}>
          <Text style={[styles.rememberMeText, rememberMe && styles.buttonTextActive]}>
            {rememberMe ? "☒" : "☐"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.rememberMeText}>Remember Me</Text>
      </View>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    color: '#000',
  },
  text: {
    fontSize: 18,
    color: '#888',
  },
  button: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  rememberMeButton: {
    marginRight: 10,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  rememberMeText: {
    fontSize: 15,
    marginRight: 5,
  },
  buttonTextActive: {
    color: 'green',
  },
});
