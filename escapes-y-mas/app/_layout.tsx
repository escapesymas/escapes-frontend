import "../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CartProvider } from "../context/CartContext";

export default function RootLayout() {
    return (
        <CartProvider>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="category/[id]" options={{ presentation: 'card' }} />
                <Stack.Screen name="product/[id]" options={{ presentation: 'card' }} />
                <Stack.Screen name="cart" options={{ presentation: 'modal' }} />
                <Stack.Screen name="checkout" options={{ headerShown: false }} />
            </Stack>
        </CartProvider>
    );
}
