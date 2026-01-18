import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api"
import { toast } from "react-hot-toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Invalid reset request
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        user_id: userId,
        new_password: password,
    });

      toast.success("Password reset successful. Please login.");
      navigate("/login");
    } catch (err) {
      toast.error("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-bold text-center">Reset Password</h2>

        <input
          type="password"
          placeholder="New password"
          className="w-full p-3 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm password"
          className="w-full p-3 border rounded"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
