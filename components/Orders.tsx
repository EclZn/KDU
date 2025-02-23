import { StyleSheet, Text, View, Image, FlatList, TouchableOpacity, Modal , TextInput, Alert, ScrollView, ActivityIndicator} from 'react-native';
import React, { useEffect, useState } from 'react';
import { firebase_storage } from '../firebase'; 
import { ref as storageRef, uploadBytes ,getDownloadURL} from "firebase/storage";
import { launchImageLibrary } from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import { firebase_auth } from '../firebase';
import { db } from '../firebase';
import { ref, push, onValue,update } from 'firebase/database';
import { Dropdown } from 'react-native-element-dropdown';

interface Order {
    id: string;
    title: string;
    client: string;
    imageUrls: string[];
    dateTime: string;
    deleted?:boolean;
    body:string;
}

const Orders = () => {
  const [newOrderImages, setNewOrderImages] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [productName, setProductName] = useState('');
  const [productBody, setProductBody] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientListDropdown, setClientListDropdown] = useState<{ label: string; value: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const ordersRef = ref(db, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      let orderList: Order[] = data ? Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        })).filter(order => 
          !order.deleted && // Add this filter
          (!selectedClient || order.client === selectedClient)
        ) : [];
      setOrders(orderList.reverse());
    });
    return () => unsubscribe();
  }, [selectedClient]);

  useEffect(() => {
    const clientsRef = ref(db, 'clients');
    onValue(clientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const clientList = Object.keys(data).map((key) => ({
          label: data[key].name, 
          value: data[key].name,
        }));
        setClientListDropdown(clientList); 
      }
    });
  }, []);

  const addOrder = async () => {
    if (productName.trim() === '') {
      Alert.alert('Hata', 'Ürün adı boş bırakılamaz.');
      return;
    }

    setIsLoading(true);
    let imageUrls: string[] = [];

    try {
      // Upload images
      for (const imageUri of newOrderImages) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const storageReference = storageRef(firebase_storage, `orders/${Date.now()}`);
        await uploadBytes(storageReference, blob);
        const imageUrl = await getDownloadURL(storageReference);
        imageUrls.push(imageUrl);
      }

      const currentUser = firebase_auth.currentUser;
      if (!currentUser?.email) {
        Alert.alert('Error', 'User not logged in.');
        return;
      }

      await push(ref(db, 'orders'), {
        title: productName,
        body:productBody,
        client: selectedClient,
        imageUrls,
        dateTime: new Date().toLocaleString()
      });

      setProductName('');
      setProductBody('');
      setNewOrderImages([]);
      setModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add order.');
    } finally {
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
                800,
                800,
                'JPEG',
                60
              );
              return resized.uri;
            } catch (error) {
              console.log('Resize error:', error);
              return null;
            }
          })
        );

        setNewOrderImages(prev => [...prev, ...uris.filter(uri => uri !== null) as string[]]);
      }
    );
  };

  const deleteOrder = async (orderId: string) => {
    Alert.alert(
      'Delete Order',
      'Do you want to delete the order ?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sil',
          onPress: async () => {
            try {
              const orderRef = ref(db, `orders/${orderId}`);
              await update(orderRef, { 
                deleted: true,
                deletedAt: new Date().toLocaleString(),
                deletedBy: firebase_auth.currentUser?.email,
              });
            } catch (error) {
              console.error('Error deleting order:', error);
              Alert.alert('Error', 'Order could not be deleted.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };
  // Update the renderItem function
  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.orderItem}
      onPress={() => deleteOrder(item.id)}
    >
      <Text style={styles.orderTitle}>{item.title}</Text>
      <View style={styles.line} />
      <Text style={[styles.orderTitle,{fontSize:14}]}>{item.body}</Text>
      <Text style={styles.dateText}>Date: {item.dateTime}</Text>
      
      <ScrollView horizontal>
        {item.imageUrls?.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.orderImage} />
        ))}
      </ScrollView>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Dropdown
        style={styles.clientDropdown}
        data={clientListDropdown}
        labelField="label"
        valueField="value"
        placeholder="Select Client"
        value={selectedClient}
        onChange={(item) => setSelectedClient(item.value)}
      />

       {/* Conditional rendering for the button */}
    {selectedClient && (
    <TouchableOpacity 
      style={styles.addButton}
      onPress={() => setModalVisible(true)}
    >
      <Text style={styles.buttonText}>Add Order</Text>
    </TouchableOpacity>
  )}

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />

      {/* Add Order Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>X</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>New Order</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Order Name"
              placeholderTextColor="#888"
              value={productName}
              onChangeText={setProductName}
            />
            <TextInput
              style={styles.input}
              placeholder="Order Description"
              placeholderTextColor="#888"
              value={productBody}
              onChangeText={setProductBody}
            />

                    <View style={[styles.row,{width:'100%',justifyContent:'space-between'}]}>
                    <TouchableOpacity  style={[styles.addButton, { backgroundColor: 'teal' }]} onPress={uploadImage} disabled={isLoading}>
                      <Image style={[styles.icon,{width:20,height:20,alignSelf:'center'}]} source={require('../assets/images/addphoto.png')} />      
                    </TouchableOpacity>
                    {isLoading ? (
                      <ActivityIndicator size="large" color="#817E7D" />
                    ) : (
                      <TouchableOpacity
                        style={[styles.addButton, styles.buttonContainer,{ backgroundColor: '#817E7D' }]}
                        onPress={addOrder}
                        disabled={isLoading}
                      >
                        <Text style={[styles.buttonText, { textAlign: 'center' }]}>Add</Text>
                      </TouchableOpacity>
                    )}
                    </View>
            {/* Display images with individual removal */}
                   <View style={[styles.row,{marginBottom:30}]}>
                     {newOrderImages.map((uri, index) => (
                       <TouchableOpacity
                         key={index}
                         onPress={() => {
                           // Remove the clicked image
                           setNewOrderImages(prev => prev.filter((_, i) => i !== index));
                         }}
                         style={styles.imageWrapper}
                       >
                         <Image source={{ uri }} style={styles.image} />
                       </TouchableOpacity>
                     ))}
                     
                   </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  clientDropdown: {
    marginVertical: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5
  },
  addButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10
  },
  orderItem: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom:5,
  },
  orderTitle: {
    fontSize: 16,
  },
  clientText: {
    fontSize: 14,
    color: '#666'
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  orderImage: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 5
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5
  },
  imageButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15
  },
  imagePreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15
  },
  thumbnail: {
    width: 80,
    height: 80,
    margin: 5,
    borderRadius: 5
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 5
  },
  closeText: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  listContainer: {
    paddingBottom: 20
  },
  buttonContainer: {
    flex: 1, // Make buttons share available space equally
    marginHorizontal: 2, // Small horizontal margin
  },
  row: {
    flexDirection: 'row',
    flexWrap:'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  icon: {
    width: 70, // Image width
    height: 70, // Image height
    resizeMode: 'contain', // Ensures the image maintains its aspect ratio
  },
  imageWrapper: {
    marginRight: 10,
  },
  image: { 
    width: 130, 
    height: 130, 
    borderRadius: 10, 
    marginBottom: 10, 
    resizeMode: 'contain' 
  },
  line: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 5,
  },
});

export default Orders;