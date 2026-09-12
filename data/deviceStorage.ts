// Web implementation; Metro selects deviceStorage.native.ts on iOS/Android.
const storage = {
  getItem: async (key: string) => localStorage.getItem(key),
  setItem: async (key: string, value: string) => { localStorage.setItem(key, value); },
  removeItem: async (key: string) => { localStorage.removeItem(key); },
  getAllKeys: async () => Object.keys(localStorage),
  multiGet: async (keys: string[]): Promise<[string, string | null][]> => keys.map(key => [key, localStorage.getItem(key)])
};
export default storage;
