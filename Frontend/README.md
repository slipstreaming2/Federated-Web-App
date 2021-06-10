# Front-end

In order to run the front-end, you will first need to install all of the necessary components (including material-ui components). This can be done using:

'npm install'

Then, to run the front-end, one must use the command:

'npm start'

Ensure that in package.json, that the 'PORT-NUMBER' value is assigned to your own

authors: cb373, cd240 & mcd8

# Back-end

In order to run on port 21707 and your local ip use:
    python3 setup.py

This assumes that you have the database server running on the pseudo-user and that this python is also running on the pseudo-users (The python will run elsewhere but you won't get much in the way of results from a database that you can't connect to). Consult authors if you are unsure on usage for the database. To run the database use:
    ~/mongodb/bin/mongod --dbpath ~/mongodb_data --auth --port <port>

Can be used with HTTP requests (curl for testing, frontend for usage)

Authors: bh77 & cmlm2


