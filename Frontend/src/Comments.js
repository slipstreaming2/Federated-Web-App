import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import $ from 'jquery';
import {PostDisp, checkUserAdmin, Options, ShowLikes, ConvertDates} from './Display';
import { useForm } from "react-hook-form";
import { useHistory, useParams, Link } from "react-router-dom";
// import { Button } from "react-bootstrap";
import { Get, Delete, Post, GetAuthorId, GetAuthorHost, GetPostId, 
        Edit, GetPostContent, GetPostAuthor, GetPostHost, GetPostComments, GetFilter, 
        GetUserPostId, GetUserPostHost, LinkProfile, GetLikedUsers, GetPostParent,
        GetPostTimeCreated, errReport} from './RequestsPosts';
import Card from '@material-ui/core/Card';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import CardHeader from '@material-ui/core/CardHeader';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import TextField from '@material-ui/core/TextField';
import CardActions from '@material-ui/core/CardActions';
import Divider from '@material-ui/core/Divider';
import Collapse from '@material-ui/core/Collapse';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import { red } from '@material-ui/core/colors';
import FavoriteIcon from '@material-ui/icons/Favorite';
import ShareIcon from '@material-ui/icons/Share';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ChatIcon from '@material-ui/icons/Chat';
import { makeStyles } from '@material-ui/core/styles';

import { useState, useEffect } from 'react';
import './style.css';


const useStyles = makeStyles((theme) => ({
  child: {
    width: 600,
    paddingLeft: 100 
  },
  content: {
    width: 600,
  }
}));


// displays comment page
export default function Commenting(props) {
    const history = useHistory();
    const { register, handleSubmit, errors } = useForm(); // hooks form
    const { server, community, postID } = useParams();
    const user = props.user;

    const [comments, setComments] = useState([]);
    const [post, setPost] = useState(null);
    const [numberComments, setNumberComments] = useState(0);
    const [admin, setAdmin] = useState(false); // if user is admin
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        console.log('id of post:' + postID);
        console.log('community: ' + community);
        const success = (data) => {
          setPost(data); // update post
          setNumberComments(GetPostComments(data).length);
          const topLevel = GetPostComments(data);
          console.log('found comments', GetPostComments(data));
          checkUserAdmin(setAdmin, user, data, decodeURIComponent(server)); // check if user is admin
          // recursively finds comments
          // const findAll = (post, children) => {
          //   var dataComments = GetPostComments(post);
          //   var j;
          //   if(dataComments) {
          //     for(j = 0 ; j < dataComments.length ; j++) {
          //       var id = dataComments[j];
          //       const secSucc = (payload) => {
          //         children.push(payload);
          //         findAll(payload, children); // recursively find comments
          //         console.log(payload);
          //       }
          //       Get(id, secSucc, decodeURIComponent(server));
          //     }
          //   }
          // }
          var promises = []; // promises found
          var i;
          for(i = 0 ; i < topLevel.length ; i++) {
            var id = topLevel[i];
            const secSucc = (payload) => {
              // var children = [];
              // findAll(payload, children); // recursively find comments
              // setComments(prevComms => [{comment: payload, children: children}, ...prevComms]); // update current comments on page
              setComments(prevComms => [payload, ...prevComms]); // update current comments on page
              console.log(payload);
            }
            Get(id, secSucc, decodeURIComponent(server), false, promises);
          }
          Promise.allSettled(promises).then((result) => {
            //reach here regardless of rejection/network failure
            // setPosts(asyncPosts);
            errReport(result);
            setFinished(true);
          });
      }
      Get(postID, success, decodeURIComponent(server)); // initial post get
    }, []); // useEffect, upon load get posts + comments

    // deletes the comment
    const deleteComment = (commentID, setChildren, children, commentData) => {
      console.log(commentID);
      const success = () => {

        // setComments(prevPosts => prevPosts.splice(prevPosts.findIndex(item => GetPostId(item) === commentID), 1));
        if(setChildren){ // if this is a child comment
          var parent = commentData.parent_data;
          if (parent) {
            parent.children = GetPostComments(parent).filter(item => item !== commentID);
          }
          const remComment = (id, setChild, childs, data) => {
            const subcomment = GetPostComments(data);
            var i;
            console.log('removing', data);
            for(i = 0 ; i < subcomment.length ; i++) {
              var index = childs.findIndex(p => GetPostId(p) === subcomment[i]);
              console.log(childs, subcomment[i]);
              if(index !== -1) remComment(subcomment[i], setChild, childs, childs[index]);
            }
            setChild(prevChildren => prevChildren.filter(item => GetPostId(item) !== id));
          }
          remComment(commentID, setChildren, children, commentData);
        }
        else {
          setComments(prevComments => prevComments.filter(item => GetPostId(item) !== commentID));
          // console.log('removing adult', prevComments, newComments);
          setNumberComments(numberComments - 1); 
        } 
      }
      Delete(commentID, success, 'comment', decodeURIComponent(server));
    }

    function postComment(data, commentID, setChildren, parent, setReplying) {
      console.log('comment post', data.comment);
      if(data && data.comment) {
        let newComment =  { community: community, // creating new comment
                            title: null, // comments to post have null titles
                            content: [{markdown: {text: data.comment}}],
                            parentPost: commentID ? commentID : postID  
                          }
        const success = (data) => {
          
          console.log("success!!");
          if(setChildren) {
            setReplying(false);
            GetPostComments(parent).push(GetPostId(data));
            data['parent_data'] = parent;
            setChildren(prev => [...prev, data]);
          }
          else {
            // setComments(prevComments => [...prevComments, {id: data, children: []}]);
            setComments(prevC => [...prevC, data]); 
            setNumberComments(numberComments + 1);
          }
        }
        Post(JSON.stringify(newComment), success, decodeURIComponent(server));
      } else {
        alert("write something in your comment!");
      }
    }

    const onSubmit = data => postComment(data); // handling post submit

    function CommentForm() {
      return (
        <form onSubmit={handleSubmit(onSubmit)} className='commentForm'>
          <label>Comment:</label>
          <input name="comment" 
            placeholder="Comment here" 
            ref={register({required: "Required"})}
            size="80"/>
          <button type="submit">Submit</button>
        </form>
      );
    }
    
    function Comments() {
      return(
        comments && comments.map((item) => (
            <div key={GetPostId(item)} style={{paddingTop: '30px'}}>
                <CommentDisp 
                  user={user}
                  comment={item}
                  server={decodeURIComponent(server)}
                  isTop={true}
                  delete={deleteComment} 
                  admin={admin} 
                  post={post} 
                  handleDataForm={postComment}
                  />
            </div>
        ))
      );
    }

    return (
      <div style={{paddingTop: '50px'}}>
        {/* <button href="#" style={{float:'left'}} onClick={() => history.goBack()}>BACK</button> */}
        {post && 
            <PostDisp post={post} user={user} comment={true} server={decodeURIComponent(server)} comments={numberComments}/> 
          }
          <div style={{marginBottom: '120px'}}>
            <Comments/> 
          </div>
          {!finished && 
          // <CircularProgress color="secondary"/>
          <h4>Loading...</h4>
          }
          <div className='footer'>
            <CommentForm />
          </div>
      </div>
  );
}

function CommentDisp(props) {
  const [editing, setEditing] = useState(false);
  const comment = props.comment;
  const [description, setDescription] = useState(GetPostContent(comment, true)); // uncompiled markdown
  const [htmlBody, setHtmlBody] = useState(GetPostContent(comment)); // compiled markdown
  const [children, setChildren] = useState([]);
  const user = props.user;
  const admin = props.admin;
  // const post = props.post;
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    var promises = [];
    const findAll = (post) => {
      var dataComments = GetPostComments(post);
      var j;
      if(dataComments) {
        for(j = 0 ; j < dataComments.length ; j++) {
          var id = dataComments[j];
          const secSucc = (payload) => {
            payload['parent_data'] = post;
            setChildren(prev => [...prev, payload]);
            findAll(payload); // recursively find comments
            console.log('found child', payload);
          }
          Get(id, secSucc, props.server,  false, promises);
        }
      }
    }
    if(props.isTop) findAll(comment);
  }, []);

  const classes = useStyles();

  function MakingEdit() {
    const maxDescriptionLength = 500; // comment should not exceed 500 characters
    const { register, handleSubmit, errors } = useForm(); // hooks form
    
    const handleDataForm = (data) => {
      let toSend = {
        title: null,
        content: [{markdown:{text:data.body}}]
      }
      console.log(toSend);
      console.log(data);
      const success = () => {
        props.comment.content = [{markdown:{text:data.body}}];
        setHtmlBody(GetPostContent(props.comment));
        setDescription(data.body);
        setEditing(false);
      }
      Edit(GetPostId(comment), toSend, success, 'comment', props.server);
    }
    
    const onSubmit = data => handleDataForm(data); // handling post submit

    return(
      <div align="left" style={{padding: '4px 0px 5px 15px'}}>
        <form onSubmit={handleSubmit(onSubmit)} className='SubmitForm'>
          <input 
            name="body" 
            defaultValue={description}
            maxLength={maxDescriptionLength}
            ref={register({required: "Required"})}
            />
          <button onClick={() => setEditing(false)}>Cancel</button>
          <button type="submit">Save</button>
        </form>
      </div>
    );
  } // MakingEdit

  function MakingReply() {
    const maxDescriptionLength = 500; // comment should not exceed 500 characters
    const { register, handleSubmit, errors } = useForm(); // hooks form
        
    const onSubmit = data => props.handleDataForm(data, comment.id, (!props.isTop ? props.setChildren : setChildren), comment, setReplying); // handling post submit

    return(
      <>
        <hr style={{height: '1px', borderWidth: 0, color: 'gray', backgroundColor: 'gray'}}></hr>
        <form onSubmit={handleSubmit(onSubmit)} className='SubmitForm' style={{paddingBottom: '20px'}}>
            <input 
            name="comment" 
            placeholder="Reply here" 
            maxLength={maxDescriptionLength}
            ref={register({required: "Required"})}
            />
          <button onClick={() => setReplying(false)}>Cancel</button>
          <button type="submit">Reply</button>
        </form>
      </>
    );
  } // MakingReply
  
  const disp = htmlBody[0];

  const authorLinks = <Link to={LinkProfile(comment)}>
                        {GetPostAuthor(comment)}
                      </Link>

  const reply = () => {
    if(!props.isTop) {
      console.log('not top');
      // var index = props.children.findIndex(p => GetPostId(p) === GetPostParent(comment));
      // if(index !== -1) {
        var parent = comment.parent_data;
        // props.children[index];
        console.log('did return');
        return(
          <Typography align="left" color="textSecondary" noWrap style={{fontSize: '12px'}}>
            replying to {GetPostAuthor(parent)}: {GetPostContent(parent)}
          </Typography>
        );
      // }
    }
    return null;
  }


  const datePosted = ConvertDates((new Date().getTime() / 1000) - GetPostTimeCreated(comment));
  const format = {
    day: "numeric",
    month: "2-digit",
    year: "numeric"
};
  const dateShow = datePosted ? datePosted : new Date(GetPostTimeCreated(comment)*1000).toLocaleString("en-gb", format);
  const commentNumber = () => GetPostComments(props.comment).length;
  console.log(commentNumber(), props.isTop, GetPostId(props.comment));
  return(
    <>
      <div style={{backgroundColor: 'white', maxWidth: '1200px'}}>
        <div style={!props.isTop ? {height: '100%', borderLeft: '4px solid gray', marginLeft: '60px'} : null}>
          <Paper variant={props.isTop && "outlined"} square={1}>
            <CardHeader title={
              <>
                {reply()}
                <Typography variant="h6" align="left" style={{ fontWeight: "bold" }} color="textSecondary">
                  {authorLinks} • {dateShow} • {GetPostHost(comment)}
                </Typography>
              </>
            }/>
            {editing ?
            <MakingEdit/> :
            <p style={{textAlign: 'left', fontSize: '18px', padding:'0px 30px', marginBottom: '0px'}}>
              {disp}
            </p>
            }
            <CardActions disableSpacing style={{paddingTop: "0px"}}>
              <ChatIcon />
              {commentNumber()}
              {GetLikedUsers(comment) &&          
              <ShowLikes post ={comment} user={props.user} />}
              <Button variant="outlined" color="primary" style={{marginLeft: 'auto'}} onClick={() => setReplying(true)}>
                Reply
              </Button>
              {GetPostAuthor(comment) === GetAuthorId(user) && GetPostHost(comment) === GetAuthorHost(user) &&
              <Button variant="outlined" onClick={() => setEditing(true)}>
                Edit
              </Button>}
              {(props.admin || (GetPostAuthor(comment) === GetAuthorId(user) && GetPostHost(comment) === GetAuthorHost(user))) &&
              <Button variant="contained" color="secondary" onClick={() => props.delete(GetPostId(comment), !props.isTop ? props.setChildren : null, props.children, props.comment)} admin={admin}>
                Delete
              </Button>}
            </CardActions>
            {replying && <MakingReply post={comment}/> }
          </Paper>
        </div>
      </div>

      {children && children.map((post) => {
        return(
          <CommentDisp 
            setChildren={setChildren}
            children={children}
            key={GetPostId(post)}
            style={{position: 'relative', left:'40px'}}
            user={user}
            server={props.server} 
            comment={post}
            delete={props.delete} 
            admin={props.admin} 
            handleDataForm={props.handleDataForm}/>
        )
      })}
    </>
  )
} // CommentDisp
