import React from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

import Login from './screens/Login';

export default function Router(){
    return(<NavigationContainer>
        <Stack.Navigator initialRouteName="Login" >
            <Stack.Screen name="Login"  component={Login} />
        </Stack.Navigator>
    </NavigationContainer>);
}

