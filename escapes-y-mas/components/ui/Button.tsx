import { Text, TouchableOpacity, ActivityIndicator, View } from "react-native";

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    loading?: boolean;
    disabled?: boolean;
    className?: string;
    icon?: React.ReactNode;
}

export default function Button({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    className = "",
    icon
}: ButtonProps) {
    const baseStyle = "p-4 rounded-xl items-center justify-center flex-row";
    const variants = {
        primary: "bg-red-600",
        secondary: "bg-gray-800",
        outline: "border border-red-600 bg-transparent"
    };
    const textVariants = {
        primary: "text-white font-bold text-lg",
        secondary: "text-white font-bold text-lg",
        outline: "text-red-600 font-bold text-lg"
    };

    const textColorClass = textVariants[variant];
    const indicatorColor = variant === 'outline' ? '#dc2626' : 'white';

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading || disabled}
            className={`${baseStyle} ${variants[variant]} ${loading || disabled ? 'opacity-70' : ''} ${className}`}
        >
            {loading ? (
                <ActivityIndicator color={indicatorColor} />
            ) : (
                <View className="flex-row items-center justify-center">
                    {icon && <View className="mr-2">{icon}</View>}
                    <Text className={textColorClass}>
                        {title}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

