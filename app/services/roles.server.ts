import { prisma } from '../utils/db.server';

export async function ensureRoles() {
    // Ensure default roles exist
    const roles = ['user', 'admin'];
    
    await Promise.all(
        roles.map(roleName =>
            prisma.role.upsert({
                where: { name: roleName },
                update: {},
                create: { name: roleName }
            })
        )
    );
}

export async function getUserRole(userId: string) {
    const userRole = await prisma.user.findUnique({
        where: { id: userId },
        select: { roles: true }
    });
    return userRole?.roles[0];
}

export async function assignUserRole(userId: string, roleName: string = 'user') {
    const role = await prisma.role.findUnique({
        where: { name: roleName }
    });
    
    if (!role) {
        await ensureRoles();
    }
    
    return prisma.user.update({
        where: { id: userId },
        data: {
            roles: {
                connect: { name: roleName }
            }
        }
    });
}
