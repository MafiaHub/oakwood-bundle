const os = require('os')
const path = require('path')

const IS_PACKAGED = process.platform == 'win32'
    ? process.argv[0].indexOf('node.exe') === -1
    : process.argv[0].indexOf('node') === -1

let SYSTEM = 'lin'

switch (process.platform) {
    case 'win32': SYSTEM = 'win'; break;
    case 'darwin': SYSTEM = 'mac'; break;
}

module.exports = {
    TEMPDATA: path.join(os.tmpdir(), 'oakwood-server'),
    EXECUTABLE: `oakwood-server-${SYSTEM=='win'?'win.exe':SYSTEM}`,
    SYSTEM,
    IS_PACKAGED,
};
