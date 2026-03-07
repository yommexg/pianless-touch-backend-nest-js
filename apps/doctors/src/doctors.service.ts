import { Injectable } from '@nestjs/common';

@Injectable()
export class DoctorsService {
  getHello(): string {
    return 'Hello World!';
  }
}
