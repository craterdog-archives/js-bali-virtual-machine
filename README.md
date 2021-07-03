## The Bali Virtual Machine™ (v2)
<img src="https://craterdog.com/images/CraterDogLogo.png" width="50%">

**_WARNING_**
_This project is currently being converted to version 2 of the base components. It is not yet ready for prime-time._

### Quick Links
For more information on this project click on the following links:
 * [project documentation](https://github.com/craterdog-bali/js-bali-virtual-machine/wiki)
 * [node packages](https://www.npmjs.com/package/bali-virtual-machine)
 * [release notes](https://github.com/craterdog-bali/js-bali-virtual-machine/wiki/release-notes)
 * [code examples](https://github.com/craterdog-bali/js-bali-virtual-machine/wiki/code-examples)

### Getting Started
To install this NodeJS package, execute the following command:
```
npm install bali-virtual-machine
```
Then add the following line to your NodeJS modules:
```
const debug = 1;  // debugging level: [0..3]
const notary = require('bali-digital-notary').service(debug);
const configuration = {
    names: '<your bucket name>',
    documents: '<your bucket name>',
    contracts: '<your bucket name>',
    messages: '<your bucket name>'
};
const repository = require('bali-document-repository').service(notary, configuration, debug);
const machine = require('bali-virtual-machine').api(repository, debug);
```

### Contributing
Project contributors are always welcome. Create a
[fork](https://github.com/craterdog-bali/js-bali-virtual-machine) of the project and add cool
new things to the project. When you are ready to contribute the changes create a subsequent
["pull request"](https://help.github.com/articles/about-pull-requests/). Any questions and
comments can be sent to [craterdog@gmail.com](mailto:craterdog@gmail.com).
