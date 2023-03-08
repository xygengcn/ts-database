/**
 * 列属性
 */
export interface IDatabaseModulesColumn {
  name: string; // 索引名称
  index?: string | string[]; // 字段名
  attributes?: {
    multiEntry?: boolean; // multiEntry表示是否为keyPath字段的每一项建立一条索引数据。
    unique?: boolean; // unique表示keyPath字段的数据是否是唯一的
  };
}

export interface IDatabaseModules {
  name: string;
  primary: string;
  columns: Array<IDatabaseModulesColumn>;
}

export type DBDatabaseEventType =
  | 'bulkCreate'
  | 'update'
  | 'findAll'
  | 'findAllLike'
  | 'findByPk'
  | 'clear'
  | 'count'
  | 'drop'
  | 'destory';
export type DBDatabaseEvent = (
  event: DBDatabaseEventType,
  content: { store: IDBObjectStore; module: IDatabaseModules; data?: any }
) => void;


/**
 * 数据库模型
 */
export interface IDatabase {
  name: string; // 数据库名
  version: number; // 版本号
  modules: Record<string, IDatabaseModules>;
  data: Record<string, Array<any>>;
}