import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../../components/DashboardLayout";
import { toast } from "react-hot-toast";
import { User, Shield, Loader2 } from "lucide-react";
import api from "@/services/api";

const HospitalUsers = () => {
  // ─── State ─────────────────────────────────────────────
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [creating, setCreating] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);

  // ─── Fetch Patients ────────────────────────────────────
  const fetchPatients = async () => {
    try {
      const res = await api.get("/hospital/users");
      const patientOnly = (res.data || []).filter(
        (u) => u.role === "patient"
      );
      setPatients(patientOnly);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // ─── Create Patient ────────────────────────────────────
  const handleCreatePatient = async () => {
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
        role: "patient",
      });

      toast.success("Patient created successfully");
      setTempPassword(res.data.temporary_password);
      setForm({ name: "", email: "" });
      fetchPatients();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Patient creation failed");
    } finally {
      setCreating(false);
    }
  };

  // ─── Enable / Disable Patient ──────────────────────────
  const toggleStatus = async (patientId, isActive) => {
    setUpdating(patientId);
    try {
      await api.patch(`/hospital/users/${patientId}/status`, {
        is_active: !isActive,
      });

      toast.success("Patient status updated");

      setPatients((prev) =>
        prev.map((p) =>
          p.id === patientId ? { ...p, is_active: !isActive } : p
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update patient");
    } finally {
      setUpdating(null);
    }
  };

  // ─── UI ────────────────────────────────────────────────
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.15),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.15),transparent_70%)] blur-3xl" />

        {/* Header */}
        <div className="relative z-10 text-center mb-10">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-500 bg-clip-text text-transparent">
            Hospital Patients
          </h1>
          <p className="text-gray-600 mt-2">
            Create and manage patients registered under this hospital
          </p>
        </div>

        {/* Create Patient */}
        <motion.div
          className="relative z-10 bg-white/70 backdrop-blur-2xl border border-cyan-200/50 
                     rounded-3xl p-6 shadow-[0_8px_35px_rgba(56,189,248,0.15)] mb-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Create Patient
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="px-4 py-2 rounded-lg border border-cyan-200 focus:outline-none"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="px-4 py-2 rounded-lg border border-cyan-200 focus:outline-none"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <button
            onClick={handleCreatePatient}
            disabled={creating}
            className="mt-4 px-6 py-2 rounded-lg bg-gradient-to-r 
                       from-cyan-500 to-blue-600 text-white font-semibold"
          >
            {creating ? "Creating..." : "Create Patient"}
          </button>

          {tempPassword && (
            <div className="mt-4 p-4 bg-yellow-100/70 border border-yellow-300 rounded-lg text-sm">
              <strong>Temporary Password:</strong> {tempPassword}
              <p className="text-xs text-gray-600 mt-1">
                Share this securely. Patient must reset password on first login.
              </p>
            </div>
          )}
        </motion.div>

        {/* Patients Table */}
        <motion.div
          className="relative z-10 bg-white/70 backdrop-blur-2xl border border-cyan-200/50 
                     rounded-3xl p-6 shadow-[0_8px_35px_rgba(56,189,248,0.15)]"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {loading ? (
            <div className="flex justify-center py-16 text-gray-500">
              <Loader2 className="animate-spin mr-2" /> Loading patients...
            </div>
          ) : patients.length === 0 ? (
            <p className="text-center text-gray-500 italic">
              No patients found.
            </p>
          ) : (
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-sm text-gray-700 uppercase">
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id} className="bg-white rounded-xl shadow">
                    <td className="px-4 py-2">{p.id}</td>
                    <td className="px-4 py-2 flex items-center gap-2">
                      <User size={14} /> {p.name}
                    </td>
                    <td className="px-4 py-2">{p.email}</td>
                    <td className="px-4 py-2">
                      {p.is_active ? "Active" : "Disabled"}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        disabled={updating === p.id}
                        onClick={() => toggleStatus(p.id, p.is_active)}
                        className={`px-4 py-1 rounded-lg text-sm text-white ${
                          p.is_active ? "bg-red-500" : "bg-emerald-500"
                        }`}
                      >
                        {updating === p.id
                          ? "Updating..."
                          : p.is_active
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

export default HospitalUsers;
