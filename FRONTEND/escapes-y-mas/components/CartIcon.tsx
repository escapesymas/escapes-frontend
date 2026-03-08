import { View, Text, TouchableOpacity } from "react-native";
import { ShoppingCart } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useCart } from "../context/CartContext";

export default function CartIcon() {
    const router = useRouter();
    const { count } = useCart();

    return (
        <TouchableOpacity onPress={() => router.push('/cart')} className="relative mr-4">
            <ShoppingCart size={24} color="#1f2937" />
            {count > 0 && (
                <View className="absolute -top-2 -right-2 bg-red-600 rounded-full w-5 h-5 items-center justify-center">
                    <Text className="text-white text-xs font-bold">{count}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}
