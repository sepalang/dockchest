# Dockchest (alpha.15)
Docker prototyping tool

## Usage

### template
```bash
doch init

# input (Template types will continue to increase)
? Template list » - Use arrow-keys. Return to submit.
>   mysql
    traefik

# input
? Mysql template type » - Use arrow-keys. Return to submit.
>   default
    traefik


√ root user password ... *****
√ Port number ... 4000
√ Enter additional users (with ,) ... foo, bar
{
  type: 'default',
  host: '*',
  port: '4000',
  rootPassword: '*****',
  users: [ 'foo', 'bar' ],
  useTraefik: false
}
√ Is the form entered correctly? ... N / Y
? Are you sure the templates will be installed from C:\Users\label\git\dockchest? » N / Y

# created file docker-entrypoint-initdb.d/user.sh
# created file DockerDesign.yml
```

### Dockchest file
Write dockchest.yml or DockerDesign.yml in the project in progress. Like this
```yml
defines:
  - &NAME doch-localvolume
  - &VERSION 0.2.0
  - &C_SERVER_PORT 8000
  - &H_SERVER_PORT 8000
arg:
  SERVER_PORT: *C_SERVER_PORT
build:
  tag: [*NAME, *VERSION]
  ignore: |
    node_modules
    npm-debug.log
  script: |
    FROM node:12
    ARG SERVER_PORT
    ENV SERVER_PORT $SERVER_PORT
    WORKDIR /usr/src/app
    COPY ./* ./
    RUN npm install
    CMD npx live-server --port=$SERVER_PORT --host=0.0.0.0
run:
  name: "live-server"
  link: "mydb"
  publishes: 
    - [*H_SERVER_PORT, *C_SERVER_PORT]
  volumes: 
    - [../volume, /usr/src/app/volume]
  
```


Create a Dockerfile through the `make` command.
```bash
$ cd test/localvolume
$ doch make  # Dockerfile is automatically generated.
$ doch build # image generated.
$ doch run # container run
```

This guide is not final... being studied to make it simpler and clearer.

### shortcut
make, build, run with deamon
```
doch asap #or doch a
```

## Design goal
It automatically creates a'Dockerfile', builds the image, and run the disposable container.
```
doch init
doch asap
```

## RFCs
```
doch template
doch init
doch asap
doch make
doch build
doch run
doch manual
```