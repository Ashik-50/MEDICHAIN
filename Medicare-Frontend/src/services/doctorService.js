import api from "./api";

export const getDoctorPatients = () => api.get("/doctor/patients");
export const getAccessRequests = () => api.get("/doctor/access-requests");
export const requestPatientAccess = (email) =>
  api.post("/doctor/request-access", { patient_email: email });
export const getDoctorRecords = async (doctorId) => {
  const response = await api.get(`/doctor/${doctorId}/records`);
  return response.data;
};

export const addPatientNote = async (patientId, note) => {
  const res = await api.post(`/doctor/patients/${patientId}/notes`, { note });
  return res.data;
};

export const uploadPatientRecord = async (patientId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post(`/doctor/patients/${patientId}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// ✅ Fetch doctor-specific blockchain transactions
export const getDoctorBlockchainData = async (doctorId) => {
  try {
    const response = await api.get(`/blockchain/doctor/${doctorId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching blockchain data:", error);
    throw error;
  }
};

// ✅ Manage patient access (Grant/Revoke)
export const grantAccess = async (doctorId, patientId) => {
  try {
    const response = await api.post("/access/grant", { doctorId, patientId });
    return response.data;
  } catch (error) {
    console.error("Error granting access:", error);
    throw error;
  }
};

export const revokeAccess = async (doctorId, patientId) => {
  try {
    const response = await api.post("/access/revoke", { doctorId, patientId });
    return response.data;
  } catch (error) {
    console.error("Error revoking access:", error);
    throw error;
  }
};

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

export const getAccessiblePatients = () => api.get("/doctor/accessible-patients");

export const uploadRecord = (formData) =>
  api.post("/doctor/upload_record", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });