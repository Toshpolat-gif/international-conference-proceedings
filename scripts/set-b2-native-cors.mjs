const required = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
};

const keyId = required("B2_ACCESS_KEY_ID");
const applicationKey = required("B2_SECRET_ACCESS_KEY");

const bucketName = required("B2_BUCKET_NAME");
const expectedBucketName = "international-conference-proceedings";

if (bucketName !== expectedBucketName) {
  throw new Error(
    `Unexpected bucket: ${bucketName}. Expected: ${expectedBucketName}`,
  );
};

// 1. Authorize with B2 Native API v4
const authHeader = Buffer.from(`${keyId}:${applicationKey}`).toString("base64");

const authResponse = await fetch(
  "https://api.backblazeb2.com/b2api/v4/b2_authorize_account",
  {
    method: "GET",
    headers: {
      Authorization: `Basic ${authHeader}`,
    },
  },
);

if (!authResponse.ok) {
  const body = await authResponse.text();
  throw new Error(
    `B2 authorization failed (${authResponse.status}): ${body}`,
  );
}

const auth = await authResponse.json();

const accountId = auth.accountId;
const storageApi = auth.apiInfo?.storageApi;
const allowedBuckets = storageApi?.allowed?.buckets ?? [];

const bucket = allowedBuckets.find(
  (item) => item.name === bucketName,
);

if (!bucket) {
  throw new Error(
    `Bucket "${bucketName}" was not found in the authorized bucket list.`,
  );
};

const apiUrl = storageApi.apiUrl;
const bucketId = bucket.id;

// 2. Set Native + S3-compatible CORS rules
const corsRules = [
  {
    corsRuleName: "conferencePublisherWeb",
    allowedOrigins: [
      "http://localhost:3000",
      "https://conferencepublisher.online",
      "https://www.conferencepublisher.online",
    ],
    allowedHeaders: ["*"],
    allowedOperations: [
      "s3_put",
      "s3_get",
      "s3_head",
      "s3_delete",
    ],
    exposeHeaders: ["ETag"],
    maxAgeSeconds: 3600,
  },
];

// 3. Update bucket through B2 Native API
const updateResponse = await fetch(
  `${apiUrl}/b2api/v4/b2_update_bucket`,
  {
    method: "POST",
    headers: {
      Authorization: auth.authorizationToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      accountId,
      bucketId,
      corsRules,
    }),
  },
);

if (!updateResponse.ok) {
  const body = await updateResponse.text();

  throw new Error(
    `B2 CORS update failed (${updateResponse.status}): ${body}`,
  );
}

const result = await updateResponse.json();

console.log("B2 NATIVE CORS: UPDATED");
console.log(`Bucket: ${result.bucketName}`);
console.log(`Revision: ${result.revision}`);
console.log("Allowed origins:");
for (const origin of result.corsRules?.[0]?.allowedOrigins ?? []) {
  console.log(`  - ${origin}`);
}

console.log("Allowed operations:");
for (const operation of result.corsRules?.[0]?.allowedOperations ?? []) {
  console.log(`  - ${operation}`);
}