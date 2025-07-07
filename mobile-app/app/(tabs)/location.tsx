import type { LocationObjectCoords } from 'expo-location';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text
} from 'react-native';

export default function LocationScreen() {
  const [status, setStatus] = useState('Starting location fetch...');
  const [location, setLocation] = useState<LocationObjectCoords | null>(null);
  const [placeInfo, setPlaceInfo] = useState<{ display_name: string } | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription;

    (async () => {
      setStatus('Requesting location permissions...');
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access was denied.');
        setStatus('Permission denied');
        return;
      }
    
      // fetch once:  let loc = await Location.getCurrentPositionAsync({});
      // Watch for location updates, or time elapsed
      setStatus('Fetching current location...');
      subscription = await Location.watchPositionAsync(
        { 
            accuracy: Location.Accuracy.High,
            timeInterval: 10000, // Update every 10 seconds
            distanceInterval: 10, // Update every 10 meters
        },
        async (loc) => {
            const coords = loc.coords;
            let entryId: number | null = null;  // Initialize entryId (for database index) to null

            setLocation(coords);
            setStatus(`Coordinates updated: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
            
            // let's write to the coords database. 
            try {
              setStatus('Sending coordinates to server...');
              const formData = new URLSearchParams();
              formData.append('action', 'create');
              formData.append('latitude', coords.latitude.toString());
              formData.append('longitude', coords.longitude.toString());
              formData.append('user_question', 'What is this place?');
              formData.append('context_tag', 'trail');

              const serverResponse = await fetch('https://steampathways.org/curiotrail-php/api.php', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
              });

              const json = await serverResponse.json();
              console.log('✅ Server response:', json);
              entryId = json.id;
              setStatus('Location sent to server!');
            } catch (error) {
              console.error('❌ Error sending to server:', error);
              setStatus('Failed to send to server.');
            }


            // Fetch address info from OpenStreetMap Nominatim
            try {
                setStatus('Fetching address info from OpenStreetMap...');
                const url = `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&format=json`;
                
                const response = await fetch(url, {
                headers: {
                    'User-Agent': 'CurioTrail/1.0 (your_email@example.com)' // Nominatim requires a valid UA
                }
                });

                const data = await response.json();
                setPlaceInfo(data);
                setStatus('Address info loaded successfully!');

            } catch (err) {
                console.error(err);
                Alert.alert('Error', 'Failed to fetch location info');
                setStatus('Failed to load address info');
            }

            setStatus('Location sent! Waiting for response...');
            console.log(`🔁 Starting polling for entry ID ${entryId}...`);

            const pollInterval = setInterval(async () => {
              try {
                const pollResponse = await fetch(`https://steampathways.org/curiotrail-php/api.php?action=read&id=${entryId}`);
                const pollData = await pollResponse.json();

                console.log('🔎 Polled entry status:', pollData.status);

                // Update the status field in the UI
                setStatus(`Waiting for reply… Status: ${pollData.status}`);

                // Stop polling if response is ready
               

              // Inside your polling block: Get the resopnse and speak it aloud
              if (pollData.status === 'responded' || pollData.status === 'complete') {
                clearInterval(pollInterval);
                const responseText = pollData.llm_response || 'No message.';
                setStatus(`✅ Final response: ${responseText}`);

                // Speak the response aloud
                Speech.speak(responseText, {
                  language: 'en-US',
                  pitch: 1.1,
                  rate: 1.0,
                });
              }
              } catch (pollError) {
                console.error('❌ Polling failed:', pollError);
                setStatus('Polling error. Retrying...');
              }
            }, 5000); // Poll every 5 seconds

        }
      );
    })();
  }, []);

    // Debug rendering
    console.log('Rendering UI:');
    console.log('location:', location);
    console.log('placeInfo:', placeInfo);
    console.log('status:', status);

    
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Image source={require('@/assets/images/Curio1_sm.png')} style={styles.image} />

      <Text style={styles.status}>{status}</Text>

      {location ? (
        <Text style={styles.text}>
          📍 Coordinates: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
        </Text>
      ) : (
        <Text style={styles.text}>Waiting for location...</Text>
      )}

      {placeInfo ? (
        <Text style={styles.text}>
          🗺️ Address: {placeInfo.display_name}
        </Text>
      ) : (
        <Text style={styles.text}>Waiting for address...</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 0,
    backgroundColor: '#1a1a1a', // Dark background
  },
  image: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 16,
  },
  status: {
    fontSize: 16,
    marginBottom: 8,
    fontStyle: 'italic',
    color: '#ccc', // Light gray
  },
  text: {
    fontSize: 16,
    marginVertical: 6,
    color: '#fff', // White text for dark background
  },
});