import Dexie from "dexie";
import { useAuthenticatedUser } from "./use-auth-context";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";

export function useHistory(limit = 10) {
  const { id: userId } = useAuthenticatedUser();

  return useLiveQuery(async () => {
    const entries = await db.transcriptions
      .where("[userId+createdAt]")
      .between([userId, Dexie.minKey], [userId, Dexie.maxKey])
      .reverse()
      .limit(limit)
      .toArray();

    if (entries.length > 0) {
      window.api.transcription.seedLastText(entries[0]!.formattedText);
    }

    return entries;
  }, [userId, limit]);
}
