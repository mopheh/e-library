import { set, get, del, keys } from "idb-keyval";

export const OFFLINE_DB_PREFIX = "offline-pdf-";

export const savePdfForOffline = async (bookId: string, blob: Blob) => {
  try {
    const key = `${OFFLINE_DB_PREFIX}${bookId}`;
    await set(key, blob);
    return true;
  } catch (error) {
    console.error("Failed to save PDF for offline", error);
    return false;
  }
};

export const getOfflinePdf = async (bookId: string): Promise<Blob | null> => {
  try {
    const key = `${OFFLINE_DB_PREFIX}${bookId}`;
    const blob = await get<Blob>(key);
    return blob || null;
  } catch (error) {
    console.error("Failed to retrieve offline PDF", error);
    return null;
  }
};

export const checkIsPdfOffline = async (bookId: string): Promise<boolean> => {
  try {
    const key = `${OFFLINE_DB_PREFIX}${bookId}`;
    const allKeys = await keys();
    return allKeys.includes(key);
  } catch (error) {
    return false;
  }
};

export const removeOfflinePdf = async (bookId: string) => {
  try {
    const key = `${OFFLINE_DB_PREFIX}${bookId}`;
    await del(key);
    return true;
  } catch (error) {
    console.error("Failed to remove offline PDF", error);
    return false;
  }
};
