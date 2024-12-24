import React from 'react';
import { View, Text, Button, TouchableOpacity,StyleSheet} from 'react-native';
import { firebase_auth } from '../firebase';


const Home = ({navigation}: any) => {
  return (
    <View style={styles.container}>
      <Text>List</Text>
      <TouchableOpacity style={styles.button} onPress={()=> navigation.navigate('Settings')} >
        <Text style={styles.buttonText}>Open Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={()=> firebase_auth.signOut()}>
        <Text style={styles.buttonText}>Sign out</Text>
      </TouchableOpacity>

    </View>
  )
}

export default Home

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