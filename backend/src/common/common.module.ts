import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SessionGuard, sessionHours } from './session';

@Global()
@Module({
  imports: [
    // Async so values from .env (loaded by ConfigModule) are available
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.SESSION_SECRET || 'dev-only-session-secret-change-me',
        signOptions: { expiresIn: `${sessionHours()}h` },
      }),
    }),
  ],
  providers: [SessionGuard],
  exports: [JwtModule, SessionGuard],
})
export class CommonModule {}
