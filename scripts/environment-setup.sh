#!/bin/bash
# Environment setup script for Bonsai

set -e # Exit script immediately on first error.

echo "Updating..."
sudo apt-get update

echo "Setting up MySQL..."

# automate setting root password
export DEBIAN_FRONTEND=noninteractive
sudo debconf-set-selections <<< 'mysql-server mysql-server/root_password password admin'
sudo debconf-set-selections <<< 'mysql-server mysql-server/root_password_again password admin'

echo "Installing MySQL..."
sudo apt-get install mysql-server -y

echo "Setting up quick access to MySQL..."
sudo tee -a /etc/mysql/my.cnf > /dev/null <<'EOB'
[client]
    user=root
    password=admin
EOB

echo "Installing GIT..."
sudo apt-get install git -y

# auto accept github public key, so no prompt during repository cloning
if [[ ! -f /home/vagrant/.ssh/config ]]; then
  sudo -u vagrant touch /home/vagrant/.ssh/config
  sudo -u vagrant echo "Host github.com" >> /home/vagrant/.ssh/config
  sudo -u vagrant echo "StrictHostKeyChecking no" >> /home/vagrant/.ssh/config
  sudo -u vagrant echo "UserKnownHostsFile /dev/null" >> /home/vagrant/.ssh/config
elif [[ "$(grep -i host ~/.ssh/config | grep -c -i github.com)" = "0" ]]; then
  echo "Adding github to hosts.."
  sudo -u vagrant sed '/^host/I s/$/ github.com/' /home/vagrant/.ssh/config
fi

echo "Cloning project..."
if [ ! -d /home/vagrant/YTRadio ]; then
  git clone https://github.com/swimmadude66/YTRadio.git
fi
pushd YTRadio # app directory

echo "Installing Nodejs and NPM..."
curl --silent --location https://deb.nodesource.com/setup_4.x | sudo bash -
sudo apt-get install -y nodejs build-essential

echo "Installing Bower..."
sudo npm install bower -g

echo "Installing Grunt..."
sudo npm install grunt-cli -g

echo "Setting npm folder permissions..." # required after installing with -g using sudo as first npm install
sudo chown -R vagrant:vagrant /home/vagrant/.npm/