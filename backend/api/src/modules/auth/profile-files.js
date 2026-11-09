import multer from "multer";
import { createHmac, randomUUID } from "node:crypto";
import prisma from "../../lib/prisma.js";

const picture = { field: "profilePicture", id: "pictureFileId", limit: 2, folder: "profiles" };
const resume = { field: "resumePath", id: "resumeFileId", limit: 5, folder: "resumes" };

function multipart(field, size) {
  const parse = multer({
    storage: multer.memoryStorage(),
    limits: { files: 1, parts: 2, fileSize: size * 1024 * 1024 },
  }).single(field);
  return (req, res, next) =>
    parse(req, res, (err) => {
      if (err)
        return res
          .status(err.code === "LIMIT_FILE_SIZE" ? 413 : 400)
          .json({ success: false, message: "Invalid or oversized upload." });
      next();
    });
}
export const parsePicture = multipart("profilePicture", picture.limit);
export const parseResume = multipart("resume", resume.limit);

function extension(buffer, kind) {
  if (kind === resume) return buffer.toString("ascii", 0, 5) === "%PDF-" ? "pdf" : null;
  if (buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) return "png";
  if (buffer.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"))) return "jpg";
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP")
    return "webp";
  return null;
}
function headers() {
  return {
    Authorization:
      "Basic " + Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY + ":").toString("base64"),
  };
}
async function discard(id) {
  if (!id) return;
  try {
    const result = await fetch("https://api.imagekit.io/v1/files/" + encodeURIComponent(id), {
      method: "DELETE",
      headers: headers(),
      signal: AbortSignal.timeout(10000),
    });
    if (!result.ok && result.status !== 404) throw new Error();
  } catch {
    console.warn("ImageKit cleanup pending for file", id);
  }
}

function changeFile(kind, remove = false) {
  return async (req, res) => {
    if (!process.env.IMAGEKIT_PRIVATE_KEY)
      return res.status(503).json({ success: false, message: "File storage is not configured." });
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user.id },
      select: { [kind.field]: true, [kind.id]: true },
    });
    let file = null;
    if (!remove) {
      const ext = req.file && extension(req.file.buffer, kind);
      if (!ext)
        return res.status(400).json({ success: false, message: "Unsupported file content." });
      const form = new FormData();
      const name = randomUUID() + "." + ext;
      form.set("file", new Blob([req.file.buffer]), name);
      form.set("fileName", name);
      form.set("folder", "/vettly/" + kind.folder);
      form.set("isPrivateFile", String(kind === resume));
      const result = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        headers: headers(),
        body: form,
        signal: AbortSignal.timeout(30000),
      });
      if (!result.ok)
        return res.status(502).json({ success: false, message: "File upload failed." });
      file = await result.json();
      if (!file.fileId || !file.url || !file.filePath) throw new Error("Invalid storage response.");
    }
    const value = kind === picture ? file?.url : file?.filePath;
    // A concurrent replacement must not delete the winning upload.
    let changed;
    try {
      changed = await prisma.user.updateMany({
        where: { id: req.user.id, ...user },
        data: { [kind.field]: value ?? null, [kind.id]: file?.fileId ?? null },
      });
    } catch (error) {
      // The database connection may have failed after commit. Never delete a potentially referenced file.
      if (file) console.warn("Verify ImageKit attachment after database failure", file.fileId);
      throw error;
    }
    if (!changed.count) {
      await discard(file?.fileId);
      return res
        .status(409)
        .json({ success: false, message: "Profile changed. Retry this request." });
    }
    await discard(user[kind.id]);
    return res.json({
      success: true,
      data: kind === picture ? { profilePicture: value ?? null } : { hasResume: Boolean(file) },
    });
  };
}
export const uploadPicture = changeFile(picture);
export const deletePicture = changeFile(picture, true);
export const uploadResume = changeFile(resume);
export const deleteResume = changeFile(resume, true);

export async function candidateProfile(req, res) {
  const user = await prisma.user.findFirst({
    where: {
      id: req.params.userId,
      OR: [
        { id: req.user.id },
        {
          interviewParticipations: {
            some: {
              interview: { creatorId: req.user.id },
              attempts: { some: { status: { in: ["SUBMITTED", "COMPLETED"] } } },
            },
          },
        },
      ],
    },
    select: { id: true, name: true, profilePicture: true, resumePath: true },
  });
  if (!user) return res.sendStatus(404);
  const { resumePath, ...profile } = user;
  let resumeUrl = null;
  if (resumePath) {
    if (!process.env.IMAGEKIT_URL_ENDPOINT || !process.env.IMAGEKIT_PRIVATE_KEY)
      return res.sendStatus(503);
    const expires = Math.floor(Date.now() / 1000) + 300;
    const path = resumePath.replace(/^\/+/, "");
    const signature = createHmac("sha1", process.env.IMAGEKIT_PRIVATE_KEY)
      .update(path + expires)
      .digest("hex");
    resumeUrl =
      process.env.IMAGEKIT_URL_ENDPOINT.replace(/\/+$/, "") +
      "/" +
      path +
      "?ik-t=" +
      expires +
      "&ik-s=" +
      signature;
  }
  res.set("Cache-Control", "no-store").json({ success: true, data: { ...profile, hasResume: Boolean(resumePath), resumeUrl } });
}
