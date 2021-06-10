# project-code
Welcome to the backend!

This following assumes that you have the database server running on the pseudo-user and that this python is also running on the pseudo-users (The python will run elsewhere but you won't get much in the way of results from a database that you can't connect to). Consult authors if you are unsure on usage for the database. To run the database use:

    ~/mongodb/bin/mongod --dbpath ~/mongodb_data --auth --port <port>

Can be used with HTTP requests (curl for testing, frontend for usage)


To deploy the application ssh into the university systems. 
Then access the pseudo user using the command: 

    sudo -u cs3099user-a4 bash -l

Once in the pseudo user, use the following command to list all the current tmux sessions running:

    tmux ls 

This should bring up 3 tmux sessions, frontend_server, backend_server and database_server. To attach to one of these servers, user the following command:

    tmux attach -t <server_name>

Once inside the tmux session, kill the current server by using CRTL + c. 
Then pull the most recent version of your code from the gitlab using: 

    git pull

Once the new code is in the tmux session, use one of the following two commands to restart the server:

    Frontend: npm start
    
    Backend: gunicorn --workers=2 --reload  --bind 138.251.22.78:21709 wsgi:app

Once the server is up and running, use CTRL + b, d one after another to exit the tmux session. 

You have sucessfully deployed your new code to the production server. 

Authors: bh77 & cmlm2

