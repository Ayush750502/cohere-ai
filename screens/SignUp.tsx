import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import { RootStackParamList, User } from '../defination';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

type SignUpForm = {
  username: string;
  email: string;
  dob: string;          // DD/MM/YYYY (Formik value)
  countryCode: string;  // 3 digits
  phone: string;        // 10 digits
  password: string;
  confirmPassword: string;
};

// --- date helpers ---
const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const formatDateDDMMYYYY = (dt: Date) =>
  `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}/${dt.getFullYear()}`;

const isValidDateDDMMYYYY = (v?: string) => {
  if (!v) return false;
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return false;
  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const y = parseInt(m[3], 10);
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
};

const toDate = (v: string) => {
  const [dd, mm, yyyy] = v.split('/');
  return new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10));
};

// (Optional) sensible DOB bounds
const today = new Date();
const hundredYearsAgo = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
const thirteenYearsAgo = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());

// --- validation ---
const SignUpSchema = Yup.object({
  username: Yup.string()
    .max(20, 'Max 20 characters')
    .required('Username is required'),
  email: Yup.string()
    .email('Invalid email')
    .max(50, 'Max 50 characters')
    .required('Email is required'),
  dob: Yup.string()
    .matches(/^\d{2}\/\d{2}\/\d{4}$/, 'Use DD/MM/YYYY')
    .test('is-valid-date', 'Invalid date', (value) => isValidDateDDMMYYYY(value || ''))
    // Optional min-age check
    .test('min-age', 'You must be at least 13 years old', (value) => {
      if (!value || !isValidDateDDMMYYYY(value)) return false;
      return toDate(value) <= thirteenYearsAgo;
    })
    .required('Date of birth is required'),
  countryCode: Yup.string()
    .matches(/^\d{2}$/, 'Must be of atleast 2 digits')
    .required('Country code is required'),
  phone: Yup.string()
    .matches(/^\d{10}$/, 'Must be 10 digits')
    .required('Phone is required'),
  password: Yup.string()
    .min(6, 'Min 6 characters')
    .max(15, 'Max 15 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

export default function SignUp({ navigation }: Props) {
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const initialValues: SignUpForm = {
    username: '',
    email: '',
    dob: '',
    countryCode: '',
    phone: '',
    password: '',
    confirmPassword: '',
  };

  const handleSubmitForm = useCallback(async (values: SignUpForm) => {
    try {
      // (Optional) prevent duplicate email
      const existing = await AsyncStorage.getItem('users');
      const list: User[] = existing ? JSON.parse(existing) : [];
      const dup = list.some(
        (u) => u.email.toLowerCase() === values.email.toLowerCase()
      );
      if (dup) {
        Alert.alert('Email already used', 'Try logging in instead.');
        navigation.navigate('Login');
        return;
      }

      const fullPhoneNumber = Number(`${values.countryCode}${values.phone}`);

      const newUser: User = {
        username: values.username,
        email: values.email,
        password: values.password,
        dob: toDate(values.dob), // convert to Date
        phone: fullPhoneNumber,
        // default image from assets
        profileImage: '',
        conversations: [],
      };

      list.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(list));

      Alert.alert('Success', 'Account created. Please log in.');
      navigation.navigate('Login');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Something went wrong while creating your account.');
    }
  }, [navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create your account</Text>

      <Formik
        initialValues={initialValues}
        validationSchema={SignUpSchema}
        onSubmit={handleSubmitForm}
        validateOnBlur
        validateOnChange
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          setFieldValue,
          isValid,
          dirty,
          isSubmitting,
        }) => (
          <View style={styles.form}>
            {/* Username */}
            <TextInput
              style={styles.input}
              placeholder="Username (max 20)"
              value={values.username}
              onChangeText={handleChange('username')}
              onBlur={handleBlur('username')}
              maxLength={20}
              autoCapitalize="words"
            />
            {touched.username && errors.username ? <Text style={styles.error}>{errors.username}</Text> : null}

            {/* Email */}
            <TextInput
              style={styles.input}
              placeholder="Email (max 50)"
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={50}
            />
            {touched.email && errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

            {/* DOB (modal date picker) */}
            <Pressable onPress={() => setDatePickerVisible(true)}>
              <View pointerEvents="none">
                <TextInput
                  style={styles.input}
                  placeholder="Date of Birth (DD/MM/YYYY)"
                  value={values.dob}
                  editable={false}
                />
              </View>
            </Pressable>
            {touched.dob && errors.dob ? <Text style={styles.error}>{errors.dob}</Text> : null}

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              maximumDate={thirteenYearsAgo}
              minimumDate={hundredYearsAgo}
              onConfirm={(date) => {
                setDatePickerVisible(false);
                const formatted = formatDateDDMMYYYY(date);
                setFieldValue('dob', formatted);
              }}
              onCancel={() => setDatePickerVisible(false)}
            />

            {/* Country Code (default keyboard, max 3) */}
            <TextInput
              style={styles.input}
              placeholder="Country Code (3 digits)"
              value={values.countryCode}
              onChangeText={(t) =>
                setFieldValue('countryCode', t.replace(/\D/g, '').slice(0, 3))
              }
              onBlur={handleBlur('countryCode')}
              // keyboardType now default (no numeric keyboard)
              maxLength={3} // extra guard at UI level
            />
            {touched.countryCode && errors.countryCode ? <Text style={styles.error}>{errors.countryCode}</Text> : null}

            {/* Phone (keep numeric keyboard) */}
            <TextInput
              style={styles.input}
              placeholder="Phone (10 digits)"
              value={values.phone}
              onChangeText={(t) =>
                setFieldValue('phone', t.replace(/\D/g, '').slice(0, 10))
              }
              onBlur={handleBlur('phone')}
              keyboardType="number-pad" // numeric keyboard kept ONLY for phone
              maxLength={10}
            />
            {touched.phone && errors.phone ? <Text style={styles.error}>{errors.phone}</Text> : null}

            {/* Password */}
            <TextInput
              style={styles.input}
              placeholder="Password (max 15)"
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              secureTextEntry
              maxLength={15}
              autoCapitalize="none"
            />
            {touched.password && errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}

            {/* Confirm Password */}
            <TextInput
              style={styles.input}
              placeholder="Confirm Password (max 15)"
              value={values.confirmPassword}
              onChangeText={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              secureTextEntry
              maxLength={15}
              autoCapitalize="none"
            />
            {touched.confirmPassword && errors.confirmPassword ? <Text style={styles.error}>{errors.confirmPassword}</Text> : null}

            {/* Submit */}
            <TouchableOpacity
              onPress={() => handleSubmit()}
              style={[styles.button, !(isValid && dirty) || isSubmitting ? styles.buttonDisabled : null]}
              disabled={!(isValid && dirty) || isSubmitting}
            >
              <Text style={styles.buttonText}>{isSubmitting ? 'Creating...' : 'Sign Up'}</Text>
            </TouchableOpacity>

            {/* Link to Login */}
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkBtn}>
              <Text style={styles.linkText}>Already have an account? Log in</Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
  form: { gap: 8 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 16,
  },
  error: { color: 'red', marginBottom: 4 },
  button: {
    backgroundColor: '#1f6feb', paddingVertical: 12, borderRadius: 8,
    alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  linkBtn: { marginTop: 12, alignItems: 'center' },
  linkText: { color: '#1f6feb', fontWeight: '500' },
});
