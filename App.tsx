import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const backgroundAppApp = require('./assets/backgroundApp.png'); 
const IconLogo = require('./assets/iconApp.png'); 
const IconPlayer = require('./assets/user.png'); 


// 🧩 1. Definimos la interfaz para un perfil
interface Profile {
  id: string;
  name: string;
  photo: string | null;
}

export default function App() {
  // 🧩 2. Tipamos el estado con nuestro tipo Profile
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [photo, setPhoto] = useState<string | null>(null);

  // Cargar perfiles al iniciar
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async (): Promise<void> => {
    try {
      const data = await AsyncStorage.getItem('profiles');
      if (data) setProfiles(JSON.parse(data) as Profile[]);
    } catch (error) {
      console.error('Error cargando perfiles', error);
    }
  };

  const saveProfiles = async (profilesList: Profile[]): Promise<void> => {
    try {
      await AsyncStorage.setItem('profiles', JSON.stringify(profilesList));
    } catch (error) {
      console.error('Error guardando perfiles', error);
    }
  };

  const addProfile = (): void => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    const newProfile: Profile = { id: Date.now().toString(), name, photo };
    const updated: Profile[] = [...profiles, newProfile];
    setProfiles(updated);
    saveProfiles(updated);
    setName('');
    setPhoto(null);
    setModalVisible(false);
  };

  const deleteProfile = (id: string): void => {
    Alert.alert('Confirmar', '¿Seguro que quieres eliminar este perfil?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          const updated = profiles.filter((p) => p.id !== id);
          setProfiles(updated);
          saveProfiles(updated);
        },
      },
    ]);
  };

  const pickImage = async (): Promise<void> => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permiso requerido', 'Debes permitir acceso a la galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  return (
    <ImageBackground 
      source={backgroundAppApp} 
      style={styles.backgroundImage} 
      resizeMode="cover" // Esto asegura que la imagen cubra todo el espacio
    >
      <View style={styles.container}>
      <View style={styles.boxTitleIcon}>
        <Image source={IconLogo} style={styles.titleIcon}/>
      </View>
      <View style={{ marginBottom: 10 }}>
          <Button title="Jugar" onPress={() => setModalVisible(true)} />
        </View>
        {profiles.length === 0 ? (
          <Text style={{ textAlign: 'center', marginVertical: 20, color: '#999' }}>
            No hay perfiles registrados
          </Text>
        ) : (
          <FlatList
            data={profiles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                {item.photo ? (
                  <Image source={{ uri: item.photo }} style={styles.avatar} />
                ) : (
                <Image source={IconPlayer} style={styles.avatar}/>
                )}
                <Text style={styles.name}>{item.name.toLocaleUpperCase()}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteProfile(item.id)}
                >
                  <Text style={{ color: 'red', fontWeight: 'bold',  fontSize: 10 }}>❌</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        <View style={{ marginTop: 20 }}>
          <Button title="Agregar perfil" onPress={() => setModalVisible(true)} />
        </View>

        {/* MODAL */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.subtitle}>Nuevo perfil</Text>

              <TextInput
                placeholder="Nombre"
                style={styles.input}
                value={name}
                onChangeText={setName}
              />

              <TouchableOpacity onPress={pickImage} style={styles.photoButton}>
                <Text style={{ color: 'white' }}>Elegir foto</Text>
              </TouchableOpacity>

              {photo && <Image source={{ uri: photo }} style={styles.preview} />}

              <View style={styles.buttonsRow}>
                <Button title="Guardar" onPress={addProfile} />
                <Button title="Cancelar" color="red" onPress={() => setModalVisible(false)} />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
}

// 🎨 ESTILOS
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1
  },
  container: { 
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 20, 
  },
  boxTitleIcon: {
    width: '100%',
    alignItems: 'center'
  },
  titleIcon: { 
    width: 120,
    height: 120,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 6,
    borderRadius: 4,
    marginVertical: 4,
  },
  avatar: { 
    width: 55, 
    height: 55, 
    borderRadius: 27.5,
    borderColor: 'black',
    borderWidth: 2, 
  },
  name: { 
    flex: 1, 
    fontSize: 14, 
    marginLeft: 15 
  },
  deleteButton: {
    width: 25,
    height: 25,
    borderRadius: '50%',
    borderBlockColor: 'red',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  subtitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 10, 
    textAlign: 'center' 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 10, 
    padding: 10, 
    marginBottom: 10 
  },
  photoButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  preview: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    alignSelf: 'center', 
    marginBottom: 10 
  },
  buttonsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginTop: 10 
  },
});
