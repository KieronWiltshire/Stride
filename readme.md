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

When developing an application on top of this template, you should stay consistent with the design principles already set in place. You should also develop following the designed lifecycle.

### Design principles

1. Services *should* be written directly within the `src` directory. Examples are the `mailer` or `database` files, those are services.
- Routers *should* only be defined within the `routes` directory.
- Routers *must* extend from `src/routes/index.js`.
- Routes *should* always redirect to functions defined within your controllers.
- Middlewares *should* only exist within the `src/middleware` directory.
- Controllers *should* only exist within the `src/controllers` directory.
- Controllers *should* only format the incoming request to fit the requirements of an API function.
- All of your application *should* be written and treated as an API, even if certain aspects of the code are not exposed publicaly.
- You *should* only create an extension of `Error` if it has a HTTP error equivalent, if it does not you should treat your error as an `ErrorCode` which is then pushed to the relevant error.
- You *should* create a custom `ErrorCode` for exceptions that can occur during a request's lifecycle.
- Any errors that are not thrown by your application and are instead thrown by dependencies such as database drivers *should* be ignored and handled by the error handler unless you need to respond to the client meaningfully, for example if you have a database connection error, this is an app specific error and should be ignored, however if you have an issue inserting a record into the database due to a duplicate entry then it is acceptable to catch this error and return the custom error response & associated error codes.
- Custom config files *should* only exist within `src/config`.
- Config files *should* be loaded and accessed using the `respondent` npm package.
- Database tables that are required for the application to function *should* be created and maintained through the use of migrations.
- Migrations *should* only exist within the `migrations` directory.
- Migrations *should* only be created using the `mogront` npm package, you can use the cli like so `npm run mogront <args>` command.
- When creating new files that you'd like to debug, please use the application's namespace. An example is as follows:

```JavaScript
import Respondent from 'respondent';
import {default as createDebugger} from 'debug';

const config = new Respondent({ rootDir: Path.join(__dirname, 'config') });
const debug = createDebugger(config.get('app.name') + ':' + 'your-namespace-can-go-here');
```

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
