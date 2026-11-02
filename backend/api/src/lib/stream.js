
import { StreamClient } from "@stream-io/node-sdk";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  throw new Error("Missing STREAM_API_KEY or STREAM_API_SECRET.");
}

const stream = new StreamClient(apiKey, apiSecret);

export default stream;
