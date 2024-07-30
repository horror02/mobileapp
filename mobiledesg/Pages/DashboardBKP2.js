import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import product1Image from './images/product1.png';
import product2Image from './images/product2.png';
import product3Image from './images/product3.png';

const ipAddress = 'http://172.22.37.69:3000';
const espAddress = 'http://172.22.37.76';

const products = [
  {
    productId: 1,
    name: 'Product 1',
    image: product1Image,
  },
  {
    productId: 2,
    name: 'Product 2',
    image: product2Image,
  },
  {
    productId: 3,
    name: 'Product 3',
    image: product3Image,
  },
];

const Dashboard = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [productPrices, setProductPrices] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    fetchProductPrices();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${ipAddress}/userPoints`);
      const data = await response.json();
      if (data && data.length > 0) {
        setUserData(data[0]); // Assuming only one user's data is returned
      } else {
        setUserData({ lastName: '', point: 0 }); // Set default values
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
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

  const handleLogout = () => {
    navigation.navigate('Login');
  };

  const sendProductIdToESP = async (productId) => {
    try {
      console.log(`Sending productId ${productId} to ESP8266`);

      const response = await fetch(`${espAddress}/reward?reward=${productId}`);
      const data = await response.text();

      console.log('Response from ESP8266:', data);

      if (response.ok) {
        Alert.alert('Success', 'Product ID sent to ESP8266');
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{userData ? `${userData.lastName}'s Dashboard` : 'Loading...'}</Text>
      <View style={styles.userDataContainer}>
        <Text style={styles.userDataTitle}>User Balances</Text>
        {userData && (
          <View style={styles.userDataItem}>
            <Text style={styles.userDataText}>Points: {parseFloat(userData.point).toFixed(2)}</Text>
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
      <View style={styles.navigationButtons}>
        <TouchableOpacity style={styles.navButton} onPress={navigateToHistory}>
          <Text style={styles.navButtonText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={navigateToProfile}>
          <Text style={styles.navButtonText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={handleLogout}>
          <Text style={styles.navButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#e6f9e6', // light green background
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 50,
    marginBottom: 20,
    color: 'darkgreen',
  },
  userDataContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
    width: '80%',
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
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 50,
    color: 'darkgreen',
  },
  navigationButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  navButton: {
    backgroundColor: 'darkgreen',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    margin: 5,
  },
  navButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Dashboard;
