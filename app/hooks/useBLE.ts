import * as ExpoDevice from "expo-device";
import { useEffect, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import base64 from "react-native-base64";
import { BleError, BleManager, Characteristic, Device, State } from "react-native-ble-plx";

const bleManager = new BleManager();
const OBD_SERVICE_UUID = "0000fff0-0000-1000-8000-00805f9b34fb";
const OBD_WRITE_UUID = "0000fff2-0000-1000-8000-00805f9b34fb";
const OBD_NOTIFY_UUID = "0000fff1-0000-1000-8000-00805f9b34fb";

export default function useBLE() {
    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
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

    //scan for devices
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

    const connectToDevice = async (device: Device) => {
        try {
            const deviceConnection = await bleManager.connectToDevice(device.id);
            setConnectedDevice(deviceConnection);

            await deviceConnection.discoverAllServicesAndCharacteristics();
            bleManager.stopDeviceScan();

            startStreamingData(deviceConnection);

        } catch (e) {
            console.log("FAILED TO CONNECT", e);
        }
    };

    const sendCommand = async (device: Device, command: string) => {
        const base64Command = base64.encode(command);

        await device.writeCharacteristicWithResponseForService(
            OBD_SERVICE_UUID,
            OBD_WRITE_UUID,
            base64Command
        );
    };

    const startStreamingData = async (device: Device) => {
        if (device) {
            device.monitorCharacteristicForService(
                OBD_SERVICE_UUID,
                OBD_NOTIFY_UUID,
                onDataUpdate
            );

            setTimeout(() => {
                initialiseOBD(device);
            }, 500);

        } else {
            console.log("No Device Connected");
        }
    }

    const initialiseOBD = async (device: Device) => {
        const commands = [
            "AT Z\r",   // reset
            "AT E0\r",  // echo OFF
            "AT L0\r",  // linefeeds OFF
            "AT S0\r",  // spaces OFF
            "AT RV\r",  // read voltage
        ];

        for (const cmd of commands) {
            await sendCommand(device, cmd);
            await new Promise(res => setTimeout(res, 300));
        }
    };


    const onDataUpdate = (
        error: BleError | null,
        characteristic: Characteristic | null
    ) => {
        if (error) {
            console.log("❌ BLE error:", error);
            return;
        }

        if (!characteristic?.value) return;

        const decoded = base64.decode(characteristic.value).trim();

        console.log("📡 OBD RX:", decoded);
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