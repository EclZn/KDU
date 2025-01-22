import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, FlatList } from 'react-native';
import { firebase_auth } from '../firebase';
import { db } from '../firebase';
import { ref, push, onValue } from 'firebase/database';

interface Task {
  id: string;
  title: string;
  body: string;
  createdBy: string;
  assignedTo: string;
  dateTime: string;
}

const Home: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);

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
      setTasks(taskList);
    });

    return () => unsubscribe();
  }, []);

  const addTask = async () => {
    if (taskTitle.trim() === '') {
      Alert.alert('Error', 'Task title cannot be empty.');
      return;
    }

    try {
      const tasksRef = ref(db, 'tasks');
      await push(tasksRef, {
        title: taskTitle,
        body: "Default body", // Placeholder for task body
        createdBy: "Creator Name", // Replace with actual user data
        assignedTo: "Unassigned", // Placeholder for assigned user
        dateTime: new Date().toLocaleString(),
      });
      Alert.alert('Success', 'Task added successfully!');
      setTaskTitle('');
      setModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add task.');
    }
  };

  const renderItem = ({ item }: { item: Task }) => {
    return (
      <View style={styles.taskItem}>
        <View style={styles.taskContainer}>
          <Text style={styles.taskTitle}>{item.title}</Text>
        </View>
        <View style={styles.line} />
        <View>
          <Text style={styles.taskBody}>{item.body}</Text>
        </View>
        <View>
          <Text style={styles.taskTimestamp}>Creator ● {item.createdBy}</Text>
          <Text style={styles.taskTimestamp}>Assigned to ● {item.assignedTo}</Text>
          <View style={styles.assignedToContainer}>
            <Text style={styles.taskTimestamp}>{item.dateTime}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Task List</Text>

      <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>Add Task</Text>
      </TouchableOpacity>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.text}>Add Task</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter task title"
              value={taskTitle}
              onChangeText={setTaskTitle}
            />
            <TouchableOpacity style={styles.button} onPress={addTask}>
              <Text style={styles.buttonText}>Add Task</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
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
    borderRadius: 10,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: '#FF6347',
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
});
