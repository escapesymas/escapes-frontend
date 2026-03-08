import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Cart() {
    return (
        <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
            <Text className="text-xl font-bold">Tu Carrito</Text>
            <Text className="text-gray-500">Productos añadidos</Text>
        </SafeAreaView>
    );
}
