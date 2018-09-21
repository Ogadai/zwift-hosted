# zwift-hosted

# Debugging inside Docker using Visual Studio Code

Use `docker-compose.debug.yml`, and add this configuration to `launch.json`:

        {
            "type": "node",
            "request": "attach",
            "protocol": "inspector",
            "name": "Docker: Attach to Node",
            "port": 9229,
            "address": "localhost",
            "localRoot": "${workspaceRoot}/zwift-hosted",
            "remoteRoot": "/home/node/app"
        },
