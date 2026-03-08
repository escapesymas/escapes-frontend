import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { fetchProducts } from "../services/woocommerce";
import { Product } from "../types";
import Card from "./ui/Card";

export default function FeaturedProducts() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFeatured();
    }, []);

    const loadFeatured = async () => {
        try {
            const { products: data } = await fetchProducts(undefined, undefined, 1, 10);
            setProducts(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <ActivityIndicator color="#dc2626" />;

    return (
        <View>
            <View className="flex-row justify-between items-center mb-4 px-1">
                <Text className="text-xl font-bold text-gray-900">Destacados</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/catalog')}>
                    <Text className="text-red-600 font-medium">Ver todo</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                horizontal
                data={products}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 4 }}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => router.push(`/product/${item.id}`)} className="mr-4">
                        <Card className="w-40 p-0 overflow-hidden pb-3">
                            <Image
                                source={{ uri: item.image }}
                                style={{ width: '100%', height: 128, backgroundColor: '#f3f4f6' }}
                                contentFit="cover"
                                transition={200}
                                cachePolicy="memory-disk"
                            />
                            <View className="px-3 pt-2">
                                <Text className="font-bold text-gray-900 text-sm leading-4 mb-1" numberOfLines={2}>{item.title}</Text>
                                <Text className="text-red-600 font-bold">{item.price} €</Text>
                            </View>
                        </Card>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}
