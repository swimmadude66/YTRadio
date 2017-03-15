# YTRadio
__codenamed LifeBoat__

Each instance of Lifeboat represents a venue in which you and your friends can DJ to an audience all over the world. What makes Lifeboat different from other DJ'ing platforms of the past is that it is light enough to be hosted as an afterthought on almost any server.


The built in chat allows for lifeboat to serve as a fun substitute for a message board or irc room. Host an instance on your company website and let your customers chat while sharing music. Run multiple instances in a docker containers to turn one server in to a de facto music room for several genres


# How to Host

## Method 1 - __Download a release__
Coming soon, releases will be a zipped folder of pre-minified code

## Method 2 - __Build from Source__
_requires git, node, and npm_

1. Clone this repo on to your host box (or just download the zip from github, I'm not your mom)
2. `cd` in to the cloned/downloaded repo
3. run `npm i`, then `npm run gulp`
4. `npm start` will host the app on the default port!

# Development
After cloning and installing, you can run `npm run dev` to create a live-reloading instance of the app. (note, you will need to run `npm start` or `npm start-dev` in a separate terminal to launch the api)

Additionally, you can configure the app by workspace by creating and editing a `.env` fle in the project root.  The contents of the file will be read as KeyValuePairs and overwrite `process.env` variables.

