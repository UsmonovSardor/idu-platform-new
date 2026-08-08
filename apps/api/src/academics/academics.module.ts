import { Module } from '@nestjs/common';
import { FacultiesController } from './faculties.controller';
import { FacultiesService } from './faculties.service';

/**
 * Akademik struktura moduli (§7.2). Faculties — namunaviy CRUD;
 * Department/Program/Group xuddi shu pattern bo'yicha qo'shiladi.
 */
@Module({
  controllers: [FacultiesController],
  providers: [FacultiesService],
  exports: [FacultiesService],
})
export class AcademicsModule {}
