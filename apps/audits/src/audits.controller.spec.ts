import { Test, TestingModule } from '@nestjs/testing';
import { AuditsController } from './audits.controller';
import { AuditsService } from './audits.service';

describe('AuditsController', () => {
  let auditsController: AuditsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuditsController],
      providers: [AuditsService],
    }).compile();

    auditsController = app.get<AuditsController>(AuditsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(auditsController.getHello()).toBe('Hello World!');
    });
  });
});
