import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const animationRef = useRef(null);
  
  useEffect(() => {
    // Ensure animation plays when component mounts
    if (animationRef.current) {
      animationRef.current.play();
    }
    
    // Optional: You can add a reset on component unmount
    return () => {
      if (animationRef.current) {
        animationRef.current.reset();
      }
    };
  }, []);
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3b82f6', '#60a5fa', '#93c5fd']}
        style={styles.background}
      />
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Easy Track</Text>
        
        <View style={styles.animationContainer}>
          <LottieView
            ref={animationRef}
            source={require('../assets/animations/wallet-animation.json')}
            autoPlay={true}
            loop={true}
            speed={1}
            style={styles.animation}
            resizeMode="cover"
          />
        </View>
      </View>
      
      <Text style={styles.footer}>Developed by Murshed Al Main</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 30,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  animationContainer: {
    width: width * 0.7,
    height: width * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  footer: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.9,
  }
});