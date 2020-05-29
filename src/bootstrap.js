const os = require('os')
const path = require('path');
const fs = require('fs-extra');

const {TEMPDATA, IS_PACKAGED, EXECUTABLE} = require('./consts')
console.log(IS_PACKAGED ? 'Packaged version' : 'Dev version');

/**
 * Native dependencies have to be extracted to the file system so that they can be spawned.
 * Since pkg doesn't allow for inclusion of .node files (their philosophy is "deliver them with the .exe"),
 * they have to be renamed to .foolkpkg before packaging.
 *
 * @param {Array<string>} deps  file paths relative to __dirname of this file
 */
const extractNativeDeps = (deps) => {
    deps.forEach((dep) => {
        fs.writeFileSync(
            path.join(TEMPDATA, path.basename(dep)),
            fs.readFileSync(
                path.join(__dirname, IS_PACKAGED ? dep.replace('.node', '.foolpkg') : dep) // pkg
                // path.join(__dirname, dep) // nexe
            )
        );

        fs.chmodSync(path.join(TEMPDATA, path.basename(dep)), 0o765)
    });
};

module.exports = !IS_PACKAGED ? Promise.resolve() : new Promise((resolve) => {
    // Needs to be done right at the the beginning so that we can put
    // native addons where we want them and make pkg look there
    // (by setting cwd to TEMPDATA), as they need to be available
    // for require() calls that follow.
    fs.ensureDirSync(TEMPDATA);
    process.chdir(TEMPDATA);

    extractNativeDeps([
        '../assets/' + EXECUTABLE,
        '../node_modules/nanomsg/build/Release/node_nanomsg.node',
    ]);

    resolve();
});
