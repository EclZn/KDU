import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Modal, TouchableOpacity, Alert, FlatList } from 'react-native';
import { db } from '../firebase'; // Ensure your Firebase setup is correct
import { ref, push, onValue, update } from 'firebase/database';

const Clients = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientDescription, setClientDescription] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientInfo, setClientInfo] = useState('');
  const [clients, setClients] = useState<{ id: string; name: string; description: string; address: string; info: string }[]>([]);
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string; description: string; address: string; info: string } | null>(null);

  // Fetch clients from Firebase
  useEffect(() => {
    const clientsRef = ref(db, 'clients');
    onValue(clientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const clientList = Object.keys(data).map((key) => ({
          id: key,
          name: data[key].name,
          description: data[key].description,
          address: data[key].address,
          info: data[key].info,
        }));
        setClients(clientList);
      }
    });
  }, []);

  const addClient = () => {
    if (!clientName ) {
      Alert.alert('Error', 'Fill necessary fields.');
      return;
    }

    // Add client to Firebase
    const clientsRef = ref(db, 'clients');
    push(clientsRef, {
      name: clientName,
      description: clientDescription,
      address: clientAddress,
      info: clientInfo,
    })
      .then(() => {
        Alert.alert('Success', 'Client added');
        setModalVisible(false);
        setClientName('');
        setClientDescription('');
        setClientAddress('');
        setClientInfo('');
      })
      .catch((error) => {
        Alert.alert('Error', error.message);
      });
  };

  const editClient = () => {
    if (!clientName || !clientDescription || !clientAddress || !clientInfo) {
      Alert.alert('Error', 'Fill necessary fields.');
      return;
    }

    // Update client in Firebase
    const clientRef = ref(db, `clients/${selectedClient?.id}`);
    update(clientRef, {
      name: clientName,
      description: clientDescription,
      address: clientAddress,
      info: clientInfo,
    })
      .then(() => {
        Alert.alert('Success', 'Client information updated successfully!');
        setModalVisible(false);
        setClientName('');
        setClientDescription('');
        setClientAddress('');
        setClientInfo('');
      })
      .catch((error) => {
        Alert.alert('Error', error.message);
      });
  };

  return (
    <View style={styles.container}>
      {/* Display Selected Client Details */}
      {selectedClient && (
        <View style={styles.clientDetails}>
          {clients
            .filter((client) => client.id === selectedClient?.id) // Fix here
            .map((client) => (
              <View key={client.id}>
                <Text style={styles.clientText}>Client name:{client.name}</Text>
                <Text style={styles.clientText}>Description: {client.description}</Text>
                <Text style={styles.clientText}>Address: {client.address}</Text>
                <Text style={styles.clientText}>Information: {client.info}</Text>

                {/* Edit Button */}
                <TouchableOpacity
                  style={[styles.editButton,{backgroundColor:'#73706f'}]}
                  onPress={() => {
                    setClientName(client.name);
                    setClientDescription(client.description);
                    setClientAddress(client.address);
                    setClientInfo(client.info);
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            ))}
        </View>
      )}

      {/* FlatList to Show Clients */}
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.clientItem, selectedClient?.id === item.id && styles.selectedClient]}
            onPress={() => {
              setSelectedClient(item);
              setClientName(item.name);
              setClientDescription(item.description);
              setClientAddress(item.address);
              setClientInfo(item.info);
            }}
          >
            <Text style={styles.clientName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Add Client Button */}
      <TouchableOpacity style={[styles.addButton,{backgroundColor:'#73706f'}]} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>Add Client</Text>
      </TouchableOpacity>

      {/* Modal for adding or editing clients */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>

            <TextInput
              style={styles.input}
              placeholder="Client name"
              placeholderTextColor="#888"
              value={clientName}
              onChangeText={setClientName}
            />
            <TextInput
              style={styles.input}
              placeholder="Client description"
              placeholderTextColor="#888"
              value={clientDescription}
              onChangeText={setClientDescription}
            />
            <TextInput
              style={styles.input}
              placeholder="Client address"
              placeholderTextColor="#888"
              value={clientAddress}
              onChangeText={setClientAddress}
            />
            <TextInput
              style={styles.input}
              placeholder="Client information"
              placeholderTextColor="#888"
              value={clientInfo}
              onChangeText={setClientInfo}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={selectedClient ? editClient : addClient}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                setClientName('');
                setClientDescription('');
                setClientAddress('');
                setClientInfo('');
                setModalVisible(false);
              }}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Clients;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dropdown: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  clientDetails: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
  },
  clientText: {
    fontSize: 16,
    marginBottom: 5,
  },
  clientItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  clientName: {
    fontSize: 16,
  },
  addButton: {
    padding: 12,
    backgroundColor: '#007BFF',
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#28A745',
    padding: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#DC3545',
    padding: 10,
    borderRadius: 5,
    marginLeft: 5,
  },
  selectedClient: {
    backgroundColor: '#e0e0e0',
  },
  editButton: {
    padding: 10,
    backgroundColor: '#FFC107',
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
});
