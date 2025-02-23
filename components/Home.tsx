import React, { useState, useEffect, lazy } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, FlatList,Image, ScrollView, ActivityIndicator } from 'react-native';
import { firebase_auth } from '../firebase';
import { db } from '../firebase';
import { ref, push, onValue, update, remove } from 'firebase/database';
import { ONESIGNAL_API_KEY, ONESIGNAL_APP_ID } from '@env' ;
import { Dropdown } from 'react-native-element-dropdown';
import { launchImageLibrary } from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, listAll,uploadBytes } from "firebase/storage";
import { firebase_storage } from '../firebase'; 


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
  client:string;
  taskComplete:string;
  selectedEmail:string;
  assignedToNote:string;
  imageUrls:string[];
}



const Home: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskBody, setTaskBody] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignedToNote, setAssignedToNote] = useState('');

  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [assignedTo, setAssignedTo] = useState<string>('Unassigned');
  
  const [markAsDoneText, setMarkAsDoneText] = useState('Tamamlandı olarak işaretle');

  const [selectedOption, setSelectedOption] = useState(null);
  
  const [usersDropdown, setUsersDropdown] = useState<{ label: string; value: string }[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [clientListDropdown, setClientListDropdown] = useState<{ label: string; value: string }[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  
  const [authorizedUser, setAuthorizedUser] = useState<boolean>(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null); 

  const [isLoading, setIsLoading] = useState(false);
  const [newTaskImages, setNewTaskImages] = useState<string[]>([]);
  
  useEffect(() => {
    const currentUser = firebase_auth.currentUser;
    if (currentUser) {
      const usersRef = ref(db, `users/${currentUser.uid}`);
      onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.isAuthorized) {
          setAuthorizedUser(true); // Set to true if the user has the isAuthorized property
        } else {
          setAuthorizedUser(false); // Set to false if the user doesn't have the isAuthorized property
        }
      });
    }
  }, []);
  
  useEffect(() => {
    const usersRef = ref(db, 'clients');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const clientListDropdown: { label: string; value: string }[] = Object.keys(data).map((key) => ({
          label: data[key].name, 
          value: data[key].name,
        }));
        setClientListDropdown(clientListDropdown); 
      }
    });
  }, []);

  useEffect(() => {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userListDropdown: { label: string; value: string;}[] = Object.keys(data).map((key) => ({
          label: data[key].email, 
          value: data[key].email,
        }));
        setUsersDropdown(userListDropdown); 
      }
    });
  }, []);
  

  useEffect(() => {
    const tasksRef = ref(db, 'tasks');
const unsubscribe = onValue(tasksRef, (snapshot) => {
  const data = snapshot.val();
  let taskList: Task[] = data
    ? Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }))
      .filter((task) => task.deleted !== 'deleted' && task.statusImage !== 'done')
         
      : [];


  // Filtering logic based on the dropdown selection
    if (selectedOption === '2') {
    // Show only ongoing tasks
    taskList = taskList.filter((task) => task.statusImage === 'inProgress');
  } else if (selectedOption === '3') {
    // Show only not assigned tasks (assuming tasks with no assignedTo are "not assigned")
    taskList = taskList.filter((task) => task.statusImage === '');
  }
  

  setTasks(taskList.reverse());
});
    const usersRef = ref(db, `users/`);
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const userList = data
        ? Object.keys(data).map((key) => data[key].email) // Extract the email for each user
        : [];
    });
    return () => {
      unsubscribe();
      unsubscribeUsers();
    };
  }, [selectedOption]);

  const markTaskAsDone = async () => {
    if (!selectedTask || taskTitle.trim() === '') return;
    try {
      const taskRef = ref(db, `tasks/${selectedTask.id}`);
      await update(taskRef, { statusImage: 'done' , taskComplete: new Date().toLocaleString() });
      setTaskTitle('');
      setTaskBody('');
      setSelectedEmail('');
      setSelectedClient('');
      setTaskModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update task.');
    }
  };

  const addTask = async () => {
    if (taskTitle.trim() === '') {
      Alert.alert('Hata', 'Başlık boş bırakılamaz.');
      return;
    }

    setIsLoading(true); 

    let imageUrls: string[] = [];

    for (const imageUri of newTaskImages) {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            const storageReference = storageRef(firebase_storage, `tasks/${Date.now()}`);
            await uploadBytes(storageReference, blob);
            const imageUrl = await getDownloadURL(storageReference);
            imageUrls.push(imageUrl);
          }

    try {
      const currentUser = firebase_auth.currentUser;
      if (!currentUser || !currentUser.email) {
        Alert.alert('Error', 'User not logged in or email not available.');
        return;
      }
  
      const creatorEmail: string = currentUser.email; 
  
      const tasksRef = ref(db, 'tasks');

      const statusImage = selectedEmail?.trim() ? 'inProgress' : '';
      const assignedTo = selectedEmail?.trim() ? selectedEmail : ''; // Ensure it's empty when no user is selected

      await push(tasksRef, {
        title: taskTitle,
        body: taskBody,
        createdBy: creatorEmail,
        assignedTo: assignedTo, // Use the fixed assignedTo variable
        client: selectedClient,
        imageUrls: imageUrls,
        dateTime: new Date().toLocaleString(),
        statusImage: statusImage,
      });

      // Reset state after adding task
      setTaskTitle('');
      setTaskBody('');
      setAssignedTo('');
      setSelectedEmail('');
      setSelectedClient('');
      setModalVisible(false);
      setNewTaskImages([]);
      sendNotification(selectedEmail ?? "",taskTitle);

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add task.');
    }finally {
      setIsLoading(false); 
    }
};
  

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskBody(task.body);
    setAssignedToNote(task.assignedToNote);
    setAssignedTo(task.assignedTo || '');
    setSelectedEmail(task.assignedTo || '');
    setNewTaskImages(task.imageUrls || []); 
    setTaskModalVisible(true);

  };

 
  const deleteTask = async () => {
    if (!selectedTask) return;

    const currentUser = firebase_auth.currentUser;
    if (!currentUser || !currentUser.email) {
      Alert.alert('Error', 'User not logged in or email not available.');
      return;
    }

    const creatorEmail: string = currentUser.email; 

    try {
      const taskRef = ref(db, `tasks/${selectedTask.id}`);
      await update(taskRef, { 
        deleted: 'deleted',
        lastEdited:new Date().toLocaleString(),
        deletedBy: creatorEmail });

      setTaskTitle('');
      setTaskBody('');
      setSelectedEmail('');
      setSelectedClient('');
      setTaskModalVisible(false);
      sendNotification(assignedTo,taskTitle);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update task.');
    }
  };

  const editTask = async () => {
    if (!selectedTask || taskTitle.trim() === '') return;

    const statusImage = assignedTo.trim() === '' ? '' : 'inProgress';
    
    const currentUser = firebase_auth.currentUser;

    setIsLoading(true); 

    let imageUrls: string[] = [];

    for (const imageUri of newTaskImages) {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            const storageReference = storageRef(firebase_storage, `tasks/${Date.now()}`);
            await uploadBytes(storageReference, blob);
            const imageUrl = await getDownloadURL(storageReference);
            imageUrls.push(imageUrl);
          }

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
        assignedToNote: assignedToNote || '',
        assignedTo: selectedEmail ,
        client: selectedClient || '',
        imageUrls: imageUrls,
        statusImage: statusImage,
        lastEdited:new Date().toLocaleString(),
        });

      setTaskTitle('');
      setTaskBody('');
      setSelectedEmail('');
      setSelectedClient('');
      setTaskModalVisible(false);
      sendNotification(selectedEmail ?? "",taskTitle);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update task.');
    }finally {
      setIsLoading(false); 
    }
  };

  const uploadImage = () => {
      launchImageLibrary(
        { mediaType: 'photo', quality: 1, selectionLimit: 0 },
        async (response) => {
          if (response.didCancel || !response.assets) return;
  
          const uris = await Promise.all(
            response.assets.map(async (asset) => {
              try {
                const resized = await ImageResizer.createResizedImage(
                  asset.uri!,
                  800,  // Height 
                  800,  // Width
                  'JPEG',
                  80    // Quality
                );
                return resized.uri;
              } catch (error) {
                console.log('Resize error:', error);
                return null;
              }
            })
          );
  
          setNewTaskImages(prev => [...prev, ...uris.filter(uri => uri !== null) as string[]]);
        }
      );
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

    const filterDropDown = [
      { label: 'All', value: '1' },
      { label: 'In Progress', value: '2' },
      { label: 'Not assigned', value: '3' },
    ];
    const renderDropdownItem = (item: any) => (
      <View style={styles.dropdownItem}>
        <Text style={styles.dropdownItemText}>{item.label}</Text>
      </View>
    )

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
          {item.assignedToNote && (<Text style={styles.taskTimestamp}>Technician Note:  {item.assignedToNote}</Text>)}
          <View style={styles.line}></View>
            {item.assignedTo && (
              <> 
              <Text style={styles.taskTimestamp}>Technician  ● {item.assignedTo}</Text>
              </>)}
            <View style={styles.assignedToContainer}>
              <Text style={styles.taskTimestamp}>Created at  ● {item.dateTime}</Text>
            </View>
            {/*Conditionally render */}
            {item.lastEdited && (
                 <>
                   <Text style={styles.taskTimestamp}>Edited at  ● {item.lastEdited}</Text>
                 </>
               )}
               {item.client && (
              <> 
              <Text style={styles.taskTimestamp}>Company Name● {item.client}</Text>
              </>)}
              {item.taskComplete && (
              <> 
              <Text style={styles.taskTimestamp}>Finished at ● {item.taskComplete}</Text>
              </>)}
          </View>
          {/* Right Column: Image */}
          <View style={[styles.imageColumn,{}]}>
          {item.statusImage === 'done' && (
        <Image style={[styles.icon,{width:20,height:20,alignSelf:'flex-end'}]} source={require('../assets/images/tick.png')} />
          )}

         

           {/* Modal for Enlarged Image */}
                <Modal visible={!!selectedImage} transparent animationType="fade" >
                  <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedImage(null)}>
                      <Text style={styles.closeText}>X</Text>
                    </TouchableOpacity>
                    <Image source={{ uri: selectedImage! }} style={styles.largeImage} />
                  </View>
                </Modal>
                      </View>
                      
              </View>
              <ScrollView horizontal style={styles.imageScroll}>
                  {item.imageUrls?.map((imgUri, index) => (
                    <TouchableOpacity 
                      key={index} 
                      onPress={() => setSelectedImage(imgUri)}
                      style={styles.imageWrapper}
                    >
                      <Image 
                        source={{ uri: imgUri }} 
                        style={styles.taskImage} 
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
        
      </TouchableOpacity>
    );
  
  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.button,{backgroundColor:'#817E7D'}]} onPress={() => setModalVisible(true)}>
        <Text style={[styles.buttonText,{textAlign:'center'}]}>Add Task</Text>
      </TouchableOpacity>
      

        <Dropdown
                style={styles.dropdown}
                data={filterDropDown}
                labelField="label"
                valueField="value"
                placeholder="Filter"
                value={selectedOption}
                onChange={item => {
                  setSelectedOption(item.value);
                }}
                renderItem={renderDropdownItem}
        />
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
  onRequestClose={() => { setModalVisible(false), setNewTaskImages([]);}}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
     
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => { setModalVisible(false), setAssignedTo(''), setSelectedEmail(''), setNewTaskImages([]);}}
          hitSlop={{ top: 10, bottom: 100, left: 10, right: 10 }}
        >
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>
        <ScrollView style={{ maxHeight: '100%' }} nestedScrollEnabled={true}>
        <Text style={styles.text}>Task Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter the header"
          placeholderTextColor="#888"
          value={taskTitle}
          onChangeText={setTaskTitle}
        />
        <Text style={styles.text}>Task Description</Text>
        <TextInput
          style={[styles.input, { verticalAlign: 'top', height: 65 }]}
          placeholder="ENter Description"
          placeholderTextColor="#888"
          value={taskBody}
          onChangeText={setTaskBody}
          multiline={true}
          numberOfLines={4}
        />

        <Dropdown
          style={[styles.dropdown, { width: '100%' }, { height: '8%' }]}
          data={clientListDropdown}
          labelField="label"
          valueField="value"
          placeholder="Select Company"
          value={selectedClient}
          onChange={(item) => setSelectedClient(item.value)}
        />
        <Text style={[styles.text, { marginTop: 0 }]}>Selected Company:</Text>
        <Text style={[styles.text, { color: '#888' }]}>{selectedClient}</Text>

        <Dropdown
          style={[styles.dropdown, { width: '100%' }, { height: '8%' }]}
          data={usersDropdown}
          labelField="label"
          valueField="value"
          placeholder="Select Technician"
          value={selectedEmail}
          onChange={(item) => setSelectedEmail(item.value)}
        />
        <Text style={[styles.text, { marginTop: 0 }]}>Selected Technician:</Text>
        <Text style={[styles.text, { color: '#888' }]}>{selectedEmail}</Text>

        <View style={[styles.row,{width:'100%',justifyContent:'space-between'}]}>
        <TouchableOpacity  style={[styles.button, { backgroundColor: 'teal' }]} onPress={uploadImage} disabled={isLoading}>
          <Image style={[styles.icon,{width:25,height:25,alignSelf:'center'}]} source={require('../assets/images/addphoto.png')} />      
        </TouchableOpacity>
        {isLoading ? (
          <ActivityIndicator size="large" color="#817E7D" style={styles.loadingIndicator} />
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.buttonContainer,{ backgroundColor: '#817E7D' }]}
            onPress={addTask}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, { textAlign: 'center' }]}>Add</Text>
          </TouchableOpacity>
        )}
        </View>

        {/* Display images with individual removal */}
        <View style={[styles.row,{marginBottom:30}]}>
          {newTaskImages.map((uri, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                // Remove the clicked image
                setNewTaskImages(prev => prev.filter((_, i) => i !== index));
              }}
              style={styles.imageWrapper}
            >
              <Image source={{ uri }} style={styles.image} />
            </TouchableOpacity>
          ))}
          
        </View>
      </ScrollView>
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
    setAssignedToNote('');
    setSelectedEmail('');
    setSelectedClient('');
    setMarkAsDoneText('Mark as Done'),
    setNewTaskImages([]);
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
          setAssignedToNote('');
          setAssignedTo('');
          setSelectedClient('');
          setSelectedEmail('');
          setMarkAsDoneText('Mark as Done'),
          setNewTaskImages([]);
        }}
        hitSlop={{ top: 10, bottom: 50, left: 50, right: 10 }}
      >
        <Text style={styles.closeButtonText}>X</Text>
      </TouchableOpacity>
      <ScrollView style={{ maxHeight: '100%' }} nestedScrollEnabled={true}>
      <Text style={styles.text}>Task Header</Text>
      <TextInput
        style={styles.input}
        value={taskTitle}
        onChangeText={setTaskTitle}
      />
      <Text style={styles.text}>Task Description</Text>
      <TextInput
        style={[styles.input, { verticalAlign: 'top', height:65 }]}
        value={taskBody}
        onChangeText={setTaskBody}
        multiline={true}
        numberOfLines={4} 
      />
      <Text style={styles.text}>Technician note</Text>
      <TextInput
        style={[styles.input, { verticalAlign: 'top', height: 65, }]}
        placeholder="Enter note"
        placeholderTextColor="#888"
        value={assignedToNote}
        onChangeText={setAssignedToNote}
        multiline={true}
        numberOfLines={4} 
      />
       <Dropdown
              style={[styles.dropdown,{width:'100%'}, {height: '7%'}]}
              data={clientListDropdown}
              labelField="label"
              valueField="value"
              placeholder="Select Company"
              value={selectedClient}
              onChange={(item) => setSelectedClient(item.value)}
            />
            <Text style={[styles.text, { marginTop:0}]}>Selected Company:</Text>
            <Text style={[styles.text, { color: '#888' }]}>{selectedClient}</Text>

      {/* User selection part in Edit Modal */}
      {authorizedUser===true && (
               <Dropdown
                 style={[styles.dropdown, { width: '100%' }, { height: '8%' }]}
                 data={usersDropdown}
                 labelField="label"
                 valueField="value"
                placeholder="Selected Technician"
                 value={selectedEmail}
                 onChange={(item) => setSelectedEmail(item.value)}
               />
             )}
      <Text style={[styles.text, { marginTop:0 }]}>Selected Technician:</Text>
      <Text style={[styles.text, { color: '#888' }]}>{assignedTo}</Text>


      {/* Mark as Done Button */}
      <TouchableOpacity
        style={[styles.button, styles.button,{backgroundColor:'green'}]}
        onPress={() => {
          if (markAsDoneText === 'Mark As Done') {
            setMarkAsDoneText('Are you sure ?');
          } else {
            markTaskAsDone(); // Trigger the function
            setMarkAsDoneText('Mark As Done'); // Reset the button text
          }
        }}
      >
        <Text style={styles.buttonText}>{markAsDoneText}</Text>
      </TouchableOpacity>
        <View style={[styles.row,{width:'100%',justifyContent:'space-between',marginBottom:5}]}>
        <TouchableOpacity style={[styles.button, styles.buttonContainer ,{backgroundColor: 'teal'}]} onPress={uploadImage}>
          <Image style={[styles.icon,{width:25,height:25,alignSelf:'center'}]} source={require('../assets/images/addphoto.png')} />      
        </TouchableOpacity>
        {isLoading ? (
          <ActivityIndicator size="large" color="#817E7D" style={styles.loadingIndicator} />
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.buttonContainer,{ backgroundColor: '#73706f' }]}
            onPress={editTask}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, { textAlign: 'center' }]}>Save</Text>
          </TouchableOpacity>
        )}
        {/* Display images with individual removal */}
      </View>
      <View style={[styles.row,{marginBottom:30}]}>
          {newTaskImages.map((uri, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                // Remove the clicked image
                setNewTaskImages(prev => prev.filter((_, i) => i !== index));
              }}
              style={styles.imageWrapper}
            >
              <Image source={{ uri }} style={styles.image} />
            </TouchableOpacity>
          ))}
          
        </View>
      </ScrollView>
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
    width: 70, // Image width
    height: 70, // Image height
    resizeMode: 'contain', // Ensures the image maintains its aspect ratio
  },
  imageColumn: {
    width: 50, // Adjust to the size of the image
    alignItems: 'center', // Centers the image horizontally
  },
  row: {
    flexDirection: 'row',
    flexWrap:'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
    paddingRight: 10, // Adds spacing between text and image
  },
  dropdown: {
    width: '50%',
    height: '6%',
    marginTop:10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 10,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 0,
    borderBottomColor: '#ccc',
  },
  dropdownItemText: {
    fontSize: 16,
  },
  largeImage: { 
    width: 600, 
    height: 600, 
    borderRadius: 10, 
    resizeMode: 'contain' 
  },

  closeText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  imageScroll: {
    flex: 1,
    marginTop: 10,
  },
  imageWrapper: {
    marginRight: 10,
  },
  taskImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  loadingIndicator: {
    marginVertical: 20, 
  },
  image: { 
    width: 130, 
    height: 130, 
    borderRadius: 10, 
    marginBottom: 10, 
    resizeMode: 'contain' 
  },
  buttonContainer: {
    flex: 1, // Make buttons share available space equally
    marginHorizontal: 2, // Small horizontal margin
  },
});
