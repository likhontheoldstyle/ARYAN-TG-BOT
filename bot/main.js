const fs = require("fs");
const path = require("path");
const {
    loadScripts,
    RESTART_FILE
} = require("./login/loadScripts");
const {
    utils: runUtils
} = require("../func/utils.js");
const configPath = path.join(process.cwd(), "config.json");
const tokenPath = path.join(process.cwd(), "token.txt");
if (!fs.existsSync(configPath) || !fs.existsSync(tokenPath)) {
    console.error("Error: config.json or token.txt not found in the root directory.");
    process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const tokenData = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
global.config = config;
global.token = tokenData;
global.teamnix = {
    cmds: new Map(),
    cooldowns: new Map(),
    replies: new Map(),
    callbacks: new Map(),
    events: new Map()
};
global.scripts = runUtils;
runUtils();
const {
    login
} = require("./login/log");
const bot = login();
if (fs.existsSync(RESTART_FILE)) {
    try {
        const restartInfo = JSON.parse(fs.readFileSync(RESTART_FILE, "utf8"));
        if (restartInfo.chatId) {
            bot.sendMessage(restartInfo.chatId, "✅ Bot restarted successfully.");
        }
    } catch (err) {
        console.error("Failed to send restart confirmation:", err);
    }
    fs.unlinkSync(RESTART_FILE);
}
