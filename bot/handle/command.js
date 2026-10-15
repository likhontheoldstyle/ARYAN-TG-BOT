const moment = require("moment-timezone");
const path = require("path");
const fs = require("fs");
const textsPath = path.join(__dirname, "../../languages/texts.txt");
const texts = {};
try {
    const raw = fs.readFileSync(textsPath, "utf8");
    const lines = raw.split("\n");
    lines.forEach(line => {
        const [key, ...rest] = line.split("=");
        if (key && rest.length) {
            texts[key.trim()] = rest.join("=").trim();
        }
    });
} catch (err) {
    console.error("Error loading texts.txt:", err);
    process.exit(1);
}
const loadPrefixes = () => {
    const prefixesPath = path.join(__dirname, "../../database/prefixes.json");
    if (!fs.existsSync(prefixesPath)) {
        fs.writeFileSync(prefixesPath, JSON.stringify({}));
        return {};
    }
    const raw = fs.readFileSync(prefixesPath, "utf8");
    return JSON.parse(raw);
};
exports.command = async function({
    bot,
    message,
    msg,
    chatId,
    args
}) {
    if (typeof msg.text !== "string") {
        return;
    }
    const text = msg.text;
    const {
        from,
        chat
    } = msg;
    const {
        admin: adminIds,
        symbols,
        devMode
    } = global.config;
    const {
        cmds,
        cooldowns
    } = global.teamnix;
    const userId = String(from.id);
    const userIdNum = from.id;
    const prefixes = loadPrefixes();
    const prefix = prefixes[chatId] || global.config.prefix;
    const hasPrefix = text.startsWith(prefix);
    const now = moment.tz(global.config.timeZone || "Asia/Dhaka");
    const time = now.format("HH:mm:ss");
    const date = now.format("DD/MM/YYYY");
    const day = now.format("dddd");
    const year = now.format("YYYY");
    const nowMs = Date.now();
    const {
        groups: groupsCfg,
        inbox: inboxCfg
    } = global.config;
    const isGroup = ["group", "supergroup"].includes(chat.type);
    const isPrivate = chat.type === "private";
    if (isPrivate) {
        if (!inboxCfg.enabled) {
            if (devMode) {
                console.log(`[DEBUG] Ignoring command from disabled private chat: ${chatId}`);
            }
            return;
        }
    }
    if (isGroup) {
        if (groupsCfg.whitelist) {
            if (!groupsCfg.list.includes(String(chatId))) {
                if (devMode) {
                    console.log(`[DEBUG] Ignoring command from non-whitelisted group: ${chatId}`);
                }
                return;
            }
        } else {
            if (groupsCfg.list.includes(String(chatId))) {
                if (devMode) {
                    console.log(`[DEBUG] Ignoring command from blacklisted group: ${chatId}`);
                }
                return;
            }
        }
    }
    const words = hasPrefix ? text.slice(prefix.length).trim().split(/\s+/) : text.trim().split(/\s+/);
    const cmdName = words.shift()?.toLowerCase?.();
    if (!cmdName) {
        if (hasPrefix) {
            return message.reply(texts.emptyCommand.replace("{prefix}", prefix));
        }
        return;
    }
    let cmd = cmds.get(cmdName);
    if (!cmd) {
        aliasSearch: for (const c of cmds.values()) {
            if (c.nix && c.nix.aliases && c.nix.aliases.includes(cmdName)) {
                cmd = c;
                break aliasSearch;
            }
        }
    }
    if (!cmd) {
        if (hasPrefix) {
            return message.reply(texts.commandNotFound.replace("{commandName}", cmdName));
        }
        return;
    }
    const prefixMode = cmd.nix.prefix;
    if (prefixMode === false && !hasPrefix) {
        return;
    }
    const name = cmd.nix.name.toLowerCase();
    const cmdArgs = words;
    const showUsage = () => {
        if (!cmd.nix.guide) {
            return;
        }
        let usageText = `${symbols} Usages:\\n\\n`;
        const prefixStr = cmd.nix.prefix === false ? prefix : "";
        if (Array.isArray(cmd.nix.guide)) {
            usageText += cmd.nix.guide.map(line => `${prefixStr}${cmd.nix.name} ${line}`).join("\n");
        } else {
            usageText += `${prefixStr}${cmd.nix.name} ${cmd.nix.guide}`;
        }
        if (cmd.nix.description) {
            usageText += `\\n- ${cmd.nix.description}`;
        }
        return message.reply(usageText, {
            parse_mode: "Markdown"
        });
    };
    const isBotAdmin = adminIds.includes(userId);
    const isVip = global.vip?.uid?.includes?.(userId);
    const role = cmd.nix.role || 0;
    if (devMode) {
        console.log(`[DEBUG] Checking access for command "${name}". User ID: ${userId}. Required Role: ${role}. Is Bot Admin: ${isBotAdmin}`);
    }
    if (role === 2) {
        if (!isBotAdmin) {
            return message.reply(texts.notBotAdmin.replace("{commandName}", cmd.nix.name));
        }
    } else if (role === 1) {
        if (!isBotAdmin) {
            if (isGroup) {
                try {
                    const member = await bot.getChatMember(chatId, userId);
                    if (!(member.status === "administrator" || member.status === "creator")) {
                        return message.reply(texts.notGroupAdmin.replace("{commandName}", cmd.nix.name));
                    }
                } catch (err) {
                    return message.reply(texts.adminVerificationFailed);
                }
            } else {
                return message.reply(texts.groupOnly.replace("{commandName}", cmd.nix.name));
            }
        }
    } else if (role === 3) {
        if (!isBotAdmin && !isVip) {
            return message.reply(texts.notVip.replace("{commandName}", cmd.nix.name));
        }
    }
    if (!isBotAdmin) {
        if (!cooldowns.has(cmd.nix.name)) {
            cooldowns.set(cmd.nix.name, new Map());
        }
        const userCooldowns = cooldowns.get(cmd.nix.name);
        const cooldownMs = (cmd.nix.cooldown || 1) * 1000;
        if (userCooldowns.has(userId)) {
            const lastUsed = userCooldowns.get(userId);
            const timeLeft = Math.ceil((lastUsed + cooldownMs - nowMs) / 1000);
            if (nowMs < lastUsed + cooldownMs) {
                return message.reply(texts.cooldown.replace("{timeLeft}", timeLeft).replace("{commandName}", name));
            }
        }
        userCooldowns.set(userId, nowMs);
    }
    try {
        const sendStickerReply = sticker => {
            bot.sendSticker(chatId, sticker, {
                reply_to_message_id: message.messageID
            });
        };
        const ctx = {
            bot,
            message,
            msg,
            chatId,
            args: cmdArgs,
            type: isBotAdmin ? "admin" : "anyone",
            userId: userIdNum,
            usages: showUsage,
            react: sendStickerReply
        };
        await cmd.onStart(ctx);
        if (devMode) {
            const execMs = Date.now() - nowMs;
            const blue = "\u001b[34m";
            const cyan = "\u001b[36m";
            const reset = "\u001b[0m";
            const divider = `${blue}${"─".repeat(40)}${reset}`;
            const logMsg = `
${divider}
Command         : ${cyan}${name}${reset}
Time            : ${cyan}${time}${reset}
Date            : ${cyan}${date}${reset}
Day             : ${cyan}${day}${reset}
Year            : ${cyan}${year}${reset}
Sender ID       : ${cyan}${userId}${reset}
Execution Time  : ${cyan}${execMs}ms${reset}
${divider}
      `.trim();
            console.log(logMsg);
        }
    } catch (err) {
        console.error(`\\x1b[31m[Error executing command "${name}"]\\x1b[0m:`, err);
        return message.reply(texts.commandExecutionError.replace("{commandName}", cmd.nix.name).replace("{errorMessage}", err.message));
    }
};
