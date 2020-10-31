
mysql -uroot -p$MYSQL_ROOT_PASSWORD -e "create user 'foo'@'%' identified by 'foo';"
mysql -uroot -p$MYSQL_ROOT_PASSWORD -e "grant all privileges on *.* to 'foo'@'%';"
echo "Added user [ foo ]"
mysql -uroot -p$MYSQL_ROOT_PASSWORD -e "create user 'bar'@'%' identified by 'bar';"
mysql -uroot -p$MYSQL_ROOT_PASSWORD -e "grant all privileges on *.* to 'bar'@'%';"
echo "Added user [ bar ]"
mysql -uroot -p$MYSQL_ROOT_PASSWORD -e "flush privileges;"