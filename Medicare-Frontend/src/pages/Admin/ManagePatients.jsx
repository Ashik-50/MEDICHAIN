import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../../components/DashboardLayout";
import { toast } from "react-hot-toast";
import { Trash2, User, Shield, Loader2 } from "lucide-react";
import api from "@/services/api";

const ManagePatients = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  // 🔹 Fetch all users
  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      const allUsers = res.data.users || [];
      const patients = allUsers.filter((u) => u.role === "patient");
      setUsers(patients);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Delete user
  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user account?")) return;
    setDeleting(userId);
    try {
      await api.delete(`/admin/delete-user/${userId}`);
      toast.success("User deleted successfully");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete user");
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <DashboardLayout role="admin">
      <motion.div
        className="relative min-h-screen px-8 py-10 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* 🌈 Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#ECF7FF] via-[#F8FBFF] to-[#E5F1FF]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.15),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.15),transparent_70%)] blur-3xl" />

        {/* 🩺 Header */}
        <div className="relative z-10 text-center mb-10">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-500 bg-clip-text text-transparent">
            Manage Patients
          </h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            View and manage all registered patient accounts securely.
          </p>
        </div>

        {/* 🧾 User Table */}
        <motion.div
          className="relative z-10 bg-white/70 backdrop-blur-2xl border border-cyan-200/50 rounded-3xl p-6 shadow-[0_8px_35px_rgba(56,189,248,0.15)] overflow-x-auto"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <div className="flex justify-center items-center py-16 text-gray-500">
              <Loader2 className="animate-spin w-6 h-6 mr-2 text-cyan-500" /> Loading users...
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500 italic">No patients found.</p>
          ) : (
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-gray-700 text-sm uppercase border-b border-cyan-200/50">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white/90 hover:bg-white shadow-[0_2px_15px_rgba(56,189,248,0.08)] transition-all rounded-xl"
                  >
                    <td className="px-5 py-3 rounded-l-xl text-gray-800">{u.id}</td>
                    <td className="px-5 py-3 flex items-center gap-2 font-semibold text-gray-800">
                      <User size={16} className="text-cyan-500" /> {u.name}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                          u.role === "doctor"
                            ? "bg-blue-100 text-blue-600 border-blue-300"
                            : u.role === "admin"
                            ? "bg-emerald-100 text-emerald-600 border-emerald-300"
                            : "bg-cyan-100 text-cyan-600 border-cyan-300"
                        }`}
                      >
                        <Shield size={12} />
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center rounded-r-xl">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(u.id)}
                      disabled={deleting === u.id}
                      className={`px-5 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 mx-auto 
                        transition-all duration-300 shadow-md hover:shadow-lg
                        focus:outline-none focus:ring-0 active:ring-0 ${
                          deleting === u.id
                            ? "bg-red-200 text-red-600 cursor-not-allowed"
                            : "bg-gradient-to-r from-red-400 via-pink-500 to-rose-500 text-white hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                        }`}
                    >
                      {deleting === u.id ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={14} /> Delete
                        </>
                      )}
                    </motion.button>
                  </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default ManagePatients;
