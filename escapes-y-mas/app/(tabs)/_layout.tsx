import { Tabs } from "expo-router";
import { Home, Search, MessageSquare, User, ShoppingCart } from "lucide-react-native";
import { View } from "react-native";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: "#ffffff",
                    borderTopColor: "#e5e7eb",
                },
                tabBarActiveTintColor: "#dc2626", // red-600
                tabBarInactiveTintColor: "#6b7280", // gray-500
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Inicio",
                    tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="catalog"
                options={{
                    title: "Catálogo",
                    tabBarIcon: ({ color }) => <Search size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="paddock"
                options={{
                    title: "Paddock",
                    tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Perfil",
                    tabBarIcon: ({ color }) => <User size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="cart"
                options={{
                    title: "Carrito",
                    tabBarIcon: ({ color }) => <ShoppingCart size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
