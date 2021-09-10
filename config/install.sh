#!/bin/bash
echo "Init Start!!!!"

# remove target & change
echo "Remove & Make Directory(Step 1)"
sudo rm -rf /home/tennisexpert/
sudo mkdir -p /home/tennisexpert/www/
sudo cd /home/tennisexpert/
	
# when use rasbian
echo "Change Owner(Step 2)"
sudo chown pi.pi /home/tennisexpert/

# install nodejs
echo "Install nodejs(Step 3)"
sudo npm install -g forever
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs
# check nodejs
npm -v
node -v
nodejs -v

# npm update
echo "Update Node Package(Step 4)"
cd /home/tennisexpert/www/
sudo rm -rf node_modules/
sudo rm -rf package*.*

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

# make key, cert pem
echo "Make Cert(Step 5)"
cd /home/tennisexpert/www/
openssl genrsa 1024 > key.pem
openssl req -x509 -new -key key.pem > cert.pem
		
# install python library
echo "Install Python3(Step 6)"
sudo apt-get install python3-dateutil
pip3 install sh
pip3 -r requirement.txt

# copy autostart & rc.local
echo "Copy Config(Step 7)"
cd ~
cp -rf /home/tennisexpert/config/autostart .config/lxsession/LXDE-pi/
sudo cp -rf /home/tennisexpert/config/rc.local /etc/

# install hangul font
echo "Install Font(Step 8)"
sudo apt-get -y install fonts-nanum
sudo apt-get -y install ibus-hangul

echo "Init Done!!!!"
	
# reboot
sudo reboot