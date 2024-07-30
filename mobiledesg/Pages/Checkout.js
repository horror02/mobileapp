import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { UserContext } from '../App.js'; // Assuming correct path to UserContext


const Checkout = ({ route }) => {
  const { productId, products } = route.params;
  const product = products.find(p => p.productId === productId);

  if (!product) {
    console.error('Invalid product data:', product);
    return <Text>Error: Invalid product data</Text>;
  }

  console.log('Received product:', product);
  const { userState } = useContext(UserContext);

  const [count, setCount] = useState(1);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleIncreaseCount = () => {
    setCount(prevCount => prevCount + 1);
  };

  const handleDecreaseCount = () => {
    setCount(prevCount => (prevCount > 1 ? prevCount - 1 : 1));
  };

  const confirmCheckout = async () => {
    try {
      const response = await axios.post('http://192.168.254.138:3000/orders', {
        schoolId: userState.schoolId,
        productId: product.productId,
        RFIDTags: userState.rfidTags,
        quantity: count,
      });

      const { success, message } = response.data;

      if (success) {
        setIsConfirmed(true);
        Alert.alert('Success', 'Order placed successfully!');
        // Update user points
        const userResponse = await axios.get('http://192.168.1.62:3000/userPoints');
        const updatedUserData = userResponse.data;
        setUserState(updatedUserData);
      } else {
        Alert.alert('Error', message);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Unable to place order. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Checkout</Text>
      <View style={styles.productContainer}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>Price: {product.price}</Text>
        <Text style={styles.productPrice}>Count: {count}</Text>
        <View style={styles.quantityControl}>
          <TouchableOpacity style={styles.button} onPress={handleDecreaseCount}>
            <Text style={styles.buttonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantity}>{count}</Text>
          <TouchableOpacity style={styles.button} onPress={handleIncreaseCount}>
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={styles.confirmButton} onPress={confirmCheckout} disabled={isConfirmed}>
        <Text style={styles.confirmButtonText}>{isConfirmed ? 'Confirmed' : 'Confirm'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  productContainer: {
    marginBottom: 20,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  productPrice: {
    fontSize: 16,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#ddd',
    padding: 10,
    margin: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantity: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 5,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default Checkout;
