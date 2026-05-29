"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import type { JoinRequest, Shop } from "@/lib/types";

export async function listPublicShops(): Promise<Shop[]> {
  if (!isFirebaseConfigured || !db) return [];

  const snapshot = await getDocs(query(collection(db, "shops"), limit(50)));
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }) as Shop);
}

export async function getPublicShop(shopId: string): Promise<Shop | null> {
  if (!isFirebaseConfigured || !db) return null;

  const snapshot = await getDoc(doc(db, "shops", shopId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Shop;
}

export async function listOwnerShops(ownerEmail: string): Promise<Shop[]> {
  if (!isFirebaseConfigured || !db) return [];

  const snapshot = await getDocs(
    query(collection(db, "shops"), where("ownerEmail", "==", ownerEmail), limit(25)),
  );
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }) as Shop);
}

export async function updateShopDetails(shopId: string, data: Partial<Shop>) {
  if (!isFirebaseConfigured || !db) return;
  await updateDoc(doc(db, "shops", shopId), data);
}

export async function listJoinRequests(): Promise<JoinRequest[]> {
  if (!isFirebaseConfigured || !db) return [];

  const snapshot = await getDocs(query(collection(db, "joinRequests"), orderBy("createdAt", "desc"), limit(50)));
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }) as JoinRequest);
}

export async function addJoinRequest(data: JoinRequest) {
  if (!isFirebaseConfigured || !db) return;
  await addDoc(collection(db, "joinRequests"), {
    ...data,
    status: "new",
    createdAt: serverTimestamp(),
  });
}

export async function listRecentEvents(deviceId: string) {
  if (!isFirebaseConfigured || !db) return [];

  const snapshot = await getDocs(
    query(
      collection(db, "events"),
      where("device", "==", deviceId),
      orderBy("timestamp", "desc"),
      limit(25),
    ),
  );
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
}
