#YTRadio

Built for WritheM radio as a possible simple host

## Vagrant
Vagrant creates a fresh VM provisioned specifically for this project. It's useful for maintaining a standardized development environment as well as providing a quick way for new developers to participate without modifying their host machine. To use Vagrant make sure to have both [Vagrant](https://www.vagrantup.com/downloads.html) and [VirturalBox](https://www.virtualbox.org/wiki/Downloads) installed.

First, make sure your ssh-agent is running:

```
eval `ssh-agent`
```

Next make sure your Github SSH key is added to your ssh-agent:

```
ssh-add <~/.ssh/id_rsa | path-to-key>
```

Following that, navigate to the project root and run the command:

```
vagrant up
```

After that ssh into the VM by running the command:

```
vagrant ssh
```

The virual machine will be accessible on the host machine at 192.168.33.10. Vagrant will also have your Github SSH key forwarded into the VM so you can interact with Github like normal.