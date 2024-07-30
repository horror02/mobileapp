import React, { useState, createContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './Pages/Login';
import ForgotPassword from './Pages/ForgotPassword';
import Dashboard from './Pages/Dashboard';
import History from './Pages/History';
import Profile from './Pages/Profile';
import Checkout from './Pages/Checkout';
import ChangePassword from './Pages/ChangePassword';

// Create a context for managing global state
export const UserContext = createContext();

const Stack = createStackNavigator();

const App = () => {
  const [userState, setUserState] = useState({
    schoolId: null,
    rfidTags: null, // Initialize rfidTags to null
    // Add other user-related data here if needed
  });

  // Function to update userState after successful login
  const updateUserState = (userData) => {
    setUserState(userData);
  };

  // Function to update schoolId in userState
  const updateSchoolId = (newSchoolId) => {
    setUserState(prevState => ({
      ...prevState,
      schoolId: newSchoolId,
    }));
  };

  // Function to update rfidTags in userState
  const updateRfidTags = (newRfidTags) => {
    setUserState(prevState => ({
      ...prevState,
      rfidTags: newRfidTags,
    }));
  };

  return (
    <UserContext.Provider value={{ userState, updateUserState, updateSchoolId, updateRfidTags }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login">
            {/* Pass updateSchoolId and updateRfidTags as props to Login */}
            {props => <Login {...props} updateSchoolId={updateSchoolId} updateRfidTags={updateRfidTags} />}
          </Stack.Screen>
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="History" component={History} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="ChangePassword" component={ChangePassword} />
          <Stack.Screen name="Checkout" component={Checkout} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserContext.Provider>
  );
};

export default App;
