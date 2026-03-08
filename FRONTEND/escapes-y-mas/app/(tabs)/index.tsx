import { View, Text, ScrollView, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import BikeSelector from "../../components/BikeSelector";
import BrandSlider from "../../components/BrandSlider";
import Card from "../../components/ui/Card";
import { STORE_CONFIG } from "../../storeData";
import FeaturedProducts from "../../components/FeaturedProducts";

export default function Home() {
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <ScrollView className="flex-1 px-4 pt-4">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-6">
                    <View>
                        <Text className="text-2xl font-bold text-gray-900">Escapes y Más</Text>
                        <Text className="text-sm text-gray-500">Equipamiento Pro</Text>
                    </View>
                    {/* Placeholder for Profile/Cart Icon if needed here */}
                </View>

                {/* Bike Selector */}
                <BikeSelector />

                {/* Hero Banner */}
                <View className="rounded-2xl overflow-hidden mb-8 h-48 bg-gray-900 relative">
                    <View className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
                        <Text className="text-white font-bold text-2xl text-center">{STORE_CONFIG.heroTitle}</Text>
                        <Text className="text-gray-200 text-center">{STORE_CONFIG.heroSubtitle}</Text>
                    </View>
                </View>

                {/* Brands */}
                <BrandSlider />

                {/* Featured */}
                <FeaturedProducts />

                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
}
