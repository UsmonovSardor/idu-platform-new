import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AcademicsModule } from './academics/academics.module';
import { AdmissionsModule } from './admissions/admissions.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AuditModule } from './audit/audit.module';
import { ChatModule } from './chat/chat.module';
import { DocumentsModule } from './documents/documents.module';
import { ForumModule } from './forum/forum.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { StorageModule } from './storage/storage.module';
import { TelegramModule } from './telegram/telegram.module';
import { AuthModule } from './auth/auth.module';
import { ExamsModule } from './exams/exams.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { validateEnv } from './config/env.validation';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { GradesModule } from './grades/grades.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { PoliciesGuard } from './rbac/policies.guard';
import { RbacModule } from './rbac/rbac.module';
import { ScheduleModule } from './schedule/schedule.module';
import { StudentsModule } from './students/students.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      envFilePath: ['.env', '../../.env'],
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get('LOG_LEVEL', 'info'),
          transport:
            config.get('NODE_ENV') === 'development'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
          redact: ['req.headers.authorization', 'req.headers.cookie'],
          autoLogging: { ignore: (req) => req.url === '/api/v1/health' },
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: Number(config.get('THROTTLE_TTL', 60)) * 1000,
            limit: Number(config.get('THROTTLE_LIMIT', 100)),
          },
        ],
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = new URL(config.get('REDIS_URL', 'redis://localhost:6379'));
        return {
          connection: { host: url.hostname, port: Number(url.port || 6379) },
        };
      },
    }),
    PrismaModule,
    RbacModule,
    AuditModule,
    StorageModule,
    AuthModule,
    HealthModule,
    AcademicsModule,
    StudentsModule,
    GradesModule,
    ScheduleModule,
    AttendanceModule,
    AssignmentsModule,
    ExamsModule,
    PaymentsModule,
    AdmissionsModule,
    DocumentsModule,
    ReportsModule,
    NotificationsModule,
    AnnouncementsModule,
    ForumModule,
    ChatModule,
    TelegramModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Guard tartibi: throttle → JWT → rol → CASL policy
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PoliciesGuard },
  ],
})
export class AppModule {}
