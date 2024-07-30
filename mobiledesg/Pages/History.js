import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const History = ({ username }) => {
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    if (username) {
      fetchHistoryData(username);
    }
  }, [username]);

  const fetchHistoryData = async (username) => {
    try {
      const response = await fetch(`http://172.22.37.36:3000/history/${username}`);
      const data = await response.json();
      if (data.success) {
        setHistoryData(data.history);
      } else {
        console.log('Error fetching history data:', data.message);
      }
    } catch (error) {
      console.error('Error fetching history data:', error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.transactionBox}>
      <Text>Date: {item.date}</Text>
      <Text>Weight: {item.weight} lbs</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      <View style={styles.bigContainer}>
        <FlatList
          data={historyData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'darkgreen',
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  bigContainer: {
    width: '100%',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 5,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  transactionBox: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default History;
