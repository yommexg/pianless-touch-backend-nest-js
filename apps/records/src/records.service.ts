import { Injectable } from '@nestjs/common';

@Injectable()
export class RecordsService {
  getHello(): string {
    return 'Hello World!';
  }
}
