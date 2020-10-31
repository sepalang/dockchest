FROM mysql:latest
ENV MYSQL_ROOT_PASSWORD "happy"
EXPOSE 3306
COPY ./docker-entrypoint-initdb.d /docker-entrypoint-initdb.d
