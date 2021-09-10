#!/bin/bash
cd /home/tennisexpert/www/

sudo rm -rf node_modules/
sudo rm -rf package*.*

# npm update
sudo npm i -g npm

# init package
npm init

# add package
npm install express@4.16.3
npm install bootstrap@3.3.7
npm install bootstrap-table@1.12.1
npm install ejs@2.6.1
npm install jquery@3.3.1
npm install sleep@5.1.1
npm install sqlite@2.9.2
npm install shelljs@0.8.2
npm install better-sqlite3@4.1.4
npm install express-session@1.15.6

# install global option (ansg.web 스크립트 이용 시 forever 패키지 사용하므로)
sudo npm install -g forever