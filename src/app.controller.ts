import { Controller, Get } from '@nestjs/common';

@Controller('/')
export class AppController {
  @Get()
  greet() {
    return {
      message: `Hello world! This is the ${process.env.NODE_ENV?.includes('prod') ?? false}`,
    };
  }
}
