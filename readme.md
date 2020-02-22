# Installation

1. Clone the repository
- Execute the `npm install --production` command to install the application's dependencies
- Execute the `npm install --development` command to install the development dependencies
- Rename `.env.example` to `.env`
- Change the environment variables within the `.env` file
- Run the `npm run build` command to build your application.

#### Serving front-end content

In order to serve front-end content, simply create a `public` directory within your application's source/build path and place the content within the newly created directory. Please note that any non-defined routes will by default redirect to this directory. You can change this default behavior from inside `src/router`.

#### Security

It is highly recommended that you secure any client accessing the end-points to help prevent [man in the middle][2] attacks, securing the connection is critical to the security of the application and it's end user.

If you wish to secure the connection via a proxy, then you may do so by enabling the `APP_BEHIND_PROXY` option within the `.env` file.

You may also secure the connection directly and this can optionally be used with a proxy server, this is enabled by the `APP_SECURE` option within the `.env` file.
Setting this value to true will require you to include your `key.pem` and `certificate.pem` files within your root directory, or you can optionally let [greenlock][9] handle it.

If you're setting up a local development environment, you can create your own self-signed certificates by creating them with the command below, and then installing the `certificate.pem` to your list of locally trusted roots.
```
openssl req -x509 -out certificate.pem -keyout key.pem \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```

# Setup

> The application uses a [monogodb][8] database.

----
#  Starting the application
> - Run the `npm run start` command in order to start the server. The start script uses [forever][1] to help ensure that your content is continuously being served.
> - Run the `npm run dev` command in order to start the server in development mode. The develop script uses [nodemon][6] to restart based on changes made within the `src` directory (_This command should not be used in a production environment_).

#### Debugging

The application will throw debug errors if something abnormal occurs. You may view these errors by enabling the debug options in your cli using the following command `DEBUG=app:*`, if you're using a windows operating system then you can enable the debug options with this command instead `set debug=app:*` and then running the `npm run dev` command afterwards. The `app` part should be changed to whatever your `APP_NAME` is set to within your `.env` file, for example if your `APP_NAME` is `my-test-app`, then your debug command would look something like `DEBUG=my-test-app:*` if you're running linux, or `set debug=my-test-app:*` if you're running windows.

----
# Contributing/Developing

 UwU

# Testing

> The application utilizes [Mocha][3] and [Chai][4] and [Chai-HTTP][5] to conduct it's unit tests.

  - Follow the installation steps above
  - Change the value of the `NODE_ENV` variable within the `.env` file to `testing`
  - Rebuild the application

  Run the `npm run test` command in order to start executing the test cases.


[1]: https://github.com/foreverjs/forever
[2]: https://en.wikipedia.org/wiki/Man-in-the-middle_attack
[3]: https://github.com/mochajs/mocha
[4]: http://chaijs.com/
[5]: http://chaijs.com/plugins/chai-http/
[6]: http://nodemon.io/
[7]: https://github.com/Automattic/monk
[8]: https://www.mongodb.com/
[9]: https://www.npmjs.com/package/greenlock
