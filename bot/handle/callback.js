const path = require("path");
const fs = require("fs");
exports.callback = function({
    bot
}) {
    if (bot._callbackHandler) {
        bot.removeListener("callback_query", bot._callbackHandler);
    }
    const registryPath = path.join(__dirname, "../../scripts/cmds/aryan/callback.json");
    let allowedPrefixes = [];
    try {
        const raw = fs.readFileSync(registryPath, "utf8");
        allowedPrefixes = JSON.parse(raw);
    } catch (err) {
        console.error(`Error reading or parsing callback.json at ${registryPath}: ${err.message}`);
        return;
    }
    const parseCallbackData = data => {
        if (typeof data !== "string" || !data) {
            return null;
        }
        const parts = data.split("_");
        if (parts.length > 1) {
            return {
                prefix: parts[0],
                action: parts.slice(1).join("_"),
                rawData: data
            };
        }
        return null;
    };
    bot._callbackHandler = async query => {
        if (!query || !query.data) {
            return;
        }
        const parsed = parseCallbackData(query.data);
        if (!parsed || !allowedPrefixes.includes(parsed.prefix)) {
            console.error(`Invalid or unauthorized callback prefix: ${parsed?.prefix}`);
            return bot.answerCallbackQuery(query.id, {
                text: "Invalid command.",
                show_alert: true
            }).catch(console.error);
        }
        const handlerPath = path.join(__dirname, `../../scripts/cmds/${parsed.prefix}.js`);
        try {
            if (!fs.existsSync(handlerPath)) {
                throw new Error(`Handler file not found: ${handlerPath}`);
            }
            delete require.cache[require.resolve(handlerPath)];
            const handler = require(handlerPath);
            if (typeof handler.onCallback !== "function") {
                throw new Error(`Handler file ${parsed.prefix}.js does not export an onCallback function.`);
            }
            const messageId = query.message?.message_id;
            const chatId = query.message?.chat?.id;
            if (!chatId) {
                throw new Error("Chat ID not found in callback query");
            }
            await handler.onCallback({
                bot,
                callbackQuery: query,
                chatId,
                messageId,
                payload: parsed
            });
            if (!query.answered) {
                await bot.answerCallbackQuery(query.id);
            }
        } catch (err) {
            console.error(`Error executing callback for "${parsed.prefix}" with data "${query.data}":`, err);
            await bot.answerCallbackQuery(query.id, {
                text: "An error occurred. Please try again.",
                show_alert: true
            }).catch(console.error);
        }
    };
    bot.on("callback_query", bot._callbackHandler);
};
