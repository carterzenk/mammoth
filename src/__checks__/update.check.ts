import { count, defineDb, defineTable, integer, text, timestampWithTimeZone, uuid } from '..';

import { toSnap } from './helpers/to-snap';

/** @dts-jest enable:test-type */

const foo = defineTable(`foo`, {
  id: uuid().primaryKey().default(`gen_random_id()`),
  createDate: timestampWithTimeZone().notNull().default(`now()`),
  name: text().notNull(),
  value: integer(),
});

const db = defineDb(() => Promise.resolve({ rows: [], affectedRowsCount: 0 }));

// @dts-jest:group update
{
  // @dts-jest:snap should update and returning id
  toSnap(db.update(foo).set({ name: `Test`, value: 123 }).returning(`id`));

  // @dts-jest:snap should update and returning two columns
  toSnap(db.update(foo).set({ name: `Test`, value: 123 }).returning(`id`, `name`));

  // @dts-jest:snap should update without returning and return number
  toSnap(db.update(foo).set({ name: `Test`, value: 123 }));

  db.update(foo).set({ name: `Test` }).then((result) => {
    // @dts-jest:snap should update and await affected count
    result;
  });

  db.update(foo).set({ name: `Test` }).returning(`name`).then((result) => {
    // @dts-jest:snap should update-returning and await rows
    result;
  });
}