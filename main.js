const fs = require("fs");
const path = require("path");
const {
    spawn
} = require("child_process");
const https = require("https");
const configPath = path.join(process.cwd(), "config.json");
const restartLogPath = path.join(process.cwd(), "restart.log");
if (!fs.existsSync(configPath)) {
    console.error(`\u001b[31m[ERROR]\u001b[0m config.json not found in the root directory.`);
    process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
global.config = config;
global.teamnix = {
    cmds: new Map(),
    cooldowns: new Map(),
    onReply: new Map(),
    events: new Map()
};
global.vip = {
    uid: global.config.vip || []
};
const cmdsDir = path.join(process.cwd(), "scripts", "cmds");
const eventsDir = path.join(process.cwd(), "scripts", "events");
console.log(`\u001b[36m${"─".repeat(40)}`);
console.log(`\u001b[1m\u001b[95mLOADING COMMANDS\u001b[0m`);
console.log(`\u001b[36m${"─".repeat(40)}\u001b[0m`);
const loadCommands = () => {
    const commands = new Map();
    if (global.config.loadCmds === false) {
        console.log(`\u001b[33m[SKIP]\u001b[0m Command loading is disabled in config.json`);
        return commands;
    }
    if (!fs.existsSync(cmdsDir)) {
        console.warn(`\u001b[33m[WARNING]\u001b[0m Cmds directory not found: ${cmdsDir}`);
        return commands;
    }
    const files = fs.readdirSync(cmdsDir).filter(file => file.endsWith(".js"));
    for (const file of files) {
        try {
            const cmd = require(path.join(cmdsDir, file));
            if (cmd.nix?.name) {
                commands.set(cmd.nix.name.toLowerCase(), cmd);
                console.log(`\u001b[32m[COMMAND]\u001b[0m Loaded ${file}`);
            } else {
                console.warn(`\u001b[33m[SKIP]\u001b[0m Missing nix.name in ${file}`);
            }
        } catch (err) {
            console.error(`\u001b[31m[ERROR]\u001b[0m Failed to load ${file}: ${err.message}`);
        }
    }
    return commands;
};
global.teamnix.cmds = loadCommands();
console.log(`\u001b[36m${"─".repeat(40)}`);
console.log(`\u001b[1m\u001b[95mLOADING EVENTS\u001b[0m`);
console.log(`\u001b[36m${"─".repeat(40)}\u001b[0m`);
const loadEvents = () => {
    if (global.config.loadEvents === false) {
        console.log(`\u001b[33m[SKIP]\u001b[0m Event loading is disabled in config.json`);
        return;
    }
    if (!fs.existsSync(eventsDir)) {
        console.warn(`\u001b[33m[WARNING]\u001b[0m Events directory not found: ${eventsDir}`);
        return;
    }
    const files = fs.readdirSync(eventsDir).filter(file => file.endsWith(".js"));
    for (const file of files) {
        try {
            require(path.join(eventsDir, file));
            console.log(`\u001b[32m[EVENT]\u001b[0m Loaded ${file}`);
        } catch (err) {
            console.error(`\u001b[31m[ERROR]\u001b[0m Failed to load event ${file}: ${err.message}`);
        }
    }
};
loadEvents();
console.log(`\u001b[36m${"─".repeat(40)}`);
console.log(`\u001b[1m\u001b[95mADMIN INFO\u001b[0m`);
console.log(`\u001b[36m${"─".repeat(40)}\u001b[0m`);
const adminInfoUrl = "https://raw.githubusercontent.com/RSF-ARYAN/stuffs/refs/heads/main/raw/ck.txt";
https.get(adminInfoUrl, res => {
    let data = "";
    res.on("data", chunk => (data += chunk));
    res.on("end", () => {
        const lines = data.trim().split("\n");
        const filtered = lines.filter(line => !line.includes("Server running on port"));
        console.log(`\u001b[36m${filtered.join("\n")}\u001b[36m`);
    });
}).on("error", err => {
    console.error(`\u001b[31m[ERROR]\u001b[36m Could not fetch admin info: ${err.message}`);
});
let childProc = null;
const startBot = entryFile => {
    if (childProc) {
        childProc.kill();
        console.log(`\u001b[33m[PROCESS]\u001b[0m Terminated previous instance of ${entryFile}`);
    }
    try {
        console.log(`\u001b[32m[PROCESS]\u001b[0m Starting bot...`);
        require(path.join(__dirname, entryFile));
        if (fs.existsSync(restartLogPath)) {
            const restartInfo = JSON.parse(fs.readFileSync(restartLogPath, "utf8"));
            fs.unlinkSync(restartLogPath);
            const startTime = process.hrtime();
            const uptimeSec = (startTime[0] * 1e9 + startTime[1] - restartInfo.restartTime[0] * 1e9 - restartInfo.restartTime[1]) / 1e9;
            setTimeout(() => {
                bot.sendMessage(restartInfo.chatId, `✅ | Bot restarted\\n⏰ | Time: ${uptimeSec.toFixed(3)}s`);
            }, 2000);
        }
    } catch (err) {
        console.error(`\u001b[31m[PROCESS ERROR]\u001b[0m Failed to start bot: ${err.message}`);
    }
};
startBot("bot/main.js");
module.exports = {
    cmds: global.teamnix.cmds
};
