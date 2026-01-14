import { useRouter } from "expo-router";
import React, { FC, useCallback } from "react";
import {
    Dimensions,
    FlatList,
    ListRenderItemInfo,
    Modal,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Device } from "react-native-ble-plx";
import { FONT_SIZE } from "../assets/styles/typography";

type DeviceModalListItemProps = {
    item: ListRenderItemInfo<Device>;
    connectToPeripheral: (device: Device) => void;
    closeModal: () => void;
};

type DeviceModalProps = {
    devices: Device[];
    visible: boolean;
    connectToPeripheral: (device: Device) => void;
    closeModal: () => void;
    bleState: string | null;
};

const DeviceModalListItem: FC<DeviceModalListItemProps> = (props) => {
    const { item, connectToPeripheral, closeModal } = props;

    const router = useRouter();

    const connectAndCloseModal = useCallback(() => {
        connectToPeripheral(item.item);
        closeModal();
        router.push("/dashboard");
    }, [closeModal, connectToPeripheral, item.item]);

    return (
        <TouchableOpacity
            onPress={connectAndCloseModal}
            style={modalStyle.ctaButton}
        >
            <Text style={modalStyle.ctaButtonText}>
                {item.item.name ?? item.item.localName}
            </Text>
        </TouchableOpacity>
    );
};

const DeviceModal: FC<DeviceModalProps> = (props) => {
    const { devices, visible, bleState, connectToPeripheral, closeModal } = props;
    const renderDeviceModalListItem = useCallback(
        (item: ListRenderItemInfo<Device>) => {
            return (
                <DeviceModalListItem
                    item={item}
                    connectToPeripheral={connectToPeripheral}
                    closeModal={closeModal}
                />
            );
        },
        [closeModal, connectToPeripheral]
    );

    return (
        <Modal
            style={modalStyle.modalContainer}
            animationType="slide"
            transparent={false}
            visible={visible}
        >
            <SafeAreaView style={modalStyle.modalTitle}>
                <Text style={modalStyle.modalTitleText}>
                    Tap on a device to connect
                </Text>
                <View style={modalStyle.modalFlatlistBackground}>
                    <FlatList
                        contentContainerStyle={modalStyle.modalFlatlistContiner}
                        data={devices}
                        renderItem={renderDeviceModalListItem}
                    />
                </View>


                <Pressable
                    onPress={closeModal}
                    style={modalStyle.closeButton}
                >
                    <Text style={modalStyle.closeButtonText}>Close</Text>
                </Pressable>
            </SafeAreaView>
        </Modal>
    );
};

const width = Dimensions.get("window").width;

const modalStyle = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: "#f2f2f2",
    },
    modalFlatlistBackground: {
        flex: 1,
        marginTop: 20,
        backgroundColor: "#cecece35",
        width: width * 0.9,
        alignSelf: "center",
        borderRadius: 12,
        paddingVertical: 10
    },
    modalFlatlistContiner: {
        flex: 1
    },
    closeButton: {
        backgroundColor: 'red',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        width: width * 0.7,
        alignSelf: "center",
        marginTop: 20,
    },
    closeButtonText: {
        fontSize: FONT_SIZE.lg,
        color: 'white',
        textAlign: 'center'
    },
    modalCellOutline: {
        borderWidth: 1,
        borderColor: "black",
        alignItems: "center",
        marginHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 8,
    },
    modalTitle: {
        flex: 1,
        backgroundColor: "#f2f2f2",
    },
    modalTitleText: {
        marginTop: 40,
        fontSize: 30,
        fontWeight: "bold",
        marginHorizontal: 20,
        textAlign: "center",
    },
    ctaButton: {
        borderBottomWidth: 1,
        borderColor: "red",
        justifyContent: "center",
        alignItems: "center",
        height: 50,
        marginHorizontal: 20,
        marginBottom: 5,
        borderRadius: 12,
    },
    ctaButtonText: {
        fontSize: FONT_SIZE.lg,
        color: "red",
    },
});

export default DeviceModal;