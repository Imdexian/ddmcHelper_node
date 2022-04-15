const {getReserveTime, getCartList, addNewOrder, checkOrder, allCheck, sendBark} = require('./api');
const schedule = require('node-schedule');
let productList = [], orderSign = '', availableTime = [], gap = 10, count = 1;


scheduleJob('45 29 08 * * *');

scheduleJob('45 59 05 * * *');


// 定时打开 疯狗模式 0.5秒一次
function scheduleJob(cronTime) {
    schedule.scheduleJob(cronTime,()=> {
        console.log(` ${cronTime} start`);
        gap = 0.5;
        // 5分钟后关闭疯狗模式
        setInterval(()=>{
            gap = 10;
        },5 * 60*1000);
    })
}

stock().catch(e => { console.log(e) })
async function stock() {
    // 全选
    await allCheck()
    // 获取购物车列表
    const {new_order_product_list, parent_order_info: {parent_order_sign}} = await getCartList();
    if (new_order_product_list.length === 0) {
        console.log(`购物车为空或无可用商品，${gap}秒后重新获取`);
        setTimeout(() => {
            stock()
        }, gap * 1000)
        return
    }
    productList = new_order_product_list;
    orderSign = parent_order_sign;
    await reserveTime()
}

// 获取可用时间
async function reserveTime() {
    const {times} = await getReserveTime(productList[0]['products']);
    availableTime = times.filter(item => {
        return !item.fullFlag;
    })
    if (availableTime.length === 0) {
        console.log('暂无可预约时间，10秒后重新获取');
        // 10秒后重新查询
        setTimeout(() => {
            reserveTime()
        }, gap * 1000)
        return;
    }
    console.log('可预约时间：', availableTime);
    await sendBark('运力监控', '已有可预约时间，请尽快预约');
    await check();
}

// 下单
async function check() {
    const {order} = await checkOrder(productList);
    const {code, msg} = await addNewOrder(order, productList, orderSign, availableTime[0]);
    if (code === 0 || code === 200 || code === 6001) {
        console.log(`第${count}次执行,下单成功`);
        await sendBark('下单成功', '请在5分钟内完成支付');
        return false;
    } else {
        console.log(`第${count}次执行,下单失败：${msg}`);
        setTimeout(() => {
            check();
            count++;
        }, gap * 1000);
    }
}

// 归档
// async function start() {
//     let gap = 0.5;
//     const {new_order_product_list,parent_order_info:{parent_order_sign}} = await getCartList();
//     if (new_order_product_list.length === 0) {
//         console.log('购物车为空，请先添加商品');
//         return;
//     }
//     const { order } = await checkOrder(new_order_product_list);
//     const reserveTime = await getReserveTime(new_order_product_list[0]['products']);
//     console.log('发现预约时间：', reserveTime);
//     const { code,msg } = await addNewOrder(order,new_order_product_list,parent_order_sign,reserveTime)
//     if (code === 0 || code ===  200 || code === 6001) {
//         console.log(`第${count}次执行,下单成功`);
//         await sendBark('下单成功', msg);
//         return false;
//     } else {
//         console.log(`第${count}次执行,下单失败`);
//         // 间隔
//         if (count > 30 && count < 50) {
//             gap = 1;
//         } else if (count >= 50 && count < 100) {
//             gap = 3;
//         } else if (count >= 100) {
//            gap = 10;
//         }
//         setTimeout(() => {
//             start();
//             count++;
//         }, gap * 1000);
//     }
//     console.log(code, msg)
// }
//

