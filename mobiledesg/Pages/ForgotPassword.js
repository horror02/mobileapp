import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet} from 'react-native';

const ForgotPassword = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [pinNumber, setPin] = useState('');

  const handleResetPassword = () => {

    

    navigation.goBack(); 
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        keyboardType="user-name"
      />
      <TextInput
        style={styles.input}
        placeholder="Pin"
        value={pinNumber}
        onChangeText={setPin}
        keyboardType="pin-number"
      />
      <TouchableOpacity onPress={handleResetPassword} style={styles.button}>
        <Text style={styles.buttonText}>Reset Password</Text>
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
    borderRadius: 0,
    color: '#fff',
  },
  button: {
    width: '50%',
    marginTop: 10,
    padding: 10,
    borderRadius: 50,
    backgroundColor: 'green',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ForgotPassword;
