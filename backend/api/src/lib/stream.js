import { StreamClient } from "@stream-io/node-sdk";

let client;
export default function getStream() {
  const { STREAM_API_KEY, STREAM_API_SECRET } = process.env;
  if (!STREAM_API_KEY || !STREAM_API_SECRET) throw new Error("Video service is not configured.");
  client ??= new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
  return client;
}
