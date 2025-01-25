import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity} from 'react-native';
import { firebase_auth } from '../firebase';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';

interface Task {
  id: string;
  title: string;
  body: string;
  createdBy: string;
  assignedTo: string;
  dateTime: string;
}

const Blank: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);

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

      // Get the current user email and filter tasks
      const currentUser = firebase_auth.currentUser;
      if (currentUser && currentUser.email) {
        const email = currentUser.email;
        setUserEmail(email);
        const filtered = taskList.filter((task) => task.assignedTo === email);
        setFilteredTasks(filtered);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const renderItem = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <View style={styles.line} />
      <Text style={styles.taskBody}>{item.body}</Text>
      <Text style={styles.taskTimestamp}>Assigned to: {item.assignedTo}</Text>
      <Text style={styles.taskTimestamp}>Created by: {item.createdBy}</Text>
      <Text style={styles.taskTimestamp}>Date: {item.dateTime}</Text>
    </View>
  );

  return (
  <View style={styles.container}>
    <View style={styles.rowContainer}>
      <Text style={[styles.emailText,{marginLeft:10,fontWeight:'800'}]}>Current Email: {userEmail}</Text>
      <TouchableOpacity style={[styles.button,{marginLeft:'auto',marginRight:10}]} onPress={()=> firebase_auth.signOut()}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.line} />


    <FlatList
      data={filteredTasks}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
    />
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
  },
  
});
