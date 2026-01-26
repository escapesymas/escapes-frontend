import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { useState } from "react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { registerUser, saveSession } from "../services/auth";

export default function RegisterScreen() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        firstName: "",
        lastName: "",
        password: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleRegister = async () => {
        const { username, email, password, confirmPassword } = formData;
        if (!username || !email || !password) {
            Alert.alert("Error", "Todos los campos son obligatorios");
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert("Error", "Las contraseñas no coinciden");
            return;
        }

        setLoading(true);
        try {
            const session = await registerUser({
                username,
                email,
                password,
                firstName: formData.firstName,
                lastName: formData.lastName
            });
            await saveSession(session);
            Alert.alert("Éxito", "Cuenta creada correctamente");
            router.replace('/(tabs)/profile');
        } catch (error: any) {
            Alert.alert("Error de Registro", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{ title: "Crear Cuenta", headerBackTitle: "Login" }} />
            <ScrollView className="p-6">

                <View className="items-center mb-8">
                    <Text className="text-2xl font-bold text-gray-900">Únete al Paddock</Text>
                    <Text className="text-gray-500">Crea tu perfil y comparte tu pasión</Text>
                </View>

                <View className="mb-6">
                    <Input
                        label="Nombre de Usuario"
                        value={formData.username}
                        onChangeText={(t) => updateField('username', t)}
                        placeholder="rider123"
                    />
                    <Input
                        label="Email"
                        value={formData.email}
                        onChangeText={(t) => updateField('email', t)}
                        placeholder="ejemplo@email.com"
                    />
                    <View className="flex-row gap-2">
                        <View className="flex-1">
                            <Input
                                label="Nombre"
                                value={formData.firstName}
                                onChangeText={(t) => updateField('firstName', t)}
                                placeholder="Juan"
                            />
                        </View>
                        <View className="flex-1">
                            <Input
                                label="Apellido"
                                value={formData.lastName}
                                onChangeText={(t) => updateField('lastName', t)}
                                placeholder="Pérez"
                            />
                        </View>
                    </View>
                    <Input
                        label="Contraseña"
                        value={formData.password}
                        onChangeText={(t) => updateField('password', t)}
                        placeholder="••••••••"
                        secureTextEntry
                    />
                    <Input
                        label="Confirmar Contraseña"
                        value={formData.confirmPassword}
                        onChangeText={(t) => updateField('confirmPassword', t)}
                        placeholder="••••••••"
                        secureTextEntry
                    />

                    <Button
                        title="Registrarse"
                        onPress={handleRegister}
                        loading={loading}
                        className="mt-2"
                    />
                </View>

                <TouchableOpacity onPress={() => router.back()} className="self-center mb-10">
                    <Text className="text-gray-600">¿Ya tienes cuenta? <Text className="text-red-600 font-bold">Inicia Sesión</Text></Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
