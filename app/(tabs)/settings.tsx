import { StyleSheet, Text, View } from 'react-native';

export default function SettingsScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text>Settings Screen</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        padding: 16,
    },
});