import api from "./api";

export const getPatientRecords = async (patientId) => {
  try {
    const response = await api.get(`/records/${patientId}`);
    return response.data.records;
  } catch (error) {
    console.error("Error fetching patient records:", error);
    throw error;
  }
};
