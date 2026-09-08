import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { ApiError } from "@/lib/utils/api-error";

const publicUser = (user: {
  id: string;
  username: string;
  email: string | null;
  fullName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}, roleCodes: string[] = []) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  fullName: user.fullName,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  roleCodes,
});

export class RbacService {
  static async listUsers() {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    const userRoles = await prisma.userRole.findMany();
    const roles = await prisma.role.findMany();
    const roleMap = Object.fromEntries(roles.map((r) => [r.id, r]));

    const userRolesMap: Record<string, typeof roles> = {};
    for (const ur of userRoles) {
      if (!userRolesMap[ur.userId]) userRolesMap[ur.userId] = [];
      const role = roleMap[ur.roleId];
      if (role) userRolesMap[ur.userId].push(role);
    }

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      isActive: u.isActive,
      roles: (userRolesMap[u.id] || []).map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        dataScope: r.dataScope,
      })),
      roleCodes: (userRolesMap[u.id] || []).map((role) => role.code),
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
  }

  static async createUser(data: {
    username: string;
    fullName: string;
    password?: string;
    email?: string;
    roleCodes?: string[];
  }) {
    const password = data.password?.trim() || "";
    if (password.length < 8) throw new ApiError("Password must contain at least 8 characters", "INVALID_PASSWORD", 400);
    const passwordHash = await hashPassword(password);
    return prisma.$transaction(async (tx) => {
      const roles = await tx.role.findMany({
        where: { code: { in: data.roleCodes || [] }, isActive: true, deletedAt: null },
      });
      if (roles.length !== new Set(data.roleCodes || []).size) {
        throw new ApiError("One or more role codes are invalid", "INVALID_ROLE", 400);
      }
      const user = await tx.user.create({
        data: {
          username: data.username.trim(),
          fullName: data.fullName.trim(),
          passwordHash,
          email: data.email?.trim() || null,
          isActive: true,
        },
      });
      if (roles.length) {
        await tx.userRole.createMany({
          data: roles.map((role) => ({ userId: user.id, roleId: role.id })),
        });
      }
      return publicUser(user, roles.map((role) => role.code));
    });
  }

  static async updateUser(
    userId: string,
    data: {
      fullName?: string;
      email?: string;
      isActive?: boolean;
      roleCodes?: string[];
      password?: string;
    }
  ) {
    const updatePayload: {
      fullName?: string;
      email?: string | null;
      isActive?: boolean;
      passwordHash?: string;
    } = {};
    if (data.fullName !== undefined) updatePayload.fullName = data.fullName.trim();
    if (data.email !== undefined) updatePayload.email = data.email?.trim() || null;
    if (data.isActive !== undefined) updatePayload.isActive = Boolean(data.isActive);
    if (data.password) {
      if (data.password.trim().length < 8) {
        throw new ApiError("Password must contain at least 8 characters", "INVALID_PASSWORD", 400);
      }
      updatePayload.passwordHash = await hashPassword(data.password.trim());
    }
    return prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id: userId }, data: updatePayload });
      if (Array.isArray(data.roleCodes)) {
        const roles = await tx.role.findMany({
          where: { code: { in: data.roleCodes }, isActive: true, deletedAt: null },
        });
        if (roles.length !== new Set(data.roleCodes).size) {
          throw new ApiError("One or more role codes are invalid", "INVALID_ROLE", 400);
        }
        await tx.userRole.deleteMany({ where: { userId } });
        if (roles.length) {
          await tx.userRole.createMany({
            data: roles.map((role) => ({ userId, roleId: role.id })),
          });
        }
      }
      const links = await tx.userRole.findMany({ where: { userId } });
      const assignedRoles = await tx.role.findMany({ where: { id: { in: links.map((link) => link.roleId) } } });
      return publicUser(updated, assignedRoles.map((role) => role.code));
    });
  }

  static async listUserRoles(userId: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw new ApiError("User not found", "NOT_FOUND", 404);
    const links = await prisma.userRole.findMany({ where: { userId } });
    const items = await prisma.role.findMany({
      where: { id: { in: links.map((link) => link.roleId) }, deletedAt: null },
      orderBy: { code: "asc" },
    });
    return { items, total: items.length };
  }

  static async assignUserRole(userId: string, roleCode: string) {
    return prisma.$transaction(async (tx) => {
      const [user, role] = await Promise.all([
        tx.user.findFirst({ where: { id: userId, deletedAt: null } }),
        tx.role.findFirst({ where: { code: roleCode, deletedAt: null, isActive: true } }),
      ]);
      if (!user) throw new ApiError("User not found", "NOT_FOUND", 404);
      if (!role) throw new ApiError("Role not found", "NOT_FOUND", 404);
      await tx.userRole.upsert({
        where: { userId_roleId: { userId, roleId: role.id } },
        create: { userId, roleId: role.id },
        update: {},
      });
      return { updated: true };
    });
  }

  static async removeUserRole(userId: string, roleCode: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw new ApiError("User not found", "NOT_FOUND", 404);
    const role = await prisma.role.findFirst({ where: { code: roleCode, deletedAt: null } });
    if (!role) throw new ApiError("Role not found", "NOT_FOUND", 404);
    await prisma.userRole.deleteMany({ where: { userId, roleId: role.id } });
    return { updated: true };
  }

  static async listRoles() {
    const roles = await prisma.role.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
    });

    const rolePermissions = await prisma.rolePermission.findMany();
    const permissions = await prisma.permission.findMany();
    const permMap = Object.fromEntries(permissions.map((p) => [p.id, p]));

    const rolePermsMap: Record<string, string[]> = {};
    for (const rp of rolePermissions) {
      if (!rolePermsMap[rp.roleId]) rolePermsMap[rp.roleId] = [];
      const perm = permMap[rp.permissionId];
      if (perm) rolePermsMap[rp.roleId].push(perm.code);
    }

    return roles.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      dataScope: r.dataScope,
      isSystem: r.isSystem,
      isActive: r.isActive,
      permissions: rolePermsMap[r.id] || [],
    }));
  }

  static async listPermissions() {
    return prisma.permission.findMany({
      orderBy: [{ resource: "asc" }, { code: "asc" }],
    });
  }

  static async listRolePermissions(roleId: string) {
    const role = await prisma.role.findFirst({ where: { id: roleId, deletedAt: null } });
    if (!role) throw new ApiError("Role not found", "NOT_FOUND", 404);
    const links = await prisma.rolePermission.findMany({ where: { roleId } });
    return prisma.permission.findMany({
      where: { id: { in: links.map((link) => link.permissionId) } },
      orderBy: [{ resource: "asc" }, { code: "asc" }],
    });
  }

  static async replaceRolePermissions(roleId: string, permissionCodes: string[]) {
    return prisma.$transaction(async (tx) => {
      const role = await tx.role.findFirst({ where: { id: roleId, deletedAt: null } });
      if (!role) throw new ApiError("Role not found", "NOT_FOUND", 404);
      const uniqueCodes = [...new Set(permissionCodes)];
      const permissions = await tx.permission.findMany({ where: { code: { in: uniqueCodes }, isAssignable: true } });
      if (permissions.length !== uniqueCodes.length) {
        throw new ApiError("One or more permissions are invalid or not assignable", "INVALID_PERMISSION", 400);
      }
      await tx.rolePermission.deleteMany({ where: { roleId } });
      if (permissions.length) {
        await tx.rolePermission.createMany({
          data: permissions.map((permission) => ({ roleId, permissionId: permission.id })),
        });
      }
      return permissions;
    });
  }

  static async listAdvisors() {
    const assignments = await prisma.classAdvisorAssignment.findMany({
      where: { status: "active" },
    });

    const classIds = assignments.map((a) => a.classId);
    const userIds = assignments.map((a) => a.userId);
    const termIds = assignments.map((a) => a.academicTermId);

    const [classes, users, terms] = await Promise.all([
      prisma.class.findMany({ where: { id: { in: classIds } } }),
      prisma.user.findMany({ where: { id: { in: userIds } } }),
      prisma.academicTerm.findMany({ where: { id: { in: termIds } } }),
    ]);

    const classMap = Object.fromEntries(classes.map((c) => [c.id, c]));
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
    const termMap = Object.fromEntries(terms.map((t) => [t.id, t]));

    return assignments.map((a) => ({
      id: a.id,
      userId: a.userId,
      classId: a.classId,
      academicTermId: a.academicTermId,
      status: a.status,
      classCode: classMap[a.classId]?.classId,
      className: classMap[a.classId]?.className,
      advisorUserId: a.userId,
      advisorName: userMap[a.userId]?.fullName,
      termCode: termMap[a.academicTermId]?.sTermCode,
      assignedAt: a.assignedAt,
    }));
  }

  static async assignAdvisor(data: {
    userId: string;
    classId: string;
    academicTermId: string;
    assignedById: string;
  }) {
    const [user, classRecord, term] = await Promise.all([
      prisma.user.findFirst({ where: { id: data.userId, isActive: true, deletedAt: null } }),
      prisma.class.findFirst({ where: { id: data.classId, deletedAt: null } }),
      prisma.academicTerm.findUnique({ where: { id: data.academicTermId } }),
    ]);
    if (!user || !classRecord || !term) {
      throw new ApiError("User, class, or academic term does not exist", "INVALID_REFERENCE", 400);
    }
    return prisma.classAdvisorAssignment.upsert({
      where: { classId_academicTermId: { classId: data.classId, academicTermId: data.academicTermId } },
      create: {
        userId: data.userId,
        classId: data.classId,
        academicTermId: data.academicTermId,
        assignedById: data.assignedById,
      },
      update: {
        userId: data.userId,
        status: "active",
        assignedAt: new Date(),
        assignedById: data.assignedById,
        revokedAt: null,
        revokedById: null,
      },
    });
  }

  static async revokeAdvisor(assignmentId: string, revokedById: string) {
    const result = await prisma.classAdvisorAssignment.updateMany({
      where: { id: assignmentId, status: "active" },
      data: { status: "revoked", revokedAt: new Date(), revokedById },
    });
    if (!result.count) throw new ApiError("Active advisor assignment not found", "NOT_FOUND", 404);
  }
}
