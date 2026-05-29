import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { addDoc, collection, getFirestore, serverTimestamp } from "firebase/firestore";
import type { JoinRequest } from "@/lib/types";

export async function POST(request: Request) {
  const payload = (await request.json()) as JoinRequest;
  const requiredFields: Array<keyof JoinRequest> = ["name", "email", "phone", "shopName", "location"];
  const missing = requiredFields.filter((field) => !String(payload[field] ?? "").trim());

  if (missing.length) {
    return NextResponse.json({ error: `Missing fields: ${missing.join(", ")}` }, { status: 400 });
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (projectId && appId && apiKey) {
    const app =
      getApps()[0] ??
      initializeApp({
        apiKey,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId,
      });
    const db = getFirestore(app);

    await addDoc(collection(db, "joinRequests"), {
      ...payload,
      status: "new",
      createdAt: serverTimestamp(),
    });

    const to = process.env.AIRLOO_JOIN_EMAIL;
    if (to) {
      await addDoc(collection(db, process.env.FIREBASE_MAIL_COLLECTION ?? "mail"), {
        to,
        message: {
          subject: `New AirLoo join request: ${payload.shopName}`,
          text: [
            `Name: ${payload.name}`,
            `Email: ${payload.email}`,
            `Phone: ${payload.phone}`,
            `Shop: ${payload.shopName}`,
            `Location: ${payload.location}`,
            `Message: ${payload.message || "-"}`,
          ].join("\n"),
        },
        createdAt: serverTimestamp(),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
