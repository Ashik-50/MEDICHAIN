import api from "./api";

// Send a connection request
export const requestConnection = async (patientId, doctorId) => {
  const response = await api.post("/connections/request", {
    patient_id: patientId,
    doctor_id: doctorId,
  });
  return response.data;
};

export const getActiveConnections = async (doctorId) => {
  try {
    const response = await api.get(`/connections/active/${doctorId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching active connections:", error);
    throw error;
  }
};

// ✅ Get all pending connection requests (for doctor approval)
export const getPendingRequests = async (doctorId) => {
  try {
    const response = await api.get(`/connections/pending/${doctorId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    throw error;
  }
};

// ✅ Approve or reject a request
export const respondToConnection = async (connectionId, action) => {
  try {
    const response = await api.put(`/connections/respond`, null, {
      params: { connection_id: connectionId, action },
    });
    return response.data;
  } catch (error) {
    console.error("Error responding to connection:", error);
    throw error;
  }
};