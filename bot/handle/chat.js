const moment = require("moment-timezone");
exports.chat = async function({
    bot,
    message,
    msg,
    chatId
}) {
    const {
        from,
        chat,
        text
    } = msg;
    if (global.config.devMode) {
        const now = moment.tz(global.config.timeZone || "Asia/Dhaka");
        const time = now.format("HH:mm:ss");
        const date = now.format("DD/MM/YYYY");
        const blue = "\u001b[34m";
        const cyan = "\u001b[36m";
        const reset = "\u001b[0m";
        const divider = `${blue}${"─".repeat(40)}${reset}`;
        const logMsg = `
${divider}
Message         : ${cyan}${text}${reset}
Chat ID         : ${cyan}${chatId}${reset}
Chat Type       : ${cyan}${chat.type}${reset}
Sender ID       : ${cyan}${from.id}${reset}
Sender Name     : ${cyan}${from.first_name}${reset}
Time            : ${cyan}${time}${reset}
Date            : ${cyan}${date}${reset}
${divider}
    `.trim();
        console.log(logMsg);
    }
};
