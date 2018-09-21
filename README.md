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

# Use Docker to create multiple instances

Initialise and start 3 containers

    docker swarm init
    docker stack deploy -c docker-compose.yml zwiftgpsswarm

Stop containers and remove swarm (must manually delete containers)

    docker stack rm zwiftgpsswarm
    docker swarm leave --force
