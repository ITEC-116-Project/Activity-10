import { Test, TestingModule } from '@nestjs/testing';
import { AccountLoginController } from './account-login.controller';
import { AccountLoginService } from './account-login.service';

describe('AccountLoginController', () => {
  let controller: AccountLoginController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountLoginController],
      providers: [AccountLoginService],
    }).compile();

    controller = module.get<AccountLoginController>(AccountLoginController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
