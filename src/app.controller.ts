import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { execSync } from 'child_process';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('run-seed')
  runSeed(@Res() res: Response) {
    try {
      const output = execSync('node dist/prisma/seed.js').toString();
      return res.status(200).send(`<pre>Seed ejecutado con exito:\n${output}</pre>`);
    } catch (error) {
      return res.status(500).send(`<pre>Error ejecutando seed:\n${error.message}\n${error.stdout?.toString()}</pre>`);
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
