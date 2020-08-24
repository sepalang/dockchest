# Dockchest (alpha.2)

## Usage
Write dockchest.yml in the project in progress. Like this
```yml
defines:
  NAME: &NAME live-server
  VERSION: &VERSION 0.1.2
  SERVER_PORT: &SERVER_PORT 8080
build:
  tag: [*NAME, *VERSION]
  ignore: |
    node_modules
    npm-debug.log
  script: |
    FROM node:12
    ARG SERVER_PORT
    WORKDIR /usr/src/app
    COPY ./* ./
    EXPOSE ${SERVER_PORT}
    RUN npm install
    CMD [ "node", "index.js" ,"--port=${SERVER_PORT}" ]
run:
  name: "express-server"
  publishes: 
    - [*SERVER_PORT, *SERVER_PORT]
#  volumes: 
#    - [../volume, /usr/src/app/volume]

```

It automatically creates a'Dockerfile', builds the image, and run the disposable container.
```
doch make
doch build
doch run
```

## RFCs
```
doch pre
doch make
doch build
doch manual
doch run
```