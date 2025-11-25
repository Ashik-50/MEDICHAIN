// src/services/blockchainService.js
import api from "./api";

export const getLedger = () => api.get("/blockchain/ledger");

export const verifyBlockchain = () => api.get("/blockchain/verify");

export const getAccessLogs = () => api.get("/api/patient/blockchain/access-logs");
