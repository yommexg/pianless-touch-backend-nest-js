import { Test, TestingModule } from '@nestjs/testing';
import { LaboratoryController } from './laboratory.controller';
import { LaboratoryService } from './laboratory.service';

describe('LaboratoryController', () => {
  let laboratoryController: LaboratoryController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [LaboratoryController],
      providers: [LaboratoryService],
    }).compile();

    laboratoryController = app.get<LaboratoryController>(LaboratoryController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(laboratoryController.getHello()).toBe('Hello World!');
    });
  });
});
