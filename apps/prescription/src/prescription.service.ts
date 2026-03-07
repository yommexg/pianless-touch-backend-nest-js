import { Injectable } from '@nestjs/common';

@Injectable()
export class PrescriptionService {
  getHello(): string {
    return 'Hello World!';
  }
}
