import { useEffect, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device, State } from "react-native-ble-plx";

import * as ExpoDevice from "expo-device";

const bleManager = new BleManager();

export default function useBLE() {
    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device>();
    const [bleState, setBleState] = useState<State | null>(null);

    useEffect(() => {
        const subscription = bleManager.onStateChange(state => {
            setBleState(state);
            if (state === State.PoweredOn) {
                subscription.remove();
            }
        }, true);

        return () => subscription.remove();
    }, []);

    const connectToDevice = () => { };

    //Request Permissions from Android users
    const requestAndroid31Permissions = async () => {
        const bluetoothScanPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            {
                title: "Bluetooth Permission",
                message: "This app requires Bluetooth access",
                buttonPositive: "OK",
            }
        );

        const bluetoothConnectPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            {
                title: "Bluetooth Permission",
                message: "This app requires Bluetooth access",
                buttonPositive: "OK",
            }
        );

        const fineLocationPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: "Location Permission",
                message: "Bluetooth Low Energy requires Location",
                buttonPositive: "OK",
            }
        );

        return (
            bluetoothScanPermission === "granted" &&
            bluetoothConnectPermission === "granted" &&
            fineLocationPermission === "granted"
        );
    };

    const requestPermissions = async () => {
        if (Platform.OS === "android") {
            if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permission",
                        message: "Bluetooth Low Energy requires Location",
                        buttonPositive: "OK",
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } else {
                const isAndroid31PermissionsGranted =
                    await requestAndroid31Permissions();

                return isAndroid31PermissionsGranted;
            }
        } else {
            return true;
        }
    };

    const isDuplicateDevice = (devices: Device[], nextDevice: Device) =>
        devices.findIndex((device) => nextDevice.id === device.id) > -1;

    const scanForPeripherals = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
            //TODO: Show some alert to user
            console.log("Permissions not granted");
            return;
        }

        // Check current BLE state
        const currentState = await bleManager.state();
        if (currentState !== State.PoweredOn) {
            //TODO: Show some alert to user
            console.log("Bluetooth not ready. Current state:", currentState);

            if (currentState === State.PoweredOff) {
                //TODO: Show some alert to user
                console.log("Please turn on Bluetooth");
            } else if (currentState === State.Unauthorized) {
                //TODO: Show some alert to user
                console.log("Bluetooth permission denied");
            }
            return;
        }

        bleManager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                //TODO: Show some alert to user
                console.log('Error scanning for devices:', error);
                return;
            }

            if (device?.name === "VEEPEAK" || device?.name === "Veepeak") {
                setAllDevices((prev) =>
                    isDuplicateDevice(prev, device) ? prev : [...prev, device]
                );
            }
        });
    };

    return {
        connectToDevice,
        requestPermissions,
        scanForPeripherals,
        bleState,
        allDevices,
        connectedDevice,
    };
}