import { Test, TestingModule } from '@nestjs/testing';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';

describe('RecordsController', () => {
  let recordsController: RecordsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [RecordsController],
      providers: [RecordsService],
    }).compile();

    recordsController = app.get<RecordsController>(RecordsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(recordsController.getHello()).toBe('Hello World!');
    });
  });
});
