import { View } from 'react-native';
import { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';
import { Surface, Text, Avatar, Card, IconButton, TouchableRipple } from 'react-native-paper';

// Define theme colors based on tailwind config
const themeColors = {
  primary: '#1d4ed8',     // Softer Blue
  secondary: '#0e7490',   // Calmer Teal
  action: '#3b82f6',      // Standard blue for actions
  accent: '#6366f1',      // Soft purple accent
  surface: '#f9fafb',     // Very light gray
  surfaceDark: '#e5e7eb', // Slightly darker surface
  background: '#ffffff',  // Pure white
  backgroundDark: '#f1f5f9', // Light gray alt background
  textPrimary: '#1f2937', // Dark gray for good readability
  textSecondary: '#6b7280', // Muted gray for secondary text
  error: '#ef4444',       // Bright error red
  success: '#10b981',     // Bright success green
  warning: '#f59e0b',     // Warm yellow-orange
  info: '#0ea5e9',        // Bright info blue
};


export default function BalanceCard() {
  const { user } = useAuth();
  const [payable, setPayable] = useState(0);
  const [receivable, setReceivable] = useState(0);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Fetch user profile data
    const fetchUserProfile = async () => {
      const db = getFirestore();
      const userRef = doc(db, 'users', user.id);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserName(userData.name || userData.email?.split('@')[0] || 'User');
        setUserAvatar(userData.profileImage);
      }
    };

    fetchUserProfile();

    const db = getFirestore();
    const chatRoomsRef = collection(db, 'chatRooms');
    const q = query(chatRoomsRef, where('participants', 'array-contains', user.id));
    
    // Set up real-time listener for chat rooms
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalPayable = 0;
      let totalReceivable = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        const balances = data.balances || {};
        const netBalance = (balances[user.id] || 0) - (balances[data.participants.find(id => id !== user.id)] || 0);

        if (netBalance < 0) {
          totalPayable += Math.abs(netBalance);
        } else {
          totalReceivable += netBalance;
        }
      });

      setPayable(totalPayable);
      setReceivable(totalReceivable);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user]);



  return (
    <Surface 
      style={{
        borderRadius: 16,
        marginHorizontal: 12,
        marginVertical: 8,
        elevation: 2,
        overflow: 'hidden'
      }}
      className="bg-background dark:bg-background-dark"
    >
      <Card className="bg-transparent">
        <Card.Content style={{ padding: 10 }}>
          {/* Header with User Info */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 10,
            borderBottomWidth: 1,
            paddingBottom: 8
          }}
          className="border-surface-dark">
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableRipple 
                onPress={() => router.push('/profile')}
                borderless
                style={{ 
                  borderRadius: 24,
                  marginRight: 8
                }}
              >
                {userAvatar ? (
                  <Avatar.Image 
                    source={{ uri: userAvatar }} 
                    size={42}
                  />
                ) : (
                  <Avatar.Icon 
                    icon="account"
                    size={42}
                    style={{ 
                      backgroundColor: 'transparent'
                    }}
                    className="bg-accent/20"
                    color={themeColors.accent}
                  />
                )}
              </TouchableRipple>
              
              <View>
                <Text 
                  variant="titleMedium" 
                  style={{ 
                    fontWeight: 'bold',
                    marginBottom: 1
                  }}
                  className="text-text-primary dark:text-text-primary-dark"
                >
                  {userName || 'User'}
                </Text>
                <Text 
                  variant="labelSmall" 
                  className="text-text-secondary dark:text-text-secondary-dark"
                >
                  Balance Summary
                </Text>
              </View>
            </View>
            
            <IconButton 
              icon="wallet-outline" 
              size={22} 
              iconColor={themeColors.primary}
              style={{ 
                margin: 0 
              }}
              className="bg-primary/10"
              onPress={() => router.push('/profile')}
            />
          </View>
          
          {/* Balance Cards */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            {/* Payable Card */}
            <Card 
              style={{
                flex: 1,
                borderRadius: 12,
                borderLeftWidth: 3,
                borderLeftColor: payable > 0 ? themeColors.error : themeColors.textSecondary,
              }}
              className={payable > 0 ? "bg-error/10" : "bg-surface-dark"}
              contentStyle={{ padding: 8 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <IconButton 
                  icon="arrow-up-bold-circle" 
                  size={16} 
                  style={{ margin: 0, marginRight: 2, padding: 0 }}
                  className={payable > 0 ? themeColors.error : themeColors.textSecondary}
                />
                <Text 
                  variant="labelLarge" 
                  style={{ fontWeight: '600' }}
                  className={payable > 0 ? themeColors.error : themeColors.textSecondary}
                >
                  দিবো
                </Text>
              </View>
              <Text 
                variant="titleLarge" 
                style={{ fontWeight: 'bold' }}
                className= "text-error"
              >
                ৳{payable.toFixed(0)}
              </Text>
            </Card>
            
            {/* Receivable Card */}
            <Card 
              style={{
                flex: 1,
                borderRadius: 12,
                borderLeftWidth: 3,
                borderLeftColor: receivable > 0 ? themeColors.success : themeColors.textSecondary,
              }}
              className={receivable > 0 ? "bg-success/10" : "bg-surface-dark"}
              contentStyle={{ padding: 8 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <IconButton 
                  icon="arrow-down-bold-circle" 
                  size={16} 
                  style={{ margin: 0, marginRight: 2, padding: 0 }}
                  className={receivable > 0 ? "text-success" : "text-text-secondary dark:text-text-secondary-dark"}
                />
                <Text 
                  variant="labelLarge" 
                  style={{ fontWeight: '600' }}
                  className={receivable > 0 ? "text-success" : "text-text-secondary dark:text-text-secondary-dark"}
                >
                  পাবো
                </Text>
              </View>
              <Text 
                variant="titleLarge" 
                style={{ 
                  fontWeight: 'bold',
                  color: receivable > 0 ? themeColors.success : themeColors.textSecondary
                }}
              >
                ৳{receivable.toFixed(0)}
              </Text>
            </Card>
          </View>
        </Card.Content>
      </Card>
    </Surface>
  );
}