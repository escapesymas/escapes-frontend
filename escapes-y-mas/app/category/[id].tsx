import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchProducts } from "../../services/woocommerce";
import { Product } from "../../types";

export default function CategoryScreen() {
    const { id, name } = useLocalSearchParams();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, [id]);

    const loadProducts = async () => {
        try {
            // Convert ID to number safely
            const catId = id ? parseInt(id as string) : undefined;
            const { products: data } = await fetchProducts(undefined, catId, 1, 20);
            setProducts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderProduct = ({ item }: { item: Product }) => (
        <TouchableOpacity
            className="flex-1 m-2 bg-white rounded-xl shadow-sm overflow-hidden"
            onPress={() => router.push(`/product/${item.id}`)}
        >
            <Image
                source={{ uri: item.images[0]?.src || 'https://via.placeholder.com/150' }}
                className="w-full h-40"
                resizeMode="cover"
            />
            <View className="p-3">
                <Text className="text-sm font-bold text-gray-900 line-clamp-2" numberOfLines={2}>{item.title}</Text>
                <Text className="text-red-600 font-bold mt-1">{item.price} €</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom', 'left', 'right']}>
            <Stack.Screen options={{ title: name as string || "Categoría", headerBackTitle: "Atrás" }} />

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#dc2626" />
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderProduct}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    contentContainerStyle={{ padding: 8 }}
                />
            )}
        </SafeAreaView>
    );
}
