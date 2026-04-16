// src/lib/api.js

const API_URL = process.env.REACT_APP_API_URL;

// Safety check so you NEVER get "undefined" again
if (!API_URL) {
  console.error("❌ REACT_APP_API_URL is missing!");
}

// Generic request handler
const request = async (endpoint, method = "GET", data = null) => {
  const url = `${API_URL}${endpoint}`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : null,
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.detail || "Request failed");
    }

    return result;
  } catch (err) {
    console.error("API Error:", err.message);
    throw err;
  }
};

// 🔐 REGISTER
export const registerUser = (data) => {
  return request("/api/auth/register", "POST", data);
};

// 🔐 LOGIN
export const loginUser = (data) => {
  return request("/api/auth/login", "POST", data);
};
