// src/services/recordService.js
import api from "./api";

export const recordService = {
  async uploadRecord(formData) {
    const res = await api.post("/records/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  getPatientRecords: async (patientId) => {
    const res = await api.get(`/record/doctor/patient-records/${patientId}`);
    return res.data;
  },

  async getDoctorRecords(doctorId) {
    const res = await api.get(`/records/doctor/${doctorId}`);
    return res.data;
  },

  async getRecordById(recordId) {
    const res = await api.get(`/records/${recordId}`);
    return res.data;
  },

  async deleteRecord(recordId) {
    const res = await api.delete(`/records/${recordId}`);
    return res.data;
  },

  async downloadRecord(recordId) {
    const res = await api.get(`/records/download/${recordId}`, {
      responseType: "blob",
    });
    return res.data; // the file blob
  },

  async viewRecordNotes(recordId) {
    const res = await api.get(`/records/notes/${recordId}`);
    return res.data; // text notes from backend
  },
  async getDoctorRecordCount(doctorId) {
    const res = await api.get(`/records/count/doctor/${doctorId}`);
    return res.data;
  },
};
