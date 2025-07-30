import { asc, eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { InsertTestType, TestTypeTable } from '@/drizzle/schema';
import { UpsertTestTypeSchemaValues } from '../schemas/periodic-testing';

export async function getTestTypes() {
  try {
    return await db.query.TestTypeTable.findMany({
      orderBy: [asc(TestTypeTable.name)],
    });
  } catch {
    return [];
  }
}

export async function getTestTypeById(type_id: string) {
  try {
    return await db.query.TestTypeTable.findFirst({
      where: eq(TestTypeTable.type_id, type_id),
    });
  } catch {
    return null;
  }
}

export async function insertTestType(data: InsertTestType) {
  try {
    return await db.insert(TestTypeTable).values(data);
  } catch (error) {
    throw error;
  }
}

export async function updateTestType(
  type_id: string,
  data: UpsertTestTypeSchemaValues
) {
  try {
    return await db
      .update(TestTypeTable)
      .set(data)
      .where(eq(TestTypeTable.type_id, type_id));
  } catch (error) {
    throw error;
  }
}

export async function deleteTestType(type_id: string) {
  try {
    return await db
      .delete(TestTypeTable)
      .where(eq(TestTypeTable.type_id, type_id));
  } catch (error) {
    throw error;
  }
}
