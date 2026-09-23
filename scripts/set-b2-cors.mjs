import {
  PutBucketCorsCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const required = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
};

const client = new S3Client({
  endpoint: required("B2_ENDPOINT"),
  region: required("B2_REGION"),
  credentials: {
    accessKeyId: required("B2_ACCESS_KEY_ID"),
    secretAccessKey: required("B2_SECRET_ACCESS_KEY"),
  },
});

const bucket = required("B2_BUCKET_NAME");

const corsConfiguration = {
  CORSRules: [
    {
      AllowedOrigins: [
        "http://localhost:3000",
        "https://conferencepublisher.online",
        "https://www.conferencepublisher.online",
      ],
      AllowedMethods: ["GET", "HEAD", "PUT"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag", "Content-Length", "Content-Type"],
      MaxAgeSeconds: 3600,
    },
  ],
};

try {
  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: corsConfiguration,
    }),
  );

  console.log("B2 S3 CORS: UPDATED");
} catch (error) {
  console.error("B2 S3 CORS update failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}