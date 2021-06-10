import $ from 'jquery';
import {GetFromCache, PutInCache, AddCache, RemoveFromCache, EditCache} from './Caching'
import ReactMarkdown from 'react-markdown';
import Linkify from 'react-linkify';
import Cookies from 'universal-cookie';
import { useHistory } from 'react-router-dom';

/* caching */
const localStorage = window.localStorage;
export const homeURL = 'https://cs3099user-a4.host.cs.st-andrews.ac.uk/';
export const home = "cs3099user-a4.host.cs.st-andrews.ac.uk";
const internalUrl = homeURL + 'api/';
export const url = homeURL + 'fed/'
const cookies = new Cookies();
const errors = (xhr, error, errorThrown) => {
  if(xhr.status === 0) {
    alert('server is unavailable');
    return;
  }
  console.log("errored with status ", xhr.status);
  console.log("with text", xhr.responseText);
  // alert(xhr.status);
  alert(xhr.responseText);
  // const message = JSON.parse(xhr.responseText);
  // alert(message.message);
    }
// const header = {
//   'Client-Host': homeURL,
//   'User-ID': "David"
// }; // update upon login/load in
var header;
var singleHeader = {'Client-Host': home}

// export function SetUserID(user) {
//   // localStorage.clear(); 
//   userID = GetAuthorId(user);
//   header = {
//       'Client-Host': home,
//       'User-ID': userID
//   };
//   console.log('signed in as', userID);
// }

/**
creates the double header using cookies
 */
function getDoubleHeader() {
  var header = {'Client-Host': home, 
                'User-ID': cookies.get('id')}
  return header;
}

/**
forms the get request across the server

@param {Object} obj: { url_send, key, success, headers, target, isFilter, isUser, err }

 */
function MakeGetRequest(obj) {
  var cache = GetFromCache(obj.key);
  // console.log("SEARCHING FOR ", obj.key);
  if(cache) { // not expired or exists
    console.log("GOT ", obj.key,  " CACHE");
    console.log('ttl ', (cache.expires - new Date().getTime())/1000);
    // filtering or a user, list of post ids
    if(obj.isFilter || obj.isUser) {
      var toRes = []
      var justIds = []
      var i;
      // user has posts stored in object
      var it = obj.isUser ? GetUserPosts(cache.value) : cache.value;
      for(i = 0 ; i < it.length ; i++) {
        var p = GetFromCache(obj.isUser ? GetUserPostId(it[i]) : it[i]);
        if(p) { // found valid cache
          if(!obj.isUser) { // not a user 
            toRes.push(p.value); // push to resolve value
            justIds.push(GetPostId(p.value)); // push just the id as reference
          } else{
            justIds.push(it[i]); // user, only value
          }
        }
      }
      // if items were removed, update cache
      if(justIds.length !== it.length) {
        // update the cache values respectively
        if(obj.isUser) cache.value.posts = justIds;
        else cache.value = justIds;
        // updates cache with new non-expired values
        localStorage.setItem(obj.key, JSON.stringify(cache));
      }
      // return cache, or the posts themselves 
      obj.success(obj.isUser ? cache.value : toRes);
    } // isUser || isFilter
    else { // just plain value
      obj.success(cache.value);
    }
    return; // sends back cache, no need for request
  }
  let toRequest = {
    url: obj.url_send,
    type: 'GET',
    success: function(res,status,xhr) {
      // console.log(target, JSON.parse(JSON.stringify(res)));
      // move all posts outside of array, leave only ids
      if(obj.isFilter) {
        var ids = [];
        var i;
        for(i = 0 ; i < res.length ; i++) {
          var pid = GetPostId(res[i]);
          ids.push(pid);
          PutInCache(pid, res[i], xhr); // store post separately
        }
        PutInCache(obj.key, ids, xhr); // store only ids (list of ids), not posts
      } else {
        // console.log('storing ', res);
        PutInCache(obj.key, res, xhr); // otherwise community / single post get, put into cache, do not need to separate ids out
      }
      // console.log('storing under ', obj.key);
      obj.success(res);
    },
    error: function(xhr, error, errorThrown) {
      // console.log('failed at target', obj.target);
      if(obj.err) { 
        obj.err();
        return;
      }
      if(obj.promises) return; // handle externally
      errors(xhr, error, errorThrown);
    },
    dataType: 'json'
  };
  if(obj.headers) {
    toRequest.headers = obj.headers;
  }
  // console.log(obj.url_send);
  console.log('request', JSON.parse(JSON.stringify(toRequest)));
  var promise = $.ajax(toRequest); // store promise for loading
  if(obj.promises) obj.promises.push(promise);
}

/**

@param {String} url_send: url to make request
@param {String} type: type of request ot make (POST || DELETE || PUT)
@param {JSON Object} data: JSON object of data to send
@param {function} success: upon success
@param {Object} headers: headers to send with request 
 */
function NonGetRequest(url_send, type, data, success, headers) {
  let toRequest = {
    url: url_send,
    type: type,
    success: success,
    headers: headers,
    error: errors
  };
  if(type !== 'DELETE') {
    toRequest.contentType = 'application/json';
    toRequest.data = data;
  }
  if(type === 'POST'){
    toRequest.dataType = 'json';
  }
  console.log(type, toRequest);
  $.ajax(toRequest);
}

/**
function to post data

@param {Object} toPost: object to post
@param {function} func: success function
@param {String} target: target to send to
 */
export function Post(toPost, func, target) {
  const success = (res,status,xhr) => {
      func(res, status, xhr);
      PutInCache(GetPostId(res), res, xhr);
      AddCache(res, GetPostTitle(res) === null ? 'comment' : 'post', target);
  }
  NonGetRequest(AddServer(internalUrl + 'posts', target), 'POST', toPost, success, getDoubleHeader());
}

function AddServer(urlSend, target, filtering) {
  const response = urlSend + (filtering ? '&' : '?') + 'targetHost='+encodeURIComponent(target);
  return response;
}


/**
Gets post by id or gets posts by filter

@param {String} toGet - url of filter or post ID
@param {function} func - success function
@param {boolean} isFilter - boolean, true if filter, false otherwise
*/
export function Get(toGet, func, target, isFilter, promises) {
  var urlSend = isFilter ? toGet : internalUrl+'posts/'+toGet;
  urlSend = AddServer(urlSend, target, isFilter)
  var obj = {
    url_send: urlSend,
    key: isFilter ? urlSend : toGet,
    success: func,
    headers: getDoubleHeader(),
    isFilter: isFilter ? true : false, 
    promises: promises,
  }
  MakeGetRequest(obj);
}

/**
Gets posts by filter

@param {URI Encoded String} filter - filter to apply
@param {function} func - success function
@param {String} target - target to send
@param {Array promises} promises - array of promises to wait on
*/
export function GetFilter(filter, func, target, promises) {
  let toSearch = internalUrl + 'posts';
  let urlFilt = !filter ? toSearch : toSearch + '?' + filter;
  Get(urlFilt, func, target, true, promises);
}

/**
Deletes post

@param {String} toDelete - post id to delete
@param {function} func - success function
@param {String} type - post, comment, community etc
@param {String} target - target to send to
*/
export function Delete(toDelete, func, type, target) {
  const success = () => {
      func();
      // remove all from the cache
      RemoveFromCache(toDelete, type, target); 
  }
  NonGetRequest(AddServer(internalUrl + 'posts/' + toDelete, target), 'DELETE', null, success, getDoubleHeader());
}

/**
Edits a post

@param {String} toEdit: post to edit
@param {Object} edits: object to edit
@param {function} func: function of success
@param {String} type: type of edit (comment || community || post)
@param {String} target: target to send to
 */
export function Edit(toEdit, edits, func, type, target) {
  const success = () => {
      func();
      // edit in the cache
      EditCache(toEdit, edits, type, target);
  }
  // no return
  NonGetRequest(AddServer(internalUrl + 'posts/' + toEdit, target), 'PUT', JSON.stringify(edits), success, getDoubleHeader());
}

/**
Gets all community ids

@param {function} func: success function
@param {String} target: target to send to
@param {Array Promises} promises: array of promises to wait upon
*/
export function GetCommunityIds(func, target, promises) {
  var url_send = internalUrl+'communities';
  url_send = AddServer(url_send, target); // add server to url (ex. targetHost)
  var obj = {
    url_send: url_send,
    key: url_send,
    success: func,
    headers: singleHeader,
    promises: promises,
  }
  MakeGetRequest(obj);
}

/**
Gets a community by Id
@param {String} community: community id to get
@param {function} func: success function
@param {String} target: target to send to
 */
export function GetCommunityById(community, func, target) {
  var url_send = internalUrl+'communities/' + encodeURIComponent(community);
  url_send = AddServer(url_send, target);
  var obj = {
    url_send: url_send,
    key: url_send,
    success: func,
    headers: singleHeader,
  }
  MakeGetRequest(obj);
}


// export function GetTimeStampsCommunity(id, func, target) {
//   var url_send =  internalUrl+'communities/' + id + '/timestamps';
//   url_send = AddServer(url_send, target);
//   var obj = {
//     url_send: url_send,
//     key: url_send,
//     success: func,
//     headers: singleHeader,
//     target: target,
//   }
//   MakeGetRequest(obj); 
// }

/**
creates a community locally

@param {String} community: community id to create
@param {function} success: success function
*/
export function CreatingCommunity(community, success) {
  AddCache(community, 'community', home);
  $.ajax({
      url: internalUrl + 'CreateOrDeleteCommunity/', 
      type: 'POST',
      data: JSON.stringify(community),
      contentType: 'application/json', // send as JSON file
      dataType: 'json', // expect JSON in return
      success: success,
      error: errors
  })
}

/**
deletes a community locally

@param {String} community: community id to delete
@param {function} success: success function
 */
export function DeletingCommunity(community, success) {
  console.log(community);
  // remove community from cache
  RemoveFromCache(community, 'community', home);
  $.ajax({
      url: internalUrl + 'CreateOrDeleteCommunity/', 
      type: 'DELETE',
      data: JSON.stringify(community),
      contentType: 'application/json', // send as JSON file
      dataType: 'json', // expect JSON in return
      success: success,
      error: errors
  });
}

/**
edits a community

@param {String} community: community id to edit
@param {String} descript: description of community
@param {function} success: success function 
 */
export function EditCommunity(community, descript, success) {
  const data = {
    title: community,
    description: descript
  }
  // edit the community in cache
  EditCache(community, data, 'community', home);
  $.ajax({
      url: internalUrl + 'EditCommunity/' + community,
      type: 'PUT',
      data: JSON.stringify(data),
      contentType: 'application/json', // send as JSON file
      dataType: 'json', // expect JSON in return
      success: success,
      headers:getDoubleHeader(),
      error: errors
  })
}

// export function SendUserMessage(sendingToId, message, success) {
//   $.ajax({
//       url: internalUrl + 'users/' + sendingToId, // community creation request 
//       type: 'POST',
//       data: message,
//       dataType: 'application/json',
//       contentType: 'json', // send as JSON file
//       success: success,
//       error: errors
//   });
// }

/**
gets user by their id

@param {String} userIdToGet: user id to fetch
@param {function} success: success function
@param {String} target: target to send to
 */
export function GetUserById(userIdToGet, success, target) {
  var url_send =  internalUrl+'users/' + userIdToGet;
  url_send = AddServer(url_send, target);
  var obj = {
    url_send: url_send,
    key: url_send,
    success: success,
    target: target,
    isUser: true
  }
  MakeGetRequest(obj);
}

/**
searches users by prefix

@param {String} userToSearch: user prefix to search
@param {function} success: succesful function
@param {String} target: target to send to
@param {Array promises} promises: promises to wait on
 */
export function SearchUsers(userToSearch, success, target, promises) {
  var search = userToSearch ? internalUrl + 'users?prefix='+encodeURIComponent(userToSearch)
                            : internalUrl + 'users';
  search = AddServer(search, target, userToSearch ? true : false);
  var obj = {
    url_send: search,
    key: search,
    success: success,
    promises: promises,
  }
  MakeGetRequest(obj);
}

// export function GetCommunityTitleByPost(post, success) {
//   // let ret = '';
//   // const success = (data) => {
//   //   return GetCommunityTitle(data);
//   // }
//   GetCommunityById(GetPostCommunityId(post), success);
//   // console.log(ret);
//   // return ret;
// }

/**
modifies the like

@param {String} type: type of like ex. LikePost DeLikePost
@param {Object} request: request like object
@param {function} success: success function 

 */
export function ModLike(type, request, success) {
  console.log('mod like', request);
  $.ajax({
    url: internalUrl + type + "/",
    type: 'PUT',
    data: JSON.stringify(request),
    contentType: 'application/json',
    success: () => {
      // request{id: postID, author: likeAuthor}
      // update cache with new like
      EditCache(request.id, request.author, type);
      success();
    },
    error: errors
  });
}

// discovers the other servers
export function Discover(success) {
  let toRequest = {
    url: url + 'discover',
    type: 'GET',
    success: success,
    headers: singleHeader,
    error: errors,
    dataType: 'json'
  }
  $.ajax(toRequest);
}

// reports erros to users given promise results
export function errReport(promiseResults) {
  if(promiseResults) {
    // var index = promiseResults.findIndex(p => p.status === "rejected");
    // if(index !== -1) alert('some information failed to load');
  }
}

export function GetLikedUsers(post) {
  return(post.likeUsers);
}

export function GetDislikedUsers(post) {
  return(post.dislikeUsers);
}

export function GetAuthorId(auth) {
  return(auth.id);
}

export function GetAuthorHost(auth) {
  return(auth.host);
}

export function GetPostTitle(post) {
  return(post.title)
}

export function GetPostHostAuthor(post) {
  return(post.author);
}

export function GetPostAuthor(post) {
  return(post.author.id);
}

export function GetPostHost(post) {
  return(post.author.host);
}

export function GetPostId(post) {
  return(post.id);
}

export function GetPostCommunityId(post) {
  return(post.community);
}

export function GetPostTimeCreated(post) {
  return(post.created);
}

export function GetPostTimeModified(post) {
  return(post.modified);
}

const Images = (props) => { return <img {...props} alt = "" style={{maxWidth: '90%', maxHeight: 400}} /> }
// const Text = (props) => {return <p style={{maxHeight: 100}} children={props.children} />}


// gets the post content from the post, if onlyText then only return as text, not obj
export function GetPostContent(post, onlyText) {
  var content = [];
  var i;
  if(post.content) {
    for(i = 0 ; i < post.content.length ; i++) {
      if(post.content[i].text) {
        if(post.content[i].text.text) {
          content.push(onlyText 
                        ? post.content[i].text.text
                        : <Linkify>
                            {post.content[i].text.text}
                          </Linkify>);
        } else{
          content.push("");
        }
      } 
      else{
        if(post.content[i].markdown && post.content[i].markdown.text) {  
          content.push(onlyText 
                      ? post.content[i].markdown.text
                      : <ReactMarkdown renderers={{image: Images}}>
                          {post.content[i].markdown.text}
                        </ReactMarkdown>);
        } else{
          content.push("");
        }
        // , text: Text
      }
    }
  } else{
    content.push("");
  }
  return content;
}


export function errHandler(promiseRes) {
  var ind = promiseRes.findIndex(a => a.status === "rejected");
  if(ind !== -1) alert('some info failed to load in');
}


export function GetPostComments(post) {
  return(post.children);
}

export function GetPostParent(post) {
  return(post.parentPost);
}

export function GetUserPosts(user) {
  return(user.posts);
}

export function GetUserAbout(user) {
  return(user.about);
}

export function GetUserAvatar(user) {
  return(user.avatarUrl);
}

export function GetUserId(user) {
  return(user.id);
}

export function GetUserPostId(post) {
  return(post.id);
}

export function GetUserPostHost(post) {
  return(post.host);
}

export function SetUserPosts(user, posts) {
  user.posts = posts;
}

export function SetPostTitle(post, title) {
  post.title = title;
}

export function SetPostContent(post, content) {
  post.content = content;
}

export function SetCommunityTitle(community, title) {
  community.title = title;
}

export function SetCommunityDescription(community, description) {
  community.description = description;
}

export function GetPostPostedTo(post) {
  return post.posted_to;
}

export function GetCommunityCreated(data) {
  return data.community;
}

export function LinkCommunity(post) {
  return('/Communities/' + GetPostPostedTo(post) + '/' + GetPostCommunityId(post));
}

export function LinkFromCommunity(comm, server) {
  return('/Communities/' + encodeURIComponent(server) + '/' + comm);
}

export function LinkProfile(post) {
  return('/Profile/' + encodeURIComponent(GetPostHost(post)) + '/' + GetPostAuthor(post));
}

export function LinkProfileViaId(id, server) {
  return('/Profile/' + encodeURIComponent(server) + '/' + id);
}

export function LinkComment(post) {
  return('/Communities/' + encodeURIComponent(GetPostPostedTo(post)) + '/' +GetPostCommunityId(post)+'/Comments/'+GetPostId(post));
}

export function LinkCreate(community, server) {
  return('/Communities/'+ encodeURIComponent(server) + '/' + community + '/CreatePost');
}

export const LinkMain = '/Main';

export const LinkCommunityStatic = '/Communities';

export const LinkCreateCommunity = '/CreateCommunity';

export const LinkLogout = '/';

export const LinkCreateStatic = '/CreatePost';

export function Logout(){
  const cookies = new Cookies();
  cookies.remove('id');
}

export function LinkSearch(search) {
  return '/Search/' + encodeURIComponent(search);
}

export const LinkSettings = '/Settings';

export function GetCommunityTitle(comm) {
  return(comm.title);
}

export function GetCommunityDescription(comm) {
  return(comm.description);
}

export function GetACommunityId(comm) {
  return(comm.id);
}

export function GetCommunityAdmins(comm) {
  return(comm.admins);
}


