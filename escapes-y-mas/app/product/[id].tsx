import { View, Text, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchProductById } from "../../services/woocommerce";
import { Product } from "../../types";
import Button from "../../components/ui/Button";
import { ShoppingCart } from "lucide-react-native";
import { useCart } from "../../context/CartContext";
import CartIcon from "../../components/CartIcon";

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { addItem } = useCart();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    const handleAddToCart = () => {
        if (product) {
            addItem(product);
            router.push('/cart');
        }
    };

    useEffect(() => {
        fetchProductById(id as string).then(p => {
            setProduct(p);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id]);

    if (loading || !product) {
        return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#dc2626" /></View>;
    }

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
            <Stack.Screen options={{
                headerTitle: "",
                headerTransparent: true,
                headerRight: () => <CartIcon />
            }} />
            <ScrollView>
                {/* Basic Image Carousel */}
                <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                    {product.images?.length > 0 ? (
                        product.images.map((img, index) => (
                            <Image
                                key={index}
                                source={{ uri: img.src }}
                                style={{ width: Dimensions.get('window').width, height: 400, backgroundColor: '#f3f4f6' }}
                                contentFit="cover"
                                transition={200}
                                priority={index === 0 ? "high" : "normal"}
                                cachePolicy="memory-disk"
                            />
                        ))
                    ) : (
                        <Image
                            source={{ uri: product.image }}
                            style={{ width: Dimensions.get('window').width, height: 400, backgroundColor: '#f3f4f6' }}
                            contentFit="cover"
                            transition={200}
                            priority="high"
                            cachePolicy="memory-disk"
                        />
                    )}
                </ScrollView>

                <View className="p-4">
                    <Text className="text-2xl font-bold text-gray-900 mb-2">{product.title}</Text>
                    <Text className="text-xl font-bold text-red-600 mb-4">{product.price} €</Text>

                    <View className="bg-gray-50 p-4 rounded-xl mb-6">
                        <Text className="font-bold text-gray-900 mb-2">Descripción</Text>
                        {/* Removing HTML tags for basic view */}
                        <Text className="text-gray-600 leading-6">
                            {(product.description || "").replace(/<[^>]*>?/gm, '')}
                        </Text>
                    </View>
                </View>
                <View className="h-20" />
            </ScrollView>

            {/* Sticky Add to Cart */}
            <View className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 shadow-lg pb-8">
                <Button
                    title="Añadir al Carrito"
                    icon={<ShoppingCart size={20} color="white" />}
                    onPress={handleAddToCart}
                />
            </View>
        </SafeAreaView>
    );
}
