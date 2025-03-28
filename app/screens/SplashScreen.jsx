import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';

const SplashScreen = () => {
  const animation = useRef(null);
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auto play the animation when component mounts
    if (animation.current) {
      animation.current.play();
    }

    // Navigate to Home screen after animation finishes
    const timer = setTimeout(() => {
      setIsLoading(false);
      navigation.replace('Home');
    }, 3000); // Adjusted timing for better splash screen experience

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <LottieView
        ref={animation}
        source={require('../../assets/animations/chat-loading-animation.json')}
        style={styles.animation}
        autoPlay
        loop={false}
        onAnimationFinish={() => setIsLoading(false)}
      />
      {isLoading ? (
        <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
      ) : (
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>ChatTrack</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  animation: {
    width: 300,
    height: 300,
  },
  loader: {
    marginTop: 20,
  },
  button: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#6C63FF',
    borderRadius: 25,
    elevation: 3,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SplashScreen;