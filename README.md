#YTRadio
__codenamed LifeBoat__

Each instance of Lifeboat represents a venue in which you and your friends can DJ to an audience all over the world. What makes Lifeboat different from other DJ'ing platforms of the past is that it is light enough to be hosted as an afterthought on almost any server.


The built in chat allows for lifeboat to serve as a fun substitute for a message board or irc room. Host an instance on your company website and let your customers chat while sharing music. Run multiple instances in a docker containers to turn one server in to a de facto music room for several genres (_docker functionality to come_).


#How to Host

##Method 1## __Download a release__
Coming soon, releases will be a zipped folder of pre-minified code; you need only edit `config.json` and run it with `node app.js`

##Method 2## __Build from Source__
_requires git, npm, bower, and gulp_

1. Clone this repo on to your host box (or just download the zip from github, I'm not your mom)
2. `cd` in to the cloned/downloaded repo
3. Ensure gulp is installed with `npm install -g gulp`
4. Run `gulp default` or just `gulp`
5. `cd` in to the newly build `dist` directory
6. Run `npm install`
7. Edit the `config.json.dist` file to match your environment, then save at `config.json`
8. Run the app with `node app.js` or your favorite node monitoring tool like [forever](https://github.com/foreverjs/forever).

The app will start on port 8080 for http or 3000 for https. These can be redirected in `app.js` or forwarded using nginx, iptables, etc


#Development
To edit this to your needs, simply fork this repo then edit the files in `src`. You will need `npm` and `bower` to install dev dependencies and an accessible mysql server. If you wish to contribute back to the project, submit a pull request from your forked repo targeting the `DevBranch` branch.

Below is an alternate method of testing utilizing [Vagrant](https://www.vagrantup.com/downloads.html)


### Vagrant
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
