import api from "./api";

export const authService = {
  async login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },

  async register(userData) {
    const res = await api.post("/auth/register", userData);
    return res.data;
  },

  async refreshToken(refreshToken) {
    const res = await api.post("/auth/refresh", { refresh_token: refreshToken });
    return res.data;
  },

  async getProfile() {
    const res = await api.get("/auth/me");
    return res.data;
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  },
};