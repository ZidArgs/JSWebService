import crypto from "crypto";

const APP_ID_CNT = new Map();

export function uuid4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

export function uniqueKey(len = 32) {
    let res = "";
    const rnd = crypto.getRandomValues(new Uint8Array(len));
    for (const v of rnd) {
        res += v.toString(36).slice(-1);
    }
    return res;
}

export function appUID(prefix = "unique-id", len = 10) {
    const fill = new Array(len).join("0");
    if (APP_ID_CNT.has(prefix)) {
        const cnt = APP_ID_CNT.get(prefix) + 1;
        APP_ID_CNT.set(prefix, cnt);
        const str = `${fill}${cnt}`.slice(-len);
        return `${prefix}-${str}`;
    } else {
        APP_ID_CNT.set(prefix, 0);
        return `${prefix}-${fill}0`;
    }
}
