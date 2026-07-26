import { createSlice } from '@reduxjs/toolkit';

const initialSettings = {
  siteName: 'TNT Luxury Streetwear',
  siteEmail: 'contact@tntclothing.com',
  sitePhone: '+91 99999 88888',
  currency: 'INR',
  freeShippingMin: 1999,
  razorpayKeyId: '',
  razorpayEnabled: true,
  codEnabled: true,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    data: initialSettings,
    loading: false,
  },
  reducers: {
    setSettings(state, action) {
      state.data = { ...state.data, ...action.payload };
    },
    setLoading(state, action) {
      state.loading = action.payload;
    }
  }
});

export const { setSettings, setLoading } = settingsSlice.actions;
export default settingsSlice.reducer;

// Selector helpers
export const selectSettings = (state) => state.settings.data;
export const selectCurrencySymbol = (state) => {
  const currency = state.settings.data.currency || 'INR';
  if (currency === 'USD') return '$';
  if (currency === 'EUR') return '€';
  if (currency === 'GBP') return '£';
  return '₹'; // Default to INR ₹
};
