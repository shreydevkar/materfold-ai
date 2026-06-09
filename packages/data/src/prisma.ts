import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __materfoldPrisma: PrismaClient | undefined;
}

export function getPrismaClient(): PrismaClient {
  if (!globalThis.__materfoldPrisma) {
    globalThis.__materfoldPrisma = new PrismaClient();
  }

  return globalThis.__materfoldPrisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});