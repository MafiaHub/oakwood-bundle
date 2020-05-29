const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const nfp = require('node-fetch-progress')
const {exec} = require('pkg')
const {SYSTEM} = require('./consts')

const url = 'https://releases.mafiahub.now.sh/api/fetch/mafiahub/oakwood/{PLATFORM}/server/latest'
const exe = 'oakwood-server'
const dep = 'assets'

const check = sys => new Promise((resolve, reject) => {
    const binary = path.join(dep, `${exe}-${sys=='win'?'win.exe':sys}`)
    const fileurl = url.replace('{PLATFORM}', sys)

    /* resolve ! */
    if (fs.existsSync(binary)) {
        return resolve(binary);
    }

    console.log(`> starting download for ${sys}: ${fileurl}`)

    return fetch(fileurl)
        .then(res => {
            if (!res.ok) return reject({code: res.status, text: res.statusText })

            const progress = new nfp(res)

            progress.on('progress', (p) => {
                process.stdout.write(`${Math.floor(p.progress * 100)}% - ${p.doneh}/${p.totalh} - ${p.rateh} - ${p.etah}                       \r`)
            })

            const stream = fs.createWriteStream(binary)

            res.body
                .on('error', reject)
                .pipe(stream)

            stream
                .on('error', reject)
                .on('finish', () => {
                    console.log(`> server binary for ${sys} was successfully downloaded`)
                    fs.chmodSync(binary, 0o755)
                    resolve(binary)
                })
        });
})

const main = async () => {
    const system = SYSTEM;
    await check(system)
    await exec(['src/bin.js', '-c', `assets/config-${system}.json`, '--out-path', 'bin/'])
}

main().catch(console.error)
