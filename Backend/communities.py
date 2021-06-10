from flask_restful import Resource
import pymongo
import time
from bson.objectid import ObjectId
from bson.json_util import dumps, default
import json
from flask import jsonify, request, make_response, Response
from connections import *
import sys
import requests
import base64
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from wsgiref.handlers import format_date_time
from datetime import datetime
from time import mktime
from validation import *
import setup



"""
purpose:Class that handles requests to create or delete communities
request-types:POST, DELETE
"""
class CreateOrDeleteCommunity(Resource):

    """
    purpose:Create a community
    pass-in: Json -> {"title":title, "description":description, "id":id, "hostname":hostname}
    successfulReturn: Json -> {"community":community , "status":status}
    possibleErrors: 400 (bad entry), 400 (missing community), 500 (Internal/Unknown Error)
    """
    
    def post(self):
        try:
            entry = request.get_json()
            title = entry.get('title', '')
            community_id = title.replace(" ", "_").lower()
            description = entry.get('description', '')
            id = entry.get('id', '')
            hostname = entry.get('hostname', '')
            if not all([validateCommunityTitle(title), validateCommunityDesc(description)]):
                response = jsonify({"title":"incorrect values", "message":"Sorry, something about that community is wrong (check none of your fields are empty!)"})
                response.status_code = 400
                return response 
            example_community = {"id":community_id,"title":title,"description":description,"admins":[{"id":id, "host":hostname}]}
            check = setup.shared_spaces.db.communities.find_one({"id":community_id})
            if check == None:
                x = setup.shared_spaces.db.communities.insert_one(example_community)
                inserted_community = setup.shared_spaces.db.communities.find_one({"_id":ObjectId(x.inserted_id)}, {"_id":0})
                inserted_community_corrected = dumps(inserted_community)
                response = jsonify({"community":inserted_community_corrected,"status":"PASS"})
                response.status_code = 201
                return inserted_community, 200
            else:
                response = jsonify({"title":"Already Exists", "message":"community already exists"})
                response.status_code = 400
                return response
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

    """
    purpose:Delete a community
    pass-in: Json -> {"id":id, "user_id":user_id, "id":id, "hostname":hostname}
    successfulReturn: Json -> {"status":status}
    possibleErrors: 404 (Missing Community), 400 (Bad Permissions), 500 (Internal/Unknown Error)
    """

    def delete(self):
        try:
            entry = request.get_json()
            id = entry.get('id','')
            user_id = entry.get('user_id','')
            host = entry.get('hostname','')


            check = setup.shared_spaces.db.communities.find_one({"id":id})
            if check == None:
                response = jsonify({"title":"Missing Community", "message":"Sorry, we have no record of that community"})
                response.status_code = 404
                return response
            elif setup.shared_spaces.db.communities.find({"id":id, "admins": { "$in" : [{"id":user_id, "host":host}]}}).count() == 0:
                response = jsonify({"title":"Bad permissions", "message":"Sorry, you don't have permissions for this community"})
                response.status_code = 400
                return response
            else:
                setup.shared_spaces.db.communities.delete_one({"id":id})
                setup.users.db.login.update_many({"subs":id}, {"$pull": {"subs":id}})
                response = jsonify({"status":"PASS"})
                response.status_code = 200
                return response
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response



"""
purpose:Class that handles requests to get communities in line with the supergroup protocol
request-types:GET
""" 
class GetCommunitiesFed(Resource):
    
    """
    purpose:Get all communities in line with the supergroup protocol 
    pass-in:None
    successfulReturn: Json -> {"collection":collection}
    possibleErrors: 500 (Internal/Unknown Error)
    """
    
    def get(self):
        try:
            iterator = setup.shared_spaces.db.communities.find({}, {"_id":0, "id":1})
            listOfID = []
            
            for record in iterator:
                listOfID += [record.get('id','')]

            listOfID_corrected = json.dumps(listOfID)

            r = Response(listOfID_corrected, status = 200, mimetype ="application/json")
            r.headers["Content-Type"] = "application/json"
            r.headers["Cache-Control"] = "max-age=60"
            return r
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests to get communities for our local application 
request-types:GET
""" 

class GetCommunitiesAPI(Resource):

    """
    purpose:Get all communities for our local application 
    pass-in:None
    successfulReturn: Json -> {"collection":collection}
    possibleErrors: 400 (Bad Target), 500 (Internal/Unknown Error)
    """
    def get(self):
        try:
            target = request.args.get('targetHost')

            if target == "cs3099user-a4.host.cs.st-andrews.ac.uk":
                iterator = setup.shared_spaces.db.communities.find({}, {"_id":0, "id":1})
                listOfID = []
                
                for record in iterator:
                    listOfID += [record.get('id','')]

                listOfID_corrected = json.dumps(listOfID)

                r = Response(listOfID_corrected, status = 200, mimetype ="application/json")
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
                requestPath = "get /fed/communities"

                sigtext = generateSigWithUser(requestPath, target, digest, dateResult, "test")

                header = {'Digest' : "sha-512=" + digest, 'Signature' : sigtext, "Client-Host": "cs3099user-a4.host.cs.st-andrews.ac.uk", "Date": dateResult, "User-ID": "test"}

                url = "https://" + target + "/fed/communities"
                resp = requests.get(url, headers = header, timeout=3)
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
purpose:Class that handles requests to get a specific community in line with the supergroup protocol
request-types:GET
""" 

class GetCommunityFed(Resource):

    """
    purpose:Get a specific community in line with the supergroup protocol 
    pass-in:None
    successfulReturn: Json -> {"community":community}
    possibleErrors: 404 (Missing Community), 500 (Internal/Unknown Error)
    """

    def get(self, id):
        try:
            check = setup.shared_spaces.db.communities.find_one({"id":id}, {"_id":0})
            if check == None:
                response = jsonify({"title":"Missing Community", "message":"Sorry, we have no record of that community"})
                response.status_code = 404
                return response
            check_finished = dumps(check)

            r = Response(check_finished, status = 200, mimetype ="application/json")
            r.headers["Content-Type"] = "application/json"
            r.headers["Cache-Control"] = "max-age=60"
            return r
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response


"""
purpose:Class that handles requests to get a specific community in our local application 
request-types:GET
""" 
class GetCommunityAPI(Resource):

    """
    purpose:Get a specific community in out local application 
    pass-in:None
    successfulReturn: Json -> {"community":community}
    possibleErrors: 404 (Missing Community), 400 (Bad Target), 500 (Internal/Unknown Error)
    """

    def get(self, id):
        try:
            target = request.args.get('targetHost')

            if target == "cs3099user-a4.host.cs.st-andrews.ac.uk":
                    check = setup.shared_spaces.db.communities.find_one({"id":id}, {"_id":0})
                    if check == None:
                        response = jsonify({"title":"Missing Community", "message":"Sorry, we have no record of that community"})
                        response.status_code = 404
                        return response
                    check_finished = dumps(check)

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
                requestPath = "get /fed/communities/" + id

                sigtext = generateSigWithUser(requestPath, target, digest, dateResult, "test")

                header = {'Digest' : "sha-512=" + digest, 'Signature' : sigtext, "Client-Host": "cs3099user-a4.host.cs.st-andrews.ac.uk", "Date": dateResult, "User-ID": "test"}

                url = "https://" + target + "/fed/communities/" + id
                resp = requests.get(url, headers = header, timeout=3)
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
purpose:Class that handles requests to return the modified time off all the posts in a comminuty in line with the supergroup protocol 
request-types:GET
""" 
class GetModifiedTimeFed(Resource):
    """
    purpose:Get the modified times of all posts in a given community in line with the supergroup proctocol
    pass-in:None 
    successfulReturn: Json -> {List of times}
    possibleErrors: 404 (Missing community), 500 (Internal/Unknown Error)
    """
    def get(self, id):
        try:
            check = setup.shared_spaces.db.communities.find_one({"id":id}, {"_id":0})
            if check == None:
                response = jsonify({"title":"Missing Community", "message":"Sorry, we have no record of that community"})
                response.status_code = 404
                return response
            iterator = setup.content.db.posts.find({"community":id}, {"_id":0, "id":1, "modified":1})

            objects = []
            for record in iterator:
                objects += [record]

            check_finished = dumps(objects)
            r = Response(check_finished, status = 200, mimetype ="application/json")
            r.headers["Content-Type"] = "application/json"
            r.headers["Cache-Control"] = "max-age=60"
            return r
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests to return the modified time off all the posts in a comminuty in our local application 
request-types:GET
""" 
class GetModifiedTimeAPI(Resource):

    """
    purpose:Get the modified times of all posts in a given community in our local application 
    pass-in:None 
    successfulReturn: Json -> {List of times}
    possibleErrors: 404 (Missing Community), 400 (bad target), 500 (Internal/Unknown Error)
    """
    def get(self, id):
        try:
            target = request.args.get('targetHost')

            if target == "cs3099user-a4.host.cs.st-andrews.ac.uk":
                check = setup.shared_spaces.db.communities.find_one({"id":id}, {"_id":0})
                if check == None:
                    response = jsonify({"title":"Missing Community", "message":"Sorry, we have no record of that community"})
                    response.status_code = 404
                    return response
                iterator = setup.content.db.posts.find({"community":id}, {"_id":0, "id":1, "modified":1})

                objects = []
                for record in iterator:
                    objects += [record]

                check_finished = dumps(objects)

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
                requestPath = "get /fed/communities/" + id + "/timestamps"

                sigtext = generateSigWithUser(requestPath, target, digest, dateResult, "test")

                header = {'Digest' : "sha-512=" + digest, 'Signature' : sigtext, "Client-Host": "cs3099user-a4.host.cs.st-andrews.ac.uk", "Date": dateResult, "User-ID": "test"}

                url = "https://" + target + "/fed/communities/" + id + "/timestamps"
                resp = requests.get(url, headers = header, timeout=3)
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
purpose:Class that handles requests to edit a specific community 
request-types:PUT
""" 
class EditCommunity(Resource):
    """
    purpose:Edit a specific community 
    pass-in:Json -> {"title":title, "description":description}
    successfulReturn: Json -> {"community":community}
    possibleErrors: 400 (Bad Entry), 400 (missing Community), 400 (Bad Permissions), 500 (Internal/Unknown Error)
    """

    def put(self, id):
        try:
            user_id = request.headers.get('User-ID', '')
            host = request.headers.get('Client-Host', '')
            entry = request.get_json()
            title = entry.get('title', '')
            description = entry.get('description', '')

            if not all([validateCommunityTitle(title), validateCommunityDesc(description)]):
                response = jsonify({"title":"incorrect values", "message":"Sorry, something about that community is wrong (check none of your fields are empty!)"})
                response.status_code = 400
                return response 

            check = setup.shared_spaces.db.communities.find({"id":id})
            if check == None:
                response = jsonify({"title":"Missing Community", "message":"Sorry, we have no record of that community"})
                response.status_code = 400
                return response
            elif setup.shared_spaces.db.communities.find({"id":id, "admins": { "$in" : [{"id":user_id, "host":host}]}}).count() == 0:
                response = jsonify({"title":"Bad Permissions", "message":"Sorry, you don't have permissions for this community"})
                response.status_code = 400
                return response
            else:
                setup.shared_spaces.db.communities.update_one({"id":id}, {"$set": { "title":title, "description":description}})
            response = {}
            return response, 200
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response
