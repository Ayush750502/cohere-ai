
import { Text, View } from 'react-native'
import { styles } from '../styles';
import { RootStackParamList } from '../defination';
import { NativeStackScreenProps } from "@react-navigation/native-stack"

type Props = NativeStackScreenProps<RootStackParamList>

import { SignUpSchema } from '../schemas';
export default function SignUp(
    {navigation} : Props
){
    return<View style={styles.container}>
        <Text>SignUp Page</Text>
    </View>;
}