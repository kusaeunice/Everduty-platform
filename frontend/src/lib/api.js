// src/lib/api.js

import axios from "axios";

// 🔥 Hardcoded backend (removes ALL env issues for now)
const BACKEND_URL = "https://everduty-platform.onrender.com";
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("everduty_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 🚫 Handle expired/invalid token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("everduty_token");
      localStorage.removeItem("everduty_user");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

// ===============================
// 🔐 AUTH FUNCTIONS
// ===============================

// REGISTER
export const registerUser = async (data) => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

// LOGIN
export const loginUser = async (data) => {
  const res = await api.post("/auth/login", data);

  // Save token + user
  localStorage.setItem("everduty_token", res.data.token);
  localStorage.setItem("everduty_user", JSON.stringify(res.data.user));

  return res.data;
};

// LOGOUT
export const logoutUser = () => {
  localStorage.removeItem("everduty_token");
  localStorage.removeItem("everduty_user");
  window.location.href = "/";
};

export default api;
