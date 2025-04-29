import {AccessPermission} from '../models/accessNPermissions/accessPermissionSchema.js';

export const createPermissionsForSystemAdmin = async (permissions, userId) => {
  const permissionsToCreate = [];

  for (const perm of permissions) {
    const { moduleName, submodules } = perm;

    for (const submodule of submodules) {
      const { name, canCreate, canRead, canUpdate, canDelete } = submodule;

      permissionsToCreate.push({
        moduleName,
        submoduleName: name,
        canCreate: canCreate || false,
        canRead: canRead || false,
        canUpdate: canUpdate || false,
        canDelete: canDelete || false,
        assignToRole: 'systemAdmin',
        assignedTo: userId,
      });
    }
  }

  return await AccessPermission.create(permissionsToCreate);
};
export const createPermissionsForAnchalPramukh = async (permissions, userId) => {
  const permissionsToCreate = [];

  for (const perm of permissions) {
    const { moduleName, submodules } = perm;

    for (const submodule of submodules) {
      const { name, canCreate, canRead, canUpdate, canDelete } = submodule;

      permissionsToCreate.push({
        moduleName,
        submoduleName: name,
        canCreate: canCreate || false,
        canRead: canRead || false,
        canUpdate: canUpdate || false,
        canDelete: canDelete || false,
        assignToRole: 'anchalPramukh',
        assignedTo: userId,
      });
    }
  }

  return await AccessPermission.create(permissionsToCreate);
};
export const createPermissionsForSankulPramukh = async (permissions, userId) => {
  const permissionsToCreate = [];

  for (const perm of permissions) {
    const { moduleName, submodules } = perm;

    for (const submodule of submodules) {
      const { name, canCreate, canRead, canUpdate, canDelete } = submodule;

      permissionsToCreate.push({
        moduleName,
        submoduleName: name,
        canCreate: canCreate || false,
        canRead: canRead || false,
        canUpdate: canUpdate || false,
        canDelete: canDelete || false,
        assignToRole: 'sankulPramukh',
        assignedTo: userId,
      });
    }
  }

  return await AccessPermission.create(permissionsToCreate);
};
export const createPermissionsForSanchPramukh = async (permissions, userId) => {
  const permissionsToCreate = [];

  for (const perm of permissions) {
    const { moduleName, submodules } = perm;

    for (const submodule of submodules) {
      const { name, canCreate, canRead, canUpdate, canDelete } = submodule;

      permissionsToCreate.push({
        moduleName,
        submoduleName: name,
        canCreate: canCreate || false,
        canRead: canRead || false,
        canUpdate: canUpdate || false,
        canDelete: canDelete || false,
        assignToRole: 'sanchPramukh',
        assignedTo: userId,
      });
    }
  }

  return await AccessPermission.create(permissionsToCreate);
};
export const createPermissionsForUpsanchPramukh = async (permissions, userId) => {
  const permissionsToCreate = [];

  for (const perm of permissions) {
    const { moduleName, submodules } = perm;

    for (const submodule of submodules) {
      const { name, canCreate, canRead, canUpdate, canDelete } = submodule;

      permissionsToCreate.push({
        moduleName,
        submoduleName: name,
        canCreate: canCreate || false,
        canRead: canRead || false,
        canUpdate: canUpdate || false,
        canDelete: canDelete || false,
        assignToRole: 'upSanchPramukh',
        assignedTo: userId,
      });
    }
  }

  return await AccessPermission.create(permissionsToCreate);
};
export const createPermissionsForPrashikshanPramukh = async (permissions, userId) => {
  const permissionsToCreate = [];

  for (const perm of permissions) {
    const { moduleName, submodules } = perm;

    for (const submodule of submodules) {
      const { name, canCreate, canRead, canUpdate, canDelete } = submodule;

      permissionsToCreate.push({
        moduleName,
        submoduleName: name,
        canCreate: canCreate || false,
        canRead: canRead || false,
        canUpdate: canUpdate || false,
        canDelete: canDelete || false,
        assignToRole: 'prashikshanPramukh',
        assignedTo: userId,
      });
    }
  }

  return await AccessPermission.create(permissionsToCreate);
};


//!gs permission
export const createPermissionsForGsMemberPradhan = async (permissions, userId) => {
  const permissionsToCreate = [];

  for (const perm of permissions) {
    const { moduleName, submodules } = perm;

    for (const submodule of submodules) {
      const { name, canCreate, canRead, canUpdate, canDelete } = submodule;

      permissionsToCreate.push({
        moduleName,
        submoduleName: name,
        canCreate: canCreate || false,
        canRead: canRead || false,
        canUpdate: canUpdate || false,
        canDelete: canDelete || false,
        assignToRole: 'pradhan',
        assignedTo: userId,
      });
    }
  }

  return await AccessPermission.create(permissionsToCreate);
};
export const createPermissionsForGsMemberUppradhan = async (permissions, userId) => {
  const permissionsToCreate = [];

  for (const perm of permissions) {
    const { moduleName, submodules } = perm;

    for (const submodule of submodules) {
      const { name, canCreate, canRead, canUpdate, canDelete } = submodule;

      permissionsToCreate.push({
        moduleName,
        submoduleName: name,
        canCreate: canCreate || false,
        canRead: canRead || false,
        canUpdate: canUpdate || false,
        canDelete: canDelete || false,
        assignToRole: 'uppradhan',
        assignedTo: userId,
      });
    }
  }

  return await AccessPermission.create(permissionsToCreate);
};
export const createPermissionsForGsMemberSachiv = async (permissions, userId) => {
  const permissionsToCreate = [];

  for (const perm of permissions) {
    const { moduleName, submodules } = perm;

    for (const submodule of submodules) {
      const { name, canCreate, canRead, canUpdate, canDelete } = submodule;

      permissionsToCreate.push({
        moduleName,
        submoduleName: name,
        canCreate: canCreate || false,
        canRead: canRead || false,
        canUpdate: canUpdate || false,
        canDelete: canDelete || false,
        assignToRole: 'sachiv',
        assignedTo: userId,
      });
    }
  }

  return await AccessPermission.create(permissionsToCreate);
};
export const createPermissionsForGsMemberUpsachiv = async (permissions, userId) => {
  const permissionsToCreate = [];

  for (const perm of permissions) {
    const { moduleName, submodules } = perm;

    for (const submodule of submodules) {
      const { name, canCreate, canRead, canUpdate, canDelete } = submodule;

      permissionsToCreate.push({
        moduleName,
        submoduleName: name,
        canCreate: canCreate || false,
        canRead: canRead || false,
        canUpdate: canUpdate || false,
        canDelete: canDelete || false,
        assignToRole: 'upsachiv',
        assignedTo: userId,
      });
    }
  }

  return await AccessPermission.create(permissionsToCreate);
};
export const createPermissionsForGsMemberSadasya1 = async (permissions, userId) => {
  const permissionsToCreate = [];

  for (const perm of permissions) {
    const { moduleName, submodules } = perm;

    for (const submodule of submodules) {
      const { name, canCreate, canRead, canUpdate, canDelete } = submodule;

      permissionsToCreate.push({
        moduleName,
        submoduleName: name,
        canCreate: canCreate || false,
        canRead: canRead || false,
        canUpdate: canUpdate || false,
        canDelete: canDelete || false,
        assignToRole: 'sadasya1',
        assignedTo: userId,
      });
    }
  }

  return await AccessPermission.create(permissionsToCreate);
};
export const createPermissionsForGsMemberSadasya2 = async (permissions, userId) => {
  const permissionsToCreate = [];

  for (const perm of permissions) {
    const { moduleName, submodules } = perm;

    for (const submodule of submodules) {
      const { name, canCreate, canRead, canUpdate, canDelete } = submodule;

      permissionsToCreate.push({
        moduleName,
        submoduleName: name,
        canCreate: canCreate || false,
        canRead: canRead || false,
        canUpdate: canUpdate || false,
        canDelete: canDelete || false,
        assignToRole: 'sadasya2',
        assignedTo: userId,
      });
    }
  }

  return await AccessPermission.create(permissionsToCreate);
};
export const createPermissionsForGsMemberSadasya3 = async (permissions, userId) => {
  const permissionsToCreate = [];

  for (const perm of permissions) {
    const { moduleName, submodules } = perm;

    for (const submodule of submodules) {
      const { name, canCreate, canRead, canUpdate, canDelete } = submodule;

      permissionsToCreate.push({
        moduleName,
        submoduleName: name,
        canCreate: canCreate || false,
        canRead: canRead || false,
        canUpdate: canUpdate || false,
        canDelete: canDelete || false,
        assignToRole: 'sadasya3',
        assignedTo: userId,
      });
    }
  }

  return await AccessPermission.create(permissionsToCreate);
};
export const createPermissionsForGsMemberAacharya = async (permissions, userId) => {
  const permissionsToCreate = [];

  for (const perm of permissions) {
    const { moduleName, submodules } = perm;

    for (const submodule of submodules) {
      const { name, canCreate, canRead, canUpdate, canDelete } = submodule;

      permissionsToCreate.push({
        moduleName,
        submoduleName: name,
        canCreate: canCreate || false,
        canRead: canRead || false,
        canUpdate: canUpdate || false,
        canDelete: canDelete || false,
        assignToRole: 'aacharya',
        assignedTo: userId,
      });
    }
  }

  return await AccessPermission.create(permissionsToCreate);
};
