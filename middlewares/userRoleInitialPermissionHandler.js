import { AccessPermission } from '../models/accessNPermissions/accessPermissionSchema.js';
import { asyncErrorHandler } from './asyncErrorHandler.js';

export const initialPermissionSystemAdmin = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const existingRolePermissions = await AccessPermission.find({
        assignToRole: 'systemAdmin',
        revokedAt: null,
      });

      if (existingRolePermissions.length === 0) {
        return next();
      }

      const formattedPermissions = existingRolePermissions.reduce(
        (acc, perm) => {
          const moduleIndex = acc.findIndex(
            (m) => m.moduleName === perm.moduleName
          );

          const submodule = {
            name: perm.submoduleName,
            canCreate: perm.canCreate,
            canRead: perm.canRead,
            canUpdate: perm.canUpdate,
            canDelete: perm.canDelete,
          };

          if (moduleIndex === -1) {
            acc.push({
              moduleName: perm.moduleName,
              submodules: [submodule],
            });
          } else {
            acc[moduleIndex].submodules.push(submodule);
          }
          return acc;
        },
        []
      );

      req.systemAdminPermissions = formattedPermissions;
      next();
    } catch (error) {
      return next(error);
    }
  }
);
export const initialPermissionAnchalPramukh = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const existingRolePermissions = await AccessPermission.find({
        assignToRole: 'anchalPramukh',
        revokedAt: null,
      });

      if (existingRolePermissions.length === 0) {
        return next();
      }

      const formattedPermissions = existingRolePermissions.reduce(
        (acc, perm) => {
          const moduleIndex = acc.findIndex(
            (m) => m.moduleName === perm.moduleName
          );

          const submodule = {
            name: perm.submoduleName,
            canCreate: perm.canCreate,
            canRead: perm.canRead,
            canUpdate: perm.canUpdate,
            canDelete: perm.canDelete,
          };

          if (moduleIndex === -1) {
            acc.push({
              moduleName: perm.moduleName,
              submodules: [submodule],
            });
          } else {
            acc[moduleIndex].submodules.push(submodule);
          }
          return acc;
        },
        []
      );

      req.anchalPramukhPermissions = formattedPermissions;
      next();
    } catch (error) {
      return next(error);
    }
  }
);
export const initialPermissionSankulPramukh = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const existingRolePermissions = await AccessPermission.find({
        assignToRole: 'sankulPramukh',
        revokedAt: null,
      });

      if (existingRolePermissions.length === 0) {
        return next();
      }

      const formattedPermissions = existingRolePermissions.reduce(
        (acc, perm) => {
          const moduleIndex = acc.findIndex(
            (m) => m.moduleName === perm.moduleName
          );

          const submodule = {
            name: perm.submoduleName,
            canCreate: perm.canCreate,
            canRead: perm.canRead,
            canUpdate: perm.canUpdate,
            canDelete: perm.canDelete,
          };

          if (moduleIndex === -1) {
            acc.push({
              moduleName: perm.moduleName,
              submodules: [submodule],
            });
          } else {
            acc[moduleIndex].submodules.push(submodule);
          }
          return acc;
        },
        []
      );

      req.sankulPramukhPermissions = formattedPermissions;
      next();
    } catch (error) {
      return next(error);
    }
  }
);
export const initialPermissionSanchPramukh = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const existingRolePermissions = await AccessPermission.find({
        assignToRole: 'sanchPramukh',
        revokedAt: null,
      });

      if (existingRolePermissions.length === 0) {
        return next();
      }

      const formattedPermissions = existingRolePermissions.reduce(
        (acc, perm) => {
          const moduleIndex = acc.findIndex(
            (m) => m.moduleName === perm.moduleName
          );

          const submodule = {
            name: perm.submoduleName,
            canCreate: perm.canCreate,
            canRead: perm.canRead,
            canUpdate: perm.canUpdate,
            canDelete: perm.canDelete,
          };

          if (moduleIndex === -1) {
            acc.push({
              moduleName: perm.moduleName,
              submodules: [submodule],
            });
          } else {
            acc[moduleIndex].submodules.push(submodule);
          }
          return acc;
        },
        []
      );

      req.sanchPramukhPermissions = formattedPermissions;
      next();
    } catch (error) {
      return next(error);
    }
  }
);
export const initialPermmissionUpsanchPramukh = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const existingRolePermissions = await AccessPermission.find({
        assignToRole: 'upSanchPramukh',
        revokedAt: null,
      });

      if (existingRolePermissions.length === 0) {
        return next();
      }

      const formattedPermissions = existingRolePermissions.reduce(
        (acc, perm) => {
          const moduleIndex = acc.findIndex(
            (m) => m.moduleName === perm.moduleName
          );

          const submodule = {
            name: perm.submoduleName,
            canCreate: perm.canCreate,
            canRead: perm.canRead,
            canUpdate: perm.canUpdate,
            canDelete: perm.canDelete,
          };

          if (moduleIndex === -1) {
            acc.push({
              moduleName: perm.moduleName,
              submodules: [submodule],
            });
          } else {
            acc[moduleIndex].submodules.push(submodule);
          }
          return acc;
        },
        []
      );

      req.upSanchPramukhPermissions = formattedPermissions;
      next();
    } catch (error) {
      return next(error);
    }
  }
);
export const initialPermissionPrashikshanPramukh = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const existingRolePermissions = await AccessPermission.find({
        assignToRole: 'prasikshanPramukh',
        revokedAt: null,
      });

      if (existingRolePermissions.length === 0) {
        return next();
      }

      const formattedPermissions = existingRolePermissions.reduce(
        (acc, perm) => {
          const moduleIndex = acc.findIndex(
            (m) => m.moduleName === perm.moduleName
          );

          const submodule = {
            name: perm.submoduleName,
            canCreate: perm.canCreate,
            canRead: perm.canRead,
            canUpdate: perm.canUpdate,
            canDelete: perm.canDelete,
          };

          if (moduleIndex === -1) {
            acc.push({
              moduleName: perm.moduleName,
              submodules: [submodule],
            });
          } else {
            acc[moduleIndex].submodules.push(submodule);
          }
          return acc;
        },
        []
      );

      req.prashikshanPramukhPermissions = formattedPermissions;
      next();
    } catch (error) {
      return next(error);
    }
  }
);

export const initialPermissionGsPradhan = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const existingRolePermissions = await AccessPermission.find({
        assignToRole: 'pradhan',
        revokedAt: null,
      });

      if (existingRolePermissions.length === 0) {
        return next();
      }

      const formattedPermissions = existingRolePermissions.reduce(
        (acc, perm) => {
          const moduleIndex = acc.findIndex(
            (m) => m.moduleName === perm.moduleName
          );

          const submodule = {
            name: perm.submoduleName,
            canCreate: perm.canCreate,
            canRead: perm.canRead,
            canUpdate: perm.canUpdate,
            canDelete: perm.canDelete,
          };

          if (moduleIndex === -1) {
            acc.push({
              moduleName: perm.moduleName,
              submodules: [submodule],
            });
          } else {
            acc[moduleIndex].submodules.push(submodule);
          }
          return acc;
        },
        []
      );

      req.pradhanPermissions = formattedPermissions;
      next();
    } catch (error) {
      return next(error);
    }
  }
);

//!gs role
export const initialPermissionGsUppradhan = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const existingRolePermissions = await AccessPermission.find({
        assignToRole: 'uppradhan',
        revokedAt: null,
      });

      if (existingRolePermissions.length === 0) {
        return next();
      }

      const formattedPermissions = existingRolePermissions.reduce(
        (acc, perm) => {
          const moduleIndex = acc.findIndex(
            (m) => m.moduleName === perm.moduleName
          );

          const submodule = {
            name: perm.submoduleName,
            canCreate: perm.canCreate,
            canRead: perm.canRead,
            canUpdate: perm.canUpdate,
            canDelete: perm.canDelete,
          };

          if (moduleIndex === -1) {
            acc.push({
              moduleName: perm.moduleName,
              submodules: [submodule],
            });
          } else {
            acc[moduleIndex].submodules.push(submodule);
          }
          return acc;
        },
        []
      );

      req.uppradhanPermissions = formattedPermissions;
      next();
    } catch (error) {
      return next(error);
    }
  }
);
export const initialPermissionGsSachiv = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const existingRolePermissions = await AccessPermission.find({
        assignToRole: 'sachiv',
        revokedAt: null,
      });

      if (existingRolePermissions.length === 0) {
        return next();
      }

      const formattedPermissions = existingRolePermissions.reduce(
        (acc, perm) => {
          const moduleIndex = acc.findIndex(
            (m) => m.moduleName === perm.moduleName
          );

          const submodule = {
            name: perm.submoduleName,
            canCreate: perm.canCreate,
            canRead: perm.canRead,
            canUpdate: perm.canUpdate,
            canDelete: perm.canDelete,
          };

          if (moduleIndex === -1) {
            acc.push({
              moduleName: perm.moduleName,
              submodules: [submodule],
            });
          } else {
            acc[moduleIndex].submodules.push(submodule);
          }
          return acc;
        },
        []
      );

      req.sachivPermissions = formattedPermissions;
      next();
    } catch (error) {
      return next(error);
    }
  }
);
export const initialPermissionGsUpsachiv = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const existingRolePermissions = await AccessPermission.find({
        assignToRole: 'upsachiv',
        revokedAt: null,
      });

      if (existingRolePermissions.length === 0) {
        return next();
      }

      const formattedPermissions = existingRolePermissions.reduce(
        (acc, perm) => {
          const moduleIndex = acc.findIndex(
            (m) => m.moduleName === perm.moduleName
          );

          const submodule = {
            name: perm.submoduleName,
            canCreate: perm.canCreate,
            canRead: perm.canRead,
            canUpdate: perm.canUpdate,
            canDelete: perm.canDelete,
          };

          if (moduleIndex === -1) {
            acc.push({
              moduleName: perm.moduleName,
              submodules: [submodule],
            });
          } else {
            acc[moduleIndex].submodules.push(submodule);
          }
          return acc;
        },
        []
      );

      req.upsachivPermissions = formattedPermissions;
      next();
    } catch (error) {
      return next(error);
    }
  }
);
export const initialPermissionGsSadasya1 = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const existingRolePermissions = await AccessPermission.find({
        assignToRole: 'sadasya1',
        revokedAt: null,
      });

      if (existingRolePermissions.length === 0) {
        return next();
      }

      const formattedPermissions = existingRolePermissions.reduce(
        (acc, perm) => {
          const moduleIndex = acc.findIndex(
            (m) => m.moduleName === perm.moduleName
          );

          const submodule = {
            name: perm.submoduleName,
            canCreate: perm.canCreate,
            canRead: perm.canRead,
            canUpdate: perm.canUpdate,
            canDelete: perm.canDelete,
          };

          if (moduleIndex === -1) {
            acc.push({
              moduleName: perm.moduleName,
              submodules: [submodule],
            });
          } else {
            acc[moduleIndex].submodules.push(submodule);
          }
          return acc;
        },
        []
      );

      req.sadasya1Permissions = formattedPermissions;
      next();
    } catch (error) {
      return next(error);
    }
  }
);
export const initialPermissionGsSadasya2 = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const existingRolePermissions = await AccessPermission.find({
        assignToRole: 'sadasya2',
        revokedAt: null,
      });

      if (existingRolePermissions.length === 0) {
        return next();
      }

      const formattedPermissions = existingRolePermissions.reduce(
        (acc, perm) => {
          const moduleIndex = acc.findIndex(
            (m) => m.moduleName === perm.moduleName
          );

          const submodule = {
            name: perm.submoduleName,
            canCreate: perm.canCreate,
            canRead: perm.canRead,
            canUpdate: perm.canUpdate,
            canDelete: perm.canDelete,
          };

          if (moduleIndex === -1) {
            acc.push({
              moduleName: perm.moduleName,
              submodules: [submodule],
            });
          } else {
            acc[moduleIndex].submodules.push(submodule);
          }
          return acc;
        },
        []
      );

      req.sadasya1Permission2 = formattedPermissions;
      next();
    } catch (error) {
      return next(error);
    }
  }
);
export const initialPermissionGsSadasya3 = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const existingRolePermissions = await AccessPermission.find({
        assignToRole: 'sadasya3',
        revokedAt: null,
      });

      if (existingRolePermissions.length === 0) {
        return next();
      }

      const formattedPermissions = existingRolePermissions.reduce(
        (acc, perm) => {
          const moduleIndex = acc.findIndex(
            (m) => m.moduleName === perm.moduleName
          );

          const submodule = {
            name: perm.submoduleName,
            canCreate: perm.canCreate,
            canRead: perm.canRead,
            canUpdate: perm.canUpdate,
            canDelete: perm.canDelete,
          };

          if (moduleIndex === -1) {
            acc.push({
              moduleName: perm.moduleName,
              submodules: [submodule],
            });
          } else {
            acc[moduleIndex].submodules.push(submodule);
          }
          return acc;
        },
        []
      );

      req.sadasya3Permissions = formattedPermissions;
      next();
    } catch (error) {
      return next(error);
    }
  }
);
export const initialPermissionAacharya = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const existingRolePermissions = await AccessPermission.find({
        assignToRole: 'aacharya',
        revokedAt: null,
      });

      if (existingRolePermissions.length === 0) {
        return next();
      }

      const formattedPermissions = existingRolePermissions.reduce(
        (acc, perm) => {
          const moduleIndex = acc.findIndex(
            (m) => m.moduleName === perm.moduleName
          );

          const submodule = {
            name: perm.submoduleName,
            canCreate: perm.canCreate,
            canRead: perm.canRead,
            canUpdate: perm.canUpdate,
            canDelete: perm.canDelete,
          };

          if (moduleIndex === -1) {
            acc.push({
              moduleName: perm.moduleName,
              submodules: [submodule],
            });
          } else {
            acc[moduleIndex].submodules.push(submodule);
          }
          return acc;
        },
        []
      );

      req.aacharyaPermissions = formattedPermissions;
      next();
    } catch (error) {
      return next(error);
    }
  }
);
