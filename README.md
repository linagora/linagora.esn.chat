# linagora.esn.chat

Chat component for OpenPaaS ESN.

## Install

While waiting for a npm-based dependency injection handler, you have to install this component in OpenPaaS like this:

**1. NPM install**

In your OpenPaaS ESN directory

    npm install linagora.esn.chat

**2. Add component in the configuration file**

Add "linagora.esn.chat" in config/default.json:

      "modules": [
        "linagora.esn.core.webserver",
        "linagora.esn.core.wsserver",
        "linagora.esn.chat"
      ],

**3. Create symlink**

In your OpenPaaS ESN directory

    ln -s node_modules/linagora.esn.chat modules/linagora.esn.chat

