import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

// Inicializa Firebase Admin
admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Endpoint de prueba (health check)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Hypnic Backend is running!" });
});

// Puedes agregar más endpoints aquí
// app.post("/api/...", (req, res) => { ... });

// Exporta la app de Express como una Cloud Function
export const api = functions.https.onRequest(app);
