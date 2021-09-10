#!/bin/bash
echo "Init Start!!!!"

# remove target & change
echo "Remove & Make Directory(Step 1)"
sudo rm -rf /home/tennisexpert/
sudo mkdir -p /home/tennisexpert/www/
sudo mkdir -p /home/tennisexpert/config/
sudo mkdir -p /home/tennisexpert/engine/
cd /home/tennisexpert/
	
# when use rasbian
echo "Change Owner(Step 2)"
sudo chown -R pi.pi /home/tennisexpert/

# install nodejs
echo "Install nodejs(Step 3)"
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs npm
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
sudo npm install -g forever

# make key, cert pem
echo "Make Cert(Step 5)"
cd /home/tennisexpert/www/
openssl genrsa 1024 > key.pem
openssl req -x509 -new -key key.pem > cert.pem
		
# install python library (python3.7)
echo "Install Python Library(Step 6)"
cd /home/tennisexpert/config/
pip3 install -r requirement.txt
# 설치 안되고 있음
sudo pip3 install torch torchvision torchaudio -f https://download.pytorch.org/whl/torch_stable.html


# install hangul font
echo "Install Font(Step 7)"
sudo apt-get -y install fonts-nanum
sudo apt-get -y install ibus-hangul

# ffmpeg
echo "Install FFMpeg(Step 8)"
git clone --depth 1 https://code.videolan.org/videolan/x264
cd x264/
./configure --host=arm-unknown-linux-gnueabi --enable-static --disable-opencl
make -j4
sudo make install
cd ~
git clone git://source.ffmpeg.org/ffmpeg --depth=1
cd ffmpeg
./configure --arch=armel --target-os=linux --enable-gpl --enable-libx264 --enable-nonfree
make -j4
sudo make install
sudo apt update
sudo apt upgrade
cd ffmpeg/
sudo ./configure --arch=armel --target-os=linux --enable-gpl --enable-libx264 --enable-nonfree
make -j4 4
make -j4
sudo apt -y install autoconf automake build-essential cmake doxygen git graphviz imagemagick libasound2-dev libass-dev libavcodec-dev libavdevice-dev libavfilter-dev libavformat-dev libavutil-dev libfreetype6-dev libgmp-dev libmp3lame-dev libopencore-amrnb-dev libopencore-amrwb-dev libopus-dev librtmp-dev libsdl2-dev libsdl2-image-dev libsdl2-mixer-dev libsdl2-net-dev libsdl2-ttf-dev libsnappy-dev libsoxr-dev libssh-dev libssl-dev libtool libv4l-dev libva-dev libvdpau-dev libvo-amrwbenc-dev libvorbis-dev libwebp-dev libx264-dev libx265-dev libxcb-shape0-dev libxcb-shm0-dev libxcb-xfixes0-dev libxcb1-dev libxml2-dev lzma-dev meson nasm pkg-config python3-dev python3-pip texinfo wget yasm zlib1g-dev libdrm-dev
mkdir ~/ffmpeg-libraries
git clone --depth 1 https://github.com/mstorsjo/fdk-aac.git ~/ffmpeg-libraries/fdk-aac   && cd ~/ffmpeg-libraries/fdk-aac   && autoreconf -fiv   && ./configure   && make -j$(nproc)   && sudo make install
git clone --depth 1 https://code.videolan.org/videolan/dav1d.git ~/ffmpeg-libraries/dav1d   && mkdir ~/ffmpeg-libraries/dav1d/build   && cd ~/ffmpeg-libraries/dav1d/build   && meson ..   && ninja   && sudo ninja install
git clone --depth 1 https://github.com/ultravideo/kvazaar.git ~/ffmpeg-libraries/kvazaar   && cd ~/ffmpeg-libraries/kvazaar   && ./autogen.sh   && ./configure   && make -j$(nproc)   && sudo make install
git clone --depth 1 https://chromium.googlesource.com/webm/libvpx ~/ffmpeg-libraries/libvpx   && cd ~/ffmpeg-libraries/libvpx   && ./configure --disable-examples --disable-tools --disable-unit_tests --disable-docs   && make -j$(nproc)   && sudo make install
git clone --depth 1 https://aomedia.googlesource.com/aom ~/ffmpeg-libraries/aom   && mkdir ~/ffmpeg-libraries/aom/aom_build   && cd ~/ffmpeg-libraries/aom/aom_build   && cmake -G "Unix Makefiles" AOM_SRC -DENABLE_NASM=on -DPYTHON_EXECUTABLE="$(which python3)" -DCMAKE_C_FLAGS="-mfpu=vfp -mfloat-abi=hard" ..   && sed -i 's/ENABLE_NEON:BOOL=ON/ENABLE_NEON:BOOL=OFF/' CMakeCache.txt   && make -j$(nproc)   && sudo make install
git clone -b release-2.9.3 https://github.com/sekrit-twc/zimg.git ~/ffmpeg-libraries/zimg   && cd ~/ffmpeg-libraries/zimg   && sh autogen.sh   && ./configure   && make   && sudo make install
sudo ldconfig
git clone --branch release/4.4 --depth 1 https://github.com/FFmpeg/FFmpeg.git ~/FFmpeg   && cd ~/FFmpeg   && ./configure     --extra-cflags="-I/usr/local/include"     --extra-ldflags="-L/usr/local/lib"     --extra-libs="-lpthread -lm -latomic"     --arch=armel     --enable-gmp     --enable-gpl     --enable-libaom     --enable-libass     --enable-libdav1d     --enable-libdrm     --enable-libfdk-aac     --enable-libfreetype     --enable-libkvazaar     --enable-libmp3lame     --enable-libopencore-amrnb     --enable-libopencore-amrwb     --enable-libopus     --enable-librtmp     --enable-libsnappy     --enable-libsoxr     --enable-libssh     --enable-libvorbis     --enable-libvpx     --enable-libzimg     --enable-libwebp     --enable-libx264     --enable-libx265     --enable-libxml2     --enable-mmal     --enable-nonfree     --enable-omx     --enable-omx-rpi     --enable-version3     --target-os=linux     --enable-pthreads     --enable-openssl     --enable-hardcoded-tables   && make -j$(nproc)   && sudo make install


2-1. IPS 네트워크 설정
pi@ips:~ $ sudo nano /etc/network/interfaces
# interfaces(5) file used by ifup(8) and ifdown(8)

# Please note that this file is written to be used with dhcpcd
# For static IP, consult /etc/dhcpcd.conf and 'man dhcpcd.conf'

# Include files from /etc/network/interfaces.d:
source-directory /etc/network/interfaces.d

auto eth0
iface eth0 inet static
    address 192.168.100.2
    netmask 255.255.255.0

auto eth1
iface eth1 inet static
    address 10.1.0.1
    netmask 255.255.255.0

auto eth2
iface eth2 inet static
    address 192.168.4.1
    netmask 255.255.255.0
	
# 무선 공유기 설정 시
auto wlan0
iface wlan0 inet static
    wpa-ssid "cnbis5.0"
    wpa-psk "0315024900!#@$"
    address 192.168.0.188
    netmask 255.255.255.0
    gateway 192.168.0.1
    dns-nameserver 8.8.8.8
	
2-2. Dnsmasq 설치(및 iptables 설정)
sudo apt-get upgrade
sudo apt-get update
sudo apt-get install -y dnsmasq
sudo apt-get remove install -y dnsmasq
sudo systemctl stop dhcpcd5

# dnsmasq 설정
sudo mv /etc/dnsmasq.conf /etc/dnsmasq.default
sudo nano /etc/dnsmasq.conf
conf-dir=/etc/dnsmasq.d/,*.conf
interface=eth1
dhcp-range=10.1.0.2,10.1.0.254,255.255.255.0,24h
listen-address=10.1.0.1
bind-interfaces
server=8.8.8.8
domain-needed
bogus-priv

sudo nano /etc/dnsmasq.d/dnsmasq_01.conf
interface=eth2
dhcp-range=192.168.4.2,192.168.4.254,255.255.255.0,24h
listen-address=192.168.4.1
bind-interfaces
server=8.8.8.8
domain-needed
bogus-priv

sudo systemctl start dnsmasq
sudo nano /etc/sysctl.conf
	net.ipv4.ip_forward=1
	
sudo iptables-restore < /home/cnbis/data/iptables.inline
sudo iptables -nvL

# copy autostart & rc.local
echo "Copy Config(Step)"
cd ~
cp -rf /home/tennisexpert/config/autostart .config/lxsession/LXDE-pi/
sudo cp -rf /home/tennisexpert/config/rc.local /etc/

echo "Init Done!!!!"

# reboot
sudo reboot