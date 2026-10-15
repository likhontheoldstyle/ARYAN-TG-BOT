const {
    cmds
} = global.teamnix;
exports.image = async function({
    bot,
    msg,
    chatId,
    message
}) {
    if (!msg.photo && !msg.sticker) {
        return;
    }
    const {
        from
    } = msg;
    const userId = String(from.id);
    const isBotAdmin = global.config.admin.includes(userId);
    for (const cmd of cmds.values()) {
        if (cmd.nix && cmd.nix.onImage) {
            try {
                await cmd.onImage({
                    bot,
                    message,
                    msg,
                    chatId,
                    userId,
                    isBotAdmin
                });
            } catch (err) {
                console.error(`Error in image handler for command "${cmd.nix.name}": ${err.message}`);
            }
        }
    }
};
