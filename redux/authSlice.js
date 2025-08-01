// redux/authSlice.js (or .ts)
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLoggedIn: false,
  currentUser: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state, action) {
      state.isLoggedIn = true;
      state.currentUser = action.payload;
    },
    setUser(state, action) {
      state.currentUser = action.payload;
      state.isLoggedIn = !!action.payload;
    },
    logout(state) {
      state.isLoggedIn = false;
      state.currentUser = null;
    },
  },
});

export const { login, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
