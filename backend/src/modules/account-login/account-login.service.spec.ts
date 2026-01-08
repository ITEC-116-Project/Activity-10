import { Test, TestingModule } from '@nestjs/testing';
import { AccountLoginService } from './account-login.service';

describe('AccountLoginService', () => {
  let service: AccountLoginService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountLoginService],
    }).compile();

    service = module.get<AccountLoginService>(AccountLoginService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
