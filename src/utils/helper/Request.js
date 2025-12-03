export async function resolveRequestBody(request) {
    const result = await getRequestBody(request);
    if (result.length) {
        try {
            return JSON.parse(result);
        } catch {
            return result;
        }
    }
    return result;
}

function getRequestBody(request) {
    return new Promise(function(resolve, reject) {
        const res = [];
        request.on("error", (err) => {
            reject(err);
        }).on("data", (chunk) => {
            res.push(chunk);
        }).on("end", async () => {
            resolve(res.join(""));
        });
    });
}
