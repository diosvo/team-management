import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { InsertTestType, TestTypeTable } from '@/drizzle/schema';

export async function getTestTypes() {
  try {
    return await db.query.TestTypeTable.findMany();
  } catch {
    return null;
  }
}

export async function getTestTypeById(type_id: string) {
  try {
    const type = await db.query.TestTypeTable.findFirst({
      where: eq(TestTypeTable.type_id, type_id),
    });

    return type;
  } catch {
    return null;
  }
}

export async function insertTestType(data: InsertTestType) {
  try {
    const [type] = await db.insert(TestTypeTable).values(data).returning();

    return type;
  } catch (error) {
    throw error;
  }
}

export async function updateTestType(type_id: string, name: string) {
  try {
    const [type] = await db
      .update(TestTypeTable)
      .set({ name })
      .where(eq(TestTypeTable.type_id, type_id))
      .returning();

    return type;
  } catch (error) {
    throw error;
  }
}

export async function deleteTestType(type_id: string) {
  try {
    const [type] = await db
      .delete(TestTypeTable)
      .where(eq(TestTypeTable.type_id, type_id))
      .returning();

    return type;
  } catch (error) {
    throw error;
  }
}
