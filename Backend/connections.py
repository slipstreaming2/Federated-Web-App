import pymongo
import sys
from os import environ
import base64
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from wsgiref.handlers import format_date_time
from datetime import datetime
from time import mktime
#from setup import isTestMode

"""
purpose:Class to generate connections to the local mongoDB database

mongodb://a4-users:cs3099a4@localhost:21538/
mongodb://a4-content:cs3099a4@localhost:21538/
mongodb://a4-shared_spaces:cs3099a4@localhost:21538/

mongodb://a4-master-user:cs3099a4@localhost:21538/


mongodb://mongo:27017/
"""


class DatabaseConnections(object):
    """
    purpose:Establish a connection to the login collection on the users database
    return:Return a pymongo connection object
    """
    
    @staticmethod
    def connectToLoginCol():
        #print(environ.get("DATABASE_URI"), file=sys.stderr)
        url = str(environ.get("USERS_DATABASE_URI")) + "users" 
        myclient = pymongo.MongoClient(url, authSource = "users")
        users = myclient["users"]
        login = users["login"]
        return login

    """
    purpose:Establish a connection to the posts collection on the content database
    return:Return a pymongo connection object
    """
    @staticmethod
    def connectToPostsCol():
        #print(environ.get("DATABASE_URI"), file=sys.stderr)
        url = str(environ.get("CONTENT_DATABASE_URI")) + "content"
        myclient = pymongo.MongoClient(url, authSource = "content")
        content = myclient["content"]
        posts = content["posts"]
        return posts

    """
    purpose:Establish a connection to the communities collection on the shared_spaces database
    return:Return a pymongo connection object
    """
    @staticmethod
    def connectToCommunitiesCol():
        url = str(environ.get("SHARED_SPACES_DATABASE_URI")) + "shared_spaces"
        myclient = pymongo.MongoClient(url, authSource = "shared_spaces")
        shared_spaces = myclient["shared_spaces"]
        communities = shared_spaces["communities"]
        return communities



'''''''''''''''''''''''''''
CRYPTOGRAPHY UTILITY METHODS
'''''''''''''''''''''''''''

"""
purpose: Generate the digest of the sha512 hash function for use in encryption  
"""        
def generateDigest(body):
    digest = hashes.Hash(hashes.SHA512())
    digest.update(bytes(body, 'utf-8'))

    base64encoded = base64.b64encode(digest.finalize()).decode("ascii")
    return base64encoded

"""
purpose: Generate the encrypted signature header
"""        
def generateSig(requestPath, path, digest, dateResult):

    with open("private.pem", "rb") as key_file:
        private_key = serialization.load_pem_private_key(
            key_file.read(),
            password=None,
        )

    messageUnByte = "(request-target): "+ requestPath + "\nhost: " + path + "\nclient-host: cs3099user-a4.host.cs.st-andrews.ac.uk\ndate: " + dateResult + "\ndigest: SHA-512=" + digest
    message = bytes(messageUnByte, 'utf-8')

    #print(messageUnByte)
    
    signature = private_key.sign(
        message,
        padding.PKCS1v15(),
        hashes.SHA512()
    )

    encodedSig = base64.b64encode(signature).decode("ascii")
    #print(encodedSig)
    sigtext = 'keyId=\"rsa-global\",algorithm=\"hs2019\",headers=\"(request-target) host client-host date digest\",signature=\"'+ encodedSig +'\"'
    #print(sigtext)

    return sigtext

"""
purpose: Generate the encrypted signature header including user_id
""" 
def generateSigWithUser(requestPath, path, digest, dateResult, user_id):

    with open("private.pem", "rb") as key_file:
        private_key = serialization.load_pem_private_key(
            key_file.read(),
            password=None,
        )

    messageUnByte = "(request-target): "+ requestPath + "\nhost: " + path + "\nclient-host: cs3099user-a4.host.cs.st-andrews.ac.uk\nuser-id: " + user_id + "\ndate: " + dateResult + "\ndigest: SHA-512=" + digest
    message = bytes(messageUnByte, 'utf-8')

    #print(messageUnByte)
    
    signature = private_key.sign(
        message,
        padding.PKCS1v15(),
        hashes.SHA512()
    )

    encodedSig = base64.b64encode(signature).decode("ascii")
    #print(encodedSig)
    sigtext = 'keyId=\"rsa-global\",algorithm=\"hs2019\",headers=\"(request-target) host client-host user-id date digest\",signature=\"'+ encodedSig +'\"'
    #print(sigtext)

    return sigtext