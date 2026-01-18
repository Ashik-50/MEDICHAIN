import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../../components/DashboardLayout";
import { toast } from "react-hot-toast";
import { UserPlus, Loader2, Stethoscope, Shield } from "lucide-react";
import api from "@/services/api";
import PrimaryButton from "@/components/ui/PrimaryButton";

const HospitalDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const [creating, setCreating] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    description: "",
  });

  // ─── Fetch Doctors ─────────────────────────────────────
  const fetchDoctors = async () => {
    try {
      const res = await api.get("/hospital/users");
      const doctorOnly = (res.data || []).filter(
        (u) => u.role === "doctor"
      );
      setDoctors(doctorOnly);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // ─── Create Doctor ─────────────────────────────────────
  const handleCreateDoctor = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email) {
      toast.error("Name and email are required");
      return;
    }

    setCreating(true);
    setTempPassword(null);

    try {
      const res = await api.post("/hospital/users", {
        name: form.name,
        email: form.email,
        role: "doctor",
        description: form.description,
      });

      toast.success("Doctor created successfully");
      setTempPassword(res.data.temporary_password);
      setForm({ name: "", email: "", description: "" });
      fetchDoctors();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Doctor creation failed");
    } finally {
      setCreating(false);
    }
  };

  // ─── Enable / Disable Doctor ───────────────────────────
  const toggleStatus = async (doctorId, isActive) => {
    setUpdating(doctorId);
    try {
      await api.patch(`/hospital/users/${doctorId}/status`, {
        is_active: !isActive,
      });
      toast.success("Doctor status updated");

      setDoctors((prev) =>
        prev.map((d) =>
          d.id === doctorId ? { ...d, is_active: !isActive } : d
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update doctor");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <DashboardLayout role="hospital">
      <motion.div
        className="relative min-h-screen px-8 py-10 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#ECF7FF] via-[#F8FBFF] to-[#E5F1FF]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(56,189,248,0.15),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.15),transparent_70%)] blur-3xl" />

        {/* Header */}
        <div className="relative z-10 text-center mb-10">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-500 bg-clip-text text-transparent">
            Hospital Doctors
          </h1>
          <p className="text-gray-600 mt-2">
            Create and manage doctors issued by this hospital
          </p>
        </div>

        {/* Create Doctor */}
        <motion.form
          onSubmit={handleCreateDoctor}
          className="relative z-10 bg-white/80 backdrop-blur-2xl border border-cyan-200/40 
                     rounded-3xl p-8 mb-10 shadow-[0_8px_30px_rgba(56,189,248,0.15)] 
                     max-w-4xl mx-auto space-y-6"
        >
          <h2 className="text-xl font-semibold text-cyan-700 flex items-center gap-2">
            <UserPlus size={20} /> Create Doctor Account
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Doctor Name"
              className="p-3 rounded-lg border border-cyan-100 focus:ring-2 focus:ring-cyan-300 focus:outline-none"
              required
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email Address"
              className="p-3 rounded-lg border border-cyan-100 focus:ring-2 focus:ring-cyan-300 focus:outline-none"
              required
            />
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Specialization / Description"
              className="p-3 rounded-lg border border-cyan-100 focus:ring-2 focus:ring-cyan-300 focus:outline-none md:col-span-2"
            />
          </div>

          <PrimaryButton
            type="submit"
            loading={creating}
            className="w-full py-3 text-base font-semibold justify-center"
          >
            <UserPlus size={18} />
            {creating ? "Creating..." : "Create Doctor"}
          </PrimaryButton>

          {tempPassword && (
            <div className="p-4 bg-yellow-100/70 border border-yellow-300 rounded-lg text-sm">
              <strong>Temporary Password:</strong> {tempPassword}
              <p className="text-xs text-gray-600 mt-1">
                Share securely. Doctor must reset on first login.
              </p>
            </div>
          )}
        </motion.form>

        {/* Doctors Table */}
        <motion.div
          className="relative z-10 bg-white/80 backdrop-blur-2xl border border-cyan-200/50 
                     rounded-3xl p-6 shadow-[0_8px_35px_rgba(56,189,248,0.15)]"
        >
          {loading ? (
            <div className="flex justify-center py-16 text-gray-500">
              <Loader2 className="animate-spin mr-2" /> Loading doctors...
            </div>
          ) : doctors.length === 0 ? (
            <p className="text-center text-gray-500 italic">
              No doctors found.
            </p>
          ) : (
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-sm text-gray-700 uppercase">
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Specialization</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.id} className="bg-white rounded-xl shadow">
                    <td className="px-4 py-2">{d.id}</td>
                    <td className="px-4 py-2 flex items-center gap-2">
                      <Stethoscope size={14} className="text-cyan-500" />
                      {d.name}
                    </td>
                    <td className="px-4 py-2">{d.email}</td>
                    <td className="px-4 py-2 text-gray-500">
                      {d.description || "—"}
                    </td>
                    <td className="px-4 py-2">
                      {d.is_active ? "Active" : "Disabled"}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        disabled={updating === d.id}
                        onClick={() => toggleStatus(d.id, d.is_active)}
                        className={`px-4 py-1 rounded-lg text-sm text-white ${
                          d.is_active
                            ? "bg-red-500"
                            : "bg-emerald-500"
                        }`}
                      >
                        {updating === d.id
                          ? "Updating..."
                          : d.is_active
                          ? "Disable"
                          : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default HospitalDoctors;
