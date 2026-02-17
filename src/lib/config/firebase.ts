import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import admin, { ServiceAccount } from "firebase-admin";
import { logger } from "../utils/logger";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: ReturnType<typeof initializeApp> | null = null;
let adminApp: admin.app.App | null = null;

export function getFirebaseApp() {
  if (!app) {
    if (!firebaseConfig.apiKey) {
      throw new Error("Firebase API key is not configured");
    }
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getFirebaseStorage() {
  return getStorage(getFirebaseApp());
}

export function getFirebaseAdmin() {
  if (!adminApp) {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    );
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!privateKey || !clientEmail || !projectId) {
      throw new Error("Firebase admin credentials are not configured");
    }

    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey,
    };

    adminApp = admin.apps.length
      ? admin.apps[0]!
      : admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: `https://${projectId}.firebaseio.com`,
        });
  }

  return adminApp;
}

export async function verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
  const adminAuth = admin.auth(getFirebaseAdmin());
  try {
    return await adminAuth.verifyIdToken(token);
  } catch (error) {
    logger.error("Failed to verify ID token", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error("Invalid or expired token");
  }
}

export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<{ user: { uid: string; email: string }; firebaseUid: string }> {
  const auth = getFirebaseAuth();

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await admin.auth(getFirebaseAdmin()).updateUser(user.uid, {
      displayName: name,
    });

    await sendEmailVerification(user);

    return {
      user: {
        uid: user.uid,
        email: user.email!,
      },
      firebaseUid: user.uid,
    };
  } catch (error) {
    logger.error("Failed to create Firebase user", {
      error: error instanceof Error ? error.message : "Unknown error",
      email,
    });
    throw error;
  }
}

export async function signInUser(
  email: string,
  password: string
): Promise<{ uid: string; email: string; emailVerified: boolean }> {
  const auth = getFirebaseAuth();

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    return {
      uid: user.uid,
      email: user.email!,
      emailVerified: user.emailVerified,
    };
  } catch (error) {
    logger.error("Failed to sign in user", {
      error: error instanceof Error ? error.message : "Unknown error",
      email,
    });
    throw error;
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  const auth = getFirebaseAuth();

  try {
    await sendPasswordResetEmail(auth, email);
    logger.info("Password reset email sent", { email });
  } catch (error) {
    logger.error("Failed to send password reset email", {
      error: error instanceof Error ? error.message : "Unknown error",
      email,
    });
    throw error;
  }
}

export async function uploadFile(
  path: string,
  file: Buffer,
  contentType: string
): Promise<string> {
  const storage = getFirebaseStorage();
  const storageRef = ref(storage, path);

  try {
    const snapshot = await uploadBytes(storageRef, file, {
      contentType,
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    logger.info("File uploaded successfully", { path });
    return downloadUrl;
  } catch (error) {
    logger.error("Failed to upload file", {
      error: error instanceof Error ? error.message : "Unknown error",
      path,
    });
    throw error;
  }
}

export async function deleteFile(path: string): Promise<void> {
  const storage = getFirebaseStorage();
  const storageRef = ref(storage, path);

  try {
    await deleteObject(storageRef);
    logger.info("File deleted successfully", { path });
  } catch (error) {
    logger.error("Failed to delete file", {
      error: error instanceof Error ? error.message : "Unknown error",
      path,
    });
    throw error;
  }
}

export async function getUserByFirebaseUid(
  firebaseUid: string
): Promise<admin.auth.UserRecord | null> {
  try {
    return await admin.auth(getFirebaseAdmin()).getUser(firebaseUid);
  } catch (error) {
    if ((error as { code?: string }).code === "auth/user-not-found") {
      return null;
    }
    throw error;
  }
}

export async function updateUserDisplayName(
  uid: string,
  displayName: string
): Promise<void> {
  try {
    await admin.auth(getFirebaseAdmin()).updateUser(uid, {
      displayName,
    });
    logger.info("User display name updated", { uid });
  } catch (error) {
    logger.error("Failed to update user display name", {
      error: error instanceof Error ? error.message : "Unknown error",
      uid,
    });
    throw error;
  }
}

export async function deleteUserAccount(uid: string): Promise<void> {
  try {
    await admin.auth(getFirebaseAdmin()).deleteUser(uid);
    logger.info("Firebase user deleted", { uid });
  } catch (error) {
    logger.error("Failed to delete Firebase user", {
      error: error instanceof Error ? error.message : "Unknown error",
      uid,
    });
    throw error;
  }
}
