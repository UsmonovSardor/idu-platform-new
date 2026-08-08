import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { FacultiesController } from './faculties.controller';
import { FacultiesService } from './faculties.service';

/**
 * Akademik struktura moduli (§7.2). Faculties + Courses — namunaviy CRUD;
 * Department/Program/Group xuddi shu pattern bo'yicha qo'shiladi.
 */
@Module({
  controllers: [FacultiesController, CoursesController],
  providers: [FacultiesService, CoursesService],
  exports: [FacultiesService, CoursesService],
})
export class AcademicsModule {}
