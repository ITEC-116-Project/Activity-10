import { Test, TestingModule } from '@nestjs/testing';
import { AnnouncementService } from './announcement.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Announcement } from '../../typeorm/entities/announcement';

describe('AnnouncementService', () => {
  let service: AnnouncementService;

  const mockAnnouncementRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementService,
        {
          provide: getRepositoryToken(Announcement),
          useValue: mockAnnouncementRepository,
        },
      ],
    }).compile();

    service = module.get<AnnouncementService>(AnnouncementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an announcement', async () => {
      const createDto = {
        title: 'Test Announcement',
        body: 'Test body',
        isActive: true,
      };
      const mockAnnouncement = { id: 1, ...createDto, adminId: 1 };

      mockAnnouncementRepository.create.mockReturnValue(mockAnnouncement);
      mockAnnouncementRepository.save.mockResolvedValue(mockAnnouncement);

      const result = await service.create(createDto, 1);

      expect(result).toEqual(mockAnnouncement);
      expect(mockAnnouncementRepository.create).toHaveBeenCalled();
      expect(mockAnnouncementRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all active announcements', async () => {
      const mockAnnouncements = [
        { id: 1, title: 'Announcement 1', isActive: true },
        { id: 2, title: 'Announcement 2', isActive: true },
      ];

      mockAnnouncementRepository.find.mockResolvedValue(mockAnnouncements);

      const result = await service.findAll();

      expect(result).toEqual(mockAnnouncements);
      expect(mockAnnouncementRepository.find).toHaveBeenCalled();
    });
  });
});
