import api from "./api";

export const getAllUsers = () => api.get("/admin/users");
export const getAdminStats = () => api.get("/admin/stats");
