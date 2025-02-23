import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity,Image, Modal, TextInput, } from 'react-native';
import { firebase_auth } from '../firebase';
import { db } from '../firebase';
import { ref, onValue ,update} from 'firebase/database';
import { Dropdown } from 'react-native-element-dropdown';

interface Task {
  id: string;
  title: string;
  body: string;
  createdBy: string;
  assignedTo: string;
  dateTime: string;
  editedBy: string;
  lastEdited: string;
  statusImage: string;
  assignedToNote: string;
}

const Blank: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState(null);

  const [isAuthorized, setIsAuthorized] = useState<boolean>(false); 
  
  const [deleteConfirm, setDeleteConfirm] = useState<{ [key: string]: boolean }>({});

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [note, setNote] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const tasksRef = ref(db, 'tasks');
    const unsubscribe = onValue(tasksRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Fetched data:", data);
      
      let taskList: Task[] = data
        ? Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }))
          .filter((task) => task.deleted !== 'deleted')
        : [];
  
      const currentUser = firebase_auth.currentUser;
  
      if (currentUser && currentUser.email) {
        setUserEmail(currentUser.email);
  
        const userRef = ref(db, `users/${currentUser.uid}/isAuthorized`);
        onValue(userRef, (userSnapshot) => {
          const isAuthorized = userSnapshot.val();
          setIsAuthorized(isAuthorized === true);
  
          if (!isAuthorized) {
            taskList = taskList.filter((task) => task.assignedTo === currentUser.email);
          }
  
          // Filter tasks to include only those with statusImage: 'inProgress' by default
          if (!selectedOption) {
            taskList = taskList.filter((task) => task.statusImage === 'inProgress');
          }
  
          // Apply dropdown filters for both authorized and non-authorized users
          if (selectedOption === '1') {
            taskList = taskList.filter((task) => task.statusImage === 'inProgress');
          } else if (selectedOption === '2') {
            taskList = taskList.filter((task) => task.statusImage === 'done');
          } else if (selectedOption === '3') {
            taskList;
          }
  
          setTasks(taskList);
          setFilteredTasks(taskList);
        });
      }
    });
  
    return () => {
      unsubscribe();
    };
  }, [selectedOption]);
  
  const handleDeletePress = (taskId: string) => {
    if (deleteConfirm[taskId]) {
      deleteTask(taskId);
    } else {
      setDeleteConfirm((prev) => ({ ...prev, [taskId]: true }));
      setTimeout(() => {
        setDeleteConfirm((prev) => ({ ...prev, [taskId]: false }));
      }, 5000);
    }
  };

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setNote(task.assignedToNote || '');
    setModalVisible(true);
  };

  const updateAssignedToNote = async () => {
    if (!selectedTask || !note.trim()) {
      Alert.alert('Servis notu boş olamaz.');
      return;
    }
     try {
      const taskRef = ref(db, `tasks/${selectedTask.id}`);
      await update(taskRef, { assignedToNote: note });
      setModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!taskId) return;
  
    const currentUser = firebase_auth.currentUser;
    if (!currentUser || !currentUser.email) {
      Alert.alert('Error', 'User not logged in or email not available.');
      return;
    }
  
    const creatorEmail: string = currentUser.email;
  
    try {
      const taskRef = ref(db, `tasks/${taskId}`);
      await update(taskRef, { 
        deleted: 'deleted',
        lastEdited: new Date().toLocaleString(),
        deletedBy: creatorEmail,
      });
  
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update task.');
    }
  };

  const filterDropDown = [
        { label: 'In progress', value: '1' },
        { label: 'Done', value: '2'},
        { label: 'All', value: '3' },
      ];
      const renderDropdownItem = (item: any) => (
        <View style={styles.dropdownItem}>
          <Text style={styles.dropdownItemText}>{item.label}</Text>
        </View>
      )

      const renderItem = ({ item }: { item: Task }) => (
        <TouchableOpacity
        onPress={() => handleTaskPress(item)}
        disabled={userEmail !== item.assignedTo}
          style={styles.taskItem}
        >
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
              <Text style={styles.taskTimestamp}>Created by  ● {item.createdBy}</Text>
              {item.assignedTo && <Text style={styles.taskTimestamp}>Technician   ● {item.assignedTo}</Text>}
              <View style={styles.assignedToContainer}>
                <Text style={styles.taskTimestamp}>Created at ● {item.dateTime}</Text>
              </View>
              {/* Conditionally render */}
              {item.editedBy && item.lastEdited && (
                <>
                  <Text style={styles.taskTimestamp}>Edited at  ● {item.editedBy}</Text>
                </>
              )}
              {isAuthorized && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePress(item.id)}
        >
          <Text style={styles.buttonText}>{deleteConfirm[item.id] ? 'Emin misiniz?' : 'Sil'}</Text>
        </TouchableOpacity>
      )}
            </View>
            {/* Right Column: Image */}
            
          </View>
        </TouchableOpacity>
      );
      
  return (
  <View style={styles.container}>
    <View style={styles.rowContainer}>
      <Text style={[styles.emailText,{marginLeft:10,fontWeight:'800'}]}>Logged in by:</Text>
      <Text style={[styles.emailText,{marginLeft:10,fontWeight:'800'}]}>{userEmail}</Text>
      <TouchableOpacity style={[styles.button,{marginLeft:'auto',marginRight:10,backgroundColor:'#73706f'}]} onPress={()=> firebase_auth.signOut()}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.line} />
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
      data={filteredTasks}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
    />

<Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Technician note </Text>
            <TextInput
              style={styles.input}
              placeholder="Add note"
              placeholderTextColor="#888"
              value={note}
              onChangeText={setNote}
            />
            <TouchableOpacity style={[styles.button,{backgroundColor:'green',margin:3}]} onPress={updateAssignedToNote}>
            <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button,{backgroundColor:'gray',margin:3}]}onPress={() => setModalVisible(false)}>
            <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

  </View>
);
};

export default Blank;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  button: {
    backgroundColor: '#007BFF',
    borderRadius: 3,
    width:'auto',
    height:'auto',
    padding:10,
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
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskBody: {
    fontSize: 14,
    color: '#555',
  },
  taskTimestamp: {
    fontSize: 12,
    color: '#888',
  },
  line: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 5,
  },
  rowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow content to wrap to the next line if needed
    alignItems: 'center', // Vertically align items in the row
    marginBottom: 10, // Add some space at the bottom
  },
  emailText: {
    marginRight: 10, // Add spacing between email and button
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign:'center',
  },
  taskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageColumn: {
    width: 50, // Adjust to the size of the image
    alignItems: 'center', // Centers the image horizontally
  },
  textColumn: {
    flex: 1,
    paddingRight: 10, // Adds spacing between text and image
  },
  assignedToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    width: 70, // Image width
    height: 70, // Image height
    resizeMode: 'contain', // Ensures the image maintains its aspect ratio
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
  dropdown: {
    width: '50%',
    height: '6%',
    marginTop:10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 10,
  },  
  deleteButton: {
     marginTop: 10, 
     backgroundColor: 'red', 
     padding: 10, 
     borderRadius: 5, 
    width:120,
  },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: 300, padding: 20, backgroundColor: '#fff', borderRadius: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginVertical: 5 },
});
