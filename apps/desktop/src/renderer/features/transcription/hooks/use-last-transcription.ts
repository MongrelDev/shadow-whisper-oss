import Dexie from "dexie";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Transcription } from "@/lib/db";

export function useLastTranscription(): Transcription | undefined {
  const { userId } = useAuthContext();

  return useLiveQuery(() => {
    if (!userId) return undefined;
    return db.transcriptions
      .where("[userId+createdAt]")
      .between([userId, Dexie.minKey], [userId, Dexie.maxKey])
      .last();
  }, [userId]);
}
