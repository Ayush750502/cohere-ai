import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, User, chat, conversations } from '../defination';

const {EXPO_PUBLIC_API_KEY} = process.env ;
type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const Chat = ({ route }: Props) => {
  const [messages, setMessages] = useState<chat[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const loadOrCreateConversation = async () => {
      const currentEmail = await AsyncStorage.getItem('currentUser');
      if (!currentEmail) return;
      setEmail(currentEmail);

      if (route.params?.conversationId) {
        const convoRaw = await AsyncStorage.getItem(`conversation-${currentEmail}-${route.params.conversationId}`);
        if (convoRaw) {
          const convo = JSON.parse(convoRaw) as conversations;
          setConversationId(convo.id);
          setMessages(convo.conversation);
          return;
        }
      }

      const newId = Date.now();
      const newConvo: conversations = { id: newId, conversation: [] };
      await AsyncStorage.setItem(`conversation-${currentEmail}-${newId}`, JSON.stringify(newConvo));

      const usersRaw = await AsyncStorage.getItem('users');
      const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
      const updatedUsers = users.map(user => {
        if (user.email === currentEmail) {
          user.conversations.push(newId);
        }
        return user;
      });
      await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));

      setConversationId(newId);
    };

    loadOrCreateConversation();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || conversationId === null || !email) return;

    const userMsg: chat = { role: 0, message: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(
        'https://api.cohere.ai/v1/chat',
        {
          model: 'command-r-plus',
          message: input,
          chat_history: updatedMessages.map((m) => ({
            role: m.role === 0 ? 'USER' : 'CHATBOT',
            message: m.message,
          })),
          temperature: 0.3,
          stream: false,
        },
        {
          headers: {
            Authorization: `Bearer ${EXPO_PUBLIC_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const botReply: chat = { role: 1, message: res.data.text || '...' };
      const fullConversation = [...updatedMessages, botReply];
      setMessages(fullConversation);

      const conversationObj: conversations = {
        id: conversationId,
        conversation: fullConversation,
      };
      await AsyncStorage.setItem(`conversation-${email}-${conversationId}`, JSON.stringify(conversationObj));
    } catch (err) {
      console.error('Cohere Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: chat }) => (
    <View
      style={[
        styles.messageContainer,
        item.role === 0 ? styles.userMessage : styles.botMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.message}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type..."
          style={styles.input}
          editable={!loading}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendButtonText}>Send</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Chat;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef2f5', paddingTop: 40 },
  messageContainer: { margin: 10, padding: 12, borderRadius: 10, maxWidth: '75%' },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#d1e7dd' },
  botMessage: { alignSelf: 'flex-start', backgroundColor: '#f8d7da' },
  messageText: { fontSize: 16 },
  inputContainer: { position: 'absolute', bottom: 10, flexDirection: 'row', paddingHorizontal: 10, width: '100%' },
  input: { flex: 1, height: 45, backgroundColor: 'white', borderRadius: 25, paddingHorizontal: 15, borderColor: '#ccc', borderWidth: 1 },
  sendButton: { marginLeft: 10, backgroundColor: '#0d6efd', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25 },
  sendButtonText: { color: 'white', fontWeight: 'bold' },
});
