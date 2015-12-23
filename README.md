#YTRadio

Project Lifeboat

## Environment Setup

### Ubuntu Development VM (Powered by Vagrant and VirtualBox)

Vagrant creates a fresh VM provisioned specifically for this project. It's useful for maintaining a standardized development environment as well as providing a quick way for new developers to participate without modifying their host machine. To use Vagrant make sure to have both [Vagrant](https://www.vagrantup.com/downloads.html) and [VirturalBox](https://www.virtualbox.org/wiki/Downloads) version >=5 installed. This Vagrant implementation starts with a base Ubuntu image and then alters hypervisor settings as well as manages provisioning scripts.

Requires at least 512 MB of memory.

#### Setup Steps
1. Clone the repository/fork
	```
	git clone https://github.com/swimmadude66/YTRadio.git
	```

2. Navigate to the project directory
	```
	cd YTRadio
	```

3. Run the Vagrantfile to setup the environment
	```
	vagrant up
	```

	The virual machine will now be accessible locally at `192.168.33.10` and Lifeboat will be available at `192.168.33.10:8080`

4. SSH into the development VM
	```
	vagrant ssh
	```

#### Use
By default Vagrant creates a synced folder between the VM and the folder `vagrant up` was run from on the host machine. It's located at `/vagrant` on the VM. Grunt is used to sync that folder with the Vagrant user home directory on the VM using [rsync](https://github.com/jedrichards/grunt-rsync). In this way, code edits can take place on your host or from within the VM.

Provisioning will install MySQL within the VM and setup root access locally.

##### Commands (from within the VM)
Update VM with host(pulls changes from host onto the VM):
```
grunt
```

Update Host with VM(pushes changes from the VM to the host):
```
grunt update-host
```

List PM2 Processes:
```
pm2 list
```

View Server Logs:
```
pm2 logs
```

Restart Server:
```
pm2 restart all
```

For more PM2 commands see: http://pm2.keymetrics.io/docs/usage/quick-start/#cheat-sheet

#### Components

##### Grunt Task Manager
[Grunt](http://gruntjs.com/) is a task manager used only to sync files between your host machine and the development VM. This is useful for those who already have a nice text editor/IDE on their host. It can be used for many other things (commonly managing css, builds, etc.) and [Gulp](http://gulpjs.com/) is another popular alternative.

##### PM2
[PM2](http://pm2.keymetrics.io/) is a great Node process manager. It manages all server processes, keeps logs, auto restarts, and many other nice features.