
import { View } from 'react-native';

import { styles } from "./styles";

import Router from './Router';

export default function App() {
  return (
    <View style={styles.container}>
      <Router />
    </View>
  );
}
