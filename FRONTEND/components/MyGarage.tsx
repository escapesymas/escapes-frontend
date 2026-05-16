import React, { useState, useEffect } from 'react';
import { Bike, Plus, Trash2, Loader2 } from 'lucide-react';
import { BikeSelection, User } from '../types';
import { fetchMasterBrands, fetchMasterModels, fetchMasterYears, updateCustomer } from '../services/woocommerce';

interface MyGarageProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

export const MyGarage: React.FC<MyGarageProps> = ({ user, onUpdateUser }) => {
  const [garage, setGarage] = useState<BikeSelection[]>(user.garage || []);
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newBike, setNewBike] = useState<BikeSelection>({ brand: '', model: '', year: '' });

  useEffect(() => {
    const loadBrands = async () => {
      setLoadingBrands(true);
      try {
        const data = await fetchMasterBrands();
        setBrands(data);
      } catch (err) {}
      setLoadingBrands(false);
    };
    loadBrands();
  }, []);

  useEffect(() => {
    const loadModels = async () => {
      if (!newBike.brand) {
        setModels([]);
        return;
      }
      setLoadingModels(true);
      try {
        const data = await fetchMasterModels(newBike.brand);
        setModels(data);
      } catch (err) {}
      setLoadingModels(false);
    };
    loadModels();
  }, [newBike.brand]);

  useEffect(() => {
    const loadYears = async () => {
      if (!newBike.model || !newBike.brand) {
        setYears([]);
        return;
      }
      setLoadingYears(true);
      try {
        const data = await fetchMasterYears(newBike.brand, newBike.model);
        setYears(data);
      } catch (err) {}
      setLoadingYears(false);
    };
    loadYears();
  }, [newBike.model, newBike.brand]);

  const handleAddBike = async () => {
    if (!newBike.brand || !newBike.model || !newBike.year) return;
    
    // Check if already in garage
    if (garage.some(b => b.brand === newBike.brand && b.model === newBike.model && b.year === newBike.year)) {
      alert('Esta moto ya está en tu garaje');
      return;
    }

    setSaving(true);
    const updatedGarage = [...garage, newBike];
    const success = await updateCustomer(user.id, { garage: updatedGarage });
    
    if (success) {
      setGarage(updatedGarage);
      onUpdateUser({ ...user, garage: updatedGarage });
      setNewBike({ brand: '', model: '', year: '' });
    } else {
      alert('Error al guardar la moto en el garaje');
    }
    setSaving(false);
  };

  const handleRemoveBike = async (index: number) => {
    setSaving(true);
    const updatedGarage = garage.filter((_, i) => i !== index);
    const success = await updateCustomer(user.id, { garage: updatedGarage });
    
    if (success) {
      setGarage(updatedGarage);
      onUpdateUser({ ...user, garage: updatedGarage });
    } else {
      alert('Error al eliminar la moto del garaje');
    }
    setSaving(false);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm mb-8">
      <h3 className="text-white font-bold uppercase mb-4 tracking-wide border-b border-zinc-800 pb-2 flex items-center gap-2">
        <Bike className="w-5 h-5 text-racing-orange" /> Mi Garaje
      </h3>

      {/* Lista de Motos en el Garaje */}
      {garage.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {garage.map((bike, index) => (
            <div key={index} className="bg-racing-carbon border border-racing-orange/30 p-4 rounded-sm flex items-center justify-between group">
              <div>
                <p className="text-zinc-400 text-xs font-bold uppercase">{bike.brand}</p>
                <p className="text-white font-black italic text-lg">{bike.model}</p>
                <p className="text-racing-orange text-sm font-bold">{bike.year}</p>
              </div>
              <button 
                onClick={() => handleRemoveBike(index)}
                disabled={saving}
                className="text-zinc-600 hover:text-red-500 transition-colors p-2"
                title="Eliminar del garaje"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-zinc-500 text-sm mb-6">No tienes ninguna moto en tu garaje. Añade una para filtrar los productos automáticamente.</p>
      )}

      {/* Formulario para añadir Moto */}
      <div className="bg-zinc-800/50 p-4 rounded-sm border border-zinc-700">
        <h4 className="text-zinc-300 text-sm font-bold uppercase mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Añadir Nueva Moto
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <select
              className="w-full h-10 bg-zinc-900 border border-zinc-700 text-white px-3 rounded-sm appearance-none focus:border-racing-orange outline-none text-sm"
              value={newBike.brand}
              onChange={(e) => setNewBike({ brand: e.target.value, model: '', year: '' })}
              disabled={loadingBrands || saving}
            >
              <option value="">Marca</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          
          <div className="relative">
            <select
              className="w-full h-10 bg-zinc-900 border border-zinc-700 text-white px-3 rounded-sm appearance-none focus:border-racing-orange outline-none text-sm disabled:opacity-50"
              value={newBike.model}
              onChange={(e) => setNewBike({ ...newBike, model: e.target.value, year: '' })}
              disabled={!newBike.brand || loadingModels || saving}
            >
              <option value="">Modelo</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="relative">
            <select
              className="w-full h-10 bg-zinc-900 border border-zinc-700 text-white px-3 rounded-sm appearance-none focus:border-racing-orange outline-none text-sm disabled:opacity-50"
              value={newBike.year}
              onChange={(e) => setNewBike({ ...newBike, year: e.target.value })}
              disabled={!newBike.model || loadingYears || saving}
            >
              <option value="">Año</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
              {years.length > 0 && <option value="General">Todos los años</option>}
            </select>
          </div>

          <button
            onClick={handleAddBike}
            disabled={!newBike.brand || !newBike.model || !newBike.year || saving}
            className="h-10 bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase text-xs rounded-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
};
