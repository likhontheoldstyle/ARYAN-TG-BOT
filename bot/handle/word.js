const {
    cmds
} = global.teamnix;
const fs = require("fs");
const path = require("path");
exports.word = async function({
    bot,
    message,
    msg,
    chatId
}) {
    if (!msg || !msg.text) {
        return;
    }
    const text = msg.text.trim();
    if (text.startsWith(global.config.prefix)) {
        return;
    }
    const words = text.split(/\s+/);
    if (words.length > 0) {
        const firstWord = words[0].toLowerCase();
        for (const cmd of cmds.values()) {
            if (cmd.nix.prefix === false || cmd.nix.prefix === "both") {
                if (cmd.nix.name.toLowerCase() === firstWord) {
                    return;
                }
                if (cmd.nix.aliases && Array.isArray(cmd.nix.aliases) && cmd.nix.aliases.map(a => a.toLowerCase()).includes(firstWord)) {
                    return;
                }
            }
            if (cmd.nix.name.toLowerCase() === firstWord) {
                return;
            }
            if (cmd.nix.aliases && Array.isArray(cmd.nix.aliases) && cmd.nix.aliases.map(a => a.toLowerCase()).includes(firstWord)) {
                return;
            }
        }
    }
    for (const cmd of cmds.values()) {
        if (cmd.nix && cmd.nix.keyword) {
            const keywords = Array.isArray(cmd.nix.keyword) ? cmd.nix.keyword : [cmd.nix.keyword];
            const regex = new RegExp(`\\\\b(${keywords.join("|")})\\\\b`, "i");
            if (regex.test(msg.text)) {
                const args = text.split(/\s+/);
                try {
                    await cmd.onWord({
                        bot,
                        message,
                        msg,
                        chatId,
                        args
                    });
                } catch (err) {
                    console.error(`Error in event handler for command "${cmd.nix.name}": ${err.message}`);
                }
            }
        }
    }
};
