import Database from './lib/index';

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
