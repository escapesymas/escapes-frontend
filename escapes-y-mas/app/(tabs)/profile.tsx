import { View, Text, Image, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { getSession, logoutSession, Session } from "../../services/auth"; // Fixed import path
import Button from "../../components/ui/Button";
import { MessageCircle, LogOut, Settings, Bike } from "lucide-react-native";

export default function ProfileScreen() {
    const router = useRouter();
    const [session, setSession] = useState<Session | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const checkSession = useCallback(async () => {
        const s = await getSession();
        setSession(s);
    }, []);

    useEffect(() => {
        checkSession();
    }, [checkSession]); // Reload on mount/focus ideally (using useFocusEffect from expo-router if needed)

    const handleLogout = async () => {
        await logoutSession();
        setSession(null);
        router.replace('/login');
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await checkSession();
        setRefreshing(false);
    };

    if (!session) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
                <Image
                    source={{ uri: "https://via.placeholder.com/150" }}
                    className="w-32 h-32 mb-6 rounded-full bg-gray-100"
                />
                <Text className="text-xl font-bold text-gray-900 mb-2">Bienvenido a Escapes y Más</Text>
                <Text className="text-gray-500 text-center mb-8">Inicia sesión para guardar tu garaje, participar en el foro y hacer seguimiento de tus pedidos.</Text>

                <View className="w-full gap-4">
                    <Button title="Iniciar Sesión" onPress={() => router.push('/login')} />
                    <Button title="Registrarse" variant="outline" onPress={() => router.push('/register')} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ padding: 16 }}
            >
                {/* Header Profile */}
                <View className="flex-row items-center mb-8">
                    <Image
                        source={{ uri: session.avatarUrl || "https://via.placeholder.com/100" }}
                        className="w-20 h-20 rounded-full bg-gray-200 mr-4"
                    />
                    <View className="flex-1">
                        <Text className="text-2xl font-bold text-gray-900">{session.user_display_name}</Text>
                        <Text className="text-gray-500">{session.user_email}</Text>
                        <View className="flex-row mt-2">
                            <View className="bg-red-100 px-2 py-1 rounded-md">
                                <Text className="text-red-700 text-xs font-bold">RIDER</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity onPress={handleLogout} className="p-2">
                        <LogOut size={24} color="#ef4444" />
                    </TouchableOpacity>
                </View>

                {/* My Garage */}
                <View className="mb-6">
                    <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-lg font-bold text-gray-900">Mi Garaje</Text>
                        <TouchableOpacity>
                            <Text className="text-red-600 font-medium">Editar</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="bg-white p-4 rounded-xl shadow-sm flex-row items-center border border-gray-100">
                        <View className="bg-gray-100 p-3 rounded-full mr-4">
                            <Bike size={24} color="#4B5563" />
                        </View>
                        <View>
                            <Text className="font-bold text-gray-900">Yamaha MT-07</Text>
                            <Text className="text-gray-500 text-xs">2023 • Añadida recientemente</Text>
                        </View>
                    </View>
                </View>

                {/* Stats / Activity */}
                <View className="flex-row gap-4 mb-6">
                    <View className="flex-1 bg-white p-4 rounded-xl shadow-sm items-center">
                        <Text className="text-2xl font-bold text-gray-900">0</Text>
                        <Text className="text-gray-500 text-xs text-center">Pedidos</Text>
                    </View>
                    <View className="flex-1 bg-white p-4 rounded-xl shadow-sm items-center">
                        <Text className="text-2xl font-bold text-gray-900">5</Text>
                        <Text className="text-gray-500 text-xs text-center">Puntos Paddock</Text>
                    </View>
                    <View className="flex-1 bg-white p-4 rounded-xl shadow-sm items-center">
                        <Text className="text-2xl font-bold text-gray-900">1</Text>
                        <Text className="text-gray-500 text-xs text-center">Motos</Text>
                    </View>
                </View>

                {/* Menu Options */}
                <View className="bg-white rounded-xl overflow-hidden shadow-sm">
                    <TouchableOpacity className="p-4 border-b border-gray-100 flex-row items-center">
                        <MessageCircle size={20} color="#374151" className="mr-3" />
                        <Text className="text-gray-700 flex-1">Mis Mensajes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="p-4 border-b border-gray-100 flex-row items-center">
                        <Settings size={20} color="#374151" className="mr-3" />
                        <Text className="text-gray-700 flex-1">Configuración</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
