import { View, Text } from "react-native";
import { styled } from "nativewind";

export default function Card({ children, className = "" }) {
    return (
        <View className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ${className}`}>
            {children}
        </View>
    );
}
