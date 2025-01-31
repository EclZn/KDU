import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity,Image} from 'react-native';
import { firebase_auth } from '../firebase';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
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
}

const Blank: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState(null);

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
        : [];

        if (selectedOption === '2') {
          // Show only completed tasks
          taskList = taskList.filter((task) => task.statusImage === 'done');
        } else if (selectedOption === '3') {
          // Show only ongoing tasks
          taskList = taskList.filter((task) => task.statusImage === 'inProgress');
        } else if (selectedOption === '4') {
          // Show only not assigned tasks (assuming tasks with no assignedTo are "not assigned")
          taskList = taskList.filter((task) => !task.assignedTo);
        }

        
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
  }, [selectedOption]);

  const filterDropDown = [
        { label: 'All', value: '1' },
        { label: 'Completed', value: '2'},
        { label: 'Ongoing', value: '3' },
        { label: 'Not assigned', value: '4' },
      ];
      const renderDropdownItem = (item: any) => (
        <View style={styles.dropdownItem}>
          <Text style={styles.dropdownItemText}>{item.label}</Text>
        </View>
      )

  const renderItem = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
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
    <Dropdown
                style={styles.dropdown}
                data={filterDropDown}
                labelField="label"
                valueField="value"
                placeholder="Filter Tasks"
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
    width: 40, // Image width
    height: 40, // Image height
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
});
