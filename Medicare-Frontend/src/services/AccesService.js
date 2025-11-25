import api from "./api";

export const getDoctors = () => api.get("patient/doctors");
export const getAccessRequests = () => api.get("/access/requests");
export const grantAccess = (doctorId) => api.post(`/access/grant?doctor_id=${doctorId}`);
export const respondAccess = (requestId, status) =>
  api.post(`/access/respond?requestId=${requestId}&status=${status}`);

export const accessService = {
  async requestAccess(doctorId, patientId) {
    const res = await api.post("/access/request", { doctor_id: doctorId, patient_id: patientId });
    return res.data;
  },

  async getRequestsForDoctor(doctorId) {
    const res = await api.get(`/access/doctor/${doctorId}`);
    return res.data;
  },

  async getRequestsForPatient(patientId) {
    const res = await api.get(`/access/patient/${patientId}`);
    return res.data;
  },

  async updateAccessStatus(requestId, status) {
    const res = await api.put(`/access/${requestId}`, { status });
    return res.data;
  },
};