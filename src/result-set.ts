import { DbConfig, GetResultType } from './config';

import type { Column } from './column';
import { DeleteQuery } from './delete';
import type { Expression } from './expression';
import { Err, GetDataType } from './types';
import { InsertQuery } from './insert';
import { Query } from './query';
import { SelectQuery } from './select';
import { UpdateQuery } from './update';
import { TruncateQuery } from './truncate';

export type ResultSetDataType<Config extends DbConfig, Type, IsNotNull> = IsNotNull extends true
  ? GetResultType<Config, Type>
  : GetResultType<Config, Type> | GetResultType<Config, 'Null'>;

type ReturningResultSet<Config extends DbConfig, Returning, Test extends boolean> = {
  [K in keyof Returning]: Returning[K] extends Column<
    any,
    any,
    any,
    infer D,
    infer N,
    any,
    infer JoinType
  >
    ? Extract<JoinType, 'left-join'> extends never
      ? Extract<JoinType, 'left-side-of-right-join'> extends never
        ? Extract<JoinType, 'full-join'> extends never
          ? N extends true
            ? Test extends true
              ? GetDataType<D, true>
              : ResultSetDataType<Config, D, true>
            : Test extends true
            ? GetDataType<D, false>
            : ResultSetDataType<Config, D, false>
          : Test extends true
          ? GetDataType<D, false>
          : ResultSetDataType<Config, D, false>
        : Test extends true
        ? GetDataType<D, false>
        : ResultSetDataType<Config, D, false>
      : Test extends true
      ? GetDataType<D, false>
      : ResultSetDataType<Config, D, false>
    : Returning[K] extends Expression<Config, infer D, infer IsNotNull, any>
    ? Test extends true
      ? GetDataType<D, IsNotNull>
      : ResultSetDataType<Config, D, IsNotNull>
    : Returning[K] extends Query<{}>
    ? ResultSet<Config, Returning[K], Test>[keyof ResultSet<Config, Returning[K], Test>]
    : never;
};

// This is not ideal, but, using dts-jest and it's snapshotting it's not capable to snapshot an e.g.
// optional number to `number | undefined`. Instead, it will snapshot to `number`. Because it's
// important to get the optional behaviour under test as well (it's so easy to create a regression)
// this flag is introduced to return a nominal class which gets snapshotted with the correct info.
export type ResultSet<
  Config extends DbConfig,
  T extends Query<any>,
  Test extends boolean,
> = T extends SelectQuery<Config, infer Returning>
  ? {
      [K in keyof Returning]: Returning[K] extends Column<
        Config,
        any,
        any,
        infer D,
        infer N,
        any,
        infer JoinType
      >
        ? Extract<JoinType, 'left-join'> extends never
          ? Extract<JoinType, 'left-side-of-right-join'> extends never
            ? Extract<JoinType, 'full-join'> extends never
              ? N extends true
                ? Test extends true
                  ? GetDataType<D, true>
                  : ResultSetDataType<Config, D, true>
                : Test extends true
                ? GetDataType<D, false>
                : ResultSetDataType<Config, D, false>
              : Test extends true
              ? GetDataType<D, false>
              : ResultSetDataType<Config, D, false>
            : Test extends true
            ? GetDataType<D, false>
            : ResultSetDataType<Config, D, false>
          : Test extends true
          ? GetDataType<D, false>
          : ResultSetDataType<Config, D, false>
        : Returning[K] extends Expression<Config, infer D, infer IsNotNull, string>
        ? Test extends true
          ? GetDataType<D, IsNotNull>
          : ResultSetDataType<Config, D, IsNotNull>
        : Returning[K] extends Query<{}>
        ? ResultSet<Config, Returning[K], Test>[keyof ResultSet<Config, Returning[K], Test>]
        : never;
    }
  : T extends DeleteQuery<Config, any, infer Returning>
  ? {
      [K in keyof Returning]: Returning[K] extends Column<
        Config,
        any,
        any,
        infer D,
        infer N,
        any,
        infer JoinType
      >
        ? Extract<JoinType, 'left-join'> extends never
          ? Extract<JoinType, 'left-side-of-right-join'> extends never
            ? Extract<JoinType, 'full-join'> extends never
              ? N extends true
                ? Test extends true
                  ? GetDataType<D, true>
                  : ResultSetDataType<Config, D, true>
                : Test extends true
                ? GetDataType<D, false>
                : ResultSetDataType<Config, D, false>
              : Test extends true
              ? GetDataType<D, false>
              : ResultSetDataType<Config, D, false>
            : Test extends true
            ? GetDataType<D, false>
            : ResultSetDataType<Config, D, false>
          : Test extends true
          ? GetDataType<D, false>
          : ResultSetDataType<Config, D, false>
        : Returning[K] extends Expression<Config, infer D, infer IsNotNull, any>
        ? Test extends true
          ? GetDataType<D, IsNotNull>
          : ResultSetDataType<Config, D, IsNotNull>
        : Returning[K] extends Query<{}>
        ? ResultSet<Config, Returning[K], Test>[keyof ResultSet<Config, Returning[K], Test>]
        : never;
    }
  : T extends UpdateQuery<Config, any, infer Returning>
  ? {
      [K in keyof Returning]: Returning[K] extends Column<
        Config,
        any,
        any,
        infer D,
        infer N,
        any,
        infer JoinType
      >
        ? Extract<JoinType, 'left-join'> extends never
          ? Extract<JoinType, 'left-side-of-right-join'> extends never
            ? Extract<JoinType, 'full-join'> extends never
              ? N extends true
                ? Test extends true
                  ? GetDataType<D, true>
                  : ResultSetDataType<Config, D, true>
                : Test extends true
                ? GetDataType<D, false>
                : ResultSetDataType<Config, D, false>
              : Test extends true
              ? GetDataType<D, false>
              : ResultSetDataType<Config, D, false>
            : Test extends true
            ? GetDataType<D, false>
            : ResultSetDataType<Config, D, false>
          : Test extends true
          ? GetDataType<D, false>
          : ResultSetDataType<Config, D, false>
        : Returning[K] extends Expression<Config, infer D, infer IsNotNull, any>
        ? Test extends true
          ? GetDataType<D, IsNotNull>
          : ResultSetDataType<Config, D, IsNotNull>
        : Returning[K] extends Query<{}>
        ? ResultSet<Config, Returning[K], Test>[keyof ResultSet<Config, Returning[K], Test>]
        : never;
    }
  : T extends InsertQuery<Config, any, infer Returning>
  ? {
      [K in keyof Returning]: Returning[K] extends Column<
        any,
        any,
        any,
        infer D,
        infer N,
        any,
        infer JoinType
      >
        ? Extract<JoinType, 'left-join'> extends never
          ? Extract<JoinType, 'left-side-of-right-join'> extends never
            ? Extract<JoinType, 'full-join'> extends never
              ? N extends true
                ? Test extends true
                  ? GetDataType<D, true>
                  : ResultSetDataType<Config, D, true>
                : Test extends true
                ? GetDataType<D, false>
                : ResultSetDataType<Config, D, false>
              : Test extends true
              ? GetDataType<D, false>
              : ResultSetDataType<Config, D, false>
            : Test extends true
            ? GetDataType<D, false>
            : ResultSetDataType<Config, D, false>
          : Test extends true
          ? GetDataType<D, false>
          : ResultSetDataType<Config, D, false>
        : Returning[K] extends Expression<Config, infer D, infer IsNotNull, any>
        ? Test extends true
          ? GetDataType<D, IsNotNull>
          : ResultSetDataType<Config, D, IsNotNull>
        : Returning[K] extends Query<{}>
        ? ResultSet<Config, Returning[K], Test>[keyof ResultSet<Config, Returning[K], Test>]
        : never;
    }
  : T extends TruncateQuery<any, infer Returning>
  ? ReturningResultSet<Config, Returning, Test>
  : Err<'not a query'>;
