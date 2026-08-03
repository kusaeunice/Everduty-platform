import axios from "axios";

// Use the Vercel environment variable when available.
// Fall back to the existing Render backend during development.
const BACKEND_URL =
  process.env.REACT_APP_API_URL ||
  "https://everduty-platform.onrender.com";

const API_BASE = `${BACKEND_URL.replace(/\/$/, "")}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the saved login token to every protected request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("everduty_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired or invalid login sessions.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("everduty_token");
      localStorage.removeItem("everduty_user");

      // Avoid repeatedly redirecting when already on the home/login page.
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

// Register a worker, employer, agency or other supported user.
export const registerUser = async (data) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

// Log in and save the returned backend token and user.
export const loginUser = async (data) => {
  const response = await api.post("/auth/login", data);

  localStorage.setItem("everduty_token", response.data.token);
  localStorage.setItem(
    "everduty_user",
    JSON.stringify(response.data.user)
  );

  return response.data;
};

// Return the currently saved user from the browser.
export const getStoredUser = () => {
  const storedUser = localStorage.getItem("everduty_user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem("everduty_user");
    return null;
  }
};

// Check whether a login token currently exists.
export const isLoggedIn = () => {
  return Boolean(localStorage.getItem("everduty_token"));
};

// Remove the local login session.
export const logoutUser = () => {
  localStorage.removeItem("everduty_token");
  localStorage.removeItem("everduty_user");
  window.location.href = "/";
};

export default api;
