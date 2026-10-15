const fs = require("fs-extra");
const path = require("path");
const {
    create: createCache,
    clear: clearCache
} = require("../database/cache.js");
const initCache = (async () => {
    await createCache();
    await clearCache();
})();

function validateModule(mod) {
    if (!mod) {
        throw new Error("No export found in module");
    }
    if (!mod.nix) {
        throw new Error("Missing nix property in module");
    }
    if (!mod.nix.name || typeof mod.nix.name !== "string") {
        throw new Error("Missing or invalid nix.name in module");
    }
    if (!mod.onStart) {
        throw new Error("Missing onStart method in module");
    }
}
async function loadModules(dir, label, map) {
    const errors = {};
    try {
        const files = await fs.readdir(dir);
        const jsFiles = files.filter(file => file.endsWith(".js"));
        for (const file of jsFiles) {
            try {
                const fullPath = path.join(dir, file);
                const mod = require(fullPath);
                const exported = mod.default || mod;
                validateModule(exported);
                map.set(exported.nix.name, exported);
            } catch (err) {
                console.error(`Error loading ${label} "${file}": ${err.message}`);
                errors[file] = err;
            }
        }
    } catch (err) {
        console.error(`Error reading ${label} directory "${dir}": ${err.message}`);
        errors.directory = err;
    }
    return errors;
}
async function loadAll() {
    await initCache;
    const errors = {};
    const cmdsDir = path.join(process.cwd(), "scripts", "cmds");
    const eventsDir = path.join(process.cwd(), "scripts", "events");
    const [cmdErrors, eventErrors] = await Promise.all([loadModules(cmdsDir, "cmds", global.teamnix.cmds), loadModules(eventsDir, "events", global.teamnix.events)]);
    Object.assign(errors, cmdErrors, eventErrors);
    return Object.keys(errors).length === 0 ? false : errors;
}
module.exports = {
    utils: loadAll
};
