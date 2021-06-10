from flask_restful import Resource
import pymongo
import time
from bson.objectid import ObjectId
from bson.json_util import dumps
import json
from flask import jsonify, request, make_response, Response
from connections import *
from validation import *
import sys
import requests
import base64
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from wsgiref.handlers import format_date_time
from datetime import datetime
from time import mktime
import setup

"""
purpose:Class that handles requests to create users
request-types:POST
"""
class CreateUser(Resource):

    """
    purpose:Create a new user
    pass-in: Json -> {"id":id, "password":password, "question":question, "answer":answer}
    sucessfulReturn: Json -> {"user": user, "status":status}
    possibleErrors: 400 (Bad Content), 400 (User Taken), 500 (Internal/Unknown Error)
    """
    
    def post(self):
        try:
            entry = request.get_json()
            id = entry.get('id')
            password = entry.get('password', '')
            question = entry.get('question', '')
            answer = entry.get('answer', '')
            if not all([validateUserName(id), validatePassword(password), validateQuestion(question), validateAnswer(answer)]):
                response = jsonify({"title":"incorrect values", "message":"Sorry, something about that user is wrong (check none of your fields are empty!)"})
                response.status_code = 400
                return response 
            check = setup.users.db.login.find_one({"id":id})
            if check == None:
                userToInsert = {"id":id, "password":password, "about":"This user hasn't set their about yet", "avatarUrl":"", "question":question, "answer":answer, "subs":[], "posts":[]}
                x = setup.users.db.login.insert_one(userToInsert)
                newUser = setup.users.db.login.find_one({"_id":ObjectId(x.inserted_id)}, {"answer":0, "password":0}) 
                newUser_corrected = dumps(newUser)
                response = jsonify({"user":newUser_corrected,"status":"PASS"})
                response.status_code = 200
                return response
            else:
                response = jsonify({"title":"user alredy exists", "message":"Sorry, that user already exists"})
                response.status_code = 400
                return response
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests to access users
request-types:POST
"""
class AccessUser(Resource):

    """
    purpose:Access/Check a users details
    pass-in: Json -> {"id":id, "password":password}
    sucessfulReturn: Json -> {"user": user, "status":status}
    possibleErrors: 400 (Unknown pair), 500 (Internal/Unknown Error)
    """
    
    def post(self):
        try:
            entry = request.get_json()
            id = entry.get('id', '')
            password = entry.get('password', '')
            check = setup.users.db.login.find_one({"id":id, "password":password}, {"_id":0, "id":1, "question":1, "about":1, "avatarUrl": 1})
            if check == None:
                response = jsonify({"title":"unknown user", "message":"Sorry, we have no record of the username/password combo"})
                response.status_code = 400
                return response
            else:
                user_corrected = dumps(check)
                response = jsonify({"user":user_corrected,"status":"PASS"})
                response.status_code = 200
                return response
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests to delete users
request-types:POST
"""
class DeleteUser(Resource):

    """
    purpose:Delete a users account
    pass-in: Json -> {"id":id, "password":password}
    sucessfulReturn: Json -> {status":status}
    possibleErrors: 400 (Unknown Pair), 500 (Internal/Unknown Error)
    """

    def post(self):
        try:
            entry = request.get_json()
            id = entry.get('id', '')
            password = entry.get('password', '')
            check = setup.users.db.login.find_one({"id":id, "password":password})
            if check == None:
                response = jsonify({"title":"unknown user", "message":"Sorry, we have no record of the username/password combo"})
                response.status_code = 400
                return response
            else:
                setup.users.db.login.delete_one({"id":id, "password":password})
                response = jsonify({"status":"PASS"})
                response.status_code = 200
                return response
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests to update users
request-types:POST
"""
class UpdateUser(Resource):

    """
    purpose:Update password of a user
    pass-in:Json -> {"id": id, "password":password, "answer":answer}
    sucessfulReturn: Json -> {"user": user, "status":status}
    possibleErrors: 400 (Wrong Answer), 500 (Internal/Unknown Error)
    """
    
    def post(self):
        try:
            entry = request.get_json()
            id = entry.get('id', '')
            newPassword = entry.get('password', '')
            answer = entry.get('answer','')
            check = setup.users.db.login.find_one({"id":id, "answer":answer}, {"_id":0, "id":1, "question":1})
            if check == None:
                response = jsonify({"title":"wrong answer", "message":"Sorry, that is the wrong answer for the security question"})
                response.status_code = 400
                return response
            else:
                update_password = {"$set":{"id":id, "password":newPassword}}
                setup.users.db.login.update_one(check,update_password)
                response_user = setup.users.db.login.find_one({"id":id, "password":newPassword}, {"_id":0, "id":1, "question":1})
                response_user_corrected = dumps(response_user)
                response = jsonify({"user": response_user_corrected,"status":"PASS"})
                response.status_code = 200
                return response
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests to update a users Question and Answer verafied by their password
request-types:POST
"""

class UpdateQAWithPassword(Resource):

    """
    purpose:Update the Question and Answer of a user verified using their password
    pass-in:Json -> {"id": id, "password":password, "question":question "answer":answer}
    sucessfulReturn: Json -> {"user": user, "status":status}
    possibleErrors: 400 (Wrong password), 500 (Internal/Unknown Error)
    """
    def post(self):
        try:
            entry = request.get_json()
            id = entry.get('id', '')
            password = entry.get('password', '')
            question = entry.get('question', '')
            answer = entry.get('answer', '')
            check = setup.users.db.login.find_one({"id":id, "password":password})
            if check == None:
                response = jsonify({"title":"unknown user", "message":"Sorry, we have no record of the username/password combo"})
                response.status_code = 400
                return response
            else:
                update_QA = {"$set":{"question":question, "answer":answer}}
                setup.users.db.login.update_one(check,update_QA)
                response_user = setup.users.db.login.find_one({"id":id, "password":password}, {"_id":0, "id":1, "question":1})
                response = jsonify({"user": response_user,"status":"PASS"})
                response.status_code = 200
                return response
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests to update a users password verified by their current password
request-types:POST
"""
class UpdatePasswordWithPassword(Resource):
    
    """
    purpose:Update the password of a user verified using their current password
    pass-in:Json -> {"id": id, "password":password, "new_password":new_password}
    sucessfulReturn: Json -> {"user": user, "status":status}
    possibleErrors: 400 (Wrong password), 500 (Internal/Unknown Error)
    """

    def post(self):
        try:
            entry = request.get_json()
            id = entry.get('id', '')
            password = entry.get('password', '')
            new_password = entry.get('new_password', '')
            check = setup.users.db.login.find_one({"id":id, "password":password})
            if check == None:
                response = jsonify({"title":"unknown user", "message":"Sorry, we have no record of the username/password combo"})
                response.status_code = 400
                return response
            else:
                update_QA = {"$set":{"id":id, "password":new_password}}
                setup.users.db.login.update_one(check,update_QA)
                response_user = setup.users.db.login.find_one({"id":id, "password":new_password}, {"_id":0, "id":1, "question":1})
                response = jsonify({"user": response_user,"status":"PASS"})
                response.status_code = 200
                return response
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests to get a user's question
request-types:PUT
"""
class GetQuestion(Resource):
    """
    purpose:Get the question of a user 
    pass-in:Json -> {"id": id}
    sucessfulReturn: Json -> {"user": user, "status":status}
    possibleErrors: 400 (Unknown User), 500 (Internal/Unknown Error)
    """
    def put(self):
        try:
            entry = request.get_json()
            id = entry.get('id', '')
            check = setup.users.db.login.find_one({"id":id}, {"_id":0, "id":1, "question":1})
            if check == None:
                response = jsonify({"title":"unknown user", "message":"Sorry, we have no record of the username"})
                response.status_code = 400
                return response
            else:
                response_user = dumps(check)
                response = jsonify({"user":response_user})
                response.status_code = 200
                return response
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests to get the details for a specific profile in line with the fedaration protocol
request-types:GET
"""
class ProfileDetailsFed(Resource):
    """
    purpose:Get the profile details for a specific user as part of the superground protocol
    pass-in:Json -> None
    sucessfulReturn: Json -> {User object}
    possibleErrors: 400 (Bad Entry), 404 (Unknown user), 500 (Internal/Unknown Error)
    """
    def get(self, id):
        try:
            if not validateUserName(id):
                response = jsonify({"title":"incorrect values", "message":"Sorry, something about that user is wrong (check none of your fields are empty!)"})
                response.status_code = 400
                return response 

            user = setup.users.db.login.find_one({"id":id}, {"_id":0, "question":0, "answer":0, "password":0})
            if user == None:
                response = jsonify({"title":"User Not Found", "message":"Sorry, we have no record of that user, they might have been deleted"})
                response.status_code = 404
                return response
            return user, 200
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests to get the details for a specific profile in line with our local application
request-types:GET
"""

class ProfileDetailsAPI(Resource):

    """
    purpose:Get the profile details for a specific user in our local application 
    pass-in:Json -> None
    sucessfulReturn: Json -> {User object}
    possibleErrors: 400 (Bad Entry), 404 (Unknown User), 400 (Unknwon Server), 500 (Internal/Unknown Error)
    """

    def get(self, id):
        try:
            target = request.args.get('targetHost')

            if not validateUserName(id):
                response = jsonify({"title":"incorrect values", "message":"Sorry, something about that user is wrong (check none of your fields are empty!)"})
                response.status_code = 400
                return response 

            if target == "cs3099user-a4.host.cs.st-andrews.ac.uk":

                user = setup.users.db.login.find_one({"id":id}, {"_id":0, "question":0, "answer":0, "password":0})
                if user == None:
                    response = jsonify({"title":"User Not Found", "message":"Sorry, we have no record of that user, they might have been deleted"})
                    response.status_code = 404
                    return response
                
                return user, 200
            else:
                if validateServer(target) == False:
                    response = jsonify({"title":"incorrect target", "message":"Sorry, something about the server " + target + " is not correct"})
                    response.status_code = 400
                    return response 

                user_id = request.headers.get('User-ID', '')
                host = request.headers.get('Client-Host', '')
                digest = generateDigest("")

                


                now = datetime.now()
                stamp = mktime(now.timetuple())
                dateResult = format_date_time(stamp)
                requestPath = "get /fed/users/" + id

                sigtext = generateSigWithUser(requestPath, target, digest, dateResult, "test")

                header = {'Digest' : "sha-512=" + digest, 'Signature' : sigtext, "Client-Host": "cs3099user-a4.host.cs.st-andrews.ac.uk", "Date": dateResult, "User-ID": "test"}

                url = "https://" + target + "/fed/users/" + id

                resp = requests.get(url, headers=header, timeout=3)
                if resp.status_code == 200:
                    check_finished = dumps(resp.json())
                    r = Response(check_finished, status = 200, mimetype ="application/json")
                    r.headers["Content-Type"] = "application/json"
                    r.headers["Cache-Control"] = "max-age=60"
                    return r
                else:
                    check_finished = dumps(resp.json())
                    r = Response(check_finished, status = resp.status_code, mimetype ="application/json")
                    r.headers["Content-Type"] = "application/json"
                    return r
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests returning a list of all users in line with the federation protocol 
request-types:GET
"""

class GetUsersFed(Resource):

    """
    purpose:Return a list of all users signed up to the applications for the supergroup protocol 
    pass-in: None
    sucessfulReturn: Json -> {List of User IDs}
    possibleErrors: 500 (Internal/Unknown Error)
    """

    def get(self):
        try:
            prefix = request.args.get('prefix')

            response_users = []
            if prefix == None:
                iterator = setup.users.db.login.find({}, {"_id":0, "id":1})
                for record in iterator:
                        response_users += [record.get('id','')]
            else:
                searchField = ".*" + prefix + ".*"

                extraIterator = setup.users.db.login.find({"id":{"$regex":searchField}}, {"_id":0, "id":1})
                for record in extraIterator:
                        value = record.get('id','')
                        if value.startswith(prefix):
                            response_users += [value]
            check_finished = dumps(response_users)
            r = Response(check_finished, status = 200, mimetype ="application/json")
            r.headers["Content-Type"] = "application/json"
            r.headers["Cache-Control"] = "max-age=60"
            return r
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests returning a list of all users for our local application 
request-types:GET
"""

class GetUsersAPI(Resource):

    """
    purpose:Return a list of all users signed up to the local application 
    pass-in: None
    sucessfulReturn: Json -> {List of User IDs}
    possibleErrors: 400 (unknown server), 500 (Internal/Unknown Error)
    """

    def get(self):
        try:
            target = request.args.get('targetHost')

            if target == "cs3099user-a4.host.cs.st-andrews.ac.uk":
                prefix = request.args.get('prefix')

                response_users = []
                if prefix == None:
                    iterator = setup.users.db.login.find({}, {"_id":0, "id":1})
                    for record in iterator:
                            response_users += record.get('id','')
                else:
                    searchField = ".*" + prefix + ".*"

                    extraIterator = setup.users.db.login.find({"id":{"$regex":searchField}}, {"_id":0, "id":1})
                    for record in extraIterator:
                            value = record.get('id','')
                            if value.startswith(prefix):
                                response_users += [value]
                check_finished = dumps(response_users)
                r = Response(check_finished, status = 200, mimetype ="application/json")
                r.headers["Content-Type"] = "application/json"
                r.headers["Cache-Control"] = "max-age=60"
                return r
            else:
                if validateServer(target) == False:
                    response = jsonify({"title":"incorrect target", "message":"Sorry, something about the server " + target + " is not correct"})
                    response.status_code = 400
                    return response 
                    
                user_id = request.headers.get('User-ID', '')
                host = request.headers.get('Client-Host', '')
                digest = generateDigest("")


                now = datetime.now()
                stamp = mktime(now.timetuple())
                dateResult = format_date_time(stamp)
                requestPath = "get /fed/users"

                sigtext = generateSigWithUser(requestPath, target, digest, dateResult, "test")

                header = {'Digest' : "sha-512=" + digest, 'Signature' : sigtext, "Client-Host": "cs3099user-a4.host.cs.st-andrews.ac.uk", "Date": dateResult, "User-ID": "test"}

                url = "https://" + target + "/fed/users"
                resp = requests.get(url, params = request.args, headers = header, timeout=3)
                if resp.status_code == 200:
                    check_finished = dumps(resp.json())
                    r = Response(check_finished, status = 200, mimetype ="application/json")
                    r.headers["Content-Type"] = "application/json"
                    r.headers["Cache-Control"] = "max-age=60"
                    return r
                else:
                    check_finished = dumps(resp.json())
                    r = Response(check_finished, status = resp.status_code, mimetype ="application/json")
                    r.headers["Content-Type"] = "application/json"
                    return r
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests to update a users about section 
request-types:PUT
"""

class UpdateAbout(Resource):

    """
    purpose:Update the about section for a specific user
    pass-in:Json -> {"id": id, "about": about}
    sucessfulReturn: Json -> {"status": status}
    possibleErrors: 400 (Unknown user), 500 (Internal/Unknown Error)
    """

    def put(self):
        try:
            entry = request.get_json()
            id = entry.get('id', '')
            about = entry.get('about', '')
            check = setup.users.db.login.find_one({"id":id})
            if check == None:
                response = jsonify({"title":"unknown user", "message":"Sorry, we have no record of the username"})
                response.status_code = 400
                return response
            else:
                setup.users.db.login.update_one(check, {"$set":{"about":about}})
                response = jsonify({"status":"PASS"})
                response.status_code = 200
                return response
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests to update a users avatar
request-types:PUT
"""

class UpdateAvatar(Resource):

    """
    purpose:Update the avatar for a specific user
    pass-in:Json -> {"id": id, "avatarUrl": avatarUrl}
    sucessfulReturn: Json -> {"status": status}
    possibleErrors: 400 (Unknown user), 500 (Internal/Unknown Error)
    """

    def put(self):
        try:
            entry = request.get_json()
            id = entry.get('id','')
            avatarUrl = entry.get('avatarUrl', '')
            if check == None:
                response = jsonify({"title":"unknown user", "message":"Sorry, we have no record of the username"})
                response.status_code = 400
                return response
            else:
                setup.users.db.login.update_one(check, {"$set":{"avatarUrl":avatarUrl}})
                response = jsonify({"status":"PASS"})
                response.status_code = 200
                return response
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests to subscribe to a specific community
request-types:PUT
"""

class Subscribe(Resource):

    """
    purpose:Subscribe to a community for a single user
    pass-in:Json -> {"id": id, "community": communityl}
    sucessfulReturn: Json -> {"status": status}
    possibleErrors: 400 (Unknown user), 404 (Unknown Community), 500 (Internal/Unknown Error)
    """

    def put(self):
        try:
            entry = request.get_json()
            id = entry.get('id', '')
            community = entry.get('community', '')
            check = setup.shared_spaces.db.communities.find_one({"id":community})
            if check == None:
                response = jsonify({"title":"Community not found", "message":"The community you tried to subscribe to couldn't be found"})
                response.status_code = 404
                return response
            check2 = setup.users.db.login.find_one({"id":id})
            if check2 == None:
                response = jsonify({"title":"User not found", "message":"The user could not be found"})
                response.status_code = 400
                return response
            setup.users.db.login.update_one({"id":id},{"$push": {"subs":community}})

            response = jsonify({"STATUS":"PASS"})
            response.status_code = 200
            return response
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests to unsubscribe from a specific community
request-types:PUT
"""

class Unsubscribe(Resource):

    """
    purpose:Unsubscribe from a community for user that is already subscribed to that community 
    pass-in:Json -> {"id": id, "community": communityl}
    sucessfulReturn: Json -> {"status": status}
    possibleErrors: 400 (Unknown user), 500 (Internal/Unknown Error)
    """

    def put(self):
        try:
            entry = request.get_json()
            id = entry.get('id', '')
            community = entry.get('community', '')
            check2 = setup.users.db.login.find_one({"id":id})
            if check2 == None:
                response = jsonify({"title":"User not found", "message":"The user could not be found"})
                response.status_code = 400
                return response
            setup.users.db.login.update_one({"id":id},{"$pull": {"subs":community}})

            response = jsonify({"STATUS":"PASS"})
            response.status_code = 200
            return response
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests to return a list of communities a user is subscribed to
request-types:GET
"""

class GetSubs(Resource):

    """
    purpose:Find all of the communities that a user is subscribed to 
    pass-in:Json -> {"id": id}
    sucessfulReturn: Json -> {"id": id, "subs": subs}
    possibleErrors: 400 (Unknown user), 500 (Internal/Unknown Error)
    """

    def get(self, id):
        try:
            check2 = setup.users.db.login.find_one({"id":id})
            if check2 == None:
                response = jsonify({"title":"User not found", "message":"The user could not be found"})
                response.status_code = 400
                return response
            response = jsonify({"id":check2.get('id'), "subs":check2.get('subs')})
            response.status_code = 200
            return response
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response
