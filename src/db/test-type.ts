import { asc, eq } from 'drizzle-orm';

import db from '@/drizzle';
import { type InsertTestType, TestTypeTable } from '@/drizzle/schema';

export async function selectTestTypes() {
  try {
    return await db.query.TestTypeTable.findMany({
      orderBy: [asc(TestTypeTable.name)],
    });
  } catch {
    return [];
  }
}

export async function selectTestTypeById(type_id: string) {
  try {
    return await db.query.TestTypeTable.findFirst({
      where: eq(TestTypeTable.type_id, type_id),
    });
  } catch {
    return null;
  }
}

export async function insertTestType(data: InsertTestType) {
  return await db.insert(TestTypeTable).values(data);
}

export async function updateTestType(
  type_id: string,
  data: Partial<InsertTestType>,
) {
  return await db
    .update(TestTypeTable)
    .set(data)
    .where(eq(TestTypeTable.type_id, type_id));
}

export async function deleteTestType(type_id: string) {
  return await db
    .delete(TestTypeTable)
    .where(eq(TestTypeTable.type_id, type_id));
}
