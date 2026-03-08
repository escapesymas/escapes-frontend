import { View, ScrollView, Text } from "react-native";
import { Image } from "expo-image";
import { BIKE_DATA } from "../../storeData";

const BRAND_LOGOS: Record<string, string> = {
    // Add brand logo URLs here in the future
    // "Yamaha": "https://...",
};

export default function BrandSlider() {
    const brands = BIKE_DATA.brands;

    return (
        <View className="mb-6">
            <Text className="text-lg font-bold mb-3 text-gray-900 px-4">Mejores Marcas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {brands.map((brand, index) => (
                    <View key={index} className="mr-4 items-center">
                        <View className="w-20 h-20 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100 mb-2 overflow-hidden">
                            {BRAND_LOGOS[brand] ? (
                                <Image
                                    source={{ uri: BRAND_LOGOS[brand] }}
                                    style={{ width: '100%', height: '100%' }}
                                    contentFit="contain"
                                    transition={200}
                                    cachePolicy="memory-disk"
                                />
                            ) : (
                                <Text className="text-xs font-bold text-gray-500">{brand.substring(0, 3).toUpperCase()}</Text>
                            )}
                        </View>
                        <Text className="text-xs text-gray-600 font-medium">{brand}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}
