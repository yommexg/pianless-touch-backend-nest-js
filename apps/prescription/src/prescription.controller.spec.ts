import { Test, TestingModule } from '@nestjs/testing';
import { PrescriptionController } from './prescription.controller';
import { PrescriptionService } from './prescription.service';

describe('PrescriptionController', () => {
  let prescriptionController: PrescriptionController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PrescriptionController],
      providers: [PrescriptionService],
    }).compile();

    prescriptionController = app.get<PrescriptionController>(PrescriptionController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(prescriptionController.getHello()).toBe('Hello World!');
    });
  });
});
