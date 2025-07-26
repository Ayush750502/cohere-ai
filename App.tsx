
import { View } from 'react-native';

import { styles } from "./styles";

import Login from './screens/Login';

export default function App() {
  return (
    <View style={styles.container}>
      <Login />
    </View>
  );
}
