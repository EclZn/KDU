import React from 'react';
import { View, Text, TouchableOpacity ,StyleSheet,Alert} from 'react-native';
import { firebase_auth } from '../firebase';
import { ONESIGNAL_API_KEY, ONESIGNAL_APP_ID } from '@env' ;
import { OneSignal } from 'react-native-onesignal';

function Settings() {


const sendNotification = async () => {
    const apiKey = ONESIGNAL_API_KEY; // Replace with the OneSignal API Key
    const appId = ONESIGNAL_APP_ID; // Replace with the OneSignal App ID, not Device OneSignal App ID

    // Sets an external id for the users device, then sends notification with include_aliases targeting the external id, include_segments targeting a segment list of users.

    
    const notificationData = {
      target_channel: "push",
     // included_segments: ["TestSegment"],
     include_aliases: {
      "external_id": [
        "test@test.com",
      ]
    },
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
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Settings Screen</Text>
      <TouchableOpacity style={styles.button} onPress={()=> firebase_auth.signOut()}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={sendNotification}>
              <Text style={styles.buttonText}>Send Notification</Text>
            </TouchableOpacity>      
    </View>
  );
}

export default Settings


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
  }
});