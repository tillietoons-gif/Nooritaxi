import { CanActivate, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { RolesController } from '../src/roles/roles.controller';
import { RolesService } from '../src/roles/roles.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';

describe('RolesController (e2e)', () => {
  let app: INestApplication;

  const rolesService = {
    findAllRoles: jest.fn(),
    getPermissions: jest.fn(),
    createRole: jest.fn(),
    updateRole: jest.fn(),
    deleteRole: jest.fn(),
    assignAdminRoles: jest.fn(),
  };

  const allowGuard: CanActivate = {
    canActivate: () => true,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [{ provide: RolesService, useValue: rolesService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowGuard)
      .overrideGuard(RolesGuard)
      .useValue(allowGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(allowGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /admin/roles returns the role list', async () => {
    rolesService.findAllRoles.mockResolvedValue([
      {
        id: 'role-1',
        name: 'Super Admin',
        isSystem: true,
      },
    ]);

    await request(app.getHttpServer())
      .get('/admin/roles')
      .expect(200)
      .expect([
        {
          id: 'role-1',
          name: 'Super Admin',
          isSystem: true,
        },
      ]);

    expect(rolesService.findAllRoles).toHaveBeenCalledTimes(1);
  });

  it('POST /admin/roles/assign/:adminId forwards the submitted assignments', async () => {
    rolesService.assignAdminRoles.mockResolvedValue(true);

    const payload = {
      assignments: [
        { roleId: 'role-1' },
        { roleId: 'role-2', cityScope: 'Kabul' },
      ],
    };

    await request(app.getHttpServer())
      .post('/admin/roles/assign/admin-1')
      .send(payload)
      .expect(201)
      .expect('true');

    expect(rolesService.assignAdminRoles).toHaveBeenCalledWith(
      'admin-1',
      payload.assignments,
    );
  });
});
