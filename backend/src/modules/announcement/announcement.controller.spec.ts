import { Test, TestingModule } from '@nestjs/testing';
import { AnnouncementController } from './announcement.controller';
import { AnnouncementService } from './announcement.service';

describe('AnnouncementController', () => {
  let controller: AnnouncementController;
  let service: AnnouncementService;

  const mockAnnouncementService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByAdmin: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnouncementController],
      providers: [
        {
          provide: AnnouncementService,
          useValue: mockAnnouncementService,
        },
      ],
    }).compile();

    controller = module.get<AnnouncementController>(AnnouncementController);
    service = module.get<AnnouncementService>(AnnouncementService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an announcement', async () => {
      const createDto = {
        title: 'Test Announcement',
        body: 'Test body',
      };
      const mockRequest = { user: { id: 1 } };

      mockAnnouncementService.create.mockResolvedValue({
        id: 1,
        ...createDto,
      });

      const result = await controller.create(createDto, mockRequest);

      expect(result).toBeDefined();
      expect(mockAnnouncementService.create).toHaveBeenCalledWith(createDto, 1);
    });
  });

  describe('findAll', () => {
    it('should return all announcements', async () => {
      const mockAnnouncements = [
        { id: 1, title: 'Announcement 1' },
      ];

      mockAnnouncementService.findAll.mockResolvedValue(mockAnnouncements);

      const result = await controller.findAll();

      expect(result).toEqual(mockAnnouncements);
      expect(mockAnnouncementService.findAll).toHaveBeenCalled();
    });
  });
});
