import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { execSync } from 'child_process';
import type { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('run-seed')
  runSeed(@Res() res: Response) {
    try {
      const deployOutput = execSync('npx -y prisma migrate deploy').toString();
      const seedOutput = execSync('node dist/prisma/seed.js').toString();
      return res.status(200).send(`<pre>Migraciones aplicadas:\n${deployOutput}\n\nSeed ejecutado con exito:\n${seedOutput}</pre>`);
    } catch (error) {
      return res.status(500).send(`<pre>Error:\n${error.message}\n\nSalida (Stdout):\n${error.stdout?.toString()}</pre>`);
    }
  }

  @Get()
  getHello(): object {
    return {
      message: 'EnrutApp API',
      version: '1.0.0',
      status: 'running',
      docs: '/api/docs',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  getHealth(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
