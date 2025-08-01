// Chat.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { chat, conversations, role } from '../defination';
import { useNavigation, useRoute } from '@react-navigation/native';

const { EXPO_PUBLIC_API_KEY } = process.env;

export default function Chat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<chat[]>([]);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { conversationId, conversationTitle } = route.params;

  useEffect(() => {
    const loadConversation = async () => {
      const email = await AsyncStorage.getItem('currentUser');
      if (!email || !conversationId) return;
      const convoJSON = await AsyncStorage.getItem(`conversation-${email}-${conversationId}`);
      if (convoJSON) {
        const convo: conversations = JSON.parse(convoJSON);
        setMessages(convo.conversation);
        navigation.setOptions({ title: conversationTitle || `Conversation #${convo.id}` });
      }
    };
    loadConversation();
  }, [conversationId, conversationTitle]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const email = await AsyncStorage.getItem('currentUser');
    if (!email || !conversationId) return;

    const newMessages: chat[] = [
      ...messages,
      { role: role.user, message: input },
    ];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(
        'https://api.cohere.ai/v1/chat',
        {
          model: 'command-r-plus',
          message: input,
          chat_history: newMessages.map(m => ({ role: role[m.role] === 'user' ? 'USER' : 'CHATBOT', message: m.message })),
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

      const reply = response.data.text;
      const updatedMessages: chat[] = [
        ...newMessages,
        { role: role.assistant, message: reply },
      ];
      setMessages(updatedMessages);
      await AsyncStorage.setItem(
        `conversation-${email}-${conversationId}`,
        JSON.stringify({ id: conversationId, conversation: updatedMessages })
      );
    } catch (error) {
      console.error('Cohere Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: chat }) => (
    <View
      style={[
        styles.message,
        item.role === role.user ? styles.userMessage : styles.assistantMessage,
      ]}>
      <Text style={styles.messageText}>{item.message}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Send</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  chatContainer: { padding: 10 },
  message: {
    padding: 10,
    marginVertical: 4,
    borderRadius: 8,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#d1e7dd',
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    backgroundColor: '#f8d7da',
    alignSelf: 'flex-start',
  },
  messageText: { fontSize: 16 },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sendText: { color: '#fff', fontWeight: 'bold' },
});
