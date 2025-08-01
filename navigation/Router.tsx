// Router.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

import Login from '../screens/Login';
import SignUp from '../screens/SignUp';
import AppDrawer from './AppDrawer';
import { RootStackParamList } from '../defination';

const Root = createNativeStackNavigator<RootStackParamList>();

function AuthStack() {
  const Auth = createNativeStackNavigator<RootStackParamList>();
  return (
    <Auth.Navigator initialRouteName="Login">
      <Auth.Screen name="Login" component={Login} />
      <Auth.Screen name="SignUp" component={SignUp} />
    </Auth.Navigator>
  );
}

export default function Router() {
  const isLoggedIn = useSelector((s: any) => s.auth.isLoggedIn);

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Root.Screen name="AppDrawer" component={AppDrawer} />
        ) : (
          <Root.Screen name="Auth" component={AuthStack} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}