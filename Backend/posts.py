from flask_restful import Resource
from flask_api import status
import pymongo
import time
from bson.objectid import ObjectId
from bson.json_util import dumps
import json
from flask import jsonify, request, make_response, Response
from connections import *
import sys
import uuid
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
purpose:Class that handles requests to create or get posts for the supergroup protocol 
request-types:POST,GET
""" 
class CreateOrGetPostFed(Resource):

    """
    purpose:Create a new post in line with the supergroup protocol 
    pass-in: Json -> {"title":title, "body":body, "parent":parent, "children":children, "author": {"id":id, "host":host}}
    successfulReturn: Json -> {"post":post , "status":status}
    possibleErrors: 400 (missing Community), 400 (missing Parent), 500 (Internal/Unknown Error)
    """
    
    def post(self):
        try:
            entry = request.get_json()
            id = request.headers.get('User-ID', '')
            host = request.headers.get('Client-Host', '')
            parent = entry.get('community', '')
            parentPost = None
            testParent = entry.get('parentPost', '')
            if "parentPost" in entry and testParent != '':
                parentPost = entry.get('parentPost', '')
            title = entry.get('title' , '')
            content = entry.get('content', '')
            friendlyTime = int(time.time())
            checkCommunity = setup.shared_spaces.db.communities.find_one({"id":parent})
            if checkCommunity == None:
                response = jsonify({"title":"mssing community", "message":"sorry we have no record of that community"})
                response.status_code = 400
                return response

            intUUID = uuid.uuid4()
            stringUUID = str(intUUID)
            if parentPost != None and parentPost != '':
                checkParent = setup.content.db.posts.find_one({"id":parentPost})
                if checkParent == None:
                    response = jsonify({"title":"mssing parent", "message":"sorry we have no record of that parent"})
                    response.status_code = 400
                    return response
                else:
                    setup.content.db.posts.update_one({"id":parentPost}, {"$push": {"children":stringUUID}})
            
            insert_post = {"id":stringUUID, "community":parent, "parentPost": parentPost, "children" : [], "title":title, "content":content, "author":{"id":id,"host":host}, "modified":friendlyTime, "created":friendlyTime,"likeUsers":[],"dislikeUsers":[]}
            x = setup.content.db.posts.insert_one(insert_post)
            created_post = setup.content.db.posts.find_one({"_id":ObjectId(x.inserted_id)}, {"_id":0})

            check_finished = dumps(created_post)
            r = Response(check_finished, status = 200, mimetype ="application/json")
            r.headers["Content-Type"] = "application/json"
            r.headers["Cache-Control"] = "max-age=60"
            return r
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

    """
    purpose:Get a list of posts in line with the supergroup protocol 
    pass-in: None
    successfulReturn: Json -> {List of Post Objects}
    possibleErrors:500 (Internal/Unknown Error)
    """

    def get(self):
        try:
            conditions = {}
            limit = sys.maxsize
            cascadePosts = True

            if "parentPost" in request.args:
                resultsOfCascade = getCascadePosts(request.args.get('parentPost'))
            

                response_posts_corrected = json.dumps(resultsOfCascade)

                r = Response(response_posts_corrected, status = 200, mimetype ="application/json")
                r.headers["Content-Type"] = "application/json"
                r.headers["Cache-Control"] = "max-age=60"
                return r


            if "community" in request.args:
                conditions['community'] = request.args.get('community')
            
            if "author" in request.args:
                conditions["author.id"] = request.args.get('author')

            if "host" in request.args:
                conditions["author.host"] = request.args.get('host')
            
            

            if "limit" in request.args:
                limit = request.args.get('limit')

            if "includeSubChildrenPosts" in request.args:
                if request.args.get('includeSubChildrenPosts').lower() == "false":
                    conditions['title'] = {"$ne": None}

            iterator = setup.content.db.posts.find(conditions, {"_id":0})

            response_posts = []
            
            counter = 0
                
            for record in iterator:
                if counter == int(limit):
                    break
                response_posts += [record]
                counter = counter + 1



            response_posts_corrected = json.dumps(response_posts)


            r = Response(response_posts_corrected, status = 200, mimetype ="application/json")
            r.headers["Content-Type"] = "application/json"
            r.headers["Cache-Control"] = "max-age=60"
            return r

        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Utility method for finding and returning a list of posts based on a parent  
""" 
def getCascadePosts(parentID):
    childrenPosts = setup.content.db.posts.find({"parentPost":parentID}, {"_id":0})
    postsToReturn = []
    for child in childrenPosts:
        postsToReturn += [child]
        if len(child["children"]) > 0:
            postsToReturn += getCascadePosts(child["id"])
    return postsToReturn

"""
purpose:Utility method for cascade deleting when a parent is deleted
""" 
def CascadeDelete(parentID):
    childrenPosts = setup.content.db.posts.find({"parentPost":parentID}, {"_id":0})
    for child in childrenPosts:
        setup.content.db.posts.delete_one({"id":child["id"]})
        if len(child["children"]) > 0:
            CascadeDelete(child["id"])
        

"""
purpose:Class that handles requests to create or get posts for out local application 
request-types:POST,GET
""" 
class CreateOrGetPostAPI(Resource):

    """
    purpose:Create a new post in our local application
    pass-in: Json -> {"title":title, "body":body, "parent":parent, "children":children, "author": {"id":id, "host":host}}
    successfulReturn: Json -> {"post":post , "status":status}
    possibleErrors: 400 (Bad Target),  400 (missing Community), 400 (missing Parent), 500 (Internal/Unknown Error)
    """
    def post(self):
        try:
            target = request.args.get('targetHost')

            if target == "cs3099user-a4.host.cs.st-andrews.ac.uk":
                entry = request.get_json()
                
                id = request.headers.get('User-ID', '')
                host = request.headers.get('Client-Host', '')

                parent = entry.get('community', '')
                parentPost = None
                if "parentPost" in entry:
                    parentPost = entry.get('parentPost', '')
                title = entry.get('title' , '')
                content = entry.get('content', '')
                friendlyTime = int(time.time())
                checkCommunity = setup.shared_spaces.db.communities.find_one({"id":parent})
                if checkCommunity == None:
                    response = jsonify({"title":"mssing community", "message":"sorry we have no record of that community"})
                    response.status_code = 400
                    return response

                intUUID = uuid.uuid4()
                stringUUID = str(intUUID)
                if parentPost != None:
                    checkParent = setup.content.db.posts.find_one({"id":parentPost})
                    if checkParent == None:
                        response = jsonify({"title":"mssing parent", "message":"sorry we have no record of that parent"})
                        response.status_code = 400
                        return response
                    else:
                        setup.content.db.posts.update_one({"id":parentPost}, {"$push": {"children":stringUUID}})
                
                insert_post = {"id":stringUUID, "community":parent, "parentPost": parentPost, "children" : [], "title":title, "content":content, "author":{"id":id,"host":host}, "modified":friendlyTime, "created":friendlyTime,"likeUsers":[],"dislikeUsers":[]}
                x = setup.content.db.posts.insert_one(insert_post)
                created_post = setup.content.db.posts.find_one({"_id":ObjectId(x.inserted_id)}, {"_id":0})

                idOfNewPost = created_post.get('id')

                setup.users.db.login.update_one({"id":id}, {"$push": {"posts": {"id":idOfNewPost, "host":"cs3099user-a4.host.cs.st-andrews.ac.uk"}}})
                
                return created_post, 200
            else:
                if validateServer(target) == False:
                    response = jsonify({"title":"incorrect target", "message":"Sorry, something about the server " + target + " is not correct"})
                    response.status_code = 400
                    return response 

                user_id = request.headers.get('User-ID', '')
                host = request.headers.get('Client-Host', '')

                entry = request.get_json()
                entryText = json.dumps(entry)
                digest = generateDigest(entryText)

                now = datetime.now()
                stamp = mktime(now.timetuple())
                dateResult = format_date_time(stamp)
                requestPath = "post /fed/posts"

                sigtext = generateSigWithUser(requestPath, target, digest, dateResult, user_id)

                header = {'Digest' : "sha-512=" + digest, 'Signature' : sigtext, "Client-Host": "cs3099user-a4.host.cs.st-andrews.ac.uk", "Date": dateResult, "User-ID": user_id}
                url = "https://" + target + "/fed/posts"

                resp = requests.post(url, headers = header, json = entry)
                if resp.status_code == 200 or resp.status_code == 201:
                    toGetID = resp.json()
                    setup.users.db.login.update_one({"id":user_id}, {"$push": {"posts": {"id":toGetID['id'], "host":target}}})
                    check_finished = dumps(toGetID)
                    r = Response(check_finished, status = 200, mimetype ="application/json")
                    r.headers["Content-Type"] = "application/json"
                    r.headers["Cache-Control"] = "max-age=60"
                    return r
                else:
                    print(resp.text)
                    check_finished = dumps(resp.json())
                    r = Response(check_finished, status = resp.status_code, mimetype ="application/json")
                    r.headers["Content-Type"] = "application/json"
                    return r
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

    """
    purpose:Get a list of posts from our local application 
    pass-in: None
    successfulReturn: Json -> {List of Post Objects}
    possibleErrors: 400 (Bad Target), 500 (Internal/Unknown Error)
    """

    def get(self):
        try:
            target = request.args.get('targetHost')

            if target == "cs3099user-a4.host.cs.st-andrews.ac.uk":
                conditions = {}
                limitStart = 0
                limit = sys.maxsize
                cascadePosts = True

                if "parentPost" in request.args:
                    resultsOfCascade = getCascadePosts(request.args.get('parentPost'))
                
                    response_posts_corrected = json.dumps(resultsOfCascade)

                    r = Response(response_posts_corrected, status = 200, mimetype ="application/json")
                    r.headers["Content-Type"] = "application/json"
                    r.headers["Cache-Control"] = "max-age=60"
                    return r


                if "community" in request.args:
                    conditions['community'] = request.args.get('community')
                
                if "author" in request.args:
                    conditions["author.id"] = request.args.get('author')

                if "host" in request.args:
                    conditions["author.host"] = request.args.get('host')
                
                if "limitStart" in request.args:
                    limitStart = request.args.get('limitStart')
                

                if "limit" in request.args:
                    limit = request.args.get('limit')

                if "includeSubChildrenPosts" in request.args:
                    if request.args.get('includeSubChildrenPosts').lower() == "false":
                        conditions['title'] = {"$ne": None}
                
                if "title" in request.args:
                    conditions['title'] = {"$regex": request.args.get('title'), "$options": "$i"} 

                iterator = setup.content.db.posts.find(conditions, {"_id":0})

                response_posts = []
                startCounter = 0
                counter = 0
                    
                for record in iterator:
                    if startCounter != limitStart:
                        startCounter = startCounter + 1
                        continue
                    if counter == int(limit):
                        break
                    response_posts += [record]
                    counter = counter + 1
                

                response_posts_corrected = json.dumps(response_posts)

                r = Response(response_posts_corrected, status = 200, mimetype ="application/json")
                r.headers["Content-Type"] = "application/json"
                r.headers["Cache-Control"] = "max-age=60"
                return r

            else:
                if validateServer(target) == False:
                    response = jsonify({"title":"incorrect target", "message":"Sorry, something about the server " + target + " is not correct"})
                    response.status_code = 400
                    return response 

                entry = request.get_json()
                digest = generateDigest("")

                now = datetime.now()
                stamp = mktime(now.timetuple())
                dateResult = format_date_time(stamp)
                requestPath = "get /fed/posts"

                sigtext = generateSigWithUser(requestPath, target, digest, dateResult, "test")

                header = {'Digest' : "sha-512=" + digest, 'Signature' : sigtext, "Client-Host": "cs3099user-a4.host.cs.st-andrews.ac.uk", "Date": dateResult, "User-ID": "test"}
                url = "https://" + target + "/fed/posts"

                resp = requests.get(url, params = request.args, headers = header, timeout=3)
                if resp.status_code == 200:
                    check_finished = dumps(resp.json())
                    r = Response(check_finished, status = 200, mimetype ="application/json")
                    r.headers["Content-Type"] = "application/json"
                    r.headers["Cache-Control"] = "max-age=60"
                    return r
                else:
                    try:
                        check_finished = dumps(resp.json())
                    except:
                        check_finished = resp.text
                    r = Response(check_finished, status = resp.status_code, mimetype ="application/json")
                    r.headers["Content-Type"] = "application/json"
                    return r
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response


"""
purpose:Class that handles requests to fetch, edit or delete a post in line with the supergroup protocol
request-types:GET,DELETE,PUT
"""
class PostLogisticsFed(Resource):

    """
    purpose:Get a specific post in line with the supergroup protocol 
    pass-in:Json -> None
    successfulReturn:Json -> {"id":id, "community":community, "parentPost":parentPost, "children":children, "title": title, "content": content,  "author": {"id":id, "host":host}, "modified": modified, "created": created}
    possibleErrors:  404 (Missing Post), 500 (Internal/Unknown Error)
    """

    def get(self, id):
        try:
            postFound = setup.content.db.posts.find_one({"id":id}, {"_id":0, "likeUsers":0, "dislikeUsers":0})
            if postFound == None:
                response = jsonify({"title":"mssing post", "message":"sorry we have no record of that post"})
                response.status_code = 404
                return response
            response = jsonify({"id":postFound.get('id'), "community":postFound.get('community'), "parentPost":postFound.get('parentPost'), "children":postFound.get('children'), "title":postFound.get('title'), "content":postFound.get('content'), "author":postFound.get('author'), "modified":postFound.get('modified'), "created":postFound.get('created')})
            response.headers["Cache-Control"] = "max-age=60"
            response.status_code = 200
            return response
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

    """
    purpose:Delete a post in line with the supergroup protocol 
    pass-in:Json -> None
    successfulReturn: Json -> {"status":status}
    possibleErrors: 400 (Missing Post), 400 (Bad Permissions), 500 (Internal/Unknown Error)
    """
    def delete(self, id):
        try:
            user_id = request.headers.get('User-ID', '')
            host = request.headers.get('Client-Host', '')
            post_to_delete = {"id":id, "author":{"id":user_id,"host":host}}
            check = setup.content.db.posts.find_one(post_to_delete)
            if check == None:
                check2 = setup.content.db.posts.find_one({"id":id})
                if check2 == None:
                    response = jsonify({"title":"mssing post", "message":"sorry we have no record of that post"})
                    response.status_code = 400

                    return response

                if setup.shared_spaces.db.communities.find({"id":check2.get('community'), "admins": { "$in" : [{"id":user_id, "host":host}]}}).count() == 0:
                    response = jsonify({"title":"permission denied", "message":"sorry, you don't have permission to delete that post"})
                    response.status_code = 400

                    return response

        
            if check == None:
                parentPost = check2.get('parentPost')
                if parentPost != None:
                    setup.content.db.posts.update_one({"id":parentPost}, {"$pull":{"children":id}})
            else:
                parentPost = check.get('parentPost')
                if parentPost != None:
                    setup.content.db.posts.update_one({"id":parentPost}, {"$pull":{"children":id}})
            
            setup.content.db.posts.delete_one(post_to_delete)
            CascadeDelete(id)
            
            return {}, 200
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

    """
    purpose:Edit a post in line with the supergroup protocol 
    pass-in:Json -> {"title":title, "content":content}
    successfulReturn: Json -> {"status":status}
    ppssibleErrors: 400 (Missing Post), 500 (Internal/Unknown Error)
    """
    def put(self, id):
        try:
            entry = request.get_json()
            title = entry.get('title','')
            content = entry.get('content','')
            user_id = request.headers.get('User-ID', '')
            host = request.headers.get('Client-Host', '')
            post_to_edit = {"id":id, "author":{"id":user_id,"host":host}}
            check = setup.content.db.posts.find_one(post_to_edit)
            if check == None:
                    response = jsonify({"title":"mssing post", "message":"sorry we have no record of that post"})
                    response.status_code = 400
                    return response
            setup.content.db.posts.update_one({"id":id}, {"$set": { "title":title, "content":content}})
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests to fetch, edit or delete a post in our local application 
request-types:GET,DELETE,PUT
"""
class PostLogisticsAPI(Resource):
    
    """
    purpose:Get a specific post from our local application. 
    pass-in:Json -> None
    successfulReturn:Json -> {"id":id, "community":community, "parentPost":parentPost, "children":children, "title": title, "content": content,  "author": {"id":id, "host":host}, "modified": modified, "created": created}
    possibleErrors: 400 (Bad Target), 404 (Missing Post), 500 (Internal/Unknown Error)
    """

    def get(self, id):
        try:
            target = request.args.get('targetHost')

            if target == "cs3099user-a4.host.cs.st-andrews.ac.uk":
                postFound = setup.content.db.posts.find_one({"id":id}, {"_id":0})
                if postFound == None:
                    response = jsonify({"title":"mssing post", "message":"sorry we have no record of that post"})
                    response.status_code = 404
                    return response
                response = jsonify({"id":postFound.get('id'), "community":postFound.get('community'), "parentPost":postFound.get('parentPost'), "children":postFound.get('children'), "title":postFound.get('title'), "content":postFound.get('content'), "author":postFound.get('author'), "modified":postFound.get('modified'), "created":postFound.get('created'), "likeUsers":postFound.get('likeUsers'), "dislikeUsers":postFound.get('dislikeUsers')})
                response.headers["Cache-Control"] = "max-age=60"
                response.status_code = 200
                return response
            else:
                if validateServer(target) == False:
                    response = jsonify({"title":"incorrect target", "message":"Sorry, something about the server " + target + " is not correct"})
                    response.status_code = 400
                    return response 

                user_id = "test"
                host = request.headers.get('Client-Host', '')
                entry = request.get_json()
                digest = generateDigest("")


                now = datetime.now()
                stamp = mktime(now.timetuple())
                dateResult = format_date_time(stamp)
                requestPath = "get /fed/posts/" + id

                sigtext = generateSigWithUser(requestPath, target, digest, dateResult, user_id)

                header = {'Digest' : "sha-512=" + digest, 'Signature' : sigtext, "Client-Host": "cs3099user-a4.host.cs.st-andrews.ac.uk", "Date": dateResult, "User-ID": "test"}

                url = "https://" + target + "/fed/posts/" + id
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
    purpose:Delete a post from our local application 
    pass-in:Json -> None
    successfulReturn: Json -> {"status":status}
    possibleErrors:400 (Bad Target), 400 (Missing Post), 400 (Bad Permissions), 500 (Internal/Unknown Error)
    """
    def delete(self, id):
        try:
            target = request.args.get('targetHost')

            if target == "cs3099user-a4.host.cs.st-andrews.ac.uk":

                user_id = request.headers.get('User-ID', '')
                host = request.headers.get('Client-Host', '')
                post_to_delete = {"id":id, "author":{"id":user_id,"host":host}}
                check = setup.content.db.posts.find_one(post_to_delete)
                if check == None:
                    check2 = setup.content.db.posts.find_one({"id":id})
                    if check2 == None:
                        response = jsonify({"title":"mssing post", "message":"sorry we have no record of that post"})
                        response.status_code = 400

                        return response

                    if setup.shared_spaces.db.communities.find({"id":check2.get('community'), "admins": { "$in" : [{"id":user_id, "host":host}]}}).count() == 0:
                        response = jsonify({"title":"permission denied", "message":"sorry, you don't have permission to delete that post"})
                        response.status_code = 400

                        return response

            
                if check == None:
                    parentPost = check2.get('parentPost')
                    if parentPost != None:
                        setup.content.db.posts.update_one({"id":parentPost}, {"$pull":{"children":id}})
                else:
                    parentPost = check.get('parentPost')
                    if parentPost != None:
                        setup.content.db.posts.update_one({"id":parentPost}, {"$pull":{"children":id}})
                
                setup.content.db.posts.delete_one(post_to_delete)
                CascadeDelete(id)
                setup.users.db.login.update_one({"id":user_id}, {"$pull": {"posts": {"id":id}}})
                
                return {}, 200

            else:
                if validateServer(target) == False:
                    response = jsonify({"title":"incorrect target", "message":"Sorry, something about the server " + target + " is not correct"})
                    response.status_code = 400
                    return response 

                user_id = request.headers.get('User-ID', '')
                host = request.headers.get('Client-Host', '')
                entry = request.get_json()
                digest = generateDigest("")

                now = datetime.now()
                stamp = mktime(now.timetuple())
                dateResult = format_date_time(stamp)
                requestPath = "delete /fed/posts/" + id

                sigtext = generateSigWithUser(requestPath, target, digest, dateResult, user_id)

                header = {'Digest' : "sha-512=" + digest, 'Signature' : sigtext, "Client-Host": "cs3099user-a4.host.cs.st-andrews.ac.uk", "Date": dateResult, "User-ID": user_id}

                url = "https://" + target + "/fed/posts/" + id
                resp = requests.delete(url, headers = header, timeout=3)
                if resp.status_code == 200:
                    setup.users.db.login.update_one({"id":user_id}, {"$pull": {"posts": {"id":id}}})
                    response = jsonify({"STATUS":"PASS"})
                    response.status_code = 200
                    return response
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
    purpose:Edit a post in our local application 
    pass-in:Json -> {"title":title, "content":content}
    successfulReturn: Json -> {"status":status}
    possibleErrors: 400 (Missing Post), 400 (Bad Target), 500 (Internal/Unknown Error)
    """
    def put(self, id):
        try:
            target = request.args.get('targetHost')

            if target == "cs3099user-a4.host.cs.st-andrews.ac.uk":
                entry = request.get_json()
                title = entry.get('title','')
                content = entry.get('content','')
                user_id = request.headers.get('User-ID', '')
                host = request.headers.get('Client-Host', '')
                post_to_edit = {"id":id, "author":{"id":user_id,"host":host}}
                check = setup.content.db.posts.find_one(post_to_edit)
                if check == None:
                        response = jsonify({"title":"Missing Post", "message":"sorry, we have no record of that post"})
                        response.status_code = 400
                        return response
                setup.content.db.posts.update_one({"id":id}, {"$set": { "title":title, "content":content}})
            else:
                if validateServer(target) == False:
                    response = jsonify({"title":"incorrect target", "message":"Sorry, something about the server " + target + " is not correct"})
                    response.status_code = 400
                    return response 

                user_id = request.headers.get('User-ID', '')
                host = request.headers.get('Client-Host', '')
                entry = request.get_json()
                entryText = json.dumps(entry)
                digest = generateDigest(entryText)

                now = datetime.now()
                stamp = mktime(now.timetuple())
                dateResult = format_date_time(stamp)
                requestPath = "put /fed/posts/" + id

                sigtext = generateSigWithUser(requestPath, target, digest, dateResult, user_id)

                header = {'Digest' : "sha-512=" + digest, 'Signature' : sigtext, "Client-Host": "cs3099user-a4.host.cs.st-andrews.ac.uk", "Date": dateResult, "User-ID": user_id}

                url = "https://" + target + "/fed/posts/" + id

                resp = requests.put(url, headers = header, json=entry)
                if resp.status_code == 200:
                    return {}, 200
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
purpose:Class that handles requests to like a post 
request-types:PUT
"""

class LikePost(Resource):
    """
    purpose:Like a post in our local application 
    pass-in:Json -> {'id': id , 'author' : {'id': 'id', 'host':'host'}}
    successfulReturn: Json -> {"status":status}
    possibleErrors: 400 (Missing Post), 500 (Internal/Unknown Error)
    """

    def put(self):
        try:
            entry = request.get_json()
            id = entry.get('id','')
            author = entry.get('author','')
            user_id = author.get('id','')
            host = author.get('host','')
            post_to_update = {"id":id}
            check = setup.content.db.posts.find_one(post_to_update)
            if check == None:
                response = jsonify({"title":"Missing Post", "message":"sorry, we have no record of that post"})
                response.status_code = 400
                return response
            else:
                if setup.content.db.posts.find({"id":id, "dislikeUsers": { "$in" : [{"id":user_id, "hostname":host}]}}).count() != 0:
                    setup.content.db.posts.update_one({"id":id}, {"$pull": {"dislikeUsers":{"id":user_id, "hostname":host}}})

                setup.content.db.posts.update_one({"id":id}, {"$push": {"likeUsers":{"id":user_id, "hostname":host}}})
                response = jsonify({"status":"PASS"})
                response.status_code = 200
                return response
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests to dislike a post 
request-types:PUT
"""

class DislikePost(Resource):
    """
    purpose:Dislike a post in our local application 
    pass-in:Json -> {'id': id , 'author' : {'id': 'id', 'host':'host'}}
    successfulReturn: Json -> {"status":status}
    possibleErrors: 400 (Missing Post), 500 (Internal/Unknown Error)
    """

    def put(self):
        try:
            entry = request.get_json()
            id = entry.get('id','')
            author = entry.get('author','')
            user_id = author.get('id','')
            host = author.get('host','')
            post_to_update = {"id":id}
            check = setup.content.db.posts.find_one(post_to_update)
            if check == None:
                response = jsonify({"title":"Missing Post", "message":"sorry, we have no record of that post"})
                response.status_code = 400
                return response
            else:
                if setup.content.db.posts.find({"id":id, "likeUsers": { "$in" : [{"id":user_id, "hostname":host}]}}).count() != 0:
                    setup.content.db.posts.update_one({"id":id}, {"$pull": {"likeUsers":{"id":user_id, "hostname":host}}})
                setup.content.db.posts.update_one({"id":id}, {"$push": {"dislikeUsers":{"id":user_id, "hostname":host}}})
                response = jsonify({"status":"PASS"})
                response.status_code = 200
                return response
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests to unlike a post that has already been liked
request-types:PUT
"""

class DeLikePost(Resource):
    """
    purpose:Unlike a post in our local application that has already been liked and return its like status to neutral 
    pass-in:Json -> {'id': id , 'author' : {'id': 'id', 'host':'host'}}
    successfulReturn: Json -> {"status":status}
    possibleErrors: 400 (Missing Post), 500 (Internal/Unknown Error)
    """

    def put(self):
        try:
            entry = request.get_json()
            id = entry.get('id','')
            author = entry.get('author','')
            user_id = author.get('id','')
            host = author.get('host','')
            post_to_update = {"id":id}
            check = setup.content.db.posts.find_one(post_to_update)
            if check == None:
                response = jsonify({"title":"Missing Post", "message":"sorry, we have no record of that post"})
                response.status_code = 400
                return response
            else:
                setup.content.db.posts.update_one({"id":id}, {"$pull": {"likeUsers":{"id":user_id, "hostname":host}}})
                response = jsonify({"status":"PASS"})
                response.status_code = 200
                return response
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

"""
purpose:Class that handles requests to un-dislike a post that has already been disliked and return its like status to neutral
request-types:PUT
"""

class DeDislikePost(Resource):
    """
    purpose:Un-dislike a post in our local application that has already been disliked and return its like status to neutral 
    pass-in:Json -> {'id': id , 'author' : {'id': 'id', 'host':'host'}}
    successfulReturn: Json -> {"status":status}
    possibleErrors: 400 (Missing Post), 500 (Internal/Unknown Error)
    """

    def put(self):
        try:
            entry = request.get_json()
            id = entry.get('id','')
            author = entry.get('author','')
            user_id = author.get('id','')
            host = author.get('host','')
            post_to_update = {"id":id}
            check = setup.content.db.posts.find_one(post_to_update)
            if check == None:
                response = jsonify({"title":"Missing Post", "message":"sorry, we have no record of that post"})
                response.status_code = 400
                return response
            else:
                setup.content.db.posts.update_one({"id":id}, {"$pull": {"dislikeUsers":{"id":user_id, "hostname":host}}})
                response = jsonify({"status":"PASS"})
                response.status_code = 200
                return response
        except:
            response=jsonify({"title":"¯\_(ツ)_/¯","message": "Sorry, we don't know what went wrong there. Try waiting and trying again"})
            response.status_code = 500
            return response

