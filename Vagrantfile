# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|

  # base box
  config.vm.box = "ubuntu/trusty64"
  config.vm.hostname = "ytradio-dev"

  # Create a private network
  config.vm.network "private_network", ip: "192.168.33.10"
  
  # Due to ubuntu/trusty64 bug that does not allow for direct passing of ssh keys
  # We have to create a file in the etc directory that allows sudo access to the ssh socket
  config.vm.provision :shell do |shell|
    shell.inline = "touch $1 && chmod 0440 $1 && echo $2 > $1"
    shell.args = %q{/etc/sudoers.d/root_ssh_agent "Defaults env_keep += \"SSH_AUTH_SOCK\""}
  end

  # provision scripts
  config.vm.provision :shell, path: "./scripts/general.setup.sh", privileged: false

  config.vm.provision :shell, path: "./scripts/mysql.install.sh", privileged: true
  config.vm.provision :shell, path: "./scripts/mysql.start.sh", privileged: true, run: "always"
  config.vm.provision :shell, path: "./scripts/mysql.setup.sh", privileged: false

  config.vm.provision :shell, path: "./scripts/server.start.sh", privileged: false

  # Enable SSH agent forwarding (for github key)
  config.ssh.forward_agent = true

  # virtual box provider config  
  config.vm.provider "virtualbox" do |vb|
   vb.name = "ytradio-dev"

   # Use VBoxManage to customize the VM. For example to change memory:
   vb.customize ["modifyvm", :id, "--memory", 512]
  end

end