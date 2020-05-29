const {constants} = require('oakwood')
const {vehicleModels, playerModels} = require('oakwood')

module.exports = (oak) => {
    const {
        VISIBILITY_NAME,
        VISIBILITY_ICON,
        VISIBILITY_RADAR,
        VISIBILITY_MODEL,
        VISIBILITY_COLLISION,
    } = constants

    /* get random element from an array */
    const rndarr = arr => arr[Math.floor(Math.random()*arr.length)]

    oak.event('start', () => {
        console.log('[info] connection started')
        oak.log('[info] oakwood-node connected')
    })

    oak.event('stop', () => console.log('[info] connection stopped'))

    oak.event("vehicleUse", async (veh, pid, success, seatId, enterOrLeave) => {
        if (success) return;

        oak.hudMessage(pid, "This vehicle is locked!", 0xff0000)
    })

    /* chat system */

    oak.event('playerChat', async (pid, text) => {
        /* skip messages with commands */
        if (text.startsWith('/'))
            return;

        /* get author player name */
        const name = await oak.playerNameGet(pid)
        const msg = `[chat] ${name}: ${text}`

        /* log stuff into our local console */
        console.log('[chat]', `${name}:`, text)

        /* send messages to each clients' chat windows */
        oak.chatBroadcast(msg)
    })

    oak.event('unknownCommand', (pid, text) => {
        oak.chatSend(pid, `[error] unknown command: ${text}`)
    })

    oak.cmd('clear', (pid) => {
        oak.chatSend(pid, '\n'.repeat(12))
    })


    /* Player system */

    const spawnLocs = [
        { name: "pete", pos: [61.4763, 4.72524, 107.708 ]},
        { name: "tommy", pos: [8.62861251831, 22.8868865967, -602.147888184 ]},
        { name: "oakhill", pos: [738.030334473, 106.889381409, -228.563537598 ]},
        { name: "hoboken", pos: [537.296386719, -5.01502513885, 77.8488616943 ]},
        { name: "downtown", pos: [-188.796401978, 18.6846675873, -668.6328125 ]},
        { name: "hospital", pos: [-760.439697266, 12.6204996109, 753.350646973 ]},
        { name: "central", pos: [-1091.47839355, -7.27131414413, 5.55286931992 ]},
        { name: "china", pos: [-1709.24157715, 16.0029373169, 582.041442871 ]},
        { name: "salieri", pos: [-1774.59301758, -4.88487052917, -2.40491962433 ]},
        { name: "work", pos: [-2550.85546875, -3.96487784386, -554.806213379 ]},
        { name: "racing", pos: [-3534.42993164, 7.05113887787, -651.97338867 ]},
    ]

    const spawnplayer = pid => {
        const loc = rndarr(spawnLocs)
        const model = rndarr(playerModels)

        oak.chatSend(pid, `[info] spawning you at location: ${loc.name}`)

        oak.playerModelSet(pid, model[1])
        oak.playerHealthSet(pid, 200)
        oak.playerSpawn(pid, loc.pos, 0.0)

        oak.hudFadeout(pid, 1, 500, 0xFFFFFF)
        oak.hudFadeout(pid, 0, 500, 0xFFFFFF)
    }

    oak.event('playerConnect', async pid => {
        console.log('[info] player connected', pid)
        oak.chatBroadcast(`[info] player ${await oak.playerNameGet(pid)} connected.`)
        oak.tempWeaponsSpawn(pid)
        spawnplayer(pid)
    })

    oak.event('playerDeath', async pid => {
        setTimeout(() => spawnplayer(pid), 5000)
        oak.chatBroadcast(`[info] player ${await oak.playerNameGet(pid)} died.`)
    })

    oak.event('playerDisconnect', async pid => {
        oak.chatBroadcast(`[info] player ${await oak.playerNameGet(pid)} disconnected.`)
        console.log(`[info] player ${await oak.playerNameGet(pid)} disconnected.`)
    })

    oak.event('playerHit', (pid, atkr, dmg) => {
        // console.log('[info] playerHit', pid, atkr, dmg)
    })

    oak.cmd('spawn', async pid => {
        spawnplayer(pid)
    })

    oak.cmd('weapons', pid => {
        oak.tempWeaponsSpawn(pid)
    })

    oak.cmd('despawn', async pid => {
        oak.playerDespawn(pid)
    })

    oak.cmd('kill', async pid => {
        oak.playerKill(pid)
    })

    oak.cmd('help', async (pid) => {
        const commands = [
            '/help - shows this message',
            '/clear - clears chat box',

            '/spawn - respawns you at random spawn location',
            '/despawn - despawns the local player',
            '/heal or /healme - heals your player',

            '/id - prints your player id',
            '/list - prints current online players',
            '/tp ID - teleport to a player with provided id',
            '/tele NAME - teleport to a location (use /telelist to get locations)',
            '/telelist - prints list of possible locations to teleport to',

            '/weapons - gives you new set of weapons',
            '/skin SKINID sets a specific skin model for your player',
            '/car MODELID - creates car near player with specified model',
            '/putcar - creates a car on player position with specified model, and puts him inside',
            '/delcar - deletes a car you are curently in (only for cars created by you)',
            '/fuel AMOUNT - sets fuel level in the car',
            '/lock VALUE - set vehicle lock on or off (0 - to unlock, 1 - to lock)',

            '/spectate PLAYERID - enable specator mode, and follow specified player',
            '/stop - disable spectating mode',
        ]

        oak.chatSend(pid, `Help:\n----------------\n${commands.join('\n')}`)
    })

    oak.cmd('heal', async (pid) => {
        oak.playerHealthSet(pid, 200.0)
    })

    oak.cmd('healme', async (pid) => {
        oak.playerHealthSet(pid, 200.0)
    })

    oak.cmd('lock', async (pid, state) => {
        const veh = await oak.vehiclePlayerInside(pid)
        if (await oak.vehicleInvalid(veh)) return;
        state = parseInt(state)
        stateMsg = (state === 0) ? "unlocked" : "locked"

        oak.chatSend(pid, `Vehicle is now ${stateMsg}!`)
        oak.vehicleLockSet(veh, state)
    })

    oak.cmd('id', pid => {
        oak.chatSend(pid, `[info] your ID is: ${pid}`)
    })

    oak.cmd('tp', async (pid, targetid) => {
        const tid = parseInt(targetid)

        if (tid === NaN) {
            return oak.chatSend(pid, `[error] provided argument should be a valid number`)
        }

        if (pid == tid) {
            return oak.chatSend(pid, `[error] you can't teleport to yourself`)
        }

        if (await oak.playerInvalid(tid)) {
            return oak.chatSend(pid, `[error] player you provided was not found`)
        }

        /* get target name and position */
        const pos = await oak.playerPositionGet(tid)
        const name = await oak.playerNameGet(tid)

        /* are we in any vehicle */
        const veh = await oak.vehiclePlayerInside(pid)

        if (!await oak.vehicleInvalid(veh)) {
            /* offset by height */
            pos[1] += 2;

            oak.chatSend(pid, `[info] teleporting your car to player ${name}.`)

            /* set our vehicle position */
            oak.vehiclePositionSet(veh, pos)
        } else {
            oak.chatSend(pid, `[info] teleporting you to player ${name}.`)

            /* set our player position */
            oak.playerPositionSet(pid, pos)
        }
    })

    oak.cmd('list', async pid => {
        const players = await oak.playerList()

        oak.chatSend(pid, `[info] connected players:`)
        players.map(async (tid, i) => oak.chatSend(pid, `ID: ${tid} | ${await oak.playerNameGet(tid)}`))
        oak.chatSend(pid, '---------------------------')
    })

    oak.cmd('skin', async (pid, arg1) => {
        if (!arg1) {
            return oak.chatSend(pid, '[info] usage: /skin [modelId]')
        }

        const veh = await oak.vehiclePlayerInside(pid)

        if (!await oak.vehicleInvalid(veh)) {
            return oak.chatSend(pid, `[error] you can't change skin inside of vehicle!`)
        }

        const modelid = parseInt(arg1)
        oak.playerModelSet(pid, playerModels[modelid][1])
    })

    oak.cmd('telelist', async (pid) => {
        oak.chatSend(pid, `Location names for /tele :`)

        spawnLocs.map((a, i) => {
            oak.chatSend(pid, `${i}. ${a.name}`)
        })
    })

    oak.cmd('tele', async (pid, name) => {
        const location = spawnLocs.find(el => el.name == name)

        if (!location) {
            return oak.chatSend(pid, `[error] cound't find any locations by given name, use /telelist`)
        }

        oak.chatSend(pid, `[info] teleporting your car to a location ${location.name}.`)

        /* are we in any vehicle */
        const veh = await oak.vehiclePlayerInside(pid)

        if (!await oak.vehicleInvalid(veh)) {
            oak.vehiclePositionSet(veh, location.pos)
        } else {
            oak.playerPositionSet(pid, location.pos)
        }
    })




    /* Spectating system */

    oak.cmd('hideme', async (pid) => {
        const nameVisible = await oak.playerVisibilityGet(pid, VISIBILITY_NAME)
        const iconVisible = await oak.playerVisibilityGet(pid, VISIBILITY_ICON)

        oak.playerVisibilitySet(pid, VISIBILITY_NAME, !nameVisible)
        oak.playerVisibilitySet(pid, VISIBILITY_ICON, !iconVisible)
    })

    oak.cmd('spectate', async (pid, arg1) => {
        const tid = parseInt(arg1)

        if (await oak.playerInvalid(tid)) {
            return oak.chatSend(pid, `[error] unknown player target`)
        }

        oak.cameraTargetPlayer(pid, tid)
    })

    oak.cmd('stop', async (pid) => {
        oak.cameraTargetUnset(pid)
    })





    /* Vehicles */

    let playerVehicles = {}
    let playerVehiclesValid = (pid, vid) => playerVehicles.hasOwnProperty(pid)
        ? playerVehicles[pid].indexOf(vid) !== -1
        : false

    let playerVehiclesAdd = (pid, vid) => {
        if (!playerVehicles.hasOwnProperty(pid)) {
            playerVehicles[pid] = []
        }

        playerVehicles[pid].push(vid)
    }

    oak.event('start', async () => {
        const existing = await oak.vehicleList()

        /* despawn all empty vehicles */
        if (existing.length > 0) {
            console.log('[info] found', existing.length, 'existing cars on start-up')

            for (var i = 0; i < existing.length; i++) {
                const veh = existing[i]
                const pass = await oak.vehiclePlayerList(veh)

                if (pass.length == 0) {
                    await oak.vehicleDespawn(veh)
                } else {
                    console.log('[info] skipping respawn for occupied vehicle', veh)
                }
            }
        }

        let models = [
            {pos: [-1991.89, -5.09753, 10.4476], heading: 0.0, model: 148}, // Manta Prototype
            {pos: [-1974.2, -4.8862, 22.5578], heading: 0.0, model: 148}, // Manta Prototype
            {pos: [-1981.11, -4.98206, 22.7471], heading: 0.0, model: 148}, // Manta Prototype
            {pos: [-1991.69, -5.12453, 22.3242], heading: 0.0, model: 148}, // Manta Prototype
        ]

        models.map(async car => {
            const {pos, heading, model} = car;
            oak.vehicleSpawn(vehicleModels[model][1], pos, heading)
        })
    })

    const spawncar = async (pid, model, adjustPos) => {
        const m = parseInt(model)

        if (m === NaN) {
            return oak.chatSend(pid, `[error] provided argument should be a valid number`)
        }

        oak.chatSend(pid, `[info] spawning vehicle model ${vehicleModels[m][0]}`)

        let pos = await oak.playerPositionGet(pid)
        let heading = await oak.playerHeadingGet(pid)

        if (adjustPos === true) {
            let dir = await oak.playerDirectionGet(pid)
            pos = pos.map((p, i) => p + dir[i] * 1.5)
            heading -= 90.0
        }

        const veh = await oak.vehicleSpawn(vehicleModels[m][1], pos, heading)

        playerVehiclesAdd(pid, veh)

        return veh
    }

    oak.cmd('car', async (pid, model) => {
        spawncar(pid, model, true)
    })

    oak.cmd('putcar', async (pid, model) => {
        const veh = await spawncar(pid, model, false)
        oak.vehiclePlayerPut(veh, pid, 0)
    })

    /*oak.cmd('repair', async pid => {
        const veh = await oak.vehiclePlayerInside(pid)
        if (await oak.vehicleInvalid(veh)) return;
        oak.vehicleRepair(veh)
    })*/

    oak.cmd('delcar', async (pid) => {
        const veh = await oak.vehiclePlayerInside(pid)

        if (await oak.vehicleInvalid(veh)) {
            return oak.chatSend(pid, '[error] you are not in a vehicle')
        }

        if (!playerVehiclesValid(pid, veh)) {
            return oak.chatSend(pid, `[error] you can't remove car not spawned by you`)
        }

        oak.vehicleDespawn(veh)
        oak.chatSend(pid, `[info] car has been successfully removed`)
    })

    oak.cmd('fuel', async (pid, arg1 = 10.0) => {
        const fuel = parseFloat(arg1)

        const veh = await oak.vehiclePlayerInside(pid)
        if (await oak.vehicleInvalid(veh)) return;

        oak.vehicleFuelSet(veh, fuel)
    })

    oak.cmd('race', async (pid, flags) => {
        const f = parseInt(flags)

        if (f === NaN) {
            return oak.chatSend(pid, '[error] pakuj do pici')
        }

        oak.hudCountdown(pid, f)
    })
}
