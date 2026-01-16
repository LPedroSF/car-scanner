import { Pressable, Text, View } from "react-native";
import useBLE from "../hooks/useBLE";

export default function Dashboard() {
    const { sendOBDCommand } = useBLE();

    function testFunction() {
        console.log("Sending OBD Command 010C");
        sendOBDCommand("010C");
    }

    return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 24 }}>🚗 Dashboard</Text>
            <Pressable
                onPress={() => testFunction()}
                style={{
                    marginTop: 20,
                    backgroundColor: 'red',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 16,
                    width: 200,
                }}

            ><Text>Test</Text></Pressable>
            <Text style={{ marginTop: 20, fontSize: 18 }}>RPM: 0</Text>
        </View>
    );
}
