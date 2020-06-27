# oakwood-bundle

A single, self-contained packaged binary that is able to run oakwood server with a default [freeride](https://github.com/mafiahub/oakwood-freeride) gamemode.

## Instructions

1. Donwload the binary for your platform
2. Run it, by double-clicking, or via a command line

## Custom gamemode

To run a custom gamemode, create an `index.js` file and place it in the same folder as your server executable. Server will pick it up, and inject `oak` client into it.
The file **should** export a **function**.

An example base might look like this:

```js
module.exports = (oak) => {
    oak.event('start', async () => {
        console.log("[info] connected to the server")
        oak.log("[info] hello world from nodejs")
    })

    oak.event('playerConnect', async pid => {
        console.log('[info] player connected', pid)

        oak.playerHealthSet(pid, 200)
        oak.playerSpawn(pid, [-1774.59301758, -4.88487052917, -2.40491962433], 0.0)
    })

    oak.cmd('goto', async (pid, targetid) => {
        const tid = parseInt(targetid)

        if (tid === NaN) {
            return oak.chatSend(pid, `[error] provided argument should be a valid number`)
        }

        if (await oak.playerInvalid(tid)) {
            return oak.chatSend(pid, `[error] player you provided was not found`)
        }

        /* get target position */
        const pos = await oak.playerPositionGet(tid)

        /* set our player position */
        oak.playerPositionSet(pid, pos)
    })
}
```

Or with a custom dependncy, installed via `npm`:

```js
const fetch = require('node-fetch')

module.exports = (oak) => {
    oak.event('start', async () => {
        console.log("[info] connected to the server")
        oak.log("[info] hello world from nodejs")
    })

    oak.event('playerConnect', async pid => {
        console.log('[info] player connected', pid)

        oak.playerHealthSet(pid, 200)
        oak.playerSpawn(pid, [-1774.59301758, -4.88487052917, -2.40491962433], 0.0)
    })

    /* search something on google */
    oak.cmd('google', async (pid, ...text) => {
        const res = await fetch(`https://www.google.com/search?q=${text}`);
        const dat = res.text()
        console.log(dat.slice(0, 30)) // print first 30 letters of html
    })
}
```

For more details, please 
