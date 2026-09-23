# Architecture Notes

## Public content rendering

Public conference and article pages are rendered from trusted server-side Firestore reads through the Firebase Admin SDK. This keeps the public browser from needing unrestricted Firestore access and lets article pages expose stable HTML metadata for scholarly discovery.

## Browser-to-B2 upload

The admin browser requests a short-lived presigned S3 PUT URL from `/api/storage/presign-upload`. The API verifies the Firebase ID token and administrator claim before signing the URL. The browser then uploads directly to B2.

The B2 application key must never be placed in `NEXT_PUBLIC_*` variables.

## Public PDF access

Published article downloads go through `/api/articles/[id]/pdf`. The server checks that the article exists, is published, and has a PDF key before issuing a short-lived B2 URL. The route increments the article's download counter.

## Public poster access

Conference poster images are served through `/api/conferences/[id]/poster`, which verifies the conference is published before returning a short-lived signed B2 URL.

## Admin authorization

The current bootstrap path sets `admin: true` as a Firebase custom claim and `role: "admin"` in `users/{uid}`. The client uses the custom claim for navigation/access gating. Protected server routes validate the Firebase ID token and accept either the custom claim or the user role document.

Firestore browser rules are closed to public reads/writes. Server-side Admin SDK reads/writes are not governed by those Firestore client rules; authorization is therefore enforced explicitly in the application server routes and by the rules for browser-accessible administrative operations.

## Future extensions

- Crossref DOI deposit and update workflow.
- ORCID validation/normalization.
- Submission workflow separate from publication workflow.
- Reviewer management if the conference wants peer review to be administered in the platform.
- Full-text search using a dedicated search service once the archive becomes large.
- Email delivery for contact messages.
- Audit log collection for sensitive admin changes.
