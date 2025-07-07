import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, TextInput, View } from 'react-native';

export default function MathScreen() {
  const [num1, setNum1] = useState('');
  const [num2, setNum2] = useState('');
  const [num3, setNum3] = useState('');

  const handleAdd = () => {
    const n1 = parseFloat(num1);
    const n2 = parseFloat(num2);
    const n3 = parseFloat(num3);

    if (isNaN(n1) || isNaN(n2) || isNaN(n3)) {
      Alert.alert('Invalid input', 'Please enter valid numbers in all boxes.');
      return;
    }

    const sum = n1 + n2 + n3;
    Alert.alert('Sum Result', `The sum is: ${sum}`);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/calc.png')}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter first number"
          value={num1}
          onChangeText={setNum1}
        />
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter second number"
          value={num2}
          onChangeText={setNum2}
        />
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter third number"
          value={num3}
          onChangeText={setNum3}
        />
        <Button title="Add Numbers" onPress={handleAdd} />
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reactLogo: {
    height: 100,
    width: 150,
    bottom: 75,
    left: 75,
    resizeMode: 'contain',
    position: 'absolute',
  },
  inputContainer: {
    marginVertical: 20,
    paddingHorizontal: 16,
  },
  input: {
    height: 40,
    width: 150,
    margin: 12,
    borderWidth: 1,
    paddingLeft: 10,
    paddingTop: 6,
    borderRadius: 4,
    borderColor: '#888',
    color: '#000',
    backgroundColor: '#fff',
  },
});