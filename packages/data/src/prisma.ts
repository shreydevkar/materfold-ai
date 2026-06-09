import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __materfoldPrisma: PrismaClient | undefined;
}

export const prisma = globalThis.__materfoldPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__materfoldPrisma = prisma;
}