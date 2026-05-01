import { jest, describe, it, expect } from '@jest/globals';
import { logger } from '@mca/common-logger'

const mockDeactivate = jest.fn();
const mockUpdate = jest.fn();
const mockAdminResetPassword = jest.fn();
const mockActivate = jest.fn();
const mockValidationResult = jest.fn();

//We need to mock both services or else you cannot test in Jenkins currently (22/06/26)
jest.unstable_mockModule('../../src/services/okta.users.js', () => ({
  __esModule: true,
  OktaUsers: jest.fn().mockImplementation(() => ({
    deactivateOrDeleteUser: mockDeactivate,
    update: mockUpdate,
    adminResetPassword: mockAdminResetPassword,
    activate: mockActivate
  })),
  getDeleteUserError: jest.fn((err) => {
    logger.error(err);
    if (err.status === 404) {
      return 'User could not be found; they may have already been deleted.';
    }
    if (err.status === 403) {
      return 'You do not have permission to delete this user.';
    }
    return err;
  }),
  getSignupError: jest.fn((err) => 'Mocked signup error message'),
  default: jest.fn().mockImplementation(() => ({
    deactivateAndDeleteUser: mockDeactivate,
    update: mockUpdate,
    adminResetPassword: mockAdminResetPassword,
    activate: mockActivate
  }))
}));
jest.unstable_mockModule('../../src/services/local.users.js', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    deactivateAndDeleteUser: mockDeactivate,
    update: mockUpdate,
    adminResetPassword: mockAdminResetPassword,
    activate: mockActivate
  })),
  LocalUsers: jest.fn().mockImplementation(() => ({
    deactivateAndDeleteUser: mockDeactivate,
    update: mockUpdate,
    adminResetPassword: mockAdminResetPassword,
    activate: mockActivate
  }))
}));

jest.unstable_mockModule('express-validator', () => ({
  __esModule: true,
  validationResult: mockValidationResult
}));

const { updateUser } = await import('../../src/controllers/users.js');
const { deactivate } = await import('../../src/controllers/users.js');
const { adminResetPassword } = await import('../../src/controllers/users.js');
const { activate } = await import('../../src/controllers/users.js');
const { validationResult } = await import('express-validator');

describe('Unit tests for the deactivate function in the user controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: { userId: 'user-123', id: 'training-provider-x' },
      body: {}
    };
    res = {
      redirect: jest.fn(),
      render: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  it('should redirect to the users list on successful service call', async () => {
    mockValidationResult.mockReturnValue({ isEmpty: () => true });
    mockDeactivate.mockResolvedValue();
    await deactivate(req, res, next);
    expect(res.redirect).toHaveBeenCalledWith('/training-providers/training-provider-x/users');
  });

  it('should render the edit view with errors if validation fails', async () => {
    mockValidationResult.mockReturnValueOnce({
      isEmpty: () => false,
      errors: [{
        type: 'field',
        msg: 'Invalid ID',
        path: 'userId',
        location: 'params'
      }]
    });
    await deactivate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.render).toHaveBeenCalledWith('users/edit', expect.objectContaining({
      error: expect.anything()
    }));
  });

  it('should call next(err) if the service throws a 500 error', async () => {
    mockValidationResult.mockReturnValue({ isEmpty: () => true });

    const error500 = new Error('Server Crash');
    error500.status = 500;
    mockDeactivate.mockRejectedValue(error500);

    await deactivate(req, res, next);

    expect(next).toHaveBeenCalledWith(error500);
  });

  it('should silently redirect to the user list if the user is already deleted (404)', async () => {
    mockDeactivate.mockRejectedValue({ status: 404 });
    await deactivate(req, res, next);
    expect(res.render).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(`/training-providers/${req.params.id}/users`);
  });
});

describe('Unit tests for the updateUser function in the user controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { userId: 'user-123', id: 'training-provider-x' },
      body: {
        firstname: 'Dave',
        lastname: 'Jones',
        phone: '01234567890'
      }
    };
    res = {
      redirect: jest.fn(),
      render: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  it('should redirect to the user profile on successful update', async () => {
    mockValidationResult.mockReturnValue({ isEmpty: () => true });
    mockUpdate.mockResolvedValue();
    await updateUser(req, res, next);
    expect(mockUpdate).toHaveBeenCalledWith('user-123', expect.objectContaining({
      firstName: 'Dave',
      lastName: 'Jones',
      primaryPhone: '01234567890'
    }));
    expect(res.redirect).toHaveBeenCalledWith('/training-providers/training-provider-x/users/user-123');
  });

  it('should render the edit view with errors if validation fails', async () => {
    mockValidationResult.mockReturnValue({
      isEmpty: () => false,
      errors: [{ msg: 'Invalid phone number' }]
    });
    await updateUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.render).toHaveBeenCalledWith('users/edit', expect.objectContaining({
      error: expect.any(Object)
    }));
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should call next(err) if the service throws a 500 error', async () => {
    mockValidationResult.mockReturnValue({ isEmpty: () => true });
    const error500 = new Error('Okta API Outage');
    error500.status = 500;
    mockUpdate.mockRejectedValue(error500);
    await updateUser(req, res, next);
    expect(next).toHaveBeenCalledWith(error500);
    expect(res.render).not.toHaveBeenCalled();
  });

  it('should render the edit view for non-500 errors', async () => {
    mockValidationResult.mockReturnValue({ isEmpty: () => true });
    const error400 = new Error('Validation failed at Okta level');
    error400.status = 400;
    mockUpdate.mockRejectedValue(error400);
    await updateUser(req, res, next);
    expect(res.render).toHaveBeenCalledWith('users/edit', {
      error: expect.any(String),
      profile: {
        firstName: 'Dave',
        lastName: 'Jones',
        primaryPhone: '01234567890'
      }
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Unit tests for the adminResetPassword function in the user controller', () => {
  let req, res, next;
  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { userId: 'user-123', id: 'training-provider-x' }
    };
    res = {
      redirect: jest.fn(),
      render: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  it('should redirect to the user profile on successful password reset', async () => {
    mockValidationResult.mockReturnValue({ isEmpty: () => true });
    mockAdminResetPassword.mockResolvedValue();
    await adminResetPassword(req, res, next);
    expect(mockAdminResetPassword).toHaveBeenCalledWith('user-123');
    expect(res.redirect).toHaveBeenCalledWith('/training-providers/training-provider-x/users/user-123');
  });

  it('should render the edit view with errors if validation fails', async () => {
    mockValidationResult.mockReturnValue({
      isEmpty: () => false,
      errors: [{ msg: 'Invalid user ID format' }]
    });
    await adminResetPassword(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.render).toHaveBeenCalledWith('users/edit', expect.objectContaining({
      error: expect.any(Object)
    }));
    expect(mockAdminResetPassword).not.toHaveBeenCalled();
  });

  it('should call next(err) if the service throws a 500 error', async () => {
    mockValidationResult.mockReturnValue({ isEmpty: () => true });
    const error500 = new Error('Okta API Connectivity Issue');
    error500.status = 500;
    mockAdminResetPassword.mockRejectedValue(error500);
    await adminResetPassword(req, res, next);
    expect(next).toHaveBeenCalledWith(error500);
    expect(res.render).not.toHaveBeenCalled();
  });

  it('should render the confirm-reset-password view for non-500 errors', async () => {
    mockValidationResult.mockReturnValue({ isEmpty: () => true });
    const error400 = new Error('User is not in an active state');
    error400.status = 400;
    mockAdminResetPassword.mockRejectedValue(error400);
    await adminResetPassword(req, res, next);
    expect(res.render).toHaveBeenCalledWith('users/confirm-reset-password', {
      error: expect.any(String)
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Unit tests for the activate function in the user controller', () => {
  let req, res, next;
  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { userId: 'user-123', id: 'training-provider-x' }
    };
    res = {
      redirect: jest.fn(),
      render: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  it('should redirect to the user profile on successful activation', async () => {
    mockValidationResult.mockReturnValue({ isEmpty: () => true });
    mockActivate.mockResolvedValue();
    await activate(req, res, next);
    expect(mockActivate).toHaveBeenCalledWith('user-123');
    expect(res.redirect).toHaveBeenCalledWith('/training-providers/training-provider-x/users/user-123');
  });

  it('should render the edit view with errors if validation fails', async () => {
    mockValidationResult.mockReturnValue({
      isEmpty: () => false,
      errors: [{ msg: 'Invalid user ID provided' }]
    });
    await activate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.render).toHaveBeenCalledWith('users/edit', expect.objectContaining({
      error: expect.any(Object)
    }));
    expect(mockActivate).not.toHaveBeenCalled();
  });

  it('should call next(err) if the service throws a 500 error', async () => {
    mockValidationResult.mockReturnValue({ isEmpty: () => true });
    const error500 = new Error('Database / Okta timeout');
    error500.status = 500;
    mockActivate.mockRejectedValue(error500);
    await activate(req, res, next);
    expect(next).toHaveBeenCalledWith(error500);
    expect(res.render).not.toHaveBeenCalled();
  });

  it('should render the confirm-status view for non-500 errors', async () => {
    mockValidationResult.mockReturnValue({ isEmpty: () => true });
    const error400 = new Error('User cannot be activated in current state');
    error400.status = 400;
    mockActivate.mockRejectedValue(error400);
    await activate(req, res, next);
    expect(res.render).toHaveBeenCalledWith('users/confirm-status', {
      error: expect.any(String)
    });
    expect(next).not.toHaveBeenCalled();
  });
});
