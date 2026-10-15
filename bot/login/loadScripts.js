const {
    execSync
} = require("child_process");
const fs = require("fs");
const path = require("path");
const EXIT_CODE = 0;
const restartFilePath = path.join(__dirname, "../../restart.json");

function restartBot(reason) {
    console.log("Bot restarting now...");
    process.exit(EXIT_CODE);
}
exports.install = function() {
    const originalRequire = module.constructor.prototype.require;
    module.constructor.prototype.require = function(request) {
        try {
            return originalRequire.call(this, request);
        } catch (err) {
            if (err.code === "MODULE_NOT_FOUND" && !request.startsWith(".") && !request.startsWith("/")) {}
            throw err;
        }
    };
};
exports.restartBot = restartBot;
exports.RESTART_FILE = restartFilePath;
