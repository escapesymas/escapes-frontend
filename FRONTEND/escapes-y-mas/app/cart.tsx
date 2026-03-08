import { View, Text, FlatList, Image, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useCart } from "../context/CartContext";
import Button from "../components/ui/Button";
import { Trash2, Plus, Minus } from "lucide-react-native";

export default function CartScreen() {
    const { items, total, updateQuantity, removeItem } = useCart();
    const router = useRouter();

    const handleCheckout = () => {
        if (items.length === 0) {
            Alert.alert("Carrito vacío", "Añade productos antes de pagar.");
            return;
        }
        // Navigate to Checkout Native Flow
        router.push("/checkout");
    };

    if (items.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
                <Stack.Screen options={{ title: "Carrito", headerShadowVisible: false }} />
                <Text className="text-xl font-bold text-gray-900 mb-2">Tu carrito está vacío</Text>
                <Text className="text-gray-500 text-center mb-6">¡Descubre las mejores ofertas en escapes y equipamiento!</Text>
                <Button title="Ir a la Tienda" onPress={() => router.replace('/(tabs)/catalog')} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50 from-white to-gray-50" edges={['bottom']}>
            <Stack.Screen options={{ title: "Tu Carrito", headerShadowVisible: true }} />

            <FlatList
                data={items}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                renderItem={({ item }) => (
                    <View className="bg-white rounded-xl p-3 mb-3 flex-row shadow-sm">
                        <Image
                            source={{ uri: item.image }}
                            className="w-20 h-20 rounded-lg bg-gray-100"
                            resizeMode="cover"
                        />
                        <View className="flex-1 ml-4 justify-between">
                            <View>
                                <Text className="font-bold text-gray-900 text-sm leading-4 mb-1" numberOfLines={2}>{item.title}</Text>
                                <Text className="text-gray-500 text-xs">{item.sku}</Text>
                            </View>

                            <View className="flex-row items-center justify-between mt-2">
                                <Text className="font-bold text-red-600">{item.price} €</Text>

                                <View className="flex-row items-center bg-gray-100 rounded-lg">
                                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} className="p-2">
                                        <Minus size={16} color="#374151" />
                                    </TouchableOpacity>
                                    <Text className="font-bold w-6 text-center text-gray-900">{item.quantity}</Text>
                                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} className="p-2">
                                        <Plus size={16} color="#374151" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => removeItem(item.id)} className="absolute top-2 right-2 p-2">
                            <Trash2 size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                )}
            />

            {/* Sticky Checkount Bar */}
            <View className="absolute bottom-0 left-0 right-0 bg-white p-4 rounded-t-3xl shadow-lg border-t border-gray-100">
                <View className="flex-row justify-between mb-4">
                    <Text className="text-gray-600">Total (IVA inc.)</Text>
                    <Text className="text-2xl font-bold text-gray-900">{total.toFixed(2)} €</Text>
                </View>
                <Button title="Tramitar Pedido" onPress={handleCheckout} />
            </View>
        </SafeAreaView>
    );
}
