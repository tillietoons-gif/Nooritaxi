import { AdminController } from './admin.controller';
import { PERMISSIONS_KEY } from '../auth/decorators/permissions.decorator';

describe('AdminController', () => {
  let controller: AdminController;

  beforeEach(() => {
    controller = new AdminController({
      listUsers: jest.fn(),
    } as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('requires admins.view permission for the admin users listing', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      AdminController.prototype.listUsers,
    );

    expect(permissions).toEqual(['admins.view']);
  });
});