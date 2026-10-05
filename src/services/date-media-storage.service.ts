import { Injectable } from "@nestjs/common";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

export type UploadedDateMediaFile = {
  buffer: Buffer;
  mimetype?: string;
  originalname?: string;
};

type DateMediaKind = "image" | "video";

const MINIO_REGION = "us-east-1";
const MINIO_SERVICE = "s3";

const toAmzDate = (date: Date) =>
  date.toISOString().replace(/[:-]|\.\d{3}/g, "");

const toDateStamp = (date: Date) => toAmzDate(date).slice(0, 8);

const hmac = (key: Buffer | string, value: string) =>
  createHmac("sha256", key).update(value).digest();

const signatureKey = (secretKey: string, dateStamp: string) => {
  const dateKey = hmac(`AWS4${secretKey}`, dateStamp);
  const regionKey = hmac(dateKey, MINIO_REGION);
  const serviceKey = hmac(regionKey, MINIO_SERVICE);

  return hmac(serviceKey, "aws4_request");
};

const defaultExtension = (kind: DateMediaKind) => (kind === "image" ? ".png" : ".mp4");

const safeExtension = (file: UploadedDateMediaFile, kind: DateMediaKind) => {
  const extension = extname(file.originalname ?? "").toLowerCase();

  return extension && /^[a-z0-9.]+$/.test(extension) ? extension : defaultExtension(kind);
};

@Injectable()
export class DateMediaStorageService {
  private readonly localUploadRoot = join(process.cwd(), "public", "uploads", "dates");
  private readonly localPublicPrefix = "/uploads/dates";
  private readonly minioEnabled = process.env.DATE_MEDIA_STORAGE === "minio";
  private readonly minioEndpoint = process.env.MINIO_ENDPOINT ?? "http://localhost:9000";
  private readonly minioPublicBaseUrl = process.env.MINIO_PUBLIC_BASE_URL ?? this.minioEndpoint;
  private readonly minioBucket = process.env.MINIO_BUCKET ?? "asteroids-lab";
  private readonly minioAccessKey = process.env.MINIO_ROOT_USER ?? "minioadmin";
  private readonly minioSecretKey = process.env.MINIO_ROOT_PASSWORD ?? "minioadmin";

  async saveDateMedia(kind: DateMediaKind, file: UploadedDateMediaFile) {
    const fileName = this.generateDateMediaFileName(kind, file);

    if (this.minioEnabled) {
      await this.uploadToMinio(fileName, file);

      return `${this.minioPublicBaseUrl}/${this.minioBucket}/${fileName}`;
    }

    await mkdir(this.localUploadRoot, { recursive: true });
    await writeFile(join(this.localUploadRoot, fileName), file.buffer);

    return `${this.localPublicPrefix}/${fileName}`;
  }

  private generateDateMediaFileName(kind: DateMediaKind, file: UploadedDateMediaFile) {
    const extension = safeExtension(file, kind);
    const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const uniquePart = randomUUID().replaceAll("-", "").slice(0, 12);

    return `date-${kind}-${datePart}-${uniquePart}${extension}`;
  }

  private async uploadToMinio(fileName: string, file: UploadedDateMediaFile) {
    const endpoint = new URL(this.minioEndpoint);
    const objectPath = `/${this.minioBucket}/${fileName}`;
    const targetUrl = new URL(objectPath, endpoint);
    const now = new Date();
    const amzDate = toAmzDate(now);
    const dateStamp = toDateStamp(now);
    const payloadHash = createHash("sha256").update(file.buffer).digest("hex");
    const canonicalHeaders = [
      `host:${targetUrl.host}`,
      `x-amz-content-sha256:${payloadHash}`,
      `x-amz-date:${amzDate}`
    ].join("\n");
    const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
    const canonicalRequest = [
      "PUT",
      objectPath,
      "",
      canonicalHeaders,
      "",
      signedHeaders,
      payloadHash
    ].join("\n");
    const credentialScope = `${dateStamp}/${MINIO_REGION}/${MINIO_SERVICE}/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      createHash("sha256").update(canonicalRequest).digest("hex")
    ].join("\n");
    const signature = createHmac("sha256", signatureKey(this.minioSecretKey, dateStamp))
      .update(stringToSign)
      .digest("hex");
    const authorization = [
      `AWS4-HMAC-SHA256 Credential=${this.minioAccessKey}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`
    ].join(", ");
    const response = await fetch(targetUrl, {
      method: "PUT",
      body: file.buffer as unknown as BodyInit,
      headers: {
        authorization,
        "content-type": file.mimetype ?? "application/octet-stream",
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate
      }
    });

    if (!response.ok) {
      throw new Error(`Minio upload failed with status ${response.status}`);
    }
  }
}
