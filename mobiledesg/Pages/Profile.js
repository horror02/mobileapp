import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Profile = ({ route, navigation }) => {
  const { schoolId } = route?.params || {};
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    schoolId: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedSchoolId = await AsyncStorage.getItem('schoolId');
        console.log('Stored schoolId:', storedSchoolId); // Check if schoolId is retrieved
        
        if (storedSchoolId) {
          const response = await fetch(`http://172.22.37.36:3000/userData?schoolId=${storedSchoolId}`);
          const data = await response.json();
          console.log('User data from API:', data); // Check the entire user data received from the API
          
          if (data.success) {
            setUserData(data.userData);
          } else {
            console.error('Error fetching user data:', data.message);
            Alert.alert('Error', 'Failed to fetch user data');
          }
        } else {
          console.error('No schoolId stored in AsyncStorage');
          Alert.alert('Error', 'No schoolId stored');
        }
      } catch (error) {
        console.error('Fetch error:', error);
        Alert.alert('Error', 'An error occurred while fetching user data');
      } finally {
        setIsLoading(false); // Set loading state to false after fetching data
      }
    };
  
    fetchUserData();
  }, []);

  const handleChangePassword = () => {
    if (!userData.schoolId) {
      Alert.alert('Error', 'No schoolId found');
      return;
    }
    navigation.navigate('ChangePassword', { schoolId: userData.schoolId });
  };

  const handleChangePin = () => {
    // Implement change PIN logic here
    Alert.alert('Change PIN', 'Change PIN functionality will be implemented here.');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="darkgreen" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.infoBox}>
        <View style={styles.infoContainer}>
          <View style={[styles.box, { width: '100%' }]}>
            <Text style={styles.label}>First Name:</Text>
            <Text style={[styles.text, styles.centerText]}>{userData.firstName}</Text>
          </View>
        </View>
        <View style={styles.infoContainer}>
          <View style={[styles.box, { width: '100%' }]}>
            <Text style={styles.label}>Last Name:</Text>
            <Text style={[styles.text, styles.centerText]}>{userData.lastName}</Text>
          </View>
        </View>
        <View style={styles.infoContainer}>
          <View style={[styles.box, { width: '100%' }]}>
            <Text style={styles.label}>Middle Name:</Text>
            <Text style={[styles.text, styles.centerText]}>{userData.middleName}</Text>
          </View>
        </View>
        <View style={styles.infoContainer}>
          <View style={[styles.box, { width: '100%' }]}>
            <Text style={styles.label}>School ID:</Text>
            <Text style={[styles.text, styles.centerText]}>{userData.schoolId}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
        <Text style={styles.buttonText}>Change Password</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleChangePin}>
        <Text style={styles.buttonText}>Change PIN</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f9e6',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'darkgreen',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: 'white',
    borderColor: 'darkgreen',
    borderWidth: 2,
    borderRadius: 10,
    padding: 10,
    width: '100%',
    alignItems: 'flex-start', // Align children to the left
  },
  infoContainer: {
    marginBottom: 15,
    flexDirection: 'row', // Align label and text in a row
  },
  box: {
    backgroundColor: '#e6f9e6',
    borderRadius: 20,
    borderColor: 'darkgreen',
    borderWidth: 2,
    padding: 8,
    marginRight: 10,
    justifyContent: 'center', // Center content vertically
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10, // Add spacing between label and text
  },
  text: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'darkgreen',
  },
  centerText: {
    textAlign: 'center',
  },
  button: {
    backgroundColor: 'darkgreen',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Profile;
