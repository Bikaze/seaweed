import { S3Client } from "@aws-sdk/client-s3";
import 'dotenv/config';

export const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: process.env.S3_ENDPOINT, // e.g., http://localhost:8333
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, 
});