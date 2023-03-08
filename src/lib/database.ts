/**
 * indexeddb数据库原型
 */

import { DBDatabaseModule } from './database-module';
import { DBDatabaseEvent, IDatabase, IDatabaseModules } from './type';

export interface IDatabaseOptions {
    name: string;
    version: number;
    modules: IDatabaseModules[];
    event?: DBDatabaseEvent; // 事件回调
}

export class Database {
    // 数据库名
    private databaseName!: string;

    // 数据库版本
    private databaseVersion!: number;

    // 数据库模型
    private databaseModules!: Record<string, IDatabaseModules>;

    // 数据库句柄
    private database!: IDBDatabase;

    // 数据库事件
    private databaseEvent: DBDatabaseEvent;

    constructor(options: IDatabaseOptions) {
        this.databaseName = options.name;
        this.databaseVersion = options.version;
        this.databaseEvent = options.event;
        if (!window.indexedDB) {
            throw new Error('浏览器不支持indexedDB');
        } else {
            this.databaseModules = options?.modules.reduce((obj: Record<string, IDatabaseModules>, module) => {
                obj[module.name] = module;
                return obj;
            }, {});
        }
    }

    /**
     * 数据库连接
     */
    private connectDatabase(): Promise<IDBDatabase> {
        if (!window.indexedDB) {
            return Promise.reject('浏览器不支持indexedDB');
        }
        if (this.database) {
            return Promise.resolve(this.database);
        }
        const request = indexedDB.open(this.databaseName, this.databaseVersion);
        return new Promise((resolve, reject) => {
            // 成功连接
            request.onsuccess = (e: Event) => {
                if (request.result) {
                    this.database = request.result;
                    resolve(this.database);
                } else {
                    reject(e);
                }
            };
            // 失败
            request.onerror = (e) => {
                reject(e);
            };

            // 有更新
            request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
                if (request.result) {
                    // 初始化所有表
                    Object.values(this.databaseModules).forEach((module) => {
                        if (!request.result.objectStoreNames.contains(module.name)) {
                            const databasaeModule = request.result.createObjectStore(module.name, {
                                keyPath: module.primary
                            });
                            module.columns.forEach((column) => {
                                if (column.index) {
                                    databasaeModule.createIndex(column.name, column.index, column.attributes || {});
                                }
                            });
                        }
                    });
                    request.transaction.oncomplete = () => {
                        this.database = request.result;
                        resolve(this.database);
                    };
                } else {
                    reject(e);
                }
            };
        });
    }

    /**
     *
     * 获取表连接
     *
     * @param moduleName
     * @returns
     */
    public module(moduleName: string): Promise<DBDatabaseModule> {
        if (!this.databaseModules[moduleName]) {
            return Promise.reject(`数据库未定义${moduleName}`);
        }
        return this.connectDatabase()
            .then((database) => {
                const databaseStore = database.transaction(moduleName, 'readwrite').objectStore(moduleName);
                return new DBDatabaseModule(databaseStore, this.databaseModules[moduleName], this.databaseEvent);
            })
            .catch((e) => {
                return Promise.reject(new Error(`数据库未定义${moduleName}: ${e}`));
            });
    }

    /**
     * 删库
     * @returns
     */
    public drop(): IDBOpenDBRequest {
        return indexedDB.deleteDatabase(this.databaseName);
    }


    /**
     * 备份
     */
    public async backup(): Promise<IDatabase> {
        return this.connectDatabase().then(() => {
            return this.exportData().then(data => {
                return {
                    name: this.databaseName,
                    version: this.databaseVersion,
                    modules: this.databaseModules,
                    data
                }

            })

        })
    }

    /**
     * 恢复
     */
    public recovery(data: IDatabase) {
        if (data.name !== this.databaseName) {
            return Promise.reject("database name is error")
        }
        if (data.version > this.databaseVersion) {
            this.databaseVersion = data.version
        }
        this.databaseModules = data.modules;
        return this.connectDatabase().then(() => {
            return this.importFromJson(data.data)

        })
    }



    /**
      * Export all data from an IndexedDB database
      * @param {IDBDatabase} idbDatabase - to export from
      */
    private exportData(): Promise<Record<string, Array<any>>> {
        return new Promise((resolve, reject) => {
            const exportObject = {};
            const objectStoreNames: string[] = Array.from(new Set(this.database.objectStoreNames as any))
            if (objectStoreNames.length === 0) {
                resolve(exportObject);
            } else {
                const transaction = this.database.transaction(
                    objectStoreNames,
                    'readonly'
                );
                transaction.onerror = (e) => {
                    reject(e);
                };
                objectStoreNames.forEach((storeName) => {
                    const allObjects = [];
                    const cursor = transaction.objectStore(storeName).openCursor();
                    cursor.onsuccess = () => {
                        const result = cursor.result;
                        if (result) {
                            allObjects.push(result.value);
                            result.continue();
                        } else {
                            exportObject[storeName] = allObjects;
                            if (
                                objectStoreNames.length ===
                                Object.keys(exportObject).length
                            ) {
                                resolve(exportObject);
                            }
                        }
                    };
                });
            }
        })

    }

    /**
 * Import data from JSON into an IndexedDB database. This does not delete any existing data
 *  from the database, so keys could clash.
 *
 * Only object stores that already exist will be imported.
 *
 * @param {IDBDatabase} idbDatabase - to import into
 * @param {string} jsonString - data to import, one key per object store
 * @param {function(Object)} cb - callback with signature (error), where error is null on success
 * @return {void}
 */
    private async importFromJson(importObject: Record<string, Array<any>>) {
        return new Promise((resolve, reject) => {
            const objectStoreNamesSet = new Set(this.database.objectStoreNames as any);
            const size = objectStoreNamesSet.size;
            if (size === 0) {
                resolve(true);
            } else {
                const objectStoreNames = Array.from(objectStoreNamesSet) as string[];
                const transaction = this.database.transaction(
                    objectStoreNames,
                    'readwrite'
                );

                // 错误处理
                transaction.onerror = (e) => {
                    reject(e);
                };


                // Delete keys present in JSON that are not present in database
                Object.keys(importObject).forEach((storeName) => {
                    if (!objectStoreNames.includes(storeName)) {
                        delete importObject[storeName];
                    }
                });

                if (Object.keys(importObject).length === 0) {
                    // no object stores exist to import for
                    resolve(true);
                }

                // 循环
                objectStoreNames.forEach((storeName) => {
                    let count = 0;
                    const aux = Array.from(importObject[storeName] || []);
                    if (importObject[storeName] && aux.length > 0) {
                        aux.forEach((toAdd) => {
                            const request = transaction.objectStore(storeName).put(toAdd);
                            request.onsuccess = () => {
                                count++;
                                if (count === importObject[storeName].length) {
                                    // added all objects for this store
                                    delete importObject[storeName];
                                    if (Object.keys(importObject).length === 0) {
                                        // added all object stores
                                        resolve(true);
                                    }
                                }
                            };
                            request.onerror = (event) => {
                                reject(event);
                            };
                        });
                    } else {
                        if (importObject[storeName]) {
                            delete importObject[storeName];
                            if (Object.keys(importObject).length === 0) {
                                // added all object stores
                                resolve(true);
                            }
                        }
                    }
                });
            }
        })
    }
}
