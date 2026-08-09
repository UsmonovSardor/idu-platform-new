import { Controller, Get, Header } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CheckPolicies } from '../rbac/policies.decorator';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('kpi')
  @CheckPolicies({ action: 'read', subject: 'Report' })
  @ApiOperation({ summary: 'KPI dashboard (rahbariyat)' })
  kpi() {
    return this.reports.kpi();
  }

  @Get('performance')
  @CheckPolicies({ action: 'read', subject: 'Report' })
  @ApiOperation({ summary: "Fakultet bo'yicha o'zlashtirish" })
  performance() {
    return this.reports.performanceByFaculty();
  }

  @Get('export/students.csv')
  @CheckPolicies({ action: 'read', subject: 'Report' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="students.csv"')
  @ApiOperation({ summary: 'Talabalar CSV eksport' })
  studentsCsv() {
    return this.reports.studentsCsv();
  }
}
