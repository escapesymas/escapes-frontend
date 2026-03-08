import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { ChevronDown, X, Bike } from 'lucide-react-native';
import { BIKE_DATA } from '../../storeData';

export default function BikeSelector() {
    const [modalVisible, setModalVisible] = useState(false);
    const [selection, setSelection] = useState<{ brand?: string; model?: string; year?: string }>({});
    const [step, setStep] = useState<'brand' | 'model' | 'year'>('brand');

    const handleOpen = () => {
        setModalVisible(true);
        setStep('brand');
    };

    const handleSelect = (value: string) => {
        if (step === 'brand') {
            setSelection({ brand: value });
            setStep('model');
        } else if (step === 'model') {
            setSelection(prev => ({ ...prev, model: value }));
            setStep('year');
        } else {
            setSelection(prev => ({ ...prev, year: value }));
            setModalVisible(false); // Close on finish
            setStep('brand');
        }
    };

    const getOptions = () => {
        if (step === 'brand') return BIKE_DATA.brands;
        if (step === 'model' && selection.brand) return BIKE_DATA.models[selection.brand] || [];
        if (step === 'year') return BIKE_DATA.years;
        return [];
    };

    return (
        <View className="w-full mb-6">
            <TouchableOpacity
                onPress={handleOpen}
                className="bg-red-600 rounded-xl p-4 flex-row items-center justify-between"
            >
                <View className="flex-row items-center">
                    <View className="bg-red-700 p-2 rounded-lg mr-3">
                        <Bike size={24} color="white" />
                    </View>
                    <View>
                        <Text className="text-white text-xs font-bold uppercase tracking-wider">
                            {selection.year && selection.model ? `${selection.brand} ${selection.model} (${selection.year})` : "SELECCIONA TU MOTO"}
                        </Text>
                        <Text className="text-red-100 text-sm">
                            {selection.year ? "Tocar para cambiar" : "Encuentra piezas compatibles"}
                        </Text>
                    </View>
                </View>
                <ChevronDown size={20} color="white" />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl min-h-[50%] p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-gray-900">
                                {step === 'brand' ? 'Selecciona Marca' : step === 'model' ? `Modelos ${selection.brand}` : 'Año'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {getOptions().map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    onPress={() => handleSelect(item)}
                                    className="py-4 border-b border-gray-100 flex-row justify-between items-center"
                                >
                                    <Text className="text-lg text-gray-700">{item}</Text>
                                    <ChevronDown size={16} color="#9CA3AF" -rotate-90 />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
