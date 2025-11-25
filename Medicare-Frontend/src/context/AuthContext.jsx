// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { decryptPrivateKey as decryptPrivateKeyUtil } from "../services/encryptionService";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("token", token);
    } else {
      delete api.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.data.access_token;
      setToken(token);
      localStorage.setItem("token", token);

      const profileRes = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = profileRes.data;
      setUser(userData);
      localStorage.setItem("id", userData.id);

      const keyRes = await api.get("/auth/get-keys", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { public_key, private_key_encrypted, salt, nonce, kdf_iterations } = keyRes.data;

      const privateKeyPem = await decryptPrivateKeyUtil(
        password,
        private_key_encrypted,
        salt,
        nonce,
        kdf_iterations
      );

      // ✅ store decrypted key for future use
      localStorage.setItem("privateKey", privateKeyPem.trim());
      localStorage.setItem("publicKey", public_key);

      toast.success("Login successful");
      navigate(`/${userData.role}/dashboard`);
    } catch (error) {
      console.error("Login failed", error);
      toast.error("Invalid credentials or server error");
    }
  };

  const register = async ({ name, email, password, role }) => {
    const payloadRole = String(role).toLowerCase();
    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        password,
        role: payloadRole,
      });
      return res.data;
    } catch (err) {
      console.error("Registration error:", err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("privateKey");
    localStorage.removeItem("publicKey");
    setUser(null);
    toast.success("Logged out");
    navigate("/login");
  };

  // ✅ Simplified decryptPrivateKey: read from localStorage directly
  const decryptPrivateKey = () => {
    const privateKey = localStorage.getItem("privateKey");
    if (!privateKey) {
      toast.error("Private key not found. Please log in again.");
      throw new Error("Private key not found in localStorage");
    }
    return privateKey;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        loading,
        decryptPrivateKey, // Exposed for patient access grant
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
