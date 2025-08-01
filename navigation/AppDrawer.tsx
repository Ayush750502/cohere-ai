// AppDrawer.tsx
import React, { useCallback, useState } from 'react';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import Dashboard from '../screens/Dashboard';
import Chat from '../screens/Chat';
import { logout } from '../redux/authSlice';
import { RootStackParamList, User, conversations } from '../defination';
import { useFocusEffect } from '@react-navigation/native';

const Drawer = createDrawerNavigator<RootStackParamList>();

function CustomDrawerContent(props: any) {
  const dispatch = useDispatch();
  const email = JSON.parse(props.email).email;
  const [conversationIds, setConversationIds] = useState<number[]>([]);
  const [conversationTitles, setConversationTitles] = useState<Record<number, string>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useFocusEffect(
    useCallback(() => {
      const fetchUserConversations = async () => {
        const usersJSON = await AsyncStorage.getItem('users');
        const users: User[] = usersJSON ? JSON.parse(usersJSON) : [];
        const user = users.find(u => u.email === email);
        if (!user) return;

        const ids = user.conversations || [];
        setConversationIds(ids);

        const titles: Record<number, string> = {};
        for (const id of ids) {
          const convoJSON = await AsyncStorage.getItem(`conversation-${email}-${id}`);
          if (convoJSON) {
            const convo: conversations = JSON.parse(convoJSON);
            titles[id] = convo.title || `Conversation #${id}`;
          }
        }
        setConversationTitles(titles);
      };
      fetchUserConversations();
    }, [email])
  );

  const handleNewConversation = async () => {
    if (!email) return;
    const newId = Date.now();
    const newConvo: conversations = { id: newId, title: `Conversation #${newId}`, conversation: [] };
    await AsyncStorage.setItem(`conversation-${email}-${newId}`, JSON.stringify(newConvo));
    const usersRaw = await AsyncStorage.getItem('users');
    const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
    const updatedUsers = users.map((user) => {
      if (user.email === email) user.conversations.push(newId);
      return user;
    });
    await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
    setConversationIds(prev => [...prev, newId]);
    setConversationTitles(prev => ({ ...prev, [newId]: newConvo.title! }));
    props.navigation.navigate('Chat', { conversationId: newId });
  };

  const handleLoadConversation = (id: number) => {
    props.navigation.navigate('Chat', { conversationId: id });
  };

  const handleLongPress = (id: number) => {
    setSelectedId(id);
    setEditTitle(conversationTitles[id]);
    setModalVisible(true);
  };

  const handleSaveTitle = async () => {
    if (selectedId == null || !email) return;
    const convoJSON = await AsyncStorage.getItem(`conversation-${email}-${selectedId}`);
    if (!convoJSON) return;
    const convo: conversations = JSON.parse(convoJSON);
    convo.title = editTitle;
    await AsyncStorage.setItem(`conversation-${email}-${selectedId}`, JSON.stringify(convo));
    setConversationTitles(prev => ({ ...prev, [selectedId]: editTitle }));
    setModalVisible(false);
  };

  const handleDeleteConversation = async () => {
    if (selectedId == null || !email) return;
    await AsyncStorage.removeItem(`conversation-${email}-${selectedId}`);

    const usersRaw = await AsyncStorage.getItem('users');
    const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
    const updatedUsers = users.map((user) => {
      if (user.email === email) {
        user.conversations = user.conversations.filter(cid => cid !== selectedId);
      }
      return user;
    });
    await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));

    setConversationIds(prev => prev.filter(id => id !== selectedId));
    setConversationTitles(prev => {
      const newTitles = { ...prev };
      delete newTitles[selectedId];
      return newTitles;
    });
    setModalVisible(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('currentUser');
    dispatch(logout());
    const rootNav = props.navigation.getParent();
    rootNav?.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.section}>
        <TouchableOpacity style={styles.newBtn} onPress={handleNewConversation}>
          <Text style={styles.newBtnText}>+ New Conversation</Text>
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Your Conversations</Text>
        {conversationIds.length === 0 && <Text style={styles.noConvos}>No conversations yet.</Text>}
        {conversationIds.map((id) => (
          <TouchableOpacity
            key={id}
            onPress={() => handleLoadConversation(id)}
            onLongPress={() => handleLongPress(id)}>
            <Text style={styles.convoItem}>{conversationTitles[id] || `Conversation #${id}`}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <DrawerItemList {...props} />
      <DrawerItem label="Logout" onPress={handleLogout} />

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Edit Title</Text>
            <TextInput
              style={styles.input}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Enter conversation title"
            />
            <View style={styles.modalBtns}>
              <Pressable onPress={handleSaveTitle} style={styles.modalBtn}><Text>Save</Text></Pressable>
              <Pressable onPress={handleDeleteConversation} style={styles.modalBtn}><Text>Delete</Text></Pressable>
              <Pressable onPress={() => setModalVisible(false)} style={styles.modalBtn}><Text>Cancel</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </DrawerContentScrollView>
  );
}

export default function AppDrawer() {
  const [email, setEmail] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchCurrentUser = async () => {
        const userEmail = await AsyncStorage.getItem('currentUser');
        if (userEmail) setEmail(userEmail);
      };
      fetchCurrentUser();
    }, [])
  );

  if (!email) return null;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} email={email} />} 
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        drawerItemStyle: route.name === 'Chat' ? { display: 'none' } : undefined
      })}
    >
      <Drawer.Screen name="Dashboard" component={Dashboard} />
      <Drawer.Screen name="Chat" component={Chat} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 15, marginBottom: 10 },
  newBtn: { backgroundColor: '#007bff', padding: 10, borderRadius: 6, marginBottom: 10, alignItems: 'center' },
  newBtnText: { color: '#fff', fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  convoItem: { paddingVertical: 6, paddingLeft: 10, fontSize: 15, color: '#333' },
  noConvos: { fontStyle: 'italic', color: '#777', paddingLeft: 10 },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalBox: { backgroundColor: '#fff', margin: 30, padding: 20, borderRadius: 10 },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  modalBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#eee', borderRadius: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6, marginTop: 10 },
});
