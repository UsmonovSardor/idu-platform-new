import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/** S3-uyg'un fayl saqlash (MinIO local, S3 prod). Avatar, hujjat, kvitansiya. */
@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor(config: ConfigService) {
    this.endpoint = config.get<string>('S3_ENDPOINT', 'http://localhost:9000');
    this.bucket = config.get<string>('S3_BUCKET', 'idu-uploads');
    this.client = new S3Client({
      region: config.get<string>('S3_REGION', 'us-east-1'),
      endpoint: this.endpoint,
      forcePathStyle: true, // MinIO uchun
      credentials: {
        accessKeyId: config.getOrThrow<string>('S3_ACCESS_KEY'),
        secretAccessKey: config.getOrThrow<string>('S3_SECRET_KEY'),
      },
    });
  }

  /** Buferni yuklaydi, ochiq URL qaytaradi (public prefiks). */
  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  /** Maxfiy fayl uchun vaqtinchalik imzolangan URL. */
  async presignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn,
    });
  }
}
