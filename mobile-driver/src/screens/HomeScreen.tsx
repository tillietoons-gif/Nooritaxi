import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert, ActivityIndicator } from 'react-native';
import apiClient from '../services/apiClient';
import { socketService } from '../services/socketService';

type DriverStatus = 'ONLINE' | 'OFFLINE';

interface TripRequest {
  tripId: string;
  pickupLocation: { address: string; latitude: number; longitude: number };
  destination: { address: string; latitude: number; longitude: number };
  passengerName: string;
  estimatedFare: number;
}

const HomeScreen = () => {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleNewTripRequest = (trip: TripRequest) => {
    console.log('New trip request received:', trip);
    Alert.alert(
      'New Trip Request',
      `From: ${trip.pickupLocation.address}\nTo: ${trip.destination.address}\nPassenger: ${trip.passengerName}`,
      [
        { text: 'Decline', style: 'cancel', onPress: () => console.log('Trip declined') },
        { text: 'Accept', onPress: () => console.log(`Trip ${trip.tripId} accepted`) },
      ],
      { cancelable: false },
    );
  };

  useEffect(() => {
    if (isOnline) {
      socketService.connect();
      socketService.on('newTripRequest', handleNewTripRequest);
    }

    return () => {
      if (isOnline) {
        socketService.off('newTripRequest', handleNewTripRequest);
        socketService.disconnect();
      }
    };
  }, [isOnline]);

  const handleStatusToggle = async (newStatus: boolean) => {
    setIsLoading(true);
    const status: DriverStatus = newStatus ? 'ONLINE' : 'OFFLINE';

    try {
      await apiClient.patch('/drivers/me/status', { status });
      setIsOnline(newStatus);
    } catch (error) {
      console.error('Failed to update driver status:', error);
      Alert.alert('Error', 'Could not update your status. Please try again.');
      setIsOnline(!newStatus);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Your Status: {isOnline ? 'Online' : 'Offline'}
        </Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.switch} />
        ) : (
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isOnline ? '#007AFF' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={handleStatusToggle}
            value={isOnline}
            style={styles.switch}
          />
        )}
      </View>
      <Text style={styles.infoText}>
        {isOnline
          ? 'You are online and ready to receive trip requests.'
          : 'You are offline. Toggle the switch to go online.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  statusText: {
    fontSize: 22,
    fontWeight: '600',
    marginRight: 20,
  },
  switch: {
    transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }],
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default HomeScreen;
