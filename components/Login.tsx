import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert,Modal } from 'react-native';
import { firebase_auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword ,sendPasswordResetEmail} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase';
import { ref, set ,get} from 'firebase/database';
import { OneSignal } from 'react-native-onesignal';

declare var alert: (message?: any) => void;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const auth = firebase_auth;

  const handleResetPassword = () => {
    if (!resetEmail) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }
    sendPasswordResetEmail(auth, resetEmail)
      .then(() => {
        Alert.alert('Success', 'Password reset link sent to your email.');
        setIsModalVisible(false);
      })
      .catch((error) => {
        console.error(error);
        Alert.alert('Error', 'Failed to send password reset email. Please try again.');
      });
  };

  const saveUserToDatabase = async (userEmail: string) => {
    try {
      const userRef = ref(db, `users/${auth.currentUser?.uid}`);
      const userSnapshot = await get(userRef);
      
      // Check if the user already exists in the database
      if (userSnapshot.exists()) {
        console.log('User already exists in the database');
        return; // User already exists, skip saving
      }
  
      // If the user doesn't exist, save them
      await set(userRef, {
        email: userEmail,
        uid: auth.currentUser?.uid,
      });
      console.log('User saved to the database');
    } catch (error) {
      console.error('Failed to save user to database:', error);
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
        placeholder="E-posta"
        placeholderTextColor="#888"
        autoCapitalize="none"
        value={email}
        onChangeText={(text) => setEmail(text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Şifre"
        placeholderTextColor="#888"
        secureTextEntry={true}
        value={password}
        onChangeText={(text) => setPassword(text)}
        autoCapitalize="none"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={signIn}>
            <Text style={styles.buttonText}>Giriş Yap</Text>
          </TouchableOpacity>
          {/* 
          <TouchableOpacity style={styles.button} onPress={signUp}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
          */}
        </>
      )}

      <View style={styles.rememberMeContainer}>
        <TouchableOpacity onPress={toggleRememberMe} style={styles.rememberMeButton}>
          <Text style={[styles.rememberMeText, rememberMe && styles.buttonTextActive]}>
            {rememberMe ? "☒" : "☐"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.rememberMeText}>Beni hatırla</Text>
      </View>
                  <TouchableOpacity style={[{ marginLeft:120,marginTop:30 }]} onPress={()=> setIsModalVisible(true)}>
                    <Text style={[{color:'#888'}]}>Şifremi unuttum ?</Text>
                  </TouchableOpacity>  
      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Şifreyi sıfırla</Text>
            <TextInput
              style={styles.input}
              placeholder="E-posta "
              placeholderTextColor="#888"
              autoCapitalize="none"
              value={resetEmail}
              onChangeText={(text) => setResetEmail(text)}
            />
            <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
              <Text style={styles.buttonText}>E-posta gönder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#f44336' }]}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.buttonText}>İptal et</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
});
