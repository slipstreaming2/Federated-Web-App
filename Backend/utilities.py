from flask_restful import Resource
from flask_api import status
import pymongo
import time
from bson.objectid import ObjectId
from bson.json_util import dumps
import json
from flask import jsonify, request, Response
from connections import *
import requests
import base64
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from wsgiref.handlers import format_date_time
from datetime import datetime
from time import mktime
import setup

class LargeSearch(Resource):

    """
    purpose:Do a Large scale search
    pass-in: Json -> {"searchField":searchfield}
    sucessfulReturn: Json -> {listOfCommunities, listOfPosts, listOfUsers objects}
    possibleErrors: 500 (Internal/Unknown Error)
    """

    def put(self):
        entry = request.get_json()
        searchField = ".*" + entry.get('searchField','') + ".*"
        communitiesIterator = setup.shared_spaces.db.communities.find({"title":{"$regex":searchField,'$options' : 'i'}})
        response_communities = dumps(communitiesIterator)

        postsIterator = setup.content.db.posts.find({"title":{"$regex":searchField,'$options' : 'i'}}, {"dislikeUsers":0, "likeUsers":0})
        response_posts = dumps(postsIterator)

        usersIterator = setup.login.db.users.find({"id":{"$regex":searchField,'$options' : 'i'}}, {"id":1})
        response_users = dumps(usersIterator)

        response = jsonify({"communities":response_communities, "posts":response_posts, "users":response_users})
        return response


class GetServers(Resource):

    """
    purpose:Get a list of live servers
    pass-in: None
    sucessfulReturn: Json -> {listOfServers strig}
    possibleErrors: 500 (Recursion Nightmare), 500 (Internal/Unknown Error)
    """

    def get(self):
        print(request.headers.get("Client-Host"))
        if request.headers.get("Client-Host") == None:
            response = jsonify({"title":"Loop", "message":"Someone messed up their recursive base case"})
            response.status_code = 500
            return response
        listOfServers = ['cs3099user-a1.host.cs.st-andrews.ac.uk', 'cs3099user-a6.host.cs.st-andrews.ac.uk', 'cs3099user-a7.host.cs.st-andrews.ac.uk', 'nebula0.herokuapp.com', 'cs3099user-a9.host.cs.st-andrews.ac.uk', 'bc89.host.cs.st-andrews.ac.uk', 'asp9@host.cs.st-andrews.ac.uk']
        active = []
        
        for server in listOfServers:
            try:
                digest = generateDigest("")

                now = datetime.now()
                stamp = mktime(now.timetuple())
                dateResult = format_date_time(stamp)
                requestPath = "get /fed/discover"

                sigtext = generateSig(requestPath, server, digest, dateResult)

                header = {'Digest' : "sha-512=" + digest, 'Signature' : sigtext, "Client-Host": "cs3099user-a4.host.cs.st-andrews.ac.uk", "Date": dateResult}
                url = "https://" + server + "/fed/discover"
                print(url)
                resp = requests.get(url, headers = header, timeout=4)
                print(resp.status_code)
                if resp.status_code == 200:
                    active.append(server)
                else:
                    print(resp.text)
            except:
                print("Tell " + server + " they aren't serving our request")

        listOfServers_corrected = json.dumps(active)

        r = Response(listOfServers_corrected, status = 200, mimetype ="application/json")
        r.headers["Content-Type"] = "application/json"
        r.headers["Cache-Control"] = "max-age=60"
        return r


class GetKey(Resource):

    """
    purpose:Get the server's public key
    pass-in: None
    sucessfulReturn: PEM key -> {pem public key}
    possibleErrors: 400 (Bad Content), 400 (User Taken), 500 (Internal/Unknown Error)
    """

    def get(self):


        with open("private.pem", "rb") as key_file: 
            private_key = serialization.load_pem_private_key(
                key_file.read(),
                password=None,
            )

        public_key = private_key.public_key()
        pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

        r = Response(pem.decode("utf-8"), status = 200, mimetype ="application/x-pem-file")
        r.headers["Content-Type"] = "application/x-pem-file"
        r.headers["Cache-Control"] = "max-age=60"
        return r

     


### NOT IMPLEMENTED BELOW ###

class SendMessage(Resource):
    def post(self, id):
        response = jsonify({"title":"Not Implemented", "message":"Craig is bad at his job and either hasn't gotten to this/will not be getting to this"})
        response.status_code = 501
        return response