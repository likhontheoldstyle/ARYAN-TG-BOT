const fs = require("fs");
const path = require("path");
const {
    Message
} = require("../bot/custom.js");
exports.listen = async function(bot) {
    const handlersDir = path.join(__dirname, "../bot/handle");
    const files = fs.readdirSync(handlersDir).filter(file => file.endsWith(".js"));
    const handlers = {};
    for (const file of files) {
        const fullPath = path.join(handlersDir, file);
        try {
            delete require.cache[require.resolve(fullPath)];
            const handler = require(fullPath);
            const name = path.basename(file, ".js");
            handlers[name] = handler[name];
        } catch (err) {
            console.error(`[ERROR] Failed to load handler file ${file}:`, err);
        }
    }
    bot.on("message", async msg => {
        try {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            const message = new Message(bot, msg);
            const ctx = {
                bot,
                msg,
                chatId,
                userId,
                message
            };
            if (typeof handlers.chat === "function") {
                await handlers.chat(ctx);
            }
            if (typeof handlers.command === "function") {
                await handlers.command(ctx);
            }
            if (typeof handlers.event === "function") {
                await handlers.event(ctx);
            }
            if (typeof handlers.image === "function") {
                await handlers.image(ctx);
            }
            if (typeof handlers.reply === "function") {
                await handlers.reply(ctx);
            }
            if (typeof handlers.word === "function") {
                await handlers.word(ctx);
            }
        } catch (err) {
            console.error("Error in message handler:", err);
        }
    });
    bot.on("message_reaction", async reaction => {
        try {
            const chatId = reaction.chat.id;
            const ctx = {
                bot,
                msg: reaction,
                chatId
            };
            if (typeof handlers.reaction === "function") {
                await handlers.reaction(ctx);
            }
        } catch (err) {
            console.error("Error in message reaction handler:", err);
        }
    });
    bot.on("callback_query", async query => {
        try {
            const chatId = query.message.chat.id;
            const ctx = {
                bot,
                msg: query.message,
                chatId,
                callbackQuery: query
            };
            if (typeof handlers.callback === "function") {
                await handlers.callback(ctx);
            }
        } catch (err) {
            console.error("Error in callback query handler:", err);
        }
    });
};
