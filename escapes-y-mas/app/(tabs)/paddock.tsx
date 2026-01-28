import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageSquare, Heart, Share2, ChevronRight, ArrowLeft, MapPin } from "lucide-react-native";
import { STATIC_CATEGORIES, SPAIN_PROVINCES, fetchTopics } from "../../services/forum";
import { ForumTopic } from "../../types";

// Mock Data for Social Feed (To be replaced by fetchTopics in logic)
const MOCK_POSTS = [
    {
        id: 1,
        author: "Marc Márquez",
        avatar: "https://i.pravatar.cc/100?img=11",
        time: "2h",
        content: "¡Increíble ruta hoy por la sierra! Probando el nuevo escape SC Project en la CBR. 🚀🔥",
        image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        likes: 124,
        comments: 18
    },
    {
        id: 2,
        author: "Ana Carrasco",
        avatar: "https://i.pravatar.cc/100?img=5",
        time: "4h",
        content: "¿Alguien sabe si el Arrow Thunder es compatible con la Ninja 400 2024?",
        likes: 45,
        comments: 32
    }
];

type ViewState = 'categories' | 'provinces' | 'topics';

export default function PaddockScreen() {
    const [view, setView] = useState<ViewState>('categories');
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
    const [topics, setTopics] = useState<any[]>(MOCK_POSTS);
    const [loading, setLoading] = useState(false);

    const handleCategoryPress = (category: any) => {
        setSelectedCategory(category);
        if (category.id === 'routes') {
            setView('provinces');
        } else {
            loadTopics(category.id);
            setView('topics');
        }
    };

    const handleProvincePress = (province: string) => {
        setSelectedProvince(province);
        loadTopics(`routes_${province}`); // Mock logic for fetching by province
        setView('topics');
    };

    const loadTopics = async (contextId: string) => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            // In a real app, fetchTopics(contextId) would be called here
            setTopics(MOCK_POSTS);
            setLoading(false);
        }, 500);
    };

    const goBack = () => {
        if (view === 'topics') {
            if (selectedCategory?.id === 'routes') {
                setView('provinces');
                setSelectedProvince(null);
            } else {
                setView('categories');
                setSelectedCategory(null);
            }
        } else if (view === 'provinces') {
            setView('categories');
            setSelectedCategory(null);
        }
    };

    const renderCategoryItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            className={`flex-1 m-2 p-4 rounded-xl ${item.bg} border-l-4 ${item.color.replace('text', 'border')} shadow-sm`}
            onPress={() => handleCategoryPress(item)}
        >
            <View className="mb-3 p-2 bg-white/60 rounded-full self-start">
                <item.icon size={24} color="#333" />
            </View>
            <Text className="text-lg font-bold text-gray-900 mb-1">{item.title}</Text>
            <Text className="text-sm text-gray-600 leading-5">{item.description}</Text>
        </TouchableOpacity>
    );

    const renderProvinceItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            className="flex-row items-center p-4 border-b border-gray-100 bg-white"
            onPress={() => handleProvincePress(item)}
        >
            <MapPin size={20} color="#ef4444" className="mr-3" />
            <Text className="text-gray-800 text-base flex-1">{item}</Text>
            <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>
    );

    const renderPost = ({ item }: { item: any }) => (
        <View className="bg-white mb-4 p-4 shadow-sm">
            <View className="flex-row items-center mb-3">
                <Image source={{ uri: item.avatar }} className="w-10 h-10 rounded-full mr-3 bg-gray-200" />
                <View>
                    <Text className="font-bold text-gray-900">{item.author}</Text>
                    <Text className="text-gray-500 text-xs">{item.time} • Público</Text>
                </View>
            </View>
            <Text className="text-gray-800 text-base mb-3 leading-6">{item.content}</Text>
            {item.image && (
                <Image source={{ uri: item.image }} className="w-full h-56 rounded-xl mb-3" resizeMode="cover" />
            )}
            <View className="flex-row border-t border-gray-100 pt-3 mt-1">
                <TouchableOpacity className="flex-row items-center mr-6">
                    <Heart size={20} color="#dc2626" className="mr-1" />
                    <Text className="text-gray-600 font-medium">{item.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center mr-6">
                    <MessageSquare size={20} color="#4B5563" className="mr-1" />
                    <Text className="text-gray-600 font-medium">{item.comments}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white p-4 border-b border-gray-200 sticky top-0 z-10 flex-row items-center">
                {view !== 'categories' && (
                    <TouchableOpacity onPress={goBack} className="mr-3">
                        <ArrowLeft size={24} color="#333" />
                    </TouchableOpacity>
                )}
                <View>
                    <Text className="text-xl font-bold text-red-600">
                        {view === 'categories' ? 'El Paddock' : selectedCategory?.title}
                    </Text>
                    {selectedProvince && (
                        <Text className="text-xs text-gray-500 font-medium">
                            España <ChevronRight size={10} color="#666" /> {selectedProvince}
                        </Text>
                    )}
                </View>
            </View>

            {/* Content */}
            {view === 'categories' && (
                <FlatList
                    data={STATIC_CATEGORIES}
                    renderItem={renderCategoryItem}
                    keyExtractor={item => item.id}
                    numColumns={1}
                    contentContainerStyle={{ padding: 8 }}
                />
            )}

            {view === 'provinces' && (
                <FlatList
                    data={SPAIN_PROVINCES}
                    renderItem={renderProvinceItem}
                    keyExtractor={item => item}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListHeaderComponent={
                        <View className="p-4 bg-red-50 mb-2">
                            <Text className="text-red-800 font-medium text-center">Selecciona tu provincia para ver rutas</Text>
                        </View>
                    }
                />
            )}

            {view === 'topics' && (
                <>
                    {selectedCategory?.id === 'market_bikes' && (
                        <View className="bg-yellow-50 p-3 mx-4 mt-4 rounded-lg border border-yellow-200">
                            <Text className="text-yellow-800 text-sm text-center font-bold">
                                ⚠️ SOLO MOTOS COMPLETAS.
                            </Text>
                            <Text className="text-yellow-700 text-xs text-center mt-1">
                                No se permiten piezas, recambios ni equipamiento en esta sección.
                            </Text>
                        </View>
                    )}

                    {loading ? (
                        <View className="mt-10">
                            <ActivityIndicator size="large" color="#dc2626" />
                        </View>
                    ) : (
                        <FlatList
                            data={topics}
                            renderItem={renderPost}
                            keyExtractor={item => item.id.toString()}
                            contentContainerStyle={{ paddingTop: 16 }}
                        />
                    )}
                </>
            )}
        </SafeAreaView>
    );
}
