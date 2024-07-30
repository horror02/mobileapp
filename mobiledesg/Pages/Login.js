import React, { useState, useContext } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../App'; // Assuming correct path to UserContext

const Login = ({ navigation }) => {
  const { updateSchoolId, updateRfidTags } = useContext(UserContext);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const clearAsyncStorage = async () => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`http://172.22.37.36:3000/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Login Response Data:', data);
  
        if (data.success && data.token && data.schoolId) {
          await AsyncStorage.setItem('token', data.token);
          await AsyncStorage.setItem('schoolId', JSON.stringify(data.schoolId));
          updateSchoolId(data.schoolId);
  
          const rfidTagsString = JSON.stringify(data.rfidTags);
          await AsyncStorage.setItem('rfidTags', rfidTagsString);
          updateRfidTags(data.rfidTags);
  
          navigation.navigate('Dashboard', { schoolId: data.schoolId }); // Pass schoolId to Profile
        } else {
          console.warn('Login failed:', data.message);
          Alert.alert('Login Failed', 'Invalid username or password');
        }
      } else {
        console.warn('Login request failed with status:', response.status);
        Alert.alert('Login Failed', 'Invalid username or password');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An error occurred while trying to login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GreenRewards</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry={true}
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity onPress={handleLogin} style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'darkgreen',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
  },
  input: {
    width: '80%',
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 5, // Changed to a lower value for a more subtle effect
    color: '#fff',
  },
  button: {
    width: '50%',
    marginTop: 10,
    padding: 10,
    borderRadius: 20, // Changed to a lower value for a more subtle effect
    backgroundColor: 'green',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Login;
