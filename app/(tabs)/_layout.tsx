import { Tabs } from "expo-router";

export default function TabsLayout() {
    return (
        <Tabs>
            <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
            <Tabs.Screen name="diagnostics" options={{ title: "Diagnostics" }} />
            <Tabs.Screen name="settings" options={{ title: "Settings" }} />
        </Tabs>
    );
}