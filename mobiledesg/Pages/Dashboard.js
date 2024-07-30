import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, SafeAreaView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import product1Image from './images/product1.png';
import product2Image from './images/product2.png';
import product3Image from './images/product3.png';
import profileLogo from './images/profileLogo.png';
import historyLogo from './images/historyLogo.png';
import logoutLogo from './images/logoutLogo.png';

const ipAddress = 'http://172.22.37.36:3000';
const espAddress = 'http://172.22.37.35';

const products = [
  {
    productId: 1,
    name: 'red',
    image: product1Image,
  },
  {
    productId: 2,
    name: 'blue',
    image: product2Image,
  },
  {
    productId: 3,
    name: 'black',
    image: product3Image,
  },
];

const Dashboard = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [productPrices, setProductPrices] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    fetchUserData();
    fetchProductPrices();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const schoolId = await AsyncStorage.getItem('schoolId');

      if (!token) {
        console.error('Token not found in AsyncStorage');
        return;
      }
      const response = await fetch(`${ipAddress}/userData?schoolId=${schoolId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setUserData(data.userData);
      } else {
        console.error('Error fetching user data:', data.message);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchProductPrices = async () => {
    try {
      const productIds = products.map(product => product.productId).join(',');
      const response = await fetch(`${ipAddress}/productPrices?productId=${productIds}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setProductPrices(data.prices);
    } catch (error) {
      console.error('Error fetching product prices:', error);
    }
  };

  const navigateToHistory = () => {
    navigation.navigate('History');
  };

  const navigateToProfile = () => {
    navigation.navigate('Profile');
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
      Alert.alert('Error', 'An error occurred while logging out');
    }
  }

  const sendProductIdToESP = async (productId) => {
    try {
      const response = await fetch(`${espAddress}/reward?reward=${productId}`);
      const data = await response.text();
      if (response.ok) {
        Alert.alert('Success', 'Thank You So Much!');
      } else {
        Alert.alert('Error', `Failed to send Product ID to ESP8266: ${data}`);
      }
    } catch (error) {
      console.error('Error sending Product ID to ESP8266:', error);
      Alert.alert('Error', 'Unable to send Product ID to ESP8266. Please try again.');
    }
  };

  const handleOrder = async (product) => {
    const price = productPrices[product.productId];
    if (!price) {
      Alert.alert('Error', 'Price not available');
      return;
    }

    try {
      const checkPendingResponse = await fetch(`${ipAddress}/checkPendingOrders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolId: userData.schoolId,
        }),
      });

      const checkPendingData = await checkPendingResponse.json();

      if (checkPendingData.success && checkPendingData.hasPending) {
        Alert.alert('Error', 'There is already an existing pending order.');
        return;
      }

      const response = await fetch(`${ipAddress}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolId: userData.schoolId,
          productId: product.productId,
          RFIDTags: userData.rfidTags,
          quantity: 1,
          price: price,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Order placed successfully!');
        fetchUserData(); // Refresh user data to reflect the updated points
        await sendProductIdToESP(product.productId); // Send productId to ESP8266
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Unable to place order. Please try again.');
    }
  };

  const handleScroll = (event) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    setScrollPosition(yOffset);
    if (yOffset === 0) {
      fetchUserData();
      fetchProductPrices();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const points = parseFloat(userData?.points || 0).toFixed(2);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Text style={styles.title}>{userData ? `${userData.lastName}'s Dashboard` : 'Loading...'}</Text>
        <View style={styles.userDataContainer}>
          <Text style={styles.userDataTitle}>User Balances</Text>
          {userData && (
            <View style={styles.userDataItem}>
              <Text style={styles.userDataText}>Points: {points}</Text>
            </View>
          )}
        </View>
        <View style={styles.productContainer}>
          {products.map(product => (
            <View key={product.productId} style={styles.productItem}>
              <Image source={product.image} style={styles.productImage} />
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>
                Price: {productPrices[product.productId] ? `${productPrices[product.productId]}` : 'Loading...'}
              </Text>
              <TouchableOpacity style={styles.orderButton} onPress={() => handleOrder(product)}>
                <Text style={styles.orderButtonText}>Order</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View style={styles.navigationBox}>
          <TouchableOpacity style={styles.navButton} onPress={navigateToHistory}>
            <Image source={historyLogo} style={styles.navButtonLogo} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={navigateToProfile}>
            <Image source={profileLogo} style={styles.navButtonLogo} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={handleLogout}>
            <Image source={logoutLogo} style={styles.navButtonLogo} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e6f9e6', // light green background
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6f9e6', // light green background
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    color: 'darkgreen',
  },
  userDataContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
    width: '90%',
    alignItems: 'center',
    borderColor: 'darkgreen',
    borderWidth: 2,
  },
  userDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'darkgreen',
  },
  userDataItem: {
    marginBottom: 5,
  },
  userDataText: {
    fontSize: 16,
    color: 'darkgreen',
  },
  productContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
  },
  productItem: {
    margin: 10,
    alignItems: 'center',
    borderColor: 'darkgreen',
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: '#fff',
    padding: 10,
  },
  productImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: 'darkgreen',
  },
  productPrice: {
    fontSize: 14,
    color: 'darkgreen',
  },
  orderButton: {
    backgroundColor: 'darkgreen',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  orderButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  navigationBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#a8dba8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
  },
  navButton: {
    paddingHorizontal: 10,
  },
  navButtonLogo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'darkgreen',
  },
});

export default Dashboard;
