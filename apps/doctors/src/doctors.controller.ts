import { Controller, Get } from '@nestjs/common';
import { DoctorsService } from './doctors.service';

@Controller()
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  getHello(): string {
    return this.doctorsService.getHello();
  }
}
