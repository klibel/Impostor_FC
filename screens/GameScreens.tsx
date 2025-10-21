// GameScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  StyleSheet,
  ImageBackground,
  Animated,
  Easing,
  Dimensions,
  Button,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { players } from '../Data/Players';
import { MaterialIcons } from '@expo/vector-icons'; // o react-native-vector-icons


const backgroundApp = require('../assets/backgroundApp.png');
const backgroundModal = require('../assets/backgroundModal.png');
const IconLogo = require('../assets/iconApp.png');

type Participant = {
  id: string;
  name: string;
  photo?: string;
  isImpostor?: boolean;
  playerName?: string;
};

const { width, height } = Dimensions.get('window');

const GameScreen = ({ navigation }: any) => {
  const [profiles, setProfiles] = useState<Participant[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [numImpostors, setNumImpostors] = useState(1);
  const [selectedParticipants, setSelectedParticipants] = useState<Participant[]>([]);
  const [gameParticipants, setGameParticipants] = useState<Participant[]>([]);
  const [playerModal, setPlayerModal] = useState<Participant | null>(null);
  const [roundMessage, setRoundMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadProfiles = async () => {
    try {
      const data = await AsyncStorage.getItem('profiles');
      if (data) setProfiles(JSON.parse(data));
    } catch (error) {
      console.log('Error al cargar perfiles:', error);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const toggleSelectParticipant = (p: Participant) => {
    if (selectedParticipants.find(sp => sp.id === p.id)) {
      setSelectedParticipants(selectedParticipants.filter(sp => sp.id !== p.id));
    } else {
      setSelectedParticipants([...selectedParticipants, p]);
    }
  };

  const createGame = () => {
    if (selectedParticipants.length < numImpostors) {
      alert('Debes seleccionar al menos tantos jugadores como impostores.');
      return;
    }

    const commonPlayer = players[Math.floor(Math.random() * players.length)];
    let participants: Participant[] = selectedParticipants.map(p => ({ ...p }));

    const impostorIndexes: number[] = [];
    while (impostorIndexes.length < numImpostors) {
      const idx = Math.floor(Math.random() * participants.length);
      if (!impostorIndexes.includes(idx)) impostorIndexes.push(idx);
    }

    participants.forEach((p, idx) => {
      if (impostorIndexes.includes(idx)) {
        p.isImpostor = true;
        p.playerName = 'IMPOSTORCITO';
      } else {
        p.playerName = commonPlayer;
      }
    });

    setGameParticipants(participants);
    setModalVisible(false);
  };

  const newRound = () => {
    createGame();
    setRoundMessage('¡Nueva ronda generada!');
    setTimeout(() => setRoundMessage(''), 2000);
  };

  const deleteGame = () => {
    setGameParticipants([]);
    setSelectedParticipants([]);
  };

  const openPlayerModal = (participant: Participant) => {
    setPlayerModal(participant);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  };

  const closePlayerModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.in(Easing.ease),
    }).start(() => setPlayerModal(null));
  };

  const getCirclePositions = (count: number, radius: number) => {
    const positions: { x: number; y: number }[] = [];
    const centerX = width / 2 - 50;
    const centerY = height / 2 - 50;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI;
      positions.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
    return positions;
  };

  const positions = getCirclePositions(gameParticipants.length, 120);

  return (
    <ImageBackground source={backgroundApp} style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Logo central arriba */}
        <Image source={IconLogo} style={styles.logoTop} />

              <TouchableOpacity
                  style={styles.fabButton}
                  onPress={() => navigation.goBack()}
                >
                  <MaterialIcons name="home" size={28} color="#fff" />
                </TouchableOpacity>
        {!gameParticipants.length && (
          <TouchableOpacity
          style={styles.Button}
          onPress={() => setModalVisible(true)}
        >
         <Text style={{ color: 'white'}}>CREAR PARTIDA</Text>
      </TouchableOpacity>
        )}

        {gameParticipants.length > 0 && (
          <>
            <View style={styles.topButtons}>
              <TouchableOpacity
                  style={styles.ButtonRed}
                  onPress={deleteGame}
                >
                 <Text style={{ color: 'white'}}>Eliminar Partida</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.Button}
                onPress={newRound}
              >
                <Text style={{ color: 'white'}}>Nueva Ronda</Text>
              </TouchableOpacity>
            </View>

            {roundMessage !== '' && (
              <Text style={styles.roundMessage}>{roundMessage}</Text>
            )}

            {/* Logo central en el medio */}
            <Image
              source={IconLogo}
              style={{
                width: 30,
                height: 30,
                position: 'absolute',
                top: height / 2 - 15,
                left: width / 2 - 15,
              }}
            />

            {/* Cartas alrededor del logo */}
            {gameParticipants.map((p, idx) => {
              const pos = positions[idx];
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.card, { position: 'absolute', left: pos.x, top: pos.y }]}
                  onPress={() => openPlayerModal(p)}
                >
                  <Text style={styles.cardText}>{p.name}</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Modal jugador */}
        <Modal visible={!!playerModal} transparent animationType="none">
          {playerModal && (
            <Animated.View style={[styles.playerModalContainer, { opacity: fadeAnim }]}>
              <View style={styles.playerModalContent}>
                <Image source={{ uri: playerModal.photo }} style={styles.playerPhoto} />
                <Text style={styles.playerName}>{playerModal.name}</Text>
                <Text style={styles.playerRole}>{playerModal.playerName}</Text>
                <Button title="Cerrar" onPress={closePlayerModal} />
              </View>
            </Animated.View>
          )}
        </Modal>

        {/* Modal crear partida */}
        <Modal visible={modalVisible} animationType="slide">
          <ImageBackground source={backgroundModal} style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Crear Partida</Text>
            <Text style={{ color: 'white' }}>Selecciona número de impostores:</Text>
            <View style={styles.impostorButtons}>
              {[1, 2, 3].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.impostorButton,
                    numImpostors === num && styles.impostorSelected,
                  ]}
                  onPress={() => setNumImpostors(num)}
                >
                  <Text style={styles.impostorText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: 'white' }}>Selecciona jugadores:</Text>
            {profiles.map((item) => {
              const selected = !!selectedParticipants.find((p) => p.id === item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.participantItem,
                    selected && styles.selectedParticipant,
                  ]}
                  onPress={() => toggleSelectParticipant(item)}
                >
                  <Text style={{ color: 'white' }}>{item.name.toLocaleUpperCase()}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.ButtonRed}
              onPress={() => setModalVisible(false)}
              >
              <Text style={{ color: 'white'}}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.Button}
              onPress={createGame}
              >
              <Text style={{ color: 'white'}}>Crear Partida</Text>
            </TouchableOpacity>
          </ImageBackground>
        </Modal>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, 
    padding: 20 
  },
  logoTop: { 
    width: 120, 
    height: 120, 
    alignSelf: 'center', 
  },
  topButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginBottom: 10 
  },
  roundMessage: { 
    textAlign: 'center', 
    color: '#00f', 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  Button: {
    backgroundColor: '#28A745',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 6,
  },
  ButtonRed: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 6,
  },
  card: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  cardText: { 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  modalContainer: { 
    flex: 1, 
    padding: 20, 
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    textAlign: "center",
    color: 'white'
  },
  fabButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#28A745',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },  
  impostorButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginVertical: 10 
  },
  impostorButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 8,
    width: 40,
    alignItems: 'center',
  },
  impostorSelected: { 
    borderColor: '#00f', 
    borderWidth: 2 
  },
  impostorText: { 
    fontSize: 16, 
    fontWeight: 'bold',
    color: 'white'
  },
  participantItem: { 
    padding: 13, 
    marginVertical: 2, 
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
    borderRadius: 8,
    borderWidth: .5,
    borderColor: 'white'
  },
  selectedParticipant: { 
    backgroundColor: '#add8e6' 
  },
  playerModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerModalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: 300,
  },
  playerPhoto: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    marginBottom: 10 
  },
  playerName: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 5 
  },
  playerRole: { 
    fontSize: 18, 
    color: '#555', 
    marginBottom: 15 
  },
});

export default GameScreen;


