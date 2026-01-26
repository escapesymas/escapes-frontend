import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageSquare, Heart, Share2 } from "lucide-react-native";

// Mock Data for Social Feed
const POSTS = [
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
    },
    {
        id: 3,
        author: "Admin Escapes",
        avatar: "https://via.placeholder.com/100",
        time: "1d",
        content: "🚨 NUEVA OFERTA: 15% de descuento en toda la gama Akrapovic este fin de semana. ¡Aprovechad! 💨",
        image: null,
        likes: 89,
        comments: 5
    }
];

export default function PaddockScreen() {
    const renderPost = ({ item }: { item: any }) => (
        <View className="bg-white mb-4 p-4 shadow-sm">
            {/* Header */}
            <View className="flex-row items-center mb-3">
                <Image source={{ uri: item.avatar }} className="w-10 h-10 rounded-full mr-3 bg-gray-200" />
                <View>
                    <Text className="font-bold text-gray-900">{item.author}</Text>
                    <Text className="text-gray-500 text-xs">{item.time} • Público</Text>
                </View>
            </View>

            {/* Content */}
            <Text className="text-gray-800 text-base mb-3 leading-6">{item.content}</Text>

            {item.image && (
                <Image
                    source={{ uri: item.image }}
                    className="w-full h-56 rounded-xl mb-3"
                    resizeMode="cover"
                />
            )}

            {/* Actions */}
            <View className="flex-row border-t border-gray-100 pt-3 mt-1">
                <TouchableOpacity className="flex-row items-center mr-6">
                    <Heart size={20} color="#dc2626" className="mr-1" />
                    <Text className="text-gray-600 font-medium">{item.likes}</Text>
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center mr-6">
                    <MessageSquare size={20} color="#4B5563" className="mr-1" />
                    <Text className="text-gray-600 font-medium">{item.comments}</Text>
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center ml-auto">
                    <Share2 size={20} color="#4B5563" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <View className="bg-white p-4 border-b border-gray-200 sticky top-0 z-10">
                <Text className="text-xl font-bold text-red-600">El Paddock</Text>
            </View>

            <FlatList
                data={POSTS}
                renderItem={renderPost}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ paddingTop: 8 }}
            />
        </SafeAreaView>
    );
}
