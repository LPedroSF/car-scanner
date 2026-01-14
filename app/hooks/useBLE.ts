import * as ExpoDevice from "expo-device";
import { useEffect, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import base64 from "react-native-base64";
import { BleError, BleManager, Characteristic, Device, State } from "react-native-ble-plx";

const bleManager = new BleManager();

export default function useBLE() {
    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [bleState, setBleState] = useState<State | null>(null);
    const [obdServiceUUID, setObdServiceUUID] = useState<string | null>(null);
    const [txUUID, setTxUUID] = useState<string | null>(null);
    const [rxUUID, setRxUUID] = useState<string | null>(null);


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

    const startListening = (
        device: Device,
        serviceUUID: string,
        rxUUID: string
    ) => {
        console.log("👂 Listening on RX:", rxUUID);

        device.monitorCharacteristicForService(
            serviceUUID,
            rxUUID,
            onDataUpdate
        );
    };


    const connectToDevice = async (device: Device) => {
        try {
            const deviceConnection = await bleManager.connectToDevice(device.id);
            setConnectedDevice(deviceConnection);

            await deviceConnection.discoverAllServicesAndCharacteristics();
            bleManager.stopDeviceScan();

            const services = await deviceConnection.services();

            let detectedService: string | null = null;
            let detectedTX: string | null = null;
            let detectedRX: string | null = null;

            for (const service of services) {
                const characteristics = await service.characteristics();

                for (const char of characteristics) {
                    if (
                        char.isWritableWithResponse ||
                        char.isWritableWithoutResponse
                    ) {
                        detectedTX = char.uuid;
                        detectedService = service.uuid;
                    }

                    if (char.isNotifiable || char.isIndicatable) {
                        detectedRX = char.uuid;
                        detectedService = service.uuid;
                    }
                }
            }

            if (detectedService && detectedTX && detectedRX) {
                setObdServiceUUID(detectedService);
                setTxUUID(detectedTX);
                setRxUUID(detectedRX);

                console.log("✅ OBD SERVICE:", detectedService);
                console.log("➡️ TX:", detectedTX);
                console.log("⬅️ RX:", detectedRX);
                console.log("👂 Listening on RX:", detectedRX);

                startListening(deviceConnection, detectedService, detectedRX);
                return;
            } else {
                console.log("❌ No OBD service found");
            }


        } catch (e) {
            console.log("FAILED TO CONNECT", e);
        }
    };

    const sendOBDCommand = async (cmd: string) => {
        if (!connectedDevice || !obdServiceUUID || !txUUID) {
            console.log("❌ OBD not ready");
            return;
        }

        const fullCmd = `${cmd}\r`;
        const payload = base64.encode(fullCmd);

        console.log("📤 Sending OBD:", fullCmd.trim());

        await connectedDevice.writeCharacteristicWithoutResponseForService(
            obdServiceUUID,
            txUUID,
            payload
        );
    };

    const onDataUpdate = (
        error: BleError | null,
        characteristic: Characteristic | null
    ) => {
        if (error) {
            console.log(error);
            return;
        } else if (!characteristic?.value) {
            console.log("No Data was received");
            return;
        }

        const colorCode = base64.decode(characteristic.value);
        console.log("Data received:", colorCode);
    };

    return {
        connectToDevice,
        requestPermissions,
        scanForPeripherals,
        sendOBDCommand,
        bleState,
        allDevices,
        connectedDevice,
    };
}