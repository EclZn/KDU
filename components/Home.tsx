import React from 'react';
import { View, Text, Button, TouchableOpacity,StyleSheet,Alert} from 'react-native';
import { firebase_auth } from '../firebase';


const Home = ({navigation}: any) => {
  const sendNotification = async () => {
    const apiKey = "os_v2_app_hh77muxqxrg43itekc2utycfk7ctv7374etun4fvmas567hxrj2yyrlbepcqnfxxe6ltunbvujrr7j2uqkp5mdpa2zzjvhgq66mawdi"; // Replace with your OneSignal API Key
    const appId = "39fff652-f0bc-4dcd-a264-50b549e04557"; // Replace with your OneSignal App ID

    const notificationData = {
      target_channel: "push",
      included_segments: ["Total Subscriptions"],
      app_id: appId,
      contents: {
        en: "Hello, world",
      },

    };
    try {
      const response = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${apiKey}`,
        },
        body: JSON.stringify(notificationData),
      });

      if (response.ok) {
        const responseData = await response.json();
        Alert.alert("Success", "Notification sent successfully!");
        console.log(responseData);
      } else {
        Alert.alert("Error", `Failed to send notification: ${response.status}`);
        console.error(await response.text());
      }
    } catch (error: unknown) {
      // Type guard for error
      if (error instanceof Error) {
        Alert.alert("Error", `An error occurred: ${error.message}`);
        console.error(error.message);
      } else {
        Alert.alert("Error", "An unknown error occurred");
        console.error("Unknown error:", error);
    }
  }
  };

  return (
    <View style={styles.container}>
      <Text>List</Text>
      <TouchableOpacity style={styles.button} onPress={()=> navigation.navigate('Settings')} >
        <Text style={styles.buttonText}>Open Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={()=> firebase_auth.signOut()}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={sendNotification}>
        <Text style={styles.buttonText}>Send Notification</Text>
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