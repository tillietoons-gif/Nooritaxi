import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Switch, StyleSheet, FlatList, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import socketService from '../services/socketService';

enum RestaurantStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

interface Order {
  id: string;
  customerName: string;
  total: number;
}

const MerchantDashboardScreen = () => {
  const [status, setStatus] = useState<RestaurantStatus>(RestaurantStatus.CLOSED);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);

  const handleNewOrder = useCallback((newOrder: Order) => {
    console.log('New order received:', newOrder);

    Alert.alert(
      'New Order Received!',
      `Order #${newOrder.id} from ${newOrder.customerName} for $${newOrder.total.toFixed(2)}.`,
      [
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => handleOrderStatus(newOrder.id, 'REJECTED'),
        },
        {
          text: 'Accept',
          style: 'default',
          onPress: () => {
            handleOrderStatus(newOrder.id, 'ACCEPTED');
            setActiveOrders((prevOrders) => [newOrder, ...prevOrders]);
          },
        },
      ],
      { cancelable: false }
    );
  }, []);

  useEffect(() => {
    const manageSocketConnection = async () => {
      if (status === RestaurantStatus.OPEN) {
        try {
          const token = await SecureStore.getItemAsync('authToken');
          if (!token) {
            console.error('Authentication token not found. Cannot connect socket.');
            setStatus(RestaurantStatus.CLOSED);
            return;
          }
          socketService.connect(token);
          socketService.on('newOrderReceived', handleNewOrder);
        } catch (error) {
          console.error('Failed to get auth token for socket:', error);
        }
      } else {
        socketService.disconnect();
      }
    };

    manageSocketConnection();

    return () => {
      socketService.off('newOrderReceived', handleNewOrder);
    };
  }, [status, handleNewOrder]);

  const toggleRestaurantStatus = (isOpen: boolean) => {
    const newStatus = isOpen ? RestaurantStatus.OPEN : RestaurantStatus.CLOSED;
    setStatus(newStatus);
    console.log(`Restaurant status set to: ${newStatus}`);
  };

  const handleOrderStatus = (orderId: string, orderStatus: 'ACCEPTED' | 'REJECTED') => {
    console.log(`Order ${orderId} has been ${orderStatus}`);
    socketService.emit('updateOrderStatus', { orderId, status: orderStatus });
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderItem}>
      <Text style={styles.orderText}>Order #{item.id}</Text>
      <Text style={styles.orderDetail}>{item.customerName}</Text>
      <Text style={styles.orderDetail}>${item.total.toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Merchant Dashboard</Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Restaurant Status</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={status === RestaurantStatus.OPEN ? '#f5dd4b' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleRestaurantStatus}
          value={status === RestaurantStatus.OPEN}
        />
        <Text style={[styles.statusText, status === RestaurantStatus.OPEN ? styles.open : styles.closed]}>
          {status}
        </Text>
      </View>

      <View style={styles.ordersSection}>
        <Text style={styles.sectionTitle}>Active Orders</Text>
        <FlatList
          data={activeOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>No active orders.</Text>}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1a202c',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#2d3748',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 70,
    textAlign: 'center',
  },
  open: {
    color: '#38a169',
  },
  closed: {
    color: '#e53e3e',
  },
  ordersSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1a202c',
  },
  listContainer: {
    flexGrow: 1,
  },
  orderItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderDetail: {
    fontSize: 14,
    color: '#4a5568',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#718096',
  },
});

export default MerchantDashboardScreen;
