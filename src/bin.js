#!/usr/bin/env node
require('./bootstrap').then(async () => {
    const os = require('os')
    const fs = require('fs')
    const path = require('path')
    const {spawn} = require('child_process')
    const {createClient} = require('oakwood')
    const {TEMPDATA, EXECUTABLE, IS_PACKAGED} = require('./consts')

    let gamemode = require('./default')

    const main = async () => {
        const binary = IS_PACKAGED
            ? path.join(TEMPDATA, EXECUTABLE)
            : path.join('./assets/', EXECUTABLE)

        console.log('> using binary', binary)

        if (!fs.existsSync(binary)) {
            throw new Error('Binary was not found in the package')
        }

        const customScriptName = 'index.js';
        const customScript = path.join(process.cwd(), customScriptName)

        if (fs.existsSync(customScript)) {
            console.log('> using custom gamemode script', customScript)
            gamemode = require(customScript)
        } else {
            console.log('> using default built-in gamemode')
        }

        /* create a client */
        const oak = createClient()

        const params = []
        const instance = spawn(binary, params, { stdio: 'inherit', cwd: process.cwd() });

        /* call gamemode code */
        gamemode(oak)

        instance.on('error', err => { throw new Error(`Error within oakwood-server process: ${err}`)});

        /* on finish (code 0 - success, other - error) */
        instance.on('close', (code) => {
            if (code !== 0) throw new Error('Error in oakwood-server; code : ' + code)
        });
    }

    await main()
})
