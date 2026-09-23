const warn = [
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "B2_ENDPOINT",
  "B2_REGION",
  "B2_BUCKET_NAME",
  "B2_ACCESS_KEY_ID",
  "B2_SECRET_ACCESS_KEY"
].filter((key) => !process.env[key]);
if (warn.length) console.warn(`Environment note: ${warn.join(", ")} are not set yet. The website can still typecheck, but Firebase/B2 data routes will not work until configured.`);
