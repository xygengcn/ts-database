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
    return database.module('users').then((model) => {
        return model.bulkCreate([user]).then((result) => {
            console.log('创建成功', result);
        });
    });
};

createUser();

database.backup().then(result => {
    console.log("备份成功", result)


    // recover 
    const data = {
        ...result,
        data: {
            users: [{
                id: 'user0001',
                name: 'XY笔记',
                updatedAt: new Date().getTime()
            }, {
                id: 'user0002',
                name: 'XY笔记',
                updatedAt: new Date().getTime()
            }]
        }
    }

    database.recovery(data).then(result => {
        console.log("恢复成功", result)
    }).catch(e => {
        console.log("恢复失败", e)

    })
})
