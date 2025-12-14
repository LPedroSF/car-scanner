import { Dimensions, StyleSheet } from "react-native";
import { FONT_SIZE } from './typography';

const height = Dimensions.get('window').height;
const width = Dimensions.get('window').width;

export const common = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: height
    },

    inputs: {
        height: 48,
        borderWidth: 1,
        borderColor: "#000",
        borderRadius: 12,
        paddingHorizontal: 12,
        fontSize: FONT_SIZE.sm,
        marginBottom: 16,
        width: width * 0.7
    },

    buttons: {
        borderRadius: 16,
        backgroundColor: '#000'
    }
});