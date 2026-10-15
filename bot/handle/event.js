const moment = require("moment-timezone");
exports.event = async function({
    bot,
    msg,
    chatId,
    message
}) {
    const startMs = Date.now();
    const now = moment.tz(global.config.timeZone || "Asia/Dhaka");
    const time = now.format("HH:mm:ss");
    const date = now.format("DD/MM/YYYY");
    const day = now.format("dddd");
    const year = now.format("YYYY");
    const {
        events
    } = global.teamnix;
    const {
        devMode
    } = global.config;
    chatId = chatId || String(msg.chat.id);
    if (msg.new_chat_members || msg.left_chat_member) {
        const eventType = msg.new_chat_members ? "welcome" : "leave";
        for (const [name, handler] of events.entries()) {
            if (handler.nix.type.includes(eventType)) {
                try {
                    const ctx = {
                        bot,
                        message,
                        msg,
                        chatId
                    };
                    await handler.onStart(ctx);
                    if (devMode) {
                        const execMs = Date.now() - startMs;
                        const blue = "\u001b[34m";
                        const cyan = "\u001b[36m";
                        const reset = "\u001b[0m";
                        const divider = `${blue}${"─".repeat(40)}${reset}`;
                        const logMsg = `
${divider}
Type            : ${cyan}${eventType}${reset}
Time            : ${cyan}${time}${reset}
Date            : ${cyan}${date}${reset}
Day             : ${cyan}${day}${reset}
Year            : ${cyan}${year}${reset}
Chat ID         : ${cyan}${chatId}${reset}
Execution Time  : ${cyan}${execMs}ms${reset}
${divider}
            `.trim();
                        console.log(logMsg);
                    }
                } catch (err) {
                    console.error(`\\x1b[31m[ Event Error ] ${handler.nix.name}:\\x1b[0m`, err);
                }
            }
        }
        return;
    }
};
