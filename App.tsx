
import { View, Text } from 'react-native';

import { styles } from "./styles";

import Login from './screens/login';

export default function App() {
  return (
    <View style={styles.container}>
      <Login />
    </View>
  );
}
