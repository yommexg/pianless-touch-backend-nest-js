import { Test, TestingModule } from '@nestjs/testing';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';

describe('DoctorsController', () => {
  let doctorsController: DoctorsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [DoctorsController],
      providers: [DoctorsService],
    }).compile();

    doctorsController = app.get<DoctorsController>(DoctorsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(doctorsController.getHello()).toBe('Hello World!');
    });
  });
});
