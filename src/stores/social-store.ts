import { create } from 'zustand';

type SocialStore = {
  revision: number;
  bumpRevision: () => void;
};

export const useSocialStore = create<SocialStore>()((set) => ({
  revision: 0,
  bumpRevision: () => set((state) => ({ revision: state.revision + 1 })),
}));
