import { Timestamp } from "firebase-admin/firestore";

export function serializeFirestore<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => {
      if (v instanceof Timestamp) return v.toDate().toISOString();
      if (v?.toDate instanceof Function) return v.toDate().toISOString();
      return v;
    })
  ) as T;
}
