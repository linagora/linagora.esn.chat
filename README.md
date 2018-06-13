# linagora.esn.chat

Chat component for OpenPaaS ESN.

## Install

*Note: The following instructions assumes that you have already installed OpenPaaS ESN in the path referenced by $ESN below.*

While waiting for a npm-based dependency injection handler, you have to install the Chat and Emoticon components in OpenPaaS ESN like this:

**1. Clone linagora.esn.chat and linagora.esn.emoticon**

Clone the `linagora.esn.chat` and `linagora.esn.emoticon` repositories.

```
git clone https://ci.linagora.com/linagora/lgs/openpaas/linagora.esn.emoticon.git
git clone https://ci.linagora.com/linagora/lgs/openpaas/linagora.esn.chat
```

Go inside OpenPaaS ESN repository:

```
cd $ESN
npm install
npm link
```

Go inside `linagora.esn.emotion` folder and run:

```
npm install
```

Go inside `linagora.esn.chat` folder and run:

```
npm link linagora-rse
npm install
```

**2. Add the modules in the OpenPaaS ESN configuration file**

You must add "linagora.esn.emoticon" and "linagora.esn.chat" in the modules section in `$ESN/config/default.NODE_ENV.json`. NODE_ENV is the environment variable used to define if the node application is running in 'production' or in 'dev' (the default environment is 'dev').
Copy the 'modules' array from `$ESN/config/default.json` into `$ESN/config/default.NODE_ENV.json` (`$ESN/config/default.dev.json` or `$ESN/config/default.production.json`) and add the "linagora.esn.emoticon" and "linagora.esn.chat" items:

```
"modules": [
  "linagora.esn.core.webserver",
  "linagora.esn.core.wsserver",
  "linagora.esn.emoticon",
  "linagora.esn.chat"
],
```

**3. Create symbolic links**

The modules must be available in the `$ESN/modules` folder:

```
cd $ESN
ln -s path_to_emoticon modules/linagora.esn.emoticon
ln -s path_to_chat modules/linagora.esn.chat
```

## Run

Once installed, you can start OpenPaaS ESN as usual. The Chat module is available in the application grid menu.

## Run in Docker

**1. Run OpenPaaS**

Pull docker containers and start them using docker-compose as described in the OpenPaaS documentation.

```
cd $ESN
docker-compose -f ./docker/dockerfiles/platform/docker-compose-images.yml pull
ESN_PATH=$PWD PROVISION=true ESN_HOST=192.168.1.17 DOCKER_IP=127.0.0.1 docker-compose -f ./docker/dockerfiles/platform/docker-compose-images.yml up
```

**2. Add emoticon and chat dependencies to OpenPaaS**

- Connect to the `esn` container

```
docker exec -it esn bash
```

- Clone emoticon repository, then install dependencies

```
cd /var/www/modules
git clone https://ci.open-paas.org/stash/scm/om/linagora.esn.emoticon.git
cd linagora.esn.emoticon
npm install --production
bower install --production --allow-root
```

- Clone chat repository, then install dependencies

```
cd /var/www/modules
git clone https://ci.open-paas.org/stash/scm/om/linagora.esn.chat.git
cd linagora.esn.chat
npm install --production
bower install --production --allow-root
```

- Add the modules in the configuration

```
apt-get update
apt-get install vim
vi /var/www/config/default.json
```

Then add chat and emoticon modules in the modules list

```
"modules": [
  "linagora.esn.core.webserver",
  "linagora.esn.core.wsserver",
  ...
  "linagora.esn.emoticon",
  "linagora.esn.chat"
],
```

**3. Restart the ESN container**

The ESN must be restarted to take new modules into account, from your terminal:

 ```
docker restart esn
 ```
