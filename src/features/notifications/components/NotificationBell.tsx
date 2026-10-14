import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '../../../shared/store/notificationStore';
import { useAuthStore } from '../../../shared/store/authStore';
import { auth } from '../../../shared/config/firebase';

interface NotificationBellProps {
  onPress?: () => void;
  color?: string;
  size?: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ 
  onPress,
  color = '#0D4722',
  size = 26
}) => {
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const { user } = useAuthStore();

  useEffect(() => {
    // Only attempt fetch if user is logged in
    if (!user && !auth?.currentUser) return;

    fetchUnreadCount();
    
    // Poll for notifications every 15 seconds while logged in
    const interval = setInterval(() => {
      if (auth?.currentUser) {
        fetchUnreadCount();
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [user]);

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component onPress={onPress} style={styles.container}>
      <Ionicons name="notifications-outline" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </Component>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
