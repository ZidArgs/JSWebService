export function resolveRequestBody(request) {
    return new Promise(function(resolve, reject) {
        const parts = [];
        request.on("error", (err) => {
            reject(err);
        }).on("data", (chunk) => {
            parts.push(chunk);
        }).on("end", async () => {
            const result = Buffer.concat(parts);
            resolve(result);
        });
    });
}
