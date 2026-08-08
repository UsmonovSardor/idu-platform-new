import { type ArgumentMetadata, BadRequestException, type PipeTransform } from '@nestjs/common';
import { ZodError, type ZodSchema } from 'zod';

/** Shared @idu/validation Zod sxemalaridan foydalanadigan pipe. */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: "Ma'lumotlar noto'g'ri",
          details: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        });
      }
      throw error;
    }
  }
}
