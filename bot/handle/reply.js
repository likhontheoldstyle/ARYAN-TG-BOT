exports.reply = async function({
    bot,
    message,
    msg,
    chatId,
    args
}) {
    const {
        replies,
        cmds
    } = global.teamnix;
    const userId = msg.from.id;
    if (!msg.reply_to_message) {
        return;
    }
    const replyCtx = replies.get(msg.reply_to_message.message_id);
    if (!replyCtx) {
        return;
    }
    const {
        nix,
        ...rest
    } = replyCtx;
    if (!nix || !nix.name) {
        await bot.sendMessage(chatId, "Cannot find command name to execute this reply!", {
            parse_mode: "Markdown"
        });
        return;
    }
    const cmdName = nix.name;
    const cmd = cmds.get(cmdName);
    if (!cmd) {
        await bot.sendMessage(chatId, `Cannot find command: ${cmdName}`, {
            parse_mode: "Markdown"
        });
        return;
    }
    if (!cmd.onReply) {
        await bot.sendMessage(chatId, `Command ${cmdName} doesn't support replies`, {
            parse_mode: "Markdown"
        });
        return;
    }
    try {
        await cmd.onReply({
            bot,
            msg,
            chatId,
            userId,
            args,
            data: rest,
            commandName: cmdName,
            replyMsg: msg.reply_to_message,
            message: msg
        });
    } catch (err) {
        const errMsg = `An error occurred while processing your reply: ${err.message}`;
        await bot.sendMessage(chatId, errMsg, {
            parse_mode: "Markdown"
        });
    }
};
