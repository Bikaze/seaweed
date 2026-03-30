import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { s3Client } from "../config/s3.js";
import { pool } from "../config/db.js";

// 1. Generate the signed URL for the frontend
export const getUploadUrl = async (req, res) => {
  try {
    const fileId = uuidv4();
    const cleanPath = `/tickets/ticket_${fileId}.pdf`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: cleanPath.replace(/^\//, ""),
      ContentType: "application/pdf",
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    res.json({ uploadUrl, cleanPath });
  } catch (error) {
    res.status(500).json({ error: "Signature failed" });
  }
};

// 2. Confirm and save to Postgres after frontend finishes upload
export const confirmUpload = async (req, res) => {
  const { passengerName, file_path } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO bus_tickets (passenger_name, file_path) VALUES ($1, $2) RETURNING *",
      [passengerName, file_path],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Database save failed" });
  }
};

import { GetObjectCommand } from "@aws-sdk/client-s3";

export const getDownloadUrl = async (req, res) => {
  try {
    // We get the path from the query string (e.g., ?path=/tickets/ticket_123.pdf)
    const { path } = req.query;

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: path.replace(/^\//, ""),
    });

    // Generate a signed URL for GETting the file
    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    }); // 1 hour

    res.json({ downloadUrl });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate download link" });
  }
};
