import { AnyColumn, ColumnSet } from '../column';
import { Expression, NumberExpression } from '../expression';
import {
  any,
  arrayAgg,
  avg,
  bitAnd,
  bitOr,
  boolAnd,
  boolOr,
  boolean,
  coalesce,
  count,
  defineDb,
  defineTable,
  enumType,
  every,
  exists,
  float4,
  group,
  integer,
  max,
  min,
  notExists,
  raw,
  star,
  stringAgg,
  sum,
  text,
  timestampWithTimeZone,
  toSql,
  uuid,
} from '..';
import { greatest, least, nullIf } from '../sql-functions';

import { DefaultDbConfig } from '../config';
import { ResultSet } from '../result-set';
import { SelectQuery } from '../select';

describe(`select`, () => {
  const foo = defineTable({
    id: uuid().primaryKey().default(`gen_random_uuid()`),
    createDate: timestampWithTimeZone().notNull().default(`now()`),
    name: text().notNull(),
    hasValue: boolean(),
    value: integer(),
    alwaysValue: integer().notNull(),
    enumTest: enumType('my_enum_type', ['A', 'B', 'C'] as const),
  });

  const bar = defineTable({
    id: uuid().primaryKey().default(`gen_random_uuid()`),
    fooId: uuid().notNull().references(foo, `id`),
    name: text(),
  });

  const listItem = defineTable({
    id: uuid().primaryKey().default(`gen_random_uuid()`),
    name: text().notNull(),
    isGreat: boolean().notNull(),
  });

  const user = defineTable({
    id: uuid(),
    with: text(),
  });

  const crate = defineTable({
    float4: float4(),
  });

  const db = defineDb({ foo, bar, listItem, user, crate }, () =>
    Promise.resolve({ rows: [], affectedCount: 0 }),
  );

  it(`should select star from foo join bar`, () => {
    const query = db.select(star()).from(db.foo).innerJoin(db.bar).on(db.bar.fooId.eq(db.foo.id));

    expect(toSql(query)).toMatchInlineSnapshot(`
Object {
  "parameters": Array [],
  "text": "SELECT foo.id, foo.create_date \\"createDate\\", foo.name, foo.has_value \\"hasValue\\", foo.value, foo.always_value \\"alwaysValue\\", foo.enum_test \\"enumTest\\", bar.id, bar.foo_id \\"fooId\\", bar.name FROM foo INNER JOIN bar ON (bar.foo_id = foo.id)",
}
`);
  });

  it(`should select star plus bar alias from foo`, () => {
    const query = db
      .select(star(), db.bar.id.as(`test`))
      .from(db.foo)
      .innerJoin(db.bar)
      .on(db.bar.fooId.eq(db.foo.id));

    expect(toSql(query)).toMatchInlineSnapshot(`
Object {
  "parameters": Array [],
  "text": "SELECT foo.id, foo.create_date \\"createDate\\", foo.name, foo.has_value \\"hasValue\\", foo.value, foo.always_value \\"alwaysValue\\", foo.enum_test \\"enumTest\\", bar.id, bar.foo_id \\"fooId\\", bar.name, bar.id test FROM foo INNER JOIN bar ON (bar.foo_id = foo.id)",
}
`);
  });

  it(`should select star foo plus bar alias from foo`, () => {
    const query = db
      .select(star(db.foo), db.bar.id.as(`test`))
      .from(db.foo)
      .innerJoin(db.bar)
      .on(db.bar.fooId.eq(db.foo.id));

    expect(toSql(query)).toMatchInlineSnapshot(`
Object {
  "parameters": Array [],
  "text": "SELECT foo.id, foo.create_date \\"createDate\\", foo.name, foo.has_value \\"hasValue\\", foo.value, foo.always_value \\"alwaysValue\\", foo.enum_test \\"enumTest\\", bar.id test FROM foo INNER JOIN bar ON (bar.foo_id = foo.id)",
}
`);
  });

  it(`should select where exists star`, () => {
    const query = db
      .select(db.foo.id)
      .from(db.foo)
      .where(exists(db.select(star()).from(db.bar).where(db.bar.fooId.eq(db.foo.id))));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo WHERE EXISTS (SELECT bar.id, bar.foo_id \\"fooId\\", bar.name FROM bar WHERE bar.foo_id = foo.id)",
      }
    `);
  });

  it(`should select foo`, () => {
    const query = db.select(db.foo.id).from(db.foo);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo",
      }
    `);
  });

  it(`should select camel case table`, () => {
    const query = db.select(db.listItem.id).from(db.listItem);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT list_item.id FROM list_item",
      }
    `);
  });

  it(`should select list_item.*`, () => {
    const query = db.select(star(db.listItem)).from(db.listItem);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT list_item.id, list_item.name, list_item.is_great \\"isGreat\\" FROM list_item",
      }
    `);
  });

  it(`should select alias baz.*`, () => {
    const baz = db.bar.as(`baZ`);
    const query = db.select(star(baz)).from(baz);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT \\"baZ\\".id, \\"baZ\\".foo_id \\"fooId\\", \\"baZ\\".name FROM bar \\"baZ\\"",
      }
    `);
  });

  it(`should wrap expression alias in quotes because timestamp is an extended reserved keyword`, () => {
    const query = db.select(coalesce(db.bar.name, db.bar.name).as(`timestamp`)).from(db.bar);

    expect(toSql(query)).toMatchInlineSnapshot(`
Object {
  "parameters": Array [],
  "text": "SELECT coalesce (bar.name, bar.name) \\"timestamp\\" FROM bar",
}
`);
  });

  it(`should select as camel case table`, () => {
    const test = db.foo.as(`testMe`);
    const query = db.select(test.id).from(test);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT \\"testMe\\".id FROM foo \\"testMe\\"",
      }
    `);
  });

  it(`should alias a column`, () => {
    const query = db.select(db.foo.id.as(`fooId`)).from(db.foo);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id \\"fooId\\" FROM foo",
      }
    `);
  });

  it(`should alias a table plus reference it in a condition `, () => {
    const baz = db.foo.as(`baz`);
    const query = db.select(baz.id).from(baz).where(baz.value.eq(1));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
        ],
        "text": "SELECT baz.id FROM foo baz WHERE baz.value = $1",
      }
    `);
  });

  it(`should alias a table with a reserved keyword plus reference it in a condition `, () => {
    const user = db.foo.as(`user`);
    const query = db.select(user.id).from(user).where(user.value.eq(1));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
        ],
        "text": "SELECT \\"user\\".id FROM foo \\"user\\" WHERE \\"user\\".value = $1",
      }
    `);
  });

  it(`should plus a column as expression`, () => {
    const query = db.select(db.foo.id, db.foo.value.plus(1).as(`test`)).from(db.foo);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
        ],
        "text": "SELECT foo.id, (foo.value + $1) test FROM foo",
      }
    `);
  });

  it(`should select subquery`, () => {
    const query = db.select(db.foo.id, db.select(db.foo.value).from(db.foo)).from(db.foo);
    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id, (SELECT foo.value FROM foo) FROM foo",
      }
    `);
  });

  it(`should select where any`, () => {
    const query = db
      .select(db.foo.id)
      .from(db.foo)
      .where(db.foo.name.eq(any(['1', '2', '3'])));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          Array [
            "1",
            "2",
            "3",
          ],
        ],
        "text": "SELECT foo.id FROM foo WHERE foo.name = ANY ($1)",
      }
    `);
  });

  it(`should select where any with empty set`, () => {
    // We must explicitly type the empty array, because the type cannot be inferred
    const array: string[] = [];
    const query = db
      .select(db.foo.id)
      .from(db.foo)
      .where(db.foo.name.eq(any(array)));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          Array [],
        ],
        "text": "SELECT foo.id FROM foo WHERE foo.name = ANY ($1)",
      }
    `);
  });

  it(`should select IN with subquery`, () => {
    const query = db
      .select(db.foo.id)
      .from(db.foo)
      .where(db.foo.id.in(db.select(db.foo.id).from(db.foo)));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo WHERE foo.id IN (SELECT foo.id FROM foo)",
      }
    `);
  });

  it(`should select in with delete subquery`, () => {
    const query = db
      .select(db.foo.id)
      .from(db.foo)
      .where(db.foo.id.in(db.deleteFrom(db.foo).returning(`id`)));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo WHERE foo.id IN (DELETE FROM foo RETURNING id)",
      }
    `);
  });

  it(`should select IN with array`, () => {
    const query = db
      .select(db.foo.id)
      .from(db.foo)
      .where(db.foo.name.in([`A`, `B`, `C`]));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          "A",
          "B",
          "C",
        ],
        "text": "SELECT foo.id FROM foo WHERE foo.name IN ($1, $2, $3)",
      }
    `);
  });

  it(`should select NOT IN with subquery`, () => {
    const query = db
      .select(db.foo.id)
      .from(db.foo)
      .where(db.foo.id.notIn(db.select(db.foo.id).from(db.foo)));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo WHERE foo.id NOT IN (SELECT foo.id FROM foo)",
      }
    `);
  });

  it(`should select NOT IN with array`, () => {
    const query = db
      .select(db.foo.id)
      .from(db.foo)
      .where(db.foo.name.notIn([`A`, `B`, `C`]));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          "A",
          "B",
          "C",
        ],
        "text": "SELECT foo.id FROM foo WHERE foo.name NOT IN ($1, $2, $3)",
      }
    `);
  });

  it(`should convert column to snake case`, () => {
    const query = db.select(db.foo.createDate).from(db.foo);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.create_date \\"createDate\\" FROM foo",
      }
    `);
  });

  it(`should select aggregate with as`, () => {
    const query = db.select(db.foo.id, sum(db.foo.value).as(`total`)).from(db.foo);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id, SUM (foo.value) total FROM foo",
      }
    `);
  });

  it(`should select min, max, avg`, () => {
    const query = db
      .select(db.foo.id, min(db.foo.value), max(db.foo.value), avg(db.foo.value))
      .from(db.foo);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id, MIN (foo.value), MAX (foo.value), AVG (foo.value) FROM foo",
      }
    `);
  });

  it(`should explicitly group`, () => {
    const query = db.select(db.foo.id).from(db.foo).where(group(db.foo.value.isNull()));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo WHERE (foo.value IS NULL)",
      }
    `);
  });

  it(`should select with in`, () => {
    const query = db.select(db.foo.id).where(db.foo.name.in([`A`, `B`, `C`]));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          "A",
          "B",
          "C",
        ],
        "text": "SELECT foo.id WHERE foo.name IN ($1, $2, $3)",
      }
    `);
  });

  it(`should select with order by`, () => {
    const query = db.select(db.foo.id).orderBy(db.foo.name.asc().nullsFirst());

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id ORDER BY foo.name ASC NULLS FIRST",
      }
    `);
  });

  it(`should select with order by desc`, () => {
    const query = db.select(db.foo.id).orderBy(db.foo.name.desc().nullsLast());

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id ORDER BY foo.name DESC NULLS LAST",
      }
    `);
  });

  it(`should select with order by alias expression`, () => {
    const winner = max(db.foo.value).as(`winner`);
    const query = db.select(db.foo.id, winner).orderBy(winner);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id, MAX (foo.value) winner ORDER BY winner",
      }
    `);
  });

  it(`should select with order by alias expression with quotes`, () => {
    const winner = max(db.foo.value).as(`camelCaseAlsoRequiresQuoting`);
    const query = db.select(db.foo.id, winner).orderBy(winner);

    expect(toSql(query)).toMatchInlineSnapshot(`
Object {
  "parameters": Array [],
  "text": "SELECT foo.id, MAX (foo.value) \\"camelCaseAlsoRequiresQuoting\\" ORDER BY \\"camelCaseAlsoRequiresQuoting\\"",
}
`);
  });

  it(`should select with concat`, () => {
    const query = db.select(db.foo.name.concat(`!`)).from(db.foo);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          "!",
        ],
        "text": "SELECT foo.name || $1 FROM foo",
      }
    `);
  });

  it(`should select where is not null`, () => {
    const query = db.select(db.foo.id).where(db.foo.value.isNotNull());

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id WHERE foo.value IS NOT NULL",
      }
    `);
  });

  it(`should basic math`, () => {
    const query = db
      .select(db.foo.id)
      .from(db.foo)
      .where(
        db.foo.value
          .plus(1)
          .multiply(2)
          .minus(3)
          .divide(4)
          .modulo(5)
          .between(-10, 10)
          .and(db.foo.value.betweenSymmetric(-20, 20)),
      );

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
          2,
          3,
          4,
          5,
          -10,
          10,
          -20,
          20,
        ],
        "text": "SELECT foo.id FROM foo WHERE foo.value + $1 * $2 - $3 / $4 % $5 BETWEEN $6 AND $7 AND (foo.value BETWEEN SYMMETRIC $8 AND $9)",
      }
    `);
  });

  it(`should select camel cased`, () => {
    const query = db.select(db.foo.id).from(db.foo).where(db.foo.createDate.isNotNull());

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo WHERE foo.create_date IS NOT NULL",
      }
    `);
  });

  it(`should select aggregate on camel cased column`, () => {
    const query = db.select(count(db.foo.createDate)).from(db.foo);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT COUNT (foo.create_date) FROM foo",
      }
    `);
  });

  it(`should select arrayAgg`, () => {
    const query = db
      .select(arrayAgg(db.foo.name.orderBy(db.foo.name.desc())))
      .from(db.foo)
      .having(arrayAgg(db.foo.name).isNotNull());

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT array_agg (foo.name ORDER BY foo.name DESC) \\"arrayAgg\\" FROM foo HAVING array_agg (foo.name) IS NOT NULL",
      }
    `);
  });

  it(`should select stringAgg`, () => {
    const query = db.select(stringAgg(db.foo.name, '-', db.foo.name.desc())).from(db.foo);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          "-",
        ],
        "text": "SELECT string_agg (foo.name, $1 ORDER BY foo.name DESC) \\"stringAgg\\" FROM foo",
      }
    `);
  });

  it(`should select bitAnd, bitOr`, () => {
    const query = db.select(bitAnd(db.foo.value), bitOr(db.foo.value)).from(db.foo);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT bit_and (foo.value) \\"bitAnd\\", bit_or (foo.value) \\"bitOr\\" FROM foo",
      }
    `);
  });

  it(`should select aggregate with alias`, () => {
    const query = db.select(count(db.foo.createDate).as(`test`)).from(db.foo);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT COUNT (foo.create_date) test FROM foo",
      }
    `);
  });

  it(`should select join`, () => {
    const query = db.select(db.foo.id).from(db.foo).join(db.bar).on(db.foo.id.eq(db.bar.fooId));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo JOIN bar ON (foo.id = bar.foo_id)",
      }
    `);
  });

  it(`should select inner join`, () => {
    const query = db
      .select(db.foo.id)
      .from(db.foo)
      .innerJoin(db.bar)
      .on(db.foo.id.eq(db.bar.fooId));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo INNER JOIN bar ON (foo.id = bar.foo_id)",
      }
    `);
  });

  it(`should select left outer join`, () => {
    const query = db
      .select(db.foo.id)
      .from(db.foo)
      .leftOuterJoin(db.bar)
      .on(db.foo.id.eq(db.bar.fooId));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo LEFT OUTER JOIN bar ON (foo.id = bar.foo_id)",
      }
    `);
  });

  it(`should select left join`, () => {
    const query = db.select(db.foo.id).from(db.foo).leftJoin(db.bar).on(db.foo.id.eq(db.bar.fooId));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo LEFT JOIN bar ON (foo.id = bar.foo_id)",
      }
    `);
  });

  it(`should select right outer join`, () => {
    const query = db.select(db.foo.id).from(db.foo).rightOuterJoin(db.bar).using(db.foo.id);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo RIGHT OUTER JOIN bar USING (foo.id)",
      }
    `);
  });

  it(`should select right join`, () => {
    const query = db
      .select(db.foo.id)
      .from(db.foo)
      .rightJoin(db.bar)
      .on(db.foo.id.eq(db.bar.fooId));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo RIGHT JOIN bar ON (foo.id = bar.foo_id)",
      }
    `);
  });

  it(`should select full outer join`, () => {
    const query = db
      .select(db.foo.id)
      .from(db.foo)
      .fullOuterJoin(db.bar)
      .on(db.foo.id.eq(db.bar.fooId));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo FULL OUTER JOIN bar ON (foo.id = bar.foo_id)",
      }
    `);
  });

  it(`should select full join`, () => {
    const query = db.select(db.foo.id).from(db.foo).fullJoin(db.bar).on(db.foo.id.eq(db.bar.fooId));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo FULL JOIN bar ON (foo.id = bar.foo_id)",
      }
    `);
  });

  it(`should select cross join`, () => {
    const query = db.select(db.foo.id).from(db.foo).crossJoin(db.bar);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo CROSS JOIN bar",
      }
    `);
  });

  it(`should select for update of table nowait`, () => {
    const query = db.select(db.foo.id).from(db.foo).limit(1).forUpdate().of(db.foo).nowait();

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
        ],
        "text": "SELECT foo.id FROM foo LIMIT $1 FOR UPDATE OF foo NOWAIT",
      }
    `);
  });

  it(`should select for no key update skip locked`, () => {
    const query = db.select(db.foo.id).from(db.foo).limit(1).forNoKeyUpdate().skipLocked();

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
        ],
        "text": "SELECT foo.id FROM foo LIMIT $1 FOR NO KEY UPDATE SKIP LOCKED",
      }
    `);
  });

  it(`should select for share`, () => {
    const query = db.select(db.foo.id).from(db.foo).limit(1).forShare().skipLocked();

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
        ],
        "text": "SELECT foo.id FROM foo LIMIT $1 FOR SHARE SKIP LOCKED",
      }
    `);
  });

  it(`should select for key share`, () => {
    const query = db.select(db.foo.id).from(db.foo).limit(1).forKeyShare().skipLocked();

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
        ],
        "text": "SELECT foo.id FROM foo LIMIT $1 FOR KEY SHARE SKIP LOCKED",
      }
    `);
  });

  it(`should select group by having count(*) > 1`, () => {
    const query = db.select(db.foo.id).from(db.foo).groupBy(db.foo.name).having(count().gt(`1`));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          "1",
        ],
        "text": "SELECT foo.id FROM foo GROUP BY foo.name HAVING COUNT(*) > $1",
      }
    `);
  });

  it(`should select limit-offset-fetch`, () => {
    const query = db.select(db.foo.id).from(db.foo).limit(10).offset(10).fetch(5);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          10,
          10,
          5,
        ],
        "text": "SELECT foo.id FROM foo LIMIT $1 OFFSET $2 FETCH FIRST $3 ROWS ONLY",
      }
    `);
  });

  it(`should select with right and or grouping`, () => {
    const query = db
      .select(db.foo.id)
      .from(db.foo)
      .where(
        db.foo.name
          .isNull()
          .or(db.foo.name.eq(`Jane`).and(db.foo.name.eq(`Joe`)))
          .or(db.foo.value.gt(600)),
      );

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          "Jane",
          "Joe",
          600,
        ],
        "text": "SELECT foo.id FROM foo WHERE foo.name IS NULL OR (foo.name = $1 AND foo.name = $2) OR foo.value > $3",
      }
    `);
  });

  it(`should select with right and or grouping with fewer than 3 tokens`, () => {
    const query = db
      .select(db.foo.id)
      .from(db.foo)
      .where(
        db.foo.name.eq(`Jane`)
        .and(
            db.foo.hasValue
            .or(db.foo.value.isNull())
        )
      );

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          "Jane",
        ],
        "text": "SELECT foo.id FROM foo WHERE foo.name = $1 AND (foo.has_value OR foo.value IS NULL)",
      }
    `);
  });

  it(`should select and exists`, () => {
    const query = db
      .select(db.foo.id)
      .from(db.foo)
      .where(
        exists(db.select(db.bar.id).where(db.bar.fooId.eq(db.foo.id))).andExists(
          db.select(db.foo.id).from(db.foo),
        ),
      );

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo WHERE EXISTS (SELECT bar.id WHERE bar.foo_id = foo.id) AND EXISTS (SELECT foo.id FROM foo)",
      }
    `);
  });

  it(`should select and not exists`, () => {
    const query = db
      .select(db.foo.id)
      .from(db.foo)
      .where(
        notExists(
          db
            .select(db.bar.id)
            .where(db.bar.fooId.eq(db.foo.id).andNotExists(db.select(db.foo.id).from(db.foo))),
        ),
      );

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo WHERE NOT EXISTS (SELECT bar.id WHERE bar.foo_id = foo.id AND NOT EXISTS (SELECT foo.id FROM foo))",
      }
    `);
  });

  it(`should select list item boolean`, () => {
    const query = db.select(db.listItem.id).from(db.listItem).where(db.listItem.isGreat);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT list_item.id FROM list_item WHERE list_item.is_great",
      }
    `);
  });

  it(`should select with case and else`, () => {
    const query = db
      .select(
        db.foo.id,
        db.case().when(db.foo.value.gt(0)).then('great').else('not great').end().as('greatness'),
      )
      .from(db.foo);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          0,
          "great",
          "not great",
        ],
        "text": "SELECT foo.id, (WHEN foo.value > $1 THEN $2 ELSE $3) greatness FROM foo",
      }
    `);
  });

  it(`should select enum column`, () => {
    const query = db.select(db.foo.enumTest).from(db.foo);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.enum_test \\"enumTest\\" FROM foo",
      }
    `);
  });

  it(`should wrap quotes around tables and columns which are reserved keywords`, () => {
    const test = db.user.as(`test`);
    const query = db
      .select(
        db.user.id,
        db.user.with,
        db.user.with.as(`test`),
        db.user.with.as(`analyse`),
        db.user.with.as(`testMe`),
        test.with.as(`with2`),
      )
      .from(db.user)
      .innerJoin(db.user.as(`test`))
      .where(db.user.with.eq('test-1').and(test.with.as(`with2`).eq('test-2')));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          "test-1",
          "test-2",
        ],
        "text": "SELECT \\"user\\".id, \\"user\\".\\"with\\", \\"user\\".\\"with\\" test, \\"user\\".\\"with\\" \\"analyse\\", \\"user\\".\\"with\\" \\"testMe\\", test.\\"with\\" with2 FROM \\"user\\" INNER JOIN \\"user\\" test WHERE \\"user\\".\\"with\\" = $1 AND test.\\"with\\" = $2",
      }
    `);
  });

  it(`should select with raw`, () => {
    const query = db
      .select(db.foo.id, raw<number, true, 'something'>`something`)
      .from(db.foo)
      .where(db.foo.id.eq('test-1').or(raw<boolean>`1 = ${1}`.and(db.foo.id.eq(`test-2`))));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          "test-1",
          1,
          "test-2",
        ],
        "text": "SELECT foo.id, something FROM foo WHERE foo.id = $1 OR (1 =  $2  AND foo.id = $3)",
      }
    `);
  });

  it(`should select using row-wise compare using raw expression`, () => {
    const query = db
      .select(db.foo.id)
      .from(db.foo)
      .where(raw`(name, value)`.gt(raw`(${'Test'},${123})`));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          "Test",
          123,
        ],
        "text": "SELECT foo.id FROM foo WHERE (name, value) > ( $1 , $2 )",
      }
    `);
  });

  it(`should quote name in alias as extended reserved keyword`, () => {
    const query = db.select(db.foo.id.as(`name`)).from(db.foo);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id \\"name\\" FROM foo",
      }
    `);
  });

  it(`should union query`, () => {
    const query = db.select(db.foo.id).from(db.foo).union(db.select(db.bar.id).from(db.bar));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo UNION SELECT bar.id FROM bar",
      }
    `);
  });

  it(`should union all query`, () => {
    const query = db.select(db.foo.id).from(db.foo).unionAll(db.select(db.bar.id).from(db.bar));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "SELECT foo.id FROM foo UNION ALL SELECT bar.id FROM bar",
      }
    `);
  });

  it(`should coalesce expression`, () => {
    const query = db.select(coalesce(db.foo.value, 1)).from(db.foo);

    expect(toSql(query)).toMatchInlineSnapshot(`
Object {
  "parameters": Array [
    1,
  ],
  "text": "SELECT coalesce (foo.value, $1) FROM foo",
}
`);
  });

  it(`should nullif expressions`, () => {
    const query = db.select(nullIf(db.foo.value, 1)).from(db.foo);

    expect(toSql(query)).toMatchInlineSnapshot(`
Object {
  "parameters": Array [
    1,
  ],
  "text": "SELECT nullif (foo.value, $1) FROM foo",
}
`);
  });

  it(`should select greatest`, () => {
    const query = db.select(greatest(db.foo.value, 1)).from(db.foo);

    expect(toSql(query)).toMatchInlineSnapshot(`
Object {
  "parameters": Array [
    1,
  ],
  "text": "SELECT greatest (foo.value, $1) FROM foo",
}
`);
  });

  it(`should select least`, () => {
    const query = db.select(least(db.foo.value, 1)).from(db.foo);

    expect(toSql(query)).toMatchInlineSnapshot(`
Object {
  "parameters": Array [
    1,
  ],
  "text": "SELECT least (foo.value, $1) FROM foo",
}
`);
  });
});
