'use server'

// Template — replace `items` and the field names with your own table.
//
// export async function getItems() {
//   const userId = await getUserId()
//   return db
//     .select()
//     .from(items)
//     .where(eq(items.userId, userId))
//     .orderBy(desc(items.createdAt))
// }
//
// export async function createItem(title: string) {
//   const userId = await getUserId()
//   const trimmed = title.trim()
//   if (!trimmed) return
//   await db.insert(items).values({ userId, title: trimmed })
//   revalidatePath("/")
// }
//
// export async function updateItem(id: number, fields: { completed?: boolean }) {
//   const userId = await getUserId()
//   await db
//     .update(items)
//     .set(fields)
//     .where(and(eq(items.id, id), eq(items.userId, userId)))
//   revalidatePath("/")
// }
//
// export async function deleteItem(id: number) {
//   const userId = await getUserId()
//   await db
//     .delete(items)
//     .where(and(eq(items.id, id), eq(items.userId, userId)))
//   revalidatePath("/")
// }

export {}
