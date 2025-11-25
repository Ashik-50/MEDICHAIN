import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#0B132B",
              color: "#E0F2FE",
              border: "1px solid #38bdf8",
              boxShadow: "0 0 15px rgba(56,189,248,0.5)",
            },
            iconTheme: {
              primary: "#38bdf8",
              secondary: "#0B132B",
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
