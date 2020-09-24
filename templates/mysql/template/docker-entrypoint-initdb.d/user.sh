<% for(user of users){ %>
mysql -uroot -p$MYSQL_ROOT_PASSWORD -e "create user '<%=user%>'@'%' identified by '<%=user%>';"
mysql -uroot -p$MYSQL_ROOT_PASSWORD -e "grant all privileges on *.* to '<%=user%>'@'%';"<% } %>
mysql -uroot -p$MYSQL_ROOT_PASSWORD -e "flush privileges;"