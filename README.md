## 这是基于 typesciprt 的 indexedDB 的数据库的操作函数

本项目基于 typescript 封装了 indexedDB 基本操作函数，并返回 Promise 操作

### 实例

```ts
import Database from 'ts-database';

// 创建数据库,并创建一个用户表，设置主键为id
const database = new Database({
    name: 'TS_STORE',
    version: 1,
    modules: [{ name: 'users', primary: 'id', columns: [] }]
});

// 造数据
const user = {
    id: 'user0001',
    name: 'XY笔记',
    updatedAt: new Date().getTime()
};

// 创建用户
const createUser = () => {
    console.log('创建用户');
    return database.module('users').then((model) => {
        return model.bulkCreate([user]).then((result) => {
            console.error('创建成功', result);
        });
    });
};

createUser();
```

### 接口文档

#### 1、批量保存，存在更新

```js
moduel.bulkCreate();
```

#### 2、数据更新

```js
moduel.update();
```

#### 3、批量数据拉取

```js
moduel.findAll();
```

#### 4、根据主键拉取

```js
moduel.findByPk();
```

#### 5、 关键词搜索

```js
moduel.findAllLike();
```

#### 6、 删除

```js
moduel.destory();
```

#### 7、 表长度

```js
moduel.count();
```

#### 8、 清表

```js
moduel.clear();
```

#### 9、 数据库备份

```js
database.backup();
```

#### 10、 数据库恢复

```js
database.recovery();
```
