import { AnyColumn, Column } from './column';
import { AnyTable, Table } from './TableType';
import {
  CollectionToken,
  ParameterToken,
  SeparatorToken,
  StringToken,
  Token,
  createQueryState,
} from './tokens';
import { DbConfig, GetResultType } from './config';
import { GetReturning, QueryExecutorFn, ResultType } from './types';

import { Expression } from './expression';
import { Query } from './query';
import { ResultSet } from './result-set';
import { wrapQuotes } from './naming';

// https://www.postgresql.org/docs/12/sql-update.html
export class UpdateQuery<
  Config extends DbConfig,
  T extends AnyTable,
  Returning = number,
  TableColumns = T extends Table<Config, any, infer Columns> ? Columns : never,
> extends Query<Returning> {
  private _updateQueryBrand: any;

  /** @internal */
  getReturningKeys() {
    return this.returningKeys;
  }

  constructor(
    private readonly queryExecutor: QueryExecutorFn,
    private readonly returningKeys: string[],
    private readonly table: T,
    private readonly resultType: ResultType,
    private readonly tokens: Token[],
  ) {
    super();
  }

  then<Result1, Result2 = never>(
    onFulfilled?:
      | ((
          value: Returning extends number
            ? Returning
            : ResultSet<Config, UpdateQuery<Config, T, Returning>, false>[],
        ) => Result1 | PromiseLike<Result1>)
      | undefined
      | null,
    onRejected?: ((reason: any) => Result2 | PromiseLike<Result2>) | undefined | null,
  ): Promise<Result1 | Result2> {
    const queryState = createQueryState(this.tokens);

    return this.queryExecutor(queryState.text.join(` `), queryState.parameters)
      .then((result) =>
        onFulfilled
          ? onFulfilled(
              this.resultType === `AFFECTED_COUNT` ? result.affectedCount : (result.rows as any),
            )
          : (result as any),
      )
      .catch(onRejected);
  }

  where(
    condition: Expression<Config, boolean, boolean, string>,
  ): UpdateQuery<Config, T, Returning> {
    return new UpdateQuery(this.queryExecutor, this.returningKeys, this.table, this.resultType, [
      ...this.tokens,
      new StringToken(`WHERE`),
      ...condition.toTokens(),
    ]);
  }

  whereCurrentOf(cursorName: string) {
    return new UpdateQuery(this.queryExecutor, this.returningKeys, this.table, this.resultType, [
      ...this.tokens,
      new StringToken(`WHERE CURRENT OF`),
      new ParameterToken(cursorName),
    ]);
  }

  from(fromItem: AnyTable): UpdateQuery<Config, T, Returning> {
    return new UpdateQuery(this.queryExecutor, this.returningKeys, this.table, this.resultType, [
      ...this.tokens,
      new StringToken(`FROM`),
      fromItem.getOriginalName()
        ? new StringToken(
            `${wrapQuotes(fromItem.getOriginalName())} ${wrapQuotes(fromItem.getName())}`,
          )
        : new StringToken(wrapQuotes(fromItem.getName())),
    ]);
  }

  returning<C1 extends keyof TableColumns>(
    column1: C1,
  ): UpdateQuery<Config, T, GetReturning<TableColumns, C1>>;
  returning<C1 extends keyof TableColumns, C2 extends keyof TableColumns>(
    column1: C1,
    column2: C2,
  ): UpdateQuery<Config, T, GetReturning<TableColumns, C1> & GetReturning<TableColumns, C2>>;
  returning<
    C1 extends keyof TableColumns,
    C2 extends keyof TableColumns,
    C3 extends keyof TableColumns,
  >(
    column1: C1,
    column2: C2,
    column3: C3,
  ): UpdateQuery<
    Config,
    T,
    GetReturning<TableColumns, C1> & GetReturning<TableColumns, C2> & GetReturning<TableColumns, C3>
  >;
  returning<
    C1 extends keyof TableColumns,
    C2 extends keyof TableColumns,
    C3 extends keyof TableColumns,
    C4 extends keyof TableColumns,
  >(
    column1: C1,
    column2: C2,
    column3: C3,
    column4: C4,
  ): UpdateQuery<
    Config,
    T,
    GetReturning<TableColumns, C1> &
      GetReturning<TableColumns, C2> &
      GetReturning<TableColumns, C3> &
      GetReturning<TableColumns, C4>
  >;
  returning<
    C1 extends keyof TableColumns,
    C2 extends keyof TableColumns,
    C3 extends keyof TableColumns,
    C4 extends keyof TableColumns,
    C5 extends keyof TableColumns,
  >(
    column1: C1,
    column2: C2,
    column3: C3,
    column4: C4,
    column5: C5,
  ): UpdateQuery<
    Config,
    T,
    GetReturning<TableColumns, C1> &
      GetReturning<TableColumns, C2> &
      GetReturning<TableColumns, C3> &
      GetReturning<TableColumns, C4> &
      GetReturning<TableColumns, C5>
  >;
  returning<
    C1 extends keyof TableColumns,
    C2 extends keyof TableColumns,
    C3 extends keyof TableColumns,
    C4 extends keyof TableColumns,
    C5 extends keyof TableColumns,
    C6 extends keyof TableColumns,
  >(
    column1: C1,
    column2: C2,
    column3: C3,
    column4: C4,
    column5: C5,
    column6: C6,
  ): UpdateQuery<
    Config,
    T,
    GetReturning<TableColumns, C1> &
      GetReturning<TableColumns, C2> &
      GetReturning<TableColumns, C3> &
      GetReturning<TableColumns, C4> &
      GetReturning<TableColumns, C5> &
      GetReturning<TableColumns, C6>
  >;
  returning<
    C1 extends keyof TableColumns,
    C2 extends keyof TableColumns,
    C3 extends keyof TableColumns,
    C4 extends keyof TableColumns,
    C5 extends keyof TableColumns,
    C6 extends keyof TableColumns,
    C7 extends keyof TableColumns,
  >(
    column1: C1,
    column2: C2,
    column3: C3,
    column4: C4,
    column5: C5,
    column6: C6,
    column7: C7,
  ): UpdateQuery<
    Config,
    T,
    GetReturning<TableColumns, C1> &
      GetReturning<TableColumns, C2> &
      GetReturning<TableColumns, C3> &
      GetReturning<TableColumns, C4> &
      GetReturning<TableColumns, C5> &
      GetReturning<TableColumns, C6> &
      GetReturning<TableColumns, C7>
  >;
  returning<
    C1 extends keyof TableColumns,
    C2 extends keyof TableColumns,
    C3 extends keyof TableColumns,
    C4 extends keyof TableColumns,
    C5 extends keyof TableColumns,
    C6 extends keyof TableColumns,
    C7 extends keyof TableColumns,
    C8 extends keyof TableColumns,
  >(
    column1: C1,
    column2: C2,
    column3: C3,
    column4: C4,
    column5: C5,
    column6: C6,
    column7: C7,
    column8: C8,
  ): UpdateQuery<
    Config,
    T,
    GetReturning<TableColumns, C1> &
      GetReturning<TableColumns, C2> &
      GetReturning<TableColumns, C3> &
      GetReturning<TableColumns, C4> &
      GetReturning<TableColumns, C5> &
      GetReturning<TableColumns, C6> &
      GetReturning<TableColumns, C7> &
      GetReturning<TableColumns, C8>
  >;
  returning<
    C1 extends keyof TableColumns,
    C2 extends keyof TableColumns,
    C3 extends keyof TableColumns,
    C4 extends keyof TableColumns,
    C5 extends keyof TableColumns,
    C6 extends keyof TableColumns,
    C7 extends keyof TableColumns,
    C8 extends keyof TableColumns,
    C9 extends keyof TableColumns,
  >(
    column1: C1,
    column2: C2,
    column3: C3,
    column4: C4,
    column5: C5,
    column6: C6,
    column7: C7,
    column8: C8,
    column9: C9,
  ): UpdateQuery<
    Config,
    T,
    GetReturning<TableColumns, C1> &
      GetReturning<TableColumns, C2> &
      GetReturning<TableColumns, C3> &
      GetReturning<TableColumns, C4> &
      GetReturning<TableColumns, C5> &
      GetReturning<TableColumns, C6> &
      GetReturning<TableColumns, C7> &
      GetReturning<TableColumns, C8> &
      GetReturning<TableColumns, C9>
  >;
  returning<
    C1 extends keyof TableColumns,
    C2 extends keyof TableColumns,
    C3 extends keyof TableColumns,
    C4 extends keyof TableColumns,
    C5 extends keyof TableColumns,
    C6 extends keyof TableColumns,
    C7 extends keyof TableColumns,
    C8 extends keyof TableColumns,
    C9 extends keyof TableColumns,
    C10 extends keyof TableColumns,
  >(
    column1: C1,
    column2: C2,
    column3: C3,
    column4: C4,
    column5: C5,
    column6: C6,
    column7: C7,
    column8: C8,
    column9: C9,
    column10: C10,
  ): UpdateQuery<
    Config,
    T,
    GetReturning<TableColumns, C1> &
      GetReturning<TableColumns, C2> &
      GetReturning<TableColumns, C3> &
      GetReturning<TableColumns, C4> &
      GetReturning<TableColumns, C5> &
      GetReturning<TableColumns, C6> &
      GetReturning<TableColumns, C7> &
      GetReturning<TableColumns, C8> &
      GetReturning<TableColumns, C9> &
      GetReturning<TableColumns, C10>
  >;
  returning(...columnNames: any[]) {
    return new UpdateQuery(this.queryExecutor, columnNames, this.table, 'ROWS', [
      ...this.tokens,
      new StringToken(`RETURNING`),
      new SeparatorToken(
        `,`,
        columnNames.map((alias) => {
          const column = (this.table as any)[alias] as AnyColumn;

          if (alias !== column.getSnakeCaseName()) {
            return new StringToken(`${wrapQuotes(column.getSnakeCaseName())} ${wrapQuotes(alias)}`);
          } else {
            return new StringToken(wrapQuotes(column.getSnakeCaseName()));
          }
        }),
      ),
    ]) as any;
  }

  /** @internal */
  toTokens() {
    return this.tokens;
  }
}

export const makeUpdate =
  <Config extends DbConfig>(queryExecutor: QueryExecutorFn) =>
  <T extends AnyTable>(table: T) => {
    const getTableStringToken = (table: AnyTable) => {
      if (table.getOriginalName()) {
        return new StringToken(
          `${wrapQuotes(table.getOriginalName())} ${wrapQuotes(table.getName())}`,
        );
      }

      return new StringToken(wrapQuotes(table.getName()));
    };

    return {
      set(
        values: T extends Table<Config, any, infer Columns>
          ? {
              [K in keyof Columns]?: Columns[K] extends Column<
                Config,
                any,
                any,
                infer DataType,
                infer IsNotNull,
                any,
                any
              >
                ? IsNotNull extends true
                  ?
                      | GetResultType<Config, DataType>
                      | Expression<Config, DataType, boolean, any>
                      | Expression<Config, GetResultType<Config, DataType>, boolean, any>
                  :
                      | GetResultType<Config, DataType>
                      | GetResultType<Config, 'Null'>
                      | Expression<Config, DataType | GetResultType<Config, 'Null'>, boolean, any>
                      | Expression<
                          Config,
                          GetResultType<Config, DataType> | GetResultType<Config, 'Null'>,
                          boolean,
                          any
                        >
                : never;
            }
          : never,
      ): UpdateQuery<Config, T, number> {
        const keys = Object.keys(values);

        return new UpdateQuery(queryExecutor, [], table, 'AFFECTED_COUNT', [
          new StringToken(`UPDATE`),
          getTableStringToken(table),
          new StringToken(`SET`),
          new SeparatorToken(
            `,`,
            keys.map((key) => {
              const column = (table as any)[key] as AnyColumn;
              const value = (values as any)[key];

              return new CollectionToken([
                new StringToken(wrapQuotes(column.getSnakeCaseName())),
                new StringToken(`=`),
                value && typeof value === `object` && 'toTokens' in value
                  ? value.toTokens()
                  : new ParameterToken(value),
              ]);
            }),
          ),
        ]);
      },
    };
  };
