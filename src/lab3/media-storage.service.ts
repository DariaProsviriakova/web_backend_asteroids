import { Injectable } from "@nestjs/common";
import { DateMediaStorageService, type UploadedDateMediaFile } from "../services/date-media-storage.service.js";

@Injectable()
export class Lab3MediaStorageService extends DateMediaStorageService {
  override async saveDateMedia(kind: "image" | "video", file: UploadedDateMediaFile): Promise<string> {
    // The parent uploads the actual bytes to MinIO using a generated Latin name.
    // LR3 persists only the object name in the database, not a client-supplied URL.
    const uploadedUrl = await super.saveDateMedia(kind, file);
    return decodeURIComponent(new URL(uploadedUrl).pathname.split("/").at(-1)!);
  }
}
