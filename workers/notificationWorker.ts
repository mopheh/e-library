import { Worker } from "bullmq";
import { connection } from "@/redis";

const keyPrefix = "notification:sent";

new Worker(
  "notifications",
  async (job) => {
    const { id, title, message } = job.data;

    const redisKey = keyPrefix + id;

    const alreadySent = await connection.get(redisKey);
    if (alreadySent) {
      console.log("✅ Skipping duplicate notification:", id);
      return;
    }
    // simulate sending notification
    console.log("Sending notification:", title);

    if (Math.random() < 0.3) {
      throw new Error("Push service failed");
    }

    await connection.set(redisKey, "SENT", "EX", 60 * 60 * 24); // 24h

    console.log("Notification sent:", message);
  },
  {
    connection: connection as any,
  }
);
