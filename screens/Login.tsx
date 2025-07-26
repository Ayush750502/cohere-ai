
import { Text, View } from 'react-native'
import { styles } from '../styles';

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from '../defination';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

import { LoginSchema } from '../schemas';

export default function Login({navigation} : Props){
    return<View style={styles.container}>
        <Text>Login Page</Text>
    </View>;
}