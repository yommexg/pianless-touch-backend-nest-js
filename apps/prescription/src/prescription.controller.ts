import { Controller, Get } from '@nestjs/common';
import { PrescriptionService } from './prescription.service';

@Controller()
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Get()
  getHello(): string {
    return this.prescriptionService.getHello();
  }
}
