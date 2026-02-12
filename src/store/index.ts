import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    // 여기에 다른 reducer들을 추가 (예: cart: cartReducer)
  },
});

// 타입 추론을 위한 Export
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;