## Command guide

### Build
```
docker build --tag doch-mysql:0.1.0 --file Dockerfile .
docker images
```

### Run with deamon
```
docker run -i -t -d --name=doch-mysql -p 60000:3306 doch-mysql:0.1.0

```

### Run with attach
```
docker run -i -t --name=doch-mysql -p 60000:3306 doch-mysql:0.1.0

```

### Run as soon as possible (build & run)
```
docker run -i -t --name=doch-mysql -p 60000:3306 doch-mysql:0.1.0

```
