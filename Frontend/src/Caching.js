import {GetPostComments, GetPostParent, 
    GetACommunityId, GetUserPosts, GetPostId, GetPostCommunityId, 
    GetLikedUsers, GetDislikedUsers, GetAuthorId, GetAuthorHost} from './RequestsPosts';
import Cookies from 'universal-cookie';

const localStorage = window.localStorage;
const homeURL = 'https://cs3099user-a4.host.cs.st-andrews.ac.uk/';
const host = 'cs3099user-a4.host.cs.st-andrews.ac.uk';
// const internalUrl = homeURL + 'api/';
const url = homeURL + 'api/';
const url_key = url + 'posts?community=';
const url_all = url + 'posts';
const url_profile = url + 'users/';
const url_community = url + 'communities';
const cookies = new Cookies();

// puts value into cache at key
export function PutInCache(key, value, xhr) {
  // console.log("SETTING CACHE");
  var setTime = xhr.getResponseHeader("Cache-Control");
  // interval of ttl (milliseconds)
  var interval = setTime ? setTime.split("=")[1]*1000 : 60000; // get cache time, otherwise default
  var expirery = new Date().getTime() + interval;
  // console.log('expires in ' + interval/1000);
  var toStore = {value: value, expires: expirery};

  // // if value already in cache (post)s
  // var val = GetFromCache(key);
  // if(val) {
  //   // if item has longer ttl than current, update the post but not ttl
  //   if(val.expires - expirery >= 0) {
  //     val.value = value;
  //     localStorage.setItem(key, JSON.stringify(val));
  //     return;
  //   }
  // }
  localStorage.setItem(key, JSON.stringify(toStore));
}

// gets from cache the key
export function GetFromCache(key) {
  var data = localStorage.getItem(key);
  var cache = data ? JSON.parse(data) : null;
  // cache has expired, remove
  if(cache && cache.expires - new Date().getTime() <= 0) {
    // console.log("expired");
    localStorage.removeItem(key);
    return null;
  }
  return cache;
}

// recursively removes comments from cache
function RemoveCommentFromCache(key) {
  var comment = GetCacheNoDate(key);
  if(comment) {
    var comments = GetPostComments(comment.value);
    localStorage.removeItem(key);
    var i;
    for(i = 0 ; i < comments.length ; i++) {
      RemoveCommentFromCache(comments[i]);
    }
  }
}

function SetComments(post, newComments) {
  post.children = newComments;
}

function RemovePostFromCache(key) {
  var item = GetCacheNoDate(key);
  if(item) {
    localStorage.removeItem(key);
    let comments = GetPostComments(item.value);
    var i;
    for(i = 0; i < comments.length; i++) {
      RemoveCommentFromCache(comments[i]);
    }
}
}

function RemoveCommentInPostCache(key, commentID) {
  var post = GetFromCache(key);
  if(post) {
    var comments = GetPostComments(post.value);
    comments.splice(comments.findIndex(p => p === commentID), 1);
    SetComments(post.value, comments);
    localStorage.setItem(key, JSON.stringify(post));
  }
}

function RemoveFromAllCommunities(key, target) {
  // removes community id from all communities
  var communities = GetFromCache(url_community + genTarget(target, true));
  if(communities) {
    // find index of community, splice + remove
    var comm = communities.value.findIndex(c => c === key);
    communities.value.splice(comm, 1);
    localStorage.setItem(url_community + genTarget(target, true), JSON.stringify(communities));
  }
}

export function RemoveFromCache(key, type, target) {
// removing anyways, don't need expired date
var item = type === 'community' ? GetCacheNoDate(url_key + key + genTarget(target, false)) 
                                : GetCacheNoDate(key);
switch(type) {
case 'post':
  if(item) {
    localStorage.removeItem(key);
    var comments = GetPostComments(item.value);
    var i;
    // remove posts comments
    for(i = 0; i < comments.length; i++) {
      RemoveCommentFromCache(comments[i]);
    }
  }
  break;
case 'comment': 
  if(item) {
    let parent = GetPostParent(item.value);
    // removes all children comments and comment itself
    RemoveCommentFromCache(key);
    // removes comment from parent post
    RemoveCommentInPostCache(parent, key);
  }
  break;
case 'community': 
  // removes community about, title etc
  localStorage.removeItem(url_community + '/' + key + genTarget(target, true));
  // removes community from all communities
  RemoveFromAllCommunities(key, target);
  // deleting community
  if(item) {
    var j;
    // removes posts from community
    for(j = 0; j < item.value.length; j++) {
      RemovePostFromCache(item.value[j]);
    }
    // removes community posts
    localStorage.removeItem(url_key + key + genTarget(target, false));
  }
  break;
}
}

// function NotExpired(cacheItem) {
//   return cacheItem.expires - new Date().getTime() > 0;
// }

// removes item from cache without looking at TTL
function GetCacheNoDate(key) {
  var cache = localStorage.getItem(key);
  return cache ? JSON.parse(cache) : null;
}

export function EditCache(key, edits, type, server) {
  // LikePost
  // DislikePost
  // DeLikePost
  // DeDislikePost
  console.log('looking for', key);
  console.log('type', type);
  const likesObj = {id: GetAuthorId(edits), hostname: GetAuthorHost(edits)};
  var cache = type === 'community' ? GetFromCache(url_community + '/' + key + genTarget(server, true)) : GetFromCache(key);
  if(cache) {
    console.log('before liked', GetLikedUsers(cache.value));
    console.log('before disliked', GetDislikedUsers(cache.value));
    switch(type) {
      case 'post':
        cache.value.title = edits.title;
        cache.value.content = edits.content;
        break;
      case 'comment':
        cache.value.content = edits.content;
        break;
      case 'community':
        cache.value.title = edits.title;
        cache.value.description = edits.description;
        // edit community here
        break;
      case 'about':
        SetUserAbout(cache.value, edits);
        break;
      case 'LikePost':
        //stored as id hostname
        var liked = GetLikedUsers(cache.value);
        console.log('liked', liked);
        var disliked = GetDislikedUsers(cache.value);
        var dislikedIndex = disliked.findIndex(p => p.id === GetAuthorId(edits));
        if(dislikedIndex !== -1) disliked.splice(dislikedIndex, 1); // remove user from disliked if there
        liked.push(likesObj); // put user into liked
        break;
      case 'DislikePost':
        liked = GetLikedUsers(cache.value);
        disliked = GetDislikedUsers(cache.value);
        var likeIndex = liked.findIndex(p => p.id === GetAuthorId(edits));
        if(likeIndex !== -1) liked.splice(likeIndex, 1);
        disliked.push(likesObj);
        break;
      case 'DeLikePost':
        liked = GetLikedUsers(cache.value);
        likeIndex = liked.findIndex(p => p.id === GetAuthorId(edits));
        if(likeIndex !== -1) liked.splice(likeIndex, 1);
        break;
      case 'DeDislikePost':
        disliked = GetDislikedUsers(cache.value);
        dislikedIndex = disliked.findIndex(p => p.id === GetAuthorId(edits));
        if(dislikedIndex !== -1) disliked.splice(dislikedIndex, 1);
        break;
      
    }
    console.log('after liked', GetLikedUsers(cache.value));
    console.log('after disliked', GetDislikedUsers(cache.value));
    localStorage.setItem(key, JSON.stringify(cache));
  }
}

function SetUserAbout(userAbout, about) {
  userAbout.about = about;
}

function AddPostCache(key, toAdd, isUser) {
  let addingTo = GetFromCache(key);
  if(addingTo) {
    // if pushing to profile page
    var pushingTo = isUser ? GetUserPosts(addingTo.value) : addingTo.value;
    var id = GetPostId(toAdd);
    // if user, stored as {id, host}, otherwise we store as postID
    pushingTo.push(isUser ? {id: id, host: host} : GetPostId(toAdd));
    localStorage.setItem(key, JSON.stringify(addingTo));
  }
}

// adds toAdd to cache
export function AddCache(toAdd, type, server) {
  switch(type) {
    case 'post':
      var communityPost = GetPostCommunityId(toAdd);
      // adds ids to relevant caches
      AddPostCache(url_key + communityPost + genTarget(server, false), toAdd, false);
      AddPostCache(url_all + '?limit=10' + genTarget(server, false), toAdd, false);
      AddPostCache(url_profile + cookies.get('id') + genTarget(server, true), toAdd, true);
      break;
    case 'comment':
      let parent = GetPostParent(toAdd);
      let post = GetFromCache(parent);
      if(post) {
        // if the post has not expired, update comments
        var comments = GetPostComments(post.value);
        comments.push(GetPostId(toAdd));
        localStorage.setItem(parent, JSON.stringify(post));
      }
      break;
    case 'community':
      var communities = GetFromCache(url_community+genTarget(server, true));
      console.log('adding to ', url_community+genTarget(server, true));
      // adding to all communities
      if(communities) {
        communities.value.push(GetACommunityId(toAdd));
        localStorage.setItem(url_community+genTarget(server, true), JSON.stringify(communities));
      }
      // adding in community to communities/<community>?targetHost=<server>
      localStorage.setItem(url_community + '/' +  GetACommunityId(toAdd) + genTarget(server,true), JSON.stringify(toAdd));
      break;
  }
}

// appends targetHost to url
function genTarget(server, q) {
  const response = (q ? '?' : '&') + 'targetHost=' + server;
  return response;
}
