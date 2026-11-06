const Base64 = Object.freeze({
    encode(string) {
        return Buffer.from(string, "utf-8").toString("base64");
    },
    decode(code) {
        return Buffer.from(code, "base64").toString("utf-8");
    }
});

export default Base64;
