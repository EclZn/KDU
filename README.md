
# KDU
## A react-native cross platform Service Management App.  

KDU is a cross-platform mobile application built by using React Native framework. It is focused on task management among the users on the platform enabling users to create, edit, assign tasks with Image uploading functionality. Users can also deliver push notifications to notify about the progress of a certain task.

#### -Integrated OneSignal to send and receive push notifications.
#### -Used Firebase to maintain storage and database functionality.
---
### Prerequisites

Before starting, ensure you have the following installed:
-   **npm**
-   **Node.js**  (v16 or higher recommended)
  
-   **Android Studio**  (for Android emulator or device setup)
    
-   **Java Development Kit (JDK)**  (required for Android development)
    
-   **React Native CLI**  (install by using command-> ( `npm install -g react-native-cli`)

## How to Use
Clone the repository:
```bash
git clone https://github.com/EclZn/KDU.git
```
To start the application with React Native CLI,  First the required packages should be installed.
```bash
cd KDU
npm install
```
You can launch the app with android emulator using this command,
```bash
npx react-native run-android
```
React Native will try to find a suitable emulator and launch it on that specific device.

---
(Optional)
You can proceed with the same steps if you want to launch it on a physical device
-USB Debugging must be enabled on Android phones from Developer Options Menu.
-Allow access to phone data when prompted.

---
After the installation is done, simply enter the command to start the Metro server.
```bash
npx react-native start
```
Alternatively,
```bash
npm start
(npm start --reset-cache is preffered to prevent bugs between sessions)
```
Once the Metro server is running, you can press R to reload the application.
