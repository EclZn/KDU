import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { firebase_auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import {LogLevel,OneSignal} from 'react-native-onesignal';

declare var alert: (message?: any) => void;


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = firebase_auth;

  
  const signIn = async () => {
    setLoading(true);
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in response:', response);
  
  
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
    }finally{
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <TextInput style={styles.input} 
      placeholder="Email" 
      autoCapitalize='none' 
      value={email} 
      onChangeText={(text)=>setEmail(text)} />

      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        secureTextEntry ={true}
        value={password}
        onChangeText={(text)=>setPassword(text)}
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
  },
  text: {
    fontSize: 18,
    color: '#333',
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
});