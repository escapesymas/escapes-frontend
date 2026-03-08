import { View, Text, ScrollView, Alert, Modal, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useCart } from "../../context/CartContext";
import { getSession } from "../../services/auth";
import { WebView } from 'react-native-webview';

// NOTE: In a real app, this should be in services
const createOrder = async (orderData: any, token?: string) => {
    // Mock API call to create order in WC
    // In prod: POST /wp-json/wc/v3/orders
    return new Promise((resolve) => setTimeout(() => resolve({
        id: Math.floor(Math.random() * 10000),
        payment_url: "https://sumup.com/pay/mock_url" // In real flow this comes from WC payment gateway
    }), 2000));
};

export default function CheckoutScreen() {
    const router = useRouter();
    const { items, total, clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState("");

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        address: "",
        city: "",
        zip: "",
        phone: ""
    });

    useEffect(() => {
        // Pre-fill if logged in
        getSession().then(session => {
            if (session) {
                setFormData(prev => ({
                    ...prev,
                    email: session.user_email,
                    firstName: session.user_display_name.split(" ")[0] || "",
                }));
            }
        });
    }, []);

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePlaceOrder = async () => {
        if (!formData.address || !formData.city || !formData.zip) {
            Alert.alert("Error", "Por favor completa la dirección de envío");
            return;
        }

        setLoading(true);
        try {
            // 1. Create Order
            const orderRes: any = await createOrder({
                billing: formData,
                shipping: formData,
                line_items: items.map(i => ({ product_id: i.id, quantity: i.quantity }))
            });

            // 2. Handle Payment Flow
            // For this specific 'Hybrid Native' SumUp plan:
            // We expect a payment_url or we simulate one.
            // Since we don't have a real backend configured for SumUp yet, we will simulate the modal.

            setPaymentUrl("https://sumup.es"); // URL real de SumUp o la de la pasarela
            setShowPaymentModal(true);

            // In a real scenario, we wait for webview navigation to 'success' url
            // Here we just simulate success after a delay or user action in modal

        } catch (e) {
            Alert.alert("Error", "No se pudo crear el pedido");
        } finally {
            setLoading(false);
        }
    };

    const handleWebViewNavigation = (navState: any) => {
        // Intercept Success/Fail URLs
        // Example: if (navState.url.includes('order-received')) ...

        // For simulation, we assume any navigation is 'processing' and we might auto-close
        // But for this demo, let's just close manually or via a timer
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{ title: "Completar Pedido" }} />

            <ScrollView className="flex-1 p-4">
                <Text className="text-xl font-bold mb-4 text-gray-900">Dirección de Envío</Text>

                <View className="flex-row gap-2 mb-2">
                    <View className="flex-1">
                        <Input label="Nombre" value={formData.firstName} onChangeText={t => updateField('firstName', t)} placeholder="Nombre" />
                    </View>
                    <View className="flex-1">
                        <Input label="Apellido" value={formData.lastName} onChangeText={t => updateField('lastName', t)} placeholder="Apellido" />
                    </View>
                </View>

                <Input label="Email" value={formData.email} onChangeText={t => updateField('email', t)} placeholder="Email" keyboardType="email-address" />
                <Input label="Teléfono" value={formData.phone} onChangeText={t => updateField('phone', t)} placeholder="Móvil" keyboardType="phone-pad" />

                <Input label="Dirección" value={formData.address} onChangeText={t => updateField('address', t)} placeholder="Calle, Número, Piso" />

                <View className="flex-row gap-2 mb-6">
                    <View className="flex-1">
                        <Input label="Ciudad" value={formData.city} onChangeText={t => updateField('city', t)} placeholder="Ciudad" />
                    </View>
                    <View className="flex-1">
                        <Input label="Código Postal" value={formData.zip} onChangeText={t => updateField('zip', t)} placeholder="CP" keyboardType="numeric" />
                    </View>
                </View>

                <View className="bg-gray-50 p-4 rounded-xl mb-6">
                    <Text className="font-bold text-gray-900 mb-2">Resumen</Text>
                    <View className="flex-row justify-between mb-1">
                        <Text className="text-gray-600">Subtotal</Text>
                        <Text className="text-gray-900">{total.toFixed(2)} €</Text>
                    </View>
                    <View className="flex-row justify-between mb-1">
                        <Text className="text-gray-600">Envío</Text>
                        <Text className="text-gray-900 font-bold text-green-600">GRATIS</Text>
                    </View>
                    <View className="border-t border-gray-200 mt-2 pt-2 flex-row justify-between">
                        <Text className="font-bold text-lg text-gray-900">Total</Text>
                        <Text className="font-bold text-lg text-red-600">{total.toFixed(2)} €</Text>
                    </View>
                </View>

                <Button
                    title={`Pagar ${total.toFixed(2)} €`}
                    onPress={handlePlaceOrder}
                    loading={loading}
                    className="mb-10"
                />
            </ScrollView>

            {/* Payment Modal */}
            <Modal visible={showPaymentModal} animationType="slide" presentationStyle="pageSheet">
                <View className="flex-1 bg-white">
                    <View className="p-4 flex-row justify-between items-center border-b border-gray-100">
                        <Text className="font-bold text-lg">Pasarela de Pago</Text>
                        <Text className="text-blue-600" onPress={() => {
                            setShowPaymentModal(false);
                            // Simulate success for demo
                            Alert.alert("Pedido Confirmado", "Gracias por tu compra.");
                            clearCart();
                            router.replace('/(tabs)/profile');
                        }}>Cerrar (Simular Éxito)</Text>
                    </View>
                    {paymentUrl ? (
                        <WebView
                            source={{ uri: paymentUrl }}
                            onNavigationStateChange={handleWebViewNavigation}
                            startInLoadingState
                            renderLoading={() => <View className="flex-1 justify-center items-center"><ActivityIndicator /></View>}
                        />
                    ) : null}
                </View>
            </Modal>
        </SafeAreaView>
    );
}
