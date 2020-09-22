# Dockchest (alpha.5)
Docker prototyping tool


## Usage


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
  publishes: 
    - [*H_SERVER_PORT, *C_SERVER_PORT]
  volumes: 
    - [../volume, /usr/src/app/volume]
  
```


Create a Dockerfile through the `make` command.
```bash
$ cd test/localvolume
$ doch make  # Dockerfile is automatically generated.


- [Directory]

  cd C:\Users\label\git\dockchest\test\localvolume\live-server

- [Build]

  docker build --tag doch-localvolume:0.2.0 --file Dockerfile --build-arg SERVER_PORT=8000 .

- [Run with attach]

  docker run -i -t --name="express-server" --publish="8000:8000" --volume="C:\Users\label\git\dockchest\test\localvolume\volume:/usr/src/app/volume" doch-localvolume:0.2.0

- [Run with deamon]

  docker run -i -t -d --name="express-server" --publish="8000:8000" --volume="C:\Users\label\git\dockchest\test\localvolume\volume:/usr/src/app/volume" doch-localvolume:0.2.0
```


Enter the commands sequentially through the manual after the make command.
```
cd ~/git/dockchest/test/localvolume/live-server
docker build --tag doch-localvolume:0.2.0 --file Dockerfile --build-arg SERVER_PORT=8000 .
docker run -i -t --name express-server --publish="8000:8000" --volume="~/git/dockchest/test/localvolume/volume:/usr/src/app/volume" doch-localvolume:0.2.0
```


This guide is not final... being studied to make it simpler and clearer.


## shortcut
make, build, run with deamon
```
doch -mbd
```

## Design goal
It automatically creates a'Dockerfile', builds the image, and run the disposable container.
```
doch make test/localvolume
doch build
doch run # support graceful exit
```


## RFCs
```
doch pre
doch make
doch build
doch manual
doch run
```