import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditsService {
  getHello(): string {
    return 'Hello World!';
  }
}
