import pymongo
import time
from bson.objectid import ObjectId
from bson.json_util import dumps
import json
from flask import Flask, jsonify, request
from flask_restful import Resource, Api
from flask_restful.utils import cors
from flask_cors import CORS, cross_origin
from flask_pymongo import PyMongo
import sys
import socket
from posts import *
from os import environ

from users import *
from communities import *
from connections import *
from utilities import *
from validation import *




#Creating the flask_restful object that waits for requests
app = Flask(__name__)
content = PyMongo(app, uri=str(environ.get("CONTENT_DATABASE_URI"))+ "content")
shared_spaces = PyMongo(app, uri=str(environ.get("SHARED_SPACES_DATABASE_URI")) + "shared_spaces")
users = PyMongo(app, uri=str(environ.get("USERS_DATABASE_URI")) + "users" )
CORS(app)

app.config['SECRET_KEY'] = 'disable the web security'
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['CORS_HEADERS'] = 'Access-Control-Allow-Origin'
#cors = CORS(app, resources={r"/*": {"origins": "*"}})

api = Api(app)


#Adding the resources to the api that are used to make requests

api.add_resource(GetModifiedTimeFed, '/fed/communities/<string:id>/timestamps')
api.add_resource(GetCommunityFed, '/fed/communities/<string:id>')
api.add_resource(GetCommunitiesFed, '/fed/communities')
api.add_resource(PostLogisticsFed, '/fed/posts/<string:id>')
api.add_resource(CreateOrGetPostFed, '/fed/posts')
api.add_resource(ProfileDetailsFed, '/fed/users/<string:id>')
api.add_resource(GetUsersFed, '/fed/users')

api.add_resource(GetModifiedTimeAPI, '/api/communities/<string:id>/timestamps')
api.add_resource(GetCommunityAPI, '/api/communities/<string:id>')
api.add_resource(GetCommunitiesAPI, '/api/communities')
api.add_resource(PostLogisticsAPI, '/api/posts/<string:id>')
api.add_resource(CreateOrGetPostAPI, '/api/posts')
api.add_resource(ProfileDetailsAPI, '/api/users/<string:id>')
api.add_resource(GetUsersAPI, '/api/users')


api.add_resource(CreateOrDeleteCommunity, '/api/CreateOrDeleteCommunity/')
api.add_resource(EditCommunity, '/api/EditCommunity/<string:id>')
api.add_resource(CreateUser, '/api/CreateUser/')
api.add_resource(AccessUser, '/api/AccessUser/')
api.add_resource(UpdateUser, '/api/UpdateUser/')
api.add_resource(GetQuestion, '/api/GetQuestion/')
api.add_resource(DeleteUser, '/api/DeleteUser/')
api.add_resource(UpdateQAWithPassword, '/api/UpdateQAWithPassword/')
api.add_resource(UpdatePasswordWithPassword, '/api/UpdatePasswordWithPassword/')
api.add_resource(UpdateAbout, '/api/UpdateAbout/')
api.add_resource(UpdateAvatar, '/api/UpdateAvatar')
api.add_resource(GetServers, '/fed/discover')
api.add_resource(Subscribe, '/api/users/subscribe/')
api.add_resource(Unsubscribe, '/api/users/unsubscribe/')
api.add_resource(GetSubs, '/api/users/subscribe/<string:id>')
api.add_resource(SendMessage, '/fed/users/<string:id>')
api.add_resource(GetKey, '/fed/key')
api.add_resource(LargeSearch, '/api/LargeSearch/')
api.add_resource(LikePost, '/api/LikePost/')
api.add_resource(DislikePost, '/api/DislikePost/')
api.add_resource(DeLikePost, '/api/DeLikePost/')
api.add_resource(DeDislikePost, '/api/DeDislikePost/')


@app.after_request
def after_request(response):
  response.headers.add('Access-Control-Allow-Origin', '*')
  response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,User-ID,Client-Host,Target-Host')
  response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  return response


if __name__ == '__main__':
    hostname = socket.gethostname()
    ip_address = socket.gethostbyname(hostname)
    app.run(debug=True, host=ip_address, port=21709)

