import express from "express";
import cors from "cors";
import ticketRoutes from "./routes/tickets.js";
import { pool } from "./config/db.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/tickets", ticketRoutes);

const PORT = 3000;

const startServer = async () => {
  await pool.query(`
		CREATE TABLE IF NOT EXISTS bus_tickets (
			id SERIAL PRIMARY KEY,
			passenger_name TEXT NOT NULL,
			file_path TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT NOW()
		)
	`);

  app.listen(PORT, () =>
    console.log(`Server running on http://localhost:${PORT}`),
  );
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
