import { StyleSheet, Text, View, TouchableOpacity, Image, FlatList,Modal,ScrollView } from 'react-native'
import React, { useState, useEffect, } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase'; 



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

  




const CompletedTask = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null); 

    useEffect(() => {
        const tasksRef = ref(db, 'tasks');
        const unsubscribe = onValue(tasksRef, (snapshot) => {
          const data = snapshot.val();
          
          let taskList: Task[] = data
            ? Object.keys(data)
                .map((key) => ({
                  id: key,
                  ...data[key],
                }))
                .filter((task) => task.deleted !== 'deleted' && task.statusImage === 'done')
                : [];
      
          setTasks(taskList.reverse());
        });
      
        return () => unsubscribe();
      }, []);


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
            <View style={styles.row}>
              {/* Left Column: Text */}
              <View style={styles.textColumn}>
                {item.assignedTo && (
                  <>
                    {item.assignedToNote && (
                      <Text style={styles.taskTimestamp}>Technician Note: {item.assignedToNote}</Text>
                    )}
                    <View style={styles.line}></View>
                    <Text style={styles.taskTimestamp}>Technician ● {item.assignedTo}</Text>
                  </>
                )}
                <View style={styles.assignedToContainer}>
                  <Text style={styles.taskTimestamp}>Created at ● {item.dateTime}</Text>
                </View>
                {item.lastEdited && (
                  <>
                    <Text style={styles.taskTimestamp}>Edited at ● {item.lastEdited}</Text>
                  </>
                )}
                {item.client && (
                  <>
                    <Text style={styles.taskTimestamp}>Client Name ● {item.client}</Text>
                  </>
                )}
                {item.taskComplete && (
                  <>
                    <Text style={styles.taskTimestamp}>Done at ● {item.taskComplete}</Text>
                  </>
                )}
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
                      
                    </View>
        );
      };
  return (
    <View style={styles.container}>
      <FlatList
              data={tasks} 
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContainer}
            />
    </View>
  )
}

export default CompletedTask

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 10,
        flex: 1,
        justifyContent: 'center',
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
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      textColumn: {
        flex: 1,
        paddingRight: 10, // Adds spacing between text and image
      },
      listContainer: {
        marginTop: 20,
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
      imageWrapper: {
        marginRight: 10,
      },
      taskImage: {
        width: 100,
        height: 100,
        borderRadius: 5,
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
});