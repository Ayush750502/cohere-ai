// screens/Login.tsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { RootStackParamList, User } from '../defination';
import { login } from '../redux/authSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().min(6, 'Min 6 characters').max(15, 'Max 15 characters').required('Required'),
});

export default function Login({ navigation }: Props) {
  const dispatch = useDispatch();

  const onSubmit = async (values: { email: string; password: string }) => {
    try {
      const stored = await AsyncStorage.getItem('users');
      const users: User[] = stored ? JSON.parse(stored) : [];

      const found = users.find(
        (u) =>
          u.email.toLowerCase() === values.email.toLowerCase() &&
          u.password === values.password
      );

      if (!found) {
        Alert.alert('Login failed', 'Invalid email or password.');
        return;
      }

      // Update Redux auth and persist session
      dispatch(login(found)); // sets isLoggedIn=true, currentUser
      await AsyncStorage.setItem('currentUser', JSON.stringify(found));

      // DO NOT navigate manually — Router switches to Drawer automatically.
      // If you insist on navigating explicitly with the root setup above:
      // navigation.reset({ index: 0, routes: [{ name: 'App' }] });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Something went wrong while logging in.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={LoginSchema}
        onSubmit={onSubmit}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          isSubmitting,
        }) => (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              maxLength={50}
            />
            {touched.email && errors.email ? (
              <Text style={styles.error}>{errors.email}</Text>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              autoCapitalize="none"
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              maxLength={15}
            />
            {touched.password && errors.password ? (
              <Text style={styles.error}>{errors.password}</Text>
            ) : null}

            <TouchableOpacity
              onPress={() => handleSubmit()}
              style={[styles.button, isSubmitting ? styles.buttonDisabled : null]}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? 'Logging in...' : 'Log In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}
              style={styles.linkBtn}
            >
              <Text style={styles.linkText}>Create an account</Text>
            </TouchableOpacity>
          </>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 8,
  },
  error: { color: 'red', marginBottom: 6 },
  button: {
    backgroundColor: '#1f6feb', paddingVertical: 12, borderRadius: 8,
    alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  linkBtn: { marginTop: 12, alignItems: 'center' },
  linkText: { color: '#1f6feb', fontWeight: '500' },
});
