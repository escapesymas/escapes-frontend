import { TextInput, View, Text } from "react-native";

interface InputProps {
    label?: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    className?: string;
}

export default function Input({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, className = "" }: InputProps) {
    return (
        <View className={`mb-4 ${className}`}>
            {label && <Text className="text-gray-700 font-medium mb-1.5">{label}</Text>}
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 text-base"
                placeholderTextColor="#9CA3AF"
            />
        </View>
    );
}
