import { S3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

let cachedClient: S3Client | undefined;

function getConfig() {
  return {
    endpoint: required("B2_ENDPOINT"),
    region: required("B2_REGION"),
    bucket: required("B2_BUCKET_NAME")
  };
}

function getClient() {
  if (cachedClient) return cachedClient;
  const config = getConfig();
  cachedClient = new S3Client({
  endpoint: config.endpoint,
  region: config.region,
  credentials: {
    accessKeyId: required("B2_ACCESS_KEY_ID"),
    secretAccessKey: required("B2_SECRET_ACCESS_KEY")
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED"
});
  return cachedClient;
}

export async function createUploadUrl(input: { key: string; contentType: string; contentLength?: number; expiresIn?: number }) {
  const config = getConfig();
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: input.key,
    ContentType: input.contentType
  });
  return getSignedUrl(getClient(), command, { expiresIn: input.expiresIn ?? 900 });
}

export async function createDownloadUrl(input: { key: string; downloadName?: string; expiresIn?: number }) {
  const config = getConfig();
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: input.key,
    ResponseContentType: "application/pdf",
    ...(input.downloadName ? { ResponseContentDisposition: `attachment; filename="${input.downloadName.replace(/"/g, "")}"` } : {})
  });
  return getSignedUrl(getClient(), command, { expiresIn: input.expiresIn ?? 900 });
}

export async function createInlineDownloadUrl(input: { key: string; contentType: string; expiresIn?: number }) {
  const config = getConfig();
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: input.key,
    ResponseContentType: input.contentType,
    ResponseContentDisposition: "inline"
  });
  return getSignedUrl(getClient(), command, { expiresIn: input.expiresIn ?? 900 });
}

export async function deleteObject(key: string) {
  const config = getConfig();
  return getClient().send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
}
