// App.tsx
import 'react-native-gesture-handler'; // required by Drawer (keep first)
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, LogBox } from 'react-native';
import { Provider, useDispatch } from 'react-redux';

import Router from './navigation/Router';
import store from './redux/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUser } from './redux/authSlice';


LogBox.ignoreLogs([
  "The action 'RESET' with payload", // partial text match is enough
]);

function SessionBootstrapper() {
  const dispatch = useDispatch();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('currentUser');
        if (saved) {
          const user = JSON.parse(saved);
          dispatch(setUser(user)); // sets isLoggedIn=true and currentUser
        }
      } finally {
        setBootstrapped(true);
      }
    })();
  }, [dispatch]);

  if (!bootstrapped) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Router />;
}

export default function App() {
  return (
    <Provider store={store}>
      <SessionBootstrapper />
    </Provider>
  );
}
