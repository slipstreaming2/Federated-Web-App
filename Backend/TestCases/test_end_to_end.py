import json
import pytest
from faker import Faker



faker = Faker()
pytest.community_id = ""
pytest.community_name = ""
pytest.new_community_name = ""
pytest.post_id = ""
pytest.comment_id = ""
pytest.reply_id = ""
pytest.username = faker.first_name()

'''
Completed:

CreateUser
AccessUser
UpdateUser
GetUsers
ProfileDetails
GetQuestion
CreateCommunity
GetCommunities
GetCommunity
GetModifiedTime
EditCommunity
CreatePost
GetPosts
GetPost
EditPost
CreateComment
GetCommentsForPost
LikePost
DislikePost
DeLikePost
DeDislikePost
DeleteComment
DeletePost
DeleteCommunity
GetPostsFromCommunity 
DeleteUser
Subscribe
Unsubscribe
GetSubs
UpdateAbout
UpdateQAWithPassword
UpdatePasswordWithPassword

TODO:
GetServers

'''





# Test to ensure Tests work
def test_test():
    assert True
    
    
# Test Create User
def test_CreateUser_check_status_code_equals_200(client):
    test_create_user_dict = {'id':pytest.username, 'password': 'TEST', 'question': 'Yoink?', 'answer': 'Doink'}
    print(test_create_user_dict)
    url = "http://138.251.22.78:21709/api/CreateUser/"
    response = client.post(path = url, json = test_create_user_dict)

    print(response.json)

    assert response.status_code == 200



# Test Access user
def test_AccessUser_check_status_code_equals_200(client):
    test_access_user_dict = {'id':pytest.username, 'password': 'TEST', 'answer': 'Doink'}
    url = "http://138.251.22.78:21709/api/AccessUser/"
    response = client.post(path = url, json = test_access_user_dict)

    print(json.loads(response.data))

    assert response.status_code == 200


# Test Update User
def test_UpdateUser_check_status_code_equals_200(client):
    test_update_user_dict = {'id':pytest.username, 'password': 'TEST', 'answer': 'Doink'}
    url = "http://138.251.22.78:21709/api/UpdateUser/"
    response = client.post(path = url, json = test_update_user_dict)

    print(json.loads(response.data))

    assert response.status_code == 200

# Test Update About
def test_UpdateAbout_check_status_code_equals_200(client):
    test_update_about_dict = {'id':pytest.username, 'about': 'Hi This is my test aBoUt'}
    url = "http://138.251.22.78:21709/api/UpdateAbout/"
    response = client.put(path = url, json = test_update_about_dict)

    print(json.loads(response.data))

    assert response.status_code == 200

# Test Fed Get Users
def test_GetUsers_check_status_code_equals_200(client):
    url = "http://138.251.22.78:21709/fed/users"
    response = client.get(path = url)

    assert response.status_code == 200



# Test Profile Details

def test_ProfileDetails_check_status_code_equals_200(client):
    url = "http://138.251.22.78:21709/fed/users/" + pytest.username
    response = client.get(path = url)
    print(json.loads(response.data))

    assert response.status_code == 200

# Test Get Question

def test_GetQuestion_check_status_code_equals_200(client):
    get_question_dict = {'id':pytest.username, 'password': 'TEST', 'answer': 'Doink'}
    url = "http://138.251.22.78:21709/api/GetQuestion/"
    response = client.put(path = url, json = get_question_dict)

    print(json.loads(response.data))

    assert response.status_code == 200

#Test Update Question and Answer using password
def test_UpdateQAWithPassword_check_status_code_equals_200(client):
    test_update_QA_dict = {'id':pytest.username, 'password': 'TEST', 'question': 'Doink?', 'answer': 'Yoink'}
    url = "http://138.251.22.78:21709/api/UpdateQAWithPassword/"
    response = client.post(path = url, json = test_update_QA_dict)

    print(json.loads(response.data))

    assert response.status_code == 200

#Test Update user password using their old password
def test_UpdatePasswordWithPassword_check_status_code_equals_200(client):
    test_update_password_dict = {'id':pytest.username, 'password': 'TEST', 'new_password': 'TEST2'}
    url = "http://138.251.22.78:21709/api/UpdatePasswordWithPassword/"
    response = client.post(path = url, json = test_update_password_dict)

    print(json.loads(response.data))

    assert response.status_code == 200


# Test Create Community
def test_CreateCommunity_check_status_code_equals_200(client):
    rand_title = faker.word()
    test_create_community_dict = {'title': rand_title, 'description': 'test1', 'id' : pytest.username, 'hostname' : 'http://138.251.22.78:21709'}
    url = "http://138.251.22.78:21709/api/CreateOrDeleteCommunity/"
    response = client.post(path = url, json = test_create_community_dict)

    response_dictionary = json.loads(response.data)

    print(response_dictionary)
    pytest.community_name = response_dictionary['title']


    print(pytest.community_name)

    assert response.status_code == 200



# Test Get Communities
def test_GetCommunities_check_status_code_equals_200(client):
    header = {'Client-Host' : 'http://138.251.22.78:21709', 'User-ID' : pytest.username}
    url = "http://138.251.22.78:21709/fed/communities"
    response = client.get(path = url, headers = header )

    print(response.json)

    assert response.status_code == 200

#Test Get Community

def test_GetCommunity_check_status_code_equals_200(client):
    header = {'Client-Host' : 'http://138.251.22.78:21709'}
    url = "http://138.251.22.78:21709/fed/communities/" + pytest.community_name
    response = client.get(path = url, headers = header)

    assert response.status_code == 200

#Test Subscribe to Community 
def test_SubscribeToCommunity_check_status_code_equals_200(client):
    url =  "http://138.251.22.78:21709/api/users/subscribe/" 
    test_subscribe_community_dict = {'id': pytest.username, 'community': pytest.community_name}
    print(test_subscribe_community_dict)
    response = client.put(path = url, json = test_subscribe_community_dict )
    assert response.status_code == 200

#Test Unsubscribe to Community 
def test_UnsubscribeFromCommunity_check_status_code_equals_200(client):
    url =  "http://138.251.22.78:21709/api/users/unsubscribe/" 
    test_unsubscribe_community_dict = {'id': pytest.username, 'community': pytest.community_name}
    print(test_unsubscribe_community_dict)
    response = client.put(path = url, json = test_unsubscribe_community_dict )

    assert response.status_code == 200    

#Test Get Subs for a user
def test_GetSubs_check_status_code_equals_200(client):
    url =  "http://138.251.22.78:21709/api/users/subscribe/" + pytest.username
    response = client.get(path = url )

    assert response.status_code == 200    


#Test Get Timestamps from community

def test_GetModifiedTime_check_status_code_equals_200(client):
    header = {'Client-Host' : 'http://138.251.22.78:21709', 'User-ID' : pytest.username}
    url = "http://138.251.22.78:21709/fed/communities/" + pytest.community_name + "/timestamps"
    response = client.get(path = url, headers = header)

    assert response.status_code == 200

# Test Edit Community
def test_EditCommunity_check_status_code_equals_200(client):
    url =  "http://138.251.22.78:21709/api/EditCommunity/" + pytest.community_name
    pytest.new_community_name = pytest.community_name + "_edited"
    print(pytest.new_community_name)
    test_edit_community_dict = {'title': pytest.new_community_name, 'description': 'test  2'}
    header = {'Client-Host' : 'http://138.251.22.78:21709', 'User-ID' : pytest.username}
    response = client.put(path = url, headers = header, json = test_edit_community_dict )

    assert response.status_code == 200




# Test Create Post


def test_CreatePost_check_status_code_equals_200(client):
    test_create_post_dict =    {
        'community': pytest.community_name,
        'parentPost': None,
        'title': 'Bezoss Wealth Overflows 64-bit Unsigned Integer, Is Now Homeless',
        'content': [
            {
            'text': {
                'text': 'Sed ut perspiciatis, unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo enim ipsam voluptatem, quia voluptas sit, aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos, qui ratione voluptatem sequi nesciunt, neque porro quisquam est, qui dolorem ipsum, quia dolor sit amet consectetur adipisci[ng]velit, sed quia non-numquam [do] eius modi tempora inci[di]dunt, ut labore et dolore magnam aliquam quaerat voluptatem.'
                }
            }
        ]
    }

    header = {'Client-Host' : 'http://138.251.22.78:21709', 'User-ID' : pytest.username}
    url = "http://138.251.22.78:21709/fed/posts"
    print(pytest.community_name)
    response = client.post(path = url, json = test_create_post_dict, headers = header)

    response_dictionary = response.json

    pytest.post_id = response_dictionary["id"]


    assert response.status_code == 200




# Test  Get Posts
def test_GetPosts_check_status_code_equals_200(client):
    url = "http://138.251.22.78:21709/fed/posts"
    header = {'Client-Host' : 'http://138.251.22.78:21709', 'User-ID': pytest.username}
    response = client.get(path = url, headers = header)

    assert response.status_code == 200


# Test  Get Posts From Community
def test_GetPostsFromCommunity_check_status_code_equals_200(client):
    url = "http://138.251.22.78:21709/fed/posts?community=" + pytest.community_name
    header = {'Client-Host' : 'http://138.251.22.78:21709', 'User-ID' : pytest.username}
    response = client.get(path = url, headers = header)

    assert response.status_code == 200

# # Test Get Posts From Community api
# def test_GetPostsFromCommunity_api_check_status_code_equals_200(client):
#     community_name_dict = {'parent': pytest.community_name}
#     print(community_name_dict)
#     url = "http://138.251.22.78:21709/api/GetPostsFromCommunity/"
#     response = client.put(path = url, json = community_name_dict)
#     response_dictionary = json.loads(response.data)
#     print(response_dictionary)
#     assert response.status_code == 200


# Test Get  Post
def test_GetPost_check_status_code_equals_200(client):
    url = "http://138.251.22.78:21709/fed/posts/" + pytest.post_id
    header = {'Client-Host' : 'http://138.251.22.78:21709', 'User-ID' : pytest.username}
    response = client.get(path = url, headers = header)
    assert response.status_code == 200

# Test Edit Post
def test_EditPost_check_status_code_equals_200(client):
    url = "http://138.251.22.78:21709/fed/posts/" + pytest.post_id
    header = {'Client-Host' : 'http://138.251.22.78:21709', 'User-ID' : pytest.username}
    new_post_content = {
        'title': 'Bezoss Wealth Overflows 64-bit Signed Integer, Now Massively In Debt',
          'content': [
                {
                'text': {
                'text': 'Sed ut perspiciatis, unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo enim ipsam voluptatem, quia voluptas sit, aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos, qui ratione voluptatem sequi nesciunt, neque porro quisquam est, qui dolorem ipsum, quia dolor sit amet consectetur adipisci[ng]velit, sed quia non-numquam [do] eius modi tempora inci[di]dunt, ut labore et dolore magnam aliquam quaerat voluptatem.'
                }
            }
        ]
    }
    response = client.put(path = url, json = new_post_content, headers = header)
    assert response.status_code == 200


# Test  Create Comment


def test_CreateComment_check_status_code_equals_200(client):
    test_comment_create_dict = {
      'community': pytest.community_name,
      'parentPost': pytest.post_id,
      'title': 'Bezoss Wealth Overflows 64-bit Unsigned Integer, Is Now Homeless Comment',
      'content': [
        {
          'text': {
            'text': 'Sed ut perspiciatis, unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo enim ipsam voluptatem, quia voluptas sit, aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos, qui ratione voluptatem sequi nesciunt, neque porro quisquam est, qui dolorem ipsum, quia dolor sit amet consectetur adipisci[ng]velit, sed quia non-numquam [do] eius modi tempora inci[di]dunt, ut labore et dolore magnam aliquam quaerat voluptatem.'
          }
        }
      ]
    }

    header = {'Client-Host' : 'http://138.251.22.78:21709', 'User-ID' : pytest.username}

    url = "http://138.251.22.78:21709/fed/posts"

    response = client.post(path = url, json = test_comment_create_dict, headers = header)

    print(pytest.post_id)
    response_dictionary = response.json
    print(response_dictionary)

    pytest.comment_id = response_dictionary["id"]


    assert response.status_code == 200

# Test Get Comments For a Post
def test_GetCommentsForPost_check_status_code_equals_200(client):
    url = "http://138.251.22.78:21709/fed/posts?parentPost=" + pytest.post_id
    header = {'Client-Host' : 'http://138.251.22.78:21709', 'User-ID' : pytest.username}
    response = client.get(path = url, headers = header)

    assert response.status_code == 200

# Test  Create reply to a comment

def test_CreateReply_check_status_code_equals_200(client):
    test_reply_create_dict = {
      'community': pytest.community_name,
      'parentPost': pytest.comment_id,
      'title': 'Bezoss Wealth Overflows 64-bit Unsigned Integer, Is Now Homeless Comment',
      'content': [
        {
          'text': {
            'text': 'Sed ut perspiciatis, unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo enim ipsam voluptatem, quia voluptas sit, aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos, qui ratione voluptatem sequi nesciunt, neque porro quisquam est, qui dolorem ipsum, quia dolor sit amet consectetur adipisci[ng]velit, sed quia non-numquam [do] eius modi tempora inci[di]dunt, ut labore et dolore magnam aliquam quaerat voluptatem.'
          }
        }
      ]
    }

    header = {'Client-Host' : 'http://138.251.22.78:21709', 'User-ID' : pytest.username}

    url = "http://138.251.22.78:21709/fed/posts"

    response = client.post(path = url, json = test_reply_create_dict, headers = header)


    response_dictionary = response.json
    print(response_dictionary)

    pytest.reply_id = response_dictionary["id"]


    assert response.status_code == 200

# Test  Get Replies to a Comment

def test_GetReplies_check_status_code_equals_200(client):
    url = "http://138.251.22.78:21709/fed/posts?parentPost=" + pytest.comment_id
    header = {'Client-Host' : 'http://138.251.22.78:21709', 'User-ID' : pytest.username}
    response = client.get(path = url, headers = header)

    assert response.status_code == 200

# Test  Like Post

def test_LikePost_check_status_code_equals_200(client):
    test_LikePost_dict = {'id': pytest.post_id, 'author' : {'id': 'bh77', 'host':'wabberjocky'}}
    url = "http://138.251.22.78:21709/api/LikePost/"
    response = client.put(path = url, json = test_LikePost_dict)
    assert response.status_code == 200

# Test  DeLike Post

def test_DeLikePost_check_status_code_equals_200(client):
    test_DeLikePost_dict = {'id': pytest.post_id, 'author' : {'id': 'bh77', 'host':'wabberjocky'}}
    url = "http://138.251.22.78:21709/api/DeLikePost/"
    response = client.put(path = url, json = test_DeLikePost_dict)
    assert response.status_code == 200

# Test  Dislike Post

def test_DislikePost_check_status_code_equals_200(client):
    test_DislikePost_dict = {'id': pytest.post_id, 'author' : {'id': 'bh77', 'host':'wabberjocky'}}
    url = "http://138.251.22.78:21709/api/DislikePost/"
    response = client.put(path = url, json = test_DislikePost_dict)
    assert response.status_code == 200

# Test  DeDislike Post

def test_DeDislikePost_check_status_code_equals_200(client):
    test_DeDislikePost_dict = {'id': pytest.post_id, 'author' : {'id': 'bh77', 'host':'wabberjocky'}}
    url = "http://138.251.22.78:21709/api/DeDislikePost/"
    response = client.put(path = url, json = test_DeDislikePost_dict)
    assert response.status_code == 200


# Test  Delete Reply to a Comment
def test_DeleteReply_check_status_code_equals_200(client):
    url = "http://138.251.22.78:21709/fed/posts/" + pytest.reply_id
    header = {'Client-Host' : 'http://138.251.22.78:21709', 'User-ID' : pytest.username}
    response = client.delete(path = url, headers = header)
    assert response.status_code == 200


# Test  Delete Comment
def test_DeleteComment_check_status_code_equals_200(client):
    url = "http://138.251.22.78:21709/fed/posts/" + pytest.comment_id
    header = {'Client-Host' : 'http://138.251.22.78:21709', 'User-ID' : pytest.username}
    response = client.delete(url, headers = header)
    assert response.status_code == 200


# Test  Delete Post
def test_DeletePost_check_status_code_equals_200(client):
    url = "http://138.251.22.78:21709/fed/posts/" + pytest.post_id
    header = {'Client-Host' : 'http://138.251.22.78:21709', 'User-ID' : pytest.username}
    response = client.delete(path = url, headers = header)
    assert response.status_code == 200

# Test Delete Community
def test_DeleteCommunity_check_status_code_equals_200(client):
    print(pytest.new_community_name)
    test_delete_community_dict = {'id': pytest.community_name, 'user_id' : pytest.username, 'hostname' : 'http://138.251.22.78:21709'}
    url = "http://138.251.22.78:21709/api/CreateOrDeleteCommunity/"
    response = client.delete(path = url, json = test_delete_community_dict)
    assert response.status_code == 200


# Test Delete User
def test_DeleteUser_check_status_code_equals_200(client):

    test_delete_user_dict = {'id':pytest.username, 'password': 'TEST2'}
    url = "http://138.251.22.78:21709/api/DeleteUser/"
    response = client.post(path = url, json = test_delete_user_dict)
    assert response.status_code == 200
