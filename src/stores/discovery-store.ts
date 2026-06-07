import { create } from 'zustand';

const defaultAnchor = {
  latitude: 25.2854,
  longitude: 51.531,
};

type DiscoveryState = {
  radiusKm: number;
  customRadiusKm: string;
  anchor: {
    latitude: number;
    longitude: number;
  };
  setRadiusKm: (radiusKm: number) => void;
  setCustomRadiusKm: (value: string) => void;
  applyCustomRadius: () => void;
  setAnchor: (latitude: number, longitude: number) => void;
};

export const useDiscoveryStore = create<DiscoveryState>()((set, get) => ({
  radiusKm: 50,
  customRadiusKm: '',
  anchor: defaultAnchor,
  setRadiusKm: (radiusKm) => set({ radiusKm, customRadiusKm: '' }),
  setCustomRadiusKm: (customRadiusKm) => set({ customRadiusKm }),
  applyCustomRadius: () => {
    const parsedRadius = Number(get().customRadiusKm);

    if (!Number.isFinite(parsedRadius) || parsedRadius <= 0) {
      return;
    }

    set({ radiusKm: Math.min(parsedRadius, 500) });
  },
  setAnchor: (latitude, longitude) => set({ anchor: { latitude, longitude } }),
}));
