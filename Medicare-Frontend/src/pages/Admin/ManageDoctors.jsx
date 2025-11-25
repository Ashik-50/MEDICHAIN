import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../../components/DashboardLayout";
import { toast } from "react-hot-toast";
import { UserPlus, Trash2, Loader2, Stethoscope } from "lucide-react";
import api from "@/services/api";
import PrimaryButton from "@/components/ui/PrimaryButton";

const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    description: "",
  });

  // 🔹 Fetch doctors
  const fetchDoctors = async () => {
    try {
      const res = await api.get("/admin/users");
      const allUsers = res.data.users || [];
      const doctorsOnly = allUsers.filter((u) => u.role === "doctor");
      setDoctors(doctorsOnly);
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
      toast.error("Error fetching doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // 🔹 Input Handler
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // 🔹 Create doctor
  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Please fill all required fields");
      return;
    }

    setCreating(true);
    try {
      await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: "doctor",
      });

      if (form.description) {
        await api.put(`/admin/update-doctor-description`, {
          email: form.email,
          description: form.description,
        });
      }

      toast.success("Doctor created successfully!");
      setForm({ name: "", email: "", password: "", description: "" });
      fetchDoctors();
    } catch (err) {
      console.error("Doctor creation failed:", err);
      toast.error(err?.response?.data?.detail || "Failed to create doctor");
    } finally {
      setCreating(false);
    }
  };

  // 🔹 Delete doctor
  const handleDelete = async (doctorId) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    setDeleting(doctorId);
    try {
      await api.delete(`/admin/delete-user/${doctorId}`);
      toast.success("Doctor deleted successfully");
      setDoctors((prev) => prev.filter((d) => d.id !== doctorId));
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete doctor");
    } finally {
      setDeleting(null);
    }
  };

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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(56,189,248,0.15),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.15),transparent_70%)] blur-3xl" />

        {/* 🩺 Header */}
        <div className="relative z-10 text-center mb-10">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-500 bg-clip-text text-transparent">
            Manage Doctors
          </h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Create, view, and remove registered doctors in the system.
          </p>
        </div>

        {/* 🧾 Create Doctor Form */}
        <motion.form
          onSubmit={handleCreateDoctor}
          className="relative z-10 bg-white/80 backdrop-blur-2xl border border-cyan-200/40 rounded-3xl p-8 mb-10 shadow-[0_8px_30px_rgba(56,189,248,0.15)] max-w-4xl mx-auto space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-xl font-semibold text-cyan-700 flex items-center gap-2">
            <UserPlus size={20} /> Create Doctor Account
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Doctor Name"
              className="p-3 rounded-lg bg-white/70 border border-cyan-100 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-cyan-300 focus:outline-none"
              required
            />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="p-3 rounded-lg bg-white/70 border border-cyan-100 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-cyan-300 focus:outline-none"
              required
            />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="p-3 rounded-lg bg-white/70 border border-cyan-100 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-cyan-300 focus:outline-none"
              required
            />
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Doctor Description / Specialization"
              className="p-3 rounded-lg bg-white/70 border border-cyan-100 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-cyan-300 focus:outline-none"
            />
          </div>

          <PrimaryButton
            type="submit"
            loading={creating}
            className="w-full mt-2 py-3 text-base font-semibold justify-center"
          >
            <UserPlus size={18} />
            {creating ? "Creating..." : "Create Doctor"}
          </PrimaryButton>

        </motion.form>

        {/* 🧑‍⚕️ Doctor List */}
        <motion.div
          className="relative z-10 bg-white/80 backdrop-blur-2xl border border-cyan-200/50 rounded-3xl p-6 shadow-[0_8px_35px_rgba(56,189,248,0.15)] overflow-x-auto"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <div className="flex justify-center items-center py-16 text-gray-500">
              <Loader2 className="animate-spin w-6 h-6 mr-2 text-cyan-500" /> Loading doctors...
            </div>
          ) : doctors.length === 0 ? (
            <p className="text-center text-gray-500 italic">No doctors found.</p>
          ) : (
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-gray-700 text-sm uppercase border-b border-cyan-200/50">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <motion.tr
                    key={d.id}
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white/90 hover:bg-white shadow-[0_2px_15px_rgba(56,189,248,0.08)] transition-all rounded-xl"
                  >
                    <td className="px-5 py-3 rounded-l-xl text-gray-800">{d.id}</td>
                    <td className="px-5 py-3 flex items-center gap-2 font-semibold text-gray-800">
                      <Stethoscope size={16} className="text-cyan-500" /> {d.name}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{d.email}</td>
                    <td className="px-5 py-3 text-gray-500">{d.description || "—"}</td>
                    <td className="px-5 py-3 text-center rounded-r-xl">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(d.id)}
                        disabled={deleting === d.id}
                        className={`px-5 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-all duration-300 
                          ${
                            deleting === d.id
                              ? "bg-red-200 text-red-600 cursor-not-allowed"
                              : "bg-gradient-to-r from-red-400 via-pink-500 to-rose-500 text-white shadow-md hover:shadow-lg hover:shadow-rose-200/50"
                          }`}
                      >
                        {deleting === d.id ? (
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

export default ManageDoctors;
