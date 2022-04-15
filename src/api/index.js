const axios = require('axios')
const {config: {cookie, params, barkKey}} = require('../config');
const querystring = require('querystring');

axios.interceptors.request.use((config) => {
    for (let key in params) {
        config.headers['ddmc-' + key.replace(/_/g, '-')] = params[key]
    }
    config.headers['user-agent'] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'
    config.headers['Cookie'] = cookie

    return config
})

axios.interceptors.response.use((response) => {
    if (response.data.code === 0 || response.data.code === 200) {
        return response.data.data
    } else if (response.data.code === 6001) {
        return response.data
    } else {
        return Promise.reject(response.data.msg)
    }
})
// 获取购物车数据
exports.getCartList = async () => {
    return await axios.get('https://maicai.api.ddxq.mobi/cart/index', {
        params
    });

}
// 获取配送时间
exports.getReserveTime = async (products) => {
    let formData = querystring.stringify({
        ...params,
        products: `[${JSON.stringify(products)}]`
    })
    const data = await axios.post('https://maicai.api.ddxq.mobi/order/getMultiReserveTime', formData);
    return data[0].time[0]
}
// 检查购物车
exports.checkOrder = async (products) => {
    let raw = {...products[0]}
    let arr = []
    raw.products.forEach(item => {
        const {
            id, category_path, count, price, total_price: total_money, instant_rebate_money, activity_id,
            conditions_num, product_type, sizes, type, total_origin_price: total_origin_money, price_type,
            sub_list, order_sort, origin_price
        } = item
        arr.push({
            id,
            category_path,
            count,
            price,
            total_money,
            instant_rebate_money,
            activity_id,
            conditions_num,
            product_type,
            sizes,
            type,
            total_origin_money,
            price_type,
            sub_list,
            order_sort,
            origin_price
        })
    })
    raw.products = arr
    let formData = querystring.stringify({
        ...params,
        packages: `[${JSON.stringify(raw)}]`
    })
    return await axios.post('https://maicai.api.ddxq.mobi/order/checkOrder', formData)
}
// 创建订单
exports.addNewOrder = async (checkOrder, products, parent_order_sign, reserveTime) => {
    const {total_money} = checkOrder;
    const {discount_freight_money, freight_money, freight_real_money} = checkOrder.freights[0].freight
    const {start_timestamp: reserved_time_start, end_timestamp: reserved_time_end} = reserveTime
    let packages = [{
        ...products[0],
        "eta_trace_id": "",
        "reserved_time_start": reserved_time_start,
        "reserved_time_end": reserved_time_end,
        "soon_arrival": "",
        "first_selected_big_time": 0
    }]
    const obj = {
        payment_order: {
            "reserved_time_start": reserved_time_start,
            "reserved_time_end": reserved_time_end,
            "price": total_money,
            "freight_discount_money": discount_freight_money,
            "freight_money": freight_money,
            "order_freight": freight_real_money,
            "parent_order_sign": parent_order_sign,
            "product_type": 1,
            "address_id": params.address_id,
            "form_id": "e431451d296c48a4b52713e8dbd174b6",
            "receipt_without_sku": 1,
            "pay_type": params.pay_type,
            "vip_money": "",
            "vip_buy_user_ticket_id": "",
            "coupons_money": "",
            "coupons_id": ""
        },
        "packages": packages
    }
    let formData = querystring.stringify({
        ...params,
        package_order: JSON.stringify(obj)
    })
    return await axios.post('https://maicai.api.ddxq.mobi/order/addNewOrder', formData)
}
// 全选购物车
exports.allCheck = async () => {
    let paramsData = querystring.stringify({
        ...params,
        is_check: 1
    })
    return await axios.post('https://maicai.api.ddxq.mobi/cart/allCheck', paramsData)
}
// 发送Bark消息
exports.sendBark = async (title = '叮咚买菜', msg) => {
    if (barkKey) {
        return await axios.post('https://api.day.app/push', {
            device_key: barkKey,
            title,
            body: msg,
            url: 'dingdongneighborhood://'
        });
    }
    return true;

};
