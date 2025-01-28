import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, FlatList,Image } from 'react-native';
import { firebase_auth } from '../firebase';
import { db } from '../firebase';
import { ref, push, onValue, update, remove } from 'firebase/database';
import { ONESIGNAL_API_KEY, ONESIGNAL_APP_ID } from '@env' ;

interface Task {
  id: string;
  title: string;
  body: string;
  createdBy: string;
  assignedTo: string;
  dateTime: string;
  statusImage: string;
  lastEdited: string;
  editedBy: string;
}

const Home: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskBody, setTaskBody] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);

  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [users, setUsers] = useState<string[]>([]);
  const [assignedTo, setAssignedTo] = useState<string>('Unassigned');
  
  const [markAsDoneText, setMarkAsDoneText] = useState('Mark as Done');
  const [deleteText, setDeleteText] = useState('Delete Task');


  useEffect(() => {
    const tasksRef = ref(db, 'tasks');
    const unsubscribe = onValue(tasksRef, (snapshot) => {
      const data = snapshot.val();
      const taskList: Task[] = data
        ? Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }))
        : [];
        setTasks(taskList.reverse());
    });
    const usersRef = ref(db, `users/`);
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const userList = data
        ? Object.keys(data).map((key) => data[key].email) // Extract the email for each user
        : [];
      setUsers(userList);
    });
    return () => {
      unsubscribe();
      unsubscribeUsers();
    };
  }, []);

  const markTaskAsDone = async () => {
    if (!selectedTask || taskTitle.trim() === '') return;
    try {
      const taskRef = ref(db, `tasks/${selectedTask.id}`);
      await update(taskRef, { statusImage: 'done' });
      setTaskTitle('');
      setTaskBody('');
      setAssignedTo('');
      setTaskModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update task.');
    }
  };

  const addTask = async () => {
    if (taskTitle.trim() === '') {
      Alert.alert('Error', 'Task title cannot be empty.');
      return;
    }
  
    try {
      const currentUser = firebase_auth.currentUser;
  
      if (!currentUser || !currentUser.email) {
        Alert.alert('Error', 'User not logged in or email not available.');
        return;
      }
  
      const creatorEmail: string = currentUser.email; 
  
      const tasksRef = ref(db, 'tasks');

      const statusImage = assignedTo.trim() === '' ? 'default' : 'inProgress';

      await push(tasksRef, {
        title: taskTitle,
        body: taskBody,
        createdBy: creatorEmail,
        assignedTo: assignedTo,
        dateTime: new Date().toLocaleString(),
        statusImage: statusImage,
      });
  
      setTaskTitle('');
      setTaskBody('');
      setAssignedTo('');
      setModalVisible(false);
  
      sendNotification(assignedTo,taskTitle);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add task.');
    }
  };
  

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskBody(task.body);
    setAssignedTo(task.assignedTo);
    setTaskModalVisible(true);
  };

  const deleteTask = async () => {
    if (!selectedTask) return;

    try {
      const taskRef = ref(db, `tasks/${selectedTask.id}`);
      await remove(taskRef);
      Alert.alert('Task deleted', `${selectedTask.title} `);
      setTaskTitle('');
      setTaskBody('');
      setAssignedTo('');
      setTaskModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to delete task.');
    }
  };

  const editTask = async () => {
    if (!selectedTask || taskTitle.trim() === '') return;

    const statusImage = assignedTo.trim() === '' ? 'default' : 'inProgress';
    
    const currentUser = firebase_auth.currentUser;
  
      if (!currentUser || !currentUser.email) {
        Alert.alert('Error', 'User not logged in or email not available.');
        return;
      }
  
      const creatorEmail: string = currentUser.email; 

    try {
      const taskRef = ref(db, `tasks/${selectedTask.id}`);
      await update(taskRef, { 
        title: taskTitle,
        body: taskBody, 
        assignedTo: assignedTo,
        statusImage: statusImage,
        lastEdited:new Date().toLocaleString(),
        editedBy: creatorEmail });

      Alert.alert('Success', 'Task updated successfully!');
      setTaskTitle('');
      setTaskBody('');
      setAssignedTo('');
      setTaskModalVisible(false);
      sendNotification(assignedTo,taskTitle);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update task.');
    }
  };

  const sendNotification = async (receiver: string, taskTitle:string) => {
      const apiKey = ONESIGNAL_API_KEY; // Replace with the OneSignal API Key
      const appId = ONESIGNAL_APP_ID; // Replace with the OneSignal App ID, not Device OneSignal App ID
  
      // Sends notification to specific user if receiver is provided, else sends to all users

      if(receiver)
      {
        const notificationData = {
          target_channel: "push",
         include_aliases: {
          "external_id": [
            receiver,
          ]
        },
          app_id: appId,
          contents: {
            en: taskTitle,
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
      }
      else
      {
      const notificationData = {
        target_channel: "push",
        included_segments: ["Total Subscriptions"],
        app_id: appId,
        contents: {
          en: taskTitle,
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
    }
    };

    const renderItem = ({ item }: { item: Task }) => (
      <TouchableOpacity onPress={() => handleTaskPress(item)} style={styles.taskItem}>
        <View style={styles.taskContainer}>
          <Text style={styles.taskTitle}>{item.title}</Text>
        </View>
        <View style={styles.line} />
        <View>
          <Text style={styles.taskBody}>{item.body}</Text>
        </View>
        <View style={styles.row}>
          {/* Left Column: Text */}
          <View style={styles.textColumn}>
            <Text style={styles.taskTimestamp}>Creator         ● {item.createdBy}</Text>
            {item.assignedTo && (
              <> 
              <Text style={styles.taskTimestamp}>Assigned to ● {item.assignedTo}</Text>
              </>)}
            <View style={styles.assignedToContainer}>
              <Text style={styles.taskTimestamp}>Created on   ● {item.dateTime}</Text>
            </View>
            {/*Conditionally render */}
            {item.editedBy && item.lastEdited && (
                 <>
                   <Text style={styles.taskTimestamp}>Edited by ● {item.editedBy}</Text>
                   <Text style={styles.taskTimestamp}>Edited on ● {item.lastEdited}</Text>
                 </>
               )}
          </View>
          {/* Right Column: Image */}
          <View style={styles.imageColumn}>
          <Image 
          source={
            item.statusImage === 'inProgress' 
              ? require('../assets/images/mechanic.png') 
              : item.statusImage === 'done' 
              ? require('../assets/images/tick.png') 
              : require('../assets/images/zzz.png')
          } 
          style={styles.icon} 
        />
          </View>
        </View>
      </TouchableOpacity>
    );
  
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>Add Task</Text>
      </TouchableOpacity>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />

      {/* Add Task Modal */}
      <Modal
  animationType="fade"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => {setModalVisible(false),setAssignedTo('');}}
        hitSlop={{ top: 10, bottom: 100, left: 10, right: 10 }}
      >
        <Text style={styles.closeButtonText}>X</Text>
      </TouchableOpacity>
      <Text></Text>

      <Text style={styles.text}>Task Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter task title"
        placeholderTextColor="#888"
        value={taskTitle}
        onChangeText={setTaskTitle}
      />
      <Text style={styles.text}>Task Body</Text>
      <TextInput
        style={[styles.input, { verticalAlign: 'top', height: 100 }]}
        placeholder="Enter task body"
        placeholderTextColor="#888"
        value={taskBody}
        onChangeText={setTaskBody}
        multiline
      />
      
      <Text style={styles.text}>Select User</Text>
      <FlatList
        data={users}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => setAssignedTo(item)} // Set the selected email as the assigned user
          >
            <Text style={styles.userEmail}>{item}</Text>
                  <View style={styles.line} />

          </TouchableOpacity>
        )}
      />
      <Text style={[styles.text]}>Selected:</Text>
      <Text style={[styles.text, { color: '#888' }]}>{assignedTo}</Text>
      <TouchableOpacity style={styles.button} onPress={addTask}>
        <Text style={styles.buttonText}>Add Task</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


        {/* Edit Task Modal */}
        <Modal
  animationType="fade"
  transparent={true}
  visible={taskModalVisible}
  onRequestClose={() => {
    setTaskModalVisible(false);
    setTaskTitle('');
    setTaskBody('');
    setMarkAsDoneText('Mark as Done'); 
  }}      
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => {
          setTaskModalVisible(false);
          setTaskTitle('');
          setTaskBody('');
          setAssignedTo('');
          setDeleteText('Delete Task');
          setMarkAsDoneText('Mark as Done');
        }}
        hitSlop={{ top: 10, bottom: 50, left: 50, right: 10 }}
      >
        <Text style={styles.closeButtonText}>X</Text>
      </TouchableOpacity>
      <Text></Text>
      <Text style={styles.text}>Edit task title</Text>
      <TextInput
        style={styles.input}
        placeholder="Edit task title"
        value={taskTitle}
        onChangeText={setTaskTitle}
      />
      <Text style={styles.text}>Edit task body</Text>
      <TextInput
        style={[styles.input, { verticalAlign: 'top', height: 100 }]}
        placeholder="Edit task body"
        value={taskBody}
        onChangeText={setTaskBody}
      />

      {/* User selection part in Edit Modal */}
      <Text style={styles.text}>Select User</Text>
      <FlatList
        data={users}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => setAssignedTo(item)} // Set the selected email as the assigned user
          >
            <Text style={styles.userEmail}>{item}</Text>
            <View style={styles.line} />
          </TouchableOpacity>
        )}
      />
      <Text style={styles.text}>Selected:</Text>
      <Text style={[styles.text, { color: '#888' }]}>{assignedTo}</Text>


      {/* Mark as Done Button */}
      <TouchableOpacity
        style={[styles.button, styles.button,{backgroundColor:'green'}]}
        onPress={() => {
          if (markAsDoneText === 'Mark as Done') {
            setMarkAsDoneText('Are you sure?');
          } else {
            markTaskAsDone(); // Trigger the function
            setMarkAsDoneText('Mark as Done'); // Reset the button text
          }
        }}
      >
        <Text style={styles.buttonText}>{markAsDoneText}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={editTask}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.cancelButton]}
        onPress={() => {
          if (deleteText === 'Delete Task') {
            setDeleteText('Are you sure?');
          } else {
            deleteTask(); // Trigger the function
            setDeleteText('Delete Task'); // Reset the button text
          }
        }}
      >
        <Text style={styles.buttonText}>{deleteText}</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


    </View>
  );
};

export default Home;

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
    fontSize: 15,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 3,
    elevation: 5,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF6347',
    borderRadius: 5,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    marginTop: 20,
  },
  taskItem: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  taskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  line: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 5,
  },
  taskBody: {
    fontSize: 14,
    color: '#555',
  },
  taskTimestamp: {
    fontSize: 12,
    color: '#888',
  },
  assignedToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#FF6347',
  },
  userItem: {
    padding: 3,
    marginVertical: 3,
  },
  userEmail: {
    fontSize: 14,
    color: '#333',
  },
  icon: {
    width: 50, // Image width
    height: 50, // Image height
    resizeMode: 'contain', // Ensures the image maintains its aspect ratio
  },
  imageColumn: {
    width: 50, // Adjust to the size of the image
    alignItems: 'center', // Centers the image horizontally
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
    paddingRight: 10, // Adds spacing between text and image
  },
});
