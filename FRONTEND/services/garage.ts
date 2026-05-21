import { BikeSelection } from "../types";

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? '' : 'https://backendescapes.com';
const API_URL = `${API_BASE}/api/garage`;

export async function fetchGarage(userEmail: string): Promise<BikeSelection[]> {
  const res = await fetch(`${API_URL}?userEmail=${encodeURIComponent(userEmail)}`);
  if (!res.ok) return [];
  const data = await res.json();
  // Transformar de la DB al formato BikeSelection si es necesario
  return data.map((b: any) => ({
    id: b.id, // Guardamos el ID de la DB
    brand: b.brand,
    model: b.model,
    year: b.year
  }));
}

export async function addBikeToGarage(userEmail: string, bike: BikeSelection): Promise<boolean> {
  const res = await fetch(`${API_URL}?userEmail=${encodeURIComponent(userEmail)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bike)
  });
  return res.ok;
}

export async function removeBikeFromGarage(userEmail: string, vehicleId: number): Promise<boolean> {
  const res = await fetch(`${API_URL}?userEmail=${encodeURIComponent(userEmail)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicleId })
  });
  return res.ok;
}
