import { Dimensions, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONT_SIZE } from '../assets/styles/typography';

export default function Index() {
  function scan() {
    console.log('Scanning...')
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container__logo}>
        <Image
          style={styles.logo}
          source={require('../assets/images/logo.png')}
        />
      </View>
      <View style={styles.container__desc}>
        <View style={styles.container__descTexts}>
          <Text style={styles.container__descTitle}>Car Scanner</Text>
          <Text style={styles.container__descText}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. </Text>
        </View>
        <Pressable
          onPress={() => scan()}
          style={styles.container__button}
        >
          <Text style={styles.container__buttonText}>Search for Scanner</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const height = Dimensions.get("window").height;
const width = Dimensions.get("window").width;

const styles = StyleSheet.create({
  logo: {
    height: '100%',
    width: '100%',
    objectFit: 'contain'
  },

  container__logo: {
    alignSelf: 'center',
    height: height * 0.45,
    width: width * 0.75
  },

  container__desc: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.08
  },

  container__descTexts: {
    alignItems: 'center'
  },

  container__descTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    marginBottom: 8
  },

  container__descText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center'
  },

  container__button: {
    backgroundColor: 'red',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: width * 0.7,
  },

  container__buttonText: {
    fontSize: FONT_SIZE.lg,
    color: 'white',
    textAlign: 'center'
  }
});