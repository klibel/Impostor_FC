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
  FlatList,
  Pressable
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { players } from '../Data/Players';
import { MaterialIcons } from '@expo/vector-icons'; // o react-native-vector-icons


const backgroundGame = require('../assets/backgroundGame.png');
const backgroundModal = require('../assets/backgroundModal.png');
const IconLogo = require('../assets/iconApp.png');
const IconPlayer = require('../assets/user.png');

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
  const [disabledCards, setDisabledCards] = useState<string[]>([]);
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
    setDisabledCards([]); // desbloquea todas las cartas
    setTimeout(() => setRoundMessage(''), 2000);
  };

  const deleteGame = () => {
    setGameParticipants([]);
    setDisabledCards([]); // desbloquea todas las cartas
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

  const radius = 130; // un poco más de distancia
  const cardSize = 80; // tu tamaño real de carta
  
  const centerX = width / 2; // centro real de la pantalla
  const centerY = height / 2;
  
  // Cálculo corregido
  const positions = gameParticipants.map((_, idx) => {
    const offset = -Math.PI / 2;
    const angle = (2 * Math.PI * idx) / gameParticipants.length + offset;
    const x = centerX + radius * Math.cos(angle) - cardSize / 2;
    const y = centerY + radius * Math.sin(angle) - cardSize / 2;
    return { x, y };
  });
  

  return (
    <ImageBackground source={backgroundGame} style={{ flex: 1 }}>
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
                  style={[styles.ButtonRed, {width: '45%'}]}
                  onPress={deleteGame}
                >
                 <Text style={{ color: 'white', fontWeight: 'bold'}}>Eliminar Partida</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.Button, {width: '45%'}]}
                onPress={newRound}
              >
                <Text style={{ color: 'white', fontWeight: 'bold'}}>Nueva Ronda</Text>
              </TouchableOpacity>
            </View>

            {roundMessage !== '' && (
              <Text style={styles.roundMessage}>{roundMessage}</Text>
            )}

            {/* Logo central en el medio */}
            <Image
              source={IconLogo}
              style={{
                width: 90,
                height: 90,
                position: 'absolute',
                top: height / 2 - 45,
                left: width / 2 - 45,
              }}
            />

            {/* Cartas alrededor del logo */}
            {gameParticipants.map((p, idx) => {
              const pos = positions[idx];
              return (
                <TouchableOpacity
                  key={p.id}
                  disabled={disabledCards.includes(p.id)}
                  style={[
                    styles.card,
                    { position: 'absolute', left: pos.x, top: pos.y },
                    disabledCards.includes(p.id) && { opacity: 0.3 }, // se ve “bloqueada”
                  ]}
                  onPress={() => {
                    if (!disabledCards.includes(p.id)) {
                      openPlayerModal(p);
                      setDisabledCards((prev) => [...prev, p.id]);
                    }
                  }}
                >
                  {p.photo ? (
                    <Image source={{ uri: p.photo }} style={styles.avatarCard} />
                  ) : (
                    <Image source={IconPlayer} style={styles.avatarCard}/>
                  )} 
                  <Text style={styles.cardText}>{p.name.toLocaleUpperCase().split(' ')[0]}</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Modal jugador */}
        <Modal visible={!!playerModal} transparent animationType="none">
          {playerModal && (
            <Pressable
              style={styles.modalOverlay}
              onPress={closePlayerModal}
            >
              <Animated.View style={[styles.playerModalContainer, { opacity: fadeAnim }]}>
                {playerModal.photo ? (
                    <Image source={{ uri: playerModal.photo }} style={styles.playerPhoto} />
                  ) : (
                    <Image source={IconPlayer} style={styles.playerPhoto}/>
                  )} 
                  <Text style={styles.playerName}>{playerModal.name.toLocaleUpperCase().split(' ').slice(0, 2).join(' ')}</Text>
                  
                  {playerModal.isImpostor ? (
                    <Text style={styles.playerRoleImpostor}>IMPOSTORCITO</Text>
                  ) : (
                    <Text style={styles.playerRole}>{playerModal.playerName?.toLocaleUpperCase()}</Text>
                  )}
                  
                  <TouchableOpacity style={styles.closeButton} onPress={closePlayerModal}>
                    <Text style={styles.closeText}>❌</Text>
                  </TouchableOpacity>
              </Animated.View>
            </Pressable>
          )}
        </Modal>


        {/* Modal crear partida */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <ImageBackground source={backgroundModal} style={styles.modalContainer}>
              <View style={{ maxHeight: '90%'}}>
                <Text style={styles.modalTitle}>Crear Partida</Text>
              
                <Text style={{ color: 'white', marginVertical: 5 }}>Selecciona número de impostores:</Text>

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

                <Text style={{ color: 'white', marginBottom: 8 }}>Selecciona jugadores:</Text>

                {/* Aquí agregamos el scroll */}
                <FlatList
                  data={profiles}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={styles.participantList}
                  showsVerticalScrollIndicator={false}
                  style={{ flexGrow: 0, maxHeight: 'auto' }} // altura máxima para scroll dentro del modal
                  renderItem={({ item }) => {
                    const selected = !!selectedParticipants.find((p) => p.id === item.id);
                    return (
                      <TouchableOpacity
                        style={[
                          styles.participantItem,
                          selected && styles.selectedParticipant,
                        ]}
                        onPress={() => toggleSelectParticipant(item)}
                      >
                        {item.photo ? (
                          <Image source={{ uri: item.photo }} style={styles.avatar} />
                        ) : (
                          <Image source={IconPlayer} style={styles.avatar}/>
                        )}
                        <Text style={{ color: 'white', marginLeft: 10, fontWeight: 'bold' }}>{item.name.toUpperCase().split(' ').slice(0, 2).join(' ')}</Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={styles.ButtonRed}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.Button}
                  onPress={createGame}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Crear Partida</Text>
                </TouchableOpacity>
              </View>
          </ImageBackground>
        </Modal>

      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, 
    padding: 10,
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
    color: 'red', 
    fontWeight: 'bold', 
    marginBottom: 15 
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
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#28A745',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  avatarCard: {
    width: 45, 
    height: 45, 
    borderRadius: 22.5,
    borderColor: '#28A745',
    borderWidth: 2, 
    position: 'absolute',
    top: -22.5,
    backgroundColor: 'white'
  },
  cardText: { 
    fontSize: 8, 
    fontWeight: 'bold',
    color: '#28A745'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerModalContainer: {
    width: '85%',
    maxWidth: 400,
    height: 230,
    backgroundColor: '#FFD700',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerPhoto: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 6,
    borderColor: '#FFD700',
    marginBottom: 12,
    position: 'absolute',
    top: -75
  },
  playerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28A745',
    textAlign: 'center',
    marginBottom: 4,
  },
  playerRole: {
    fontSize: 18,
    color: '#222',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  playerRoleImpostor: {
    fontSize: 16,
    color: 'red',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 4,
  },
  closeButton: {
    backgroundColor: 'rgb(255, 217, 0)',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'red',
    elevation: 3,
    position: 'absolute',
    bottom: -70,
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
  },
  
  modalContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 15,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  impostorButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 5,
  },
  impostorButton: {
    padding: 8,
    marginHorizontal: 8,
    borderRadius: 8,
    borderColor: 'white',
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20,
    borderColor: 'white',
    borderWidth: 2, 
    backgroundColor: 'white'
  },
  impostorSelected: {
    borderWidth: 1,
    borderColor: '#28A745',
  },
  participantList: {
    width: '100%',
  },
  participantItem: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderColor: 'white',
    borderWidth: .5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center'
  },
  selectedParticipant: {
    borderWidth: 1,
    borderColor: '#28A745',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
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
  impostorText: {
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 4,
    marginHorizontal: 8
  },
});

export default GameScreen;


