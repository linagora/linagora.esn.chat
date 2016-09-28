# linagora.esn.chat

Chat component for OpenPaaS ESN.

## Install

While waiting for a npm-based dependency injection handler, you have to install this component in OpenPaaS like this:

**1. Clone linagora.esn.chat and linagora.esn.emoticon**

Clone somewhere, the three following git repository:

 * https://ci.open-paas.org/stash/projects/OM/repos/linagora.esn.rse/browse
 * https://ci.open-paas.org/stash/projects/OM/repos/linagora.esn.emoticon/browse
 * https://ci.open-paas.org/stash/projects/OM/repos/linagora.esn.chat/browse

Go inside linagora.esn.rse repo and run:

    npm install
    npm link

Go inside linagora.esn.emotion and run:

    npm install

Go inside linagora.esn.chat and run:

    npm link linagora-rse
    npm install

**2. Add component in the configuration file**

Add "linagora.esn.chat" in config/default.json:

      "modules": [
        "linagora.esn.core.webserver",
        "linagora.esn.core.wsserver",
        "linagora.esn.emoticon",
        "linagora.esn.chat"
      ],

**3. Create symlink**

In your OpenPaaS ESN directory

    cd path_to_rse
    ln -s path_to_emoticon modules/linagora.esn.emoticon
    ln -s path_to_chat modules/linagora.esn.chat
