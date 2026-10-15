const path = require("path");
const fs = require("fs");
exports.reaction = async function({
    bot,
    msg,
    chatId
}) {
    if (!msg.reaction) {
        return;
    }
    const {
        reaction,
        message_id: messageId,
        user
    } = msg;
    const reactionsDir = path.join(__dirname, "../../scripts/events/reactions");
    if (!fs.existsSync(reactionsDir)) {
        console.warn(`[WARNING] Reaction event directory not found: ${reactionsDir}`);
        return;
    }
    const files = fs.readdirSync(reactionsDir).filter(file => file.endsWith(".js"));
    for (const file of files) {
        const fullPath = path.join(reactionsDir, file);
        try {
            const handler = require(fullPath);
            if (handler.nix && handler.nix.type && handler.nix.type.includes("reaction")) {
                await handler.onStart({
                    bot,
                    chatId,
                    messageId,
                    user,
                    reaction,
                    msg
                });
            }
        } catch (err) {
            console.error(`[ERROR] Failed to load or execute reaction handler ${file}:`, err);
        }
    }
};
