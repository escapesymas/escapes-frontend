import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { useState } from "react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { loginUser, saveSession } from "../services/auth";

export default function LoginScreen() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert("Error", "Por favor ingresa usuario y contraseña");
            return;
        }

        setLoading(true);
        try {
            const session = await loginUser(username, password);
            await saveSession(session);
            Alert.alert("Bienvenido", `Hola ${session.user_display_name}`);
            // Navigate to profile (tab)
            router.replace('/(tabs)/profile');
        } catch (error: any) {
            Alert.alert("Login Fallido", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white p-6 justify-center">
            <Stack.Screen options={{ headerShown: false }} />

            <View className="items-center mb-8">
                <Text className="text-3xl font-bold text-red-600 mb-2">Escapes y Más</Text>
                <Text className="text-gray-500 text-lg">Inicia sesión en tu cuenta</Text>
            </View>

            <View className="mb-6">
                <Input
                    label="Usuario / Email"
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Tu nombre de usuario"
                />
                <Input
                    label="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry
                />

                <TouchableOpacity className="self-end mb-4">
                    <Text className="text-red-600 font-medium">¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>

                <Button
                    title="Iniciar Sesión"
                    onPress={handleLogin}
                    loading={loading}
                />
            </View>

            <View className="flex-row justify-center mt-4">
                <Text className="text-gray-600">¿No tienes cuenta? </Text>
                <TouchableOpacity onPress={() => router.push('/register')}>
                    <Text className="text-red-600 font-bold">Regístrate</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
