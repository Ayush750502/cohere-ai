import React from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { RootStackParamList } from './defination';

import Login from './screens/Login';
import SignUp from './screens/SignUp';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Router(){
    return(<NavigationContainer>
        <Stack.Navigator initialRouteName="Login" >
            <Stack.Screen name="Login"  component={Login} />
            <Stack.Screen name="SignUp"  component={SignUp} />
        </Stack.Navigator>
    </NavigationContainer>);
}

