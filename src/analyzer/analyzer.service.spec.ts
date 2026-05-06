import { Test, TestingModule } from '@nestjs/testing';
import { AnalyzerService } from './analyzer.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('AnalyzerService', () => {
  let service: AnalyzerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyzerService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyzerService>(AnalyzerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
