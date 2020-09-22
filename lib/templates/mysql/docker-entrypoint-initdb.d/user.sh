mysql -uroot -p$MYSQL_ROOT_PASSWORD -e "create user 'labeldock'@'%' identified by 'labeldock';"
mysql -uroot -p$MYSQL_ROOT_PASSWORD -e "grant all privileges on *.* to 'labeldock'@'%';"
mysql -uroot -p$MYSQL_ROOT_PASSWORD -e "flush privileges;"