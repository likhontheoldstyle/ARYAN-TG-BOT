const {
    execSync
} = require("child_process");
const path = require("path");
const fs = require("fs");
const pkg = require(path.join(__dirname, "package.json"));
const pkgName = pkg.name || "bot-updater";
const pkgVersion = pkg.version || "unknown";
const rootDir = path.resolve(__dirname);
const LOG_LEVELS = {
    INFO: "[INFO]",
    WARN: "[WARN]",
    ERROR: "[ERROR]",
    EXEC: "[EXEC]"
};

function log(level, msg) {
    console.log(`${LOG_LEVELS[level]} ${msg}`);
}
const updaterJsonPath = path.join(__dirname, "updater.json");
let updaterConfig;
try {
    const raw = fs.readFileSync(updaterJsonPath, "utf8");
    updaterConfig = JSON.parse(raw);
} catch (err) {
    log("ERROR", `Failed to read or parse update.json: ${err.message}`);
    process.exit(1);
}
if (!updaterConfig.repository || typeof updaterConfig.repository !== "string") {
    log("ERROR", "Missing or invalid 'repository' in updater.json");
    process.exit(1);
}
if (!updaterConfig.branch || typeof updaterConfig.branch !== "string") {
    log("ERROR", "Missing or invalid 'branch' in updater.json");
    process.exit(1);
}
if (!updaterConfig.preserve || !Array.isArray(updaterConfig.preserve)) {
    log("ERROR", "Missing or invalid 'preserve' in updater.json");
    process.exit(1);
}
if (!updaterConfig.backup || typeof updaterConfig.backup !== "string") {
    log("ERROR", "Missing or invalid 'backup' in updater.json");
    process.exit(1);
}
const cfg = {
    repoUrl: updaterConfig.repository,
    branch: updaterConfig.branch,
    preserveDirs: updaterConfig.preserve,
    backupDir: path.join(rootDir, updaterConfig.backup)
};

function runCmd(cmd, errMsg = `Failed to execute '${cmd}'`) {
    try {
        const out = execSync(cmd, {
            cwd: rootDir,
            stdio: "inherit"
        });
        log("EXEC", cmd);
        return out ? out.toString().trim() : "";
    } catch (err) {
        const msg = `${errMsg}: ${err.message}`;
        log("ERROR", msg);
        throw new Error(msg);
    }
}

function hasGit() {
    try {
        runCmd("git --version", "Git is not installed on this system");
        return true;
    } catch (err) {
        log("ERROR", err.message);
        return false;
    }
}
async function updateBot() {
    log("INFO", `Starting ${pkgName} update (Version: ${pkgVersion})...`);
    try {
        if (!hasGit()) {
            throw new Error("Git is not installed. Please install Git and try again.");
        }
        if (!fs.existsSync(cfg.backupDir)) {
            fs.mkdirSync(cfg.backupDir, {
                recursive: true
            });
            log("INFO", `Created backups directory: ${cfg.backupDir}`);
        }
        const backups = {};
        for (const dir of cfg.preserveDirs) {
            const srcPath = path.join(rootDir, dir);
            if (fs.existsSync(srcPath)) {
                const backupPath = path.join(cfg.backupDir, `${dir}_backup_${Date.now()}`);
                fs.cpSync(srcPath, backupPath, {
                    recursive: true
                });
                backups[dir] = backupPath;
                log("INFO", `Backed up ${dir} to ${backupPath}`);
            } else {
                log("INFO", `No ${dir} folder found to back up.`);
            }
        }
        try {
            runCmd("git diff --quiet && git diff --staged --quiet", "Failed to check Git status");
        } catch (err) {
            log("WARN", "Uncommitted changes detected. These will be overwritten.");
        }
        runCmd("git rev-parse --is-inside-work-tree || git init", "Failed to initialize or verify Git repository");
        runCmd(`git remote set-url origin ${cfg.repoUrl} || git remote add origin ${cfg.repoUrl}`, "Failed to set Git remote origin");
        runCmd("git fetch origin", "Failed to fetch from remote repository");
        runCmd(`git reset --hard origin/${cfg.branch}`, `Failed to reset to latest ${cfg.branch} branch`);
        for (const [dir, backupPath] of Object.entries(backups)) {
            const targetPath = path.join(rootDir, dir);
            fs.rmSync(targetPath, {
                recursive: true,
                force: true
            });
            fs.cpSync(backupPath, targetPath, {
                recursive: true
            });
            fs.rmSync(backupPath, {
                recursive: true,
                force: true
            });
            log("INFO", `Restored original ${dir} from ${backupPath}`);
        }
        try {
            runCmd("npm install", "Failed to install NPM dependencies");
        } catch (err) {
            throw new Error(`Dependency installation failed: ${err.message}. Update aborted.`);
        }
        log("INFO", `${pkgName} updated successfully.`);
    } catch (err) {
        log("ERROR", `Update process failed: ${err.message}`);
        throw err;
    }
}
module.exports = {
    updateBot
};
if (require.main === module) {
    updateBot().catch(err => {
        log("ERROR", `Unhandled error: ${err.message}`);
        process.exit(1);
    });
}
