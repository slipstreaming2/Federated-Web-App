import React, { useState, useEffect } from "react";
import { Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import { useHistory, Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import Card from '@material-ui/core/Card';
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
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import ListItemText from '@material-ui/core/ListItemText';
import Select from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';
import { VariableSizeList as List } from "react-window";
import useCellMeasurer from "./useCellMeasurer";
import InfiniteLoader from "react-window-infinite-loader";
import "./style.css";
import { useForm } from "react-hook-form";
import { Delete, Edit, GetPostComments, GetPostId, LinkComment, GetPostTitle, 
        GetPostContent, GetPostHost, LinkCommunity,
        GetPostHostAuthor, GetCommunityTitleByPost, GetPostTimeCreated, 
        GetPostTimeModified, GetAuthorId, GetAuthorHost, 
        GetACommunityId, GetCommunityTitle, LinkProfile,
        GetCommunityDescription, GetPostAuthor, LinkFromCommunity,
        GetPostCommunityId, ModLike, GetCommunityAdmins,
        GetCommunityById, LinkMain, GetPostParent, LinkCreate,
        GetLikedUsers, GetDislikedUsers, GetPostPostedTo} from './RequestsPosts';
import Chip from '@material-ui/core/Chip';


const useStyles = makeStyles((theme) => ({
  root: {
    width: 1000,
    border: '2px solid',
    borderColor: '#E7EDF3',
    borderRadius: 8,
    transition: '0.4s',
    '&:hover': {
      borderColor: '#5B9FED',
    },
  },
  nohover: {
    width: 1200,
    border: '2px solid',
    borderColor: '#E7EDF3',
    borderRadius: 8,
  },
  type: {
    maxHeight:400,
    overflow: 'hidden'
  },
  comment: {
    height: '100%'
  },
  header: {
    paddingBottom: 2
  },
  like: {
    backgroundColor: "#00cc69"
  },
  dislike: {
    backgroundColor: "red"
  },
  content: {
    paddingTop: 2,
    paddingBottom: 1 

  },
  actions: {
    padding: 2
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  chip: {
    margin: 2,
  },
}));

// props.filt, props.onchange, props.servers
export function Selector(props) {
  return(
  <div style={{position: "fixed", bottom: 600, right: 175, Typography: "white"}}>
  {/* <InputLabel id="demo-mutiple-checkbox-label" style={{color: "white"}}>Servers</InputLabel> */}
    <Select
      labelId="server-select"
      id="server-select"
      multiple
      style={{backgroundColor: "white", width: 200, color: "black", borderRadius: 4}}
      value={props.filt}
      onChange={props.onChange}
      input={<Input />}
      renderValue={(selected) => <div>select servers</div>}
    >
      {props.servers.map((name) => (
        <MenuItem key={name} value={name}>
          <Checkbox checked={props.filt.indexOf(name) !== -1} />
          <ListItemText primary={name} />
        </MenuItem>
      ))}
    </Select>
  </div>
  );
}


export function Display(props) {
  const history = useHistory();
  // const[pageView, setPageView] = useState("Asc"); // current page views posts in ascending time order
  // const[view, setView] = useState("Time");
  // const[timeView, setTimeView] = useState('All'); // timeline of viewing posts ex. past hour, 24 hours, week, all time
  // const[editing, setEditing] = useState(false);

  // removes a post, postRem is post ID
  function removePost(postRem, post) {
    const success = () => {
      console.log('removing post');
      let prevPosts = props.posts;
      let delPosts = prevPosts.filter(item => GetPostId(item) !== postRem);
      props.setPosts(delPosts);
    }
    Delete(postRem, success, 'post', GetPostPostedTo(post));
  }

  // const dict =  { "NameAsc": {func: (a,b) => (a.title > b.title) ? 1 : -1 },
  //                 "NameDesc": {func: (a,b) => (a.title < b.title) ? 1 : -1},
  //                 "TimeAsc": {func: (a,b) => (a.timestamp < b.timestamp) ? 1 : -1},
  //                 "TimeDesc": {func: (a,b) => (a.timestamp > b.timestamp) ? 1 : -1 },
  //                 "CommentsAsc": {func: (a,b) => (a.children.length > b.children.length) ? 1 : -1 },
  //                 "CommentsDesc": {func: (a,b) => (a.children.length < b.children.length) ? 1 : -1  },
  //                 "LikesAsc": {func: (a,b) => (a.likeCount > b.likeCount) ? 1 : -1},
  //                 "LikesDesc": {func: (a,b) => (a.likeCount < b.likeCount) ? 1 : -1}
  //               }
  // .sort(dict[view+pageView].func)
  
  const filterFunc = (filtServers, post) => {
    if(filtServers) {
      return filtServers.findIndex(s => s===GetPostHost(post)) !== -1;
    } return true;
  }
  const classes = useStyles();
  // FIX CONTENT!!!!!!!!!!!
  function ShowPosts() {
    const adminInProps = 'admin' in props;
    

    const postsToShow = props.posts && props.posts.length !== 0 && props.posts.filter(a => filterFunc(props.filt, a)).map((item, i) => {
                        const title = GetPostTitle(item);
                        // only shows posts, not comments, and posts with authors, and posts with titles
                        return (
                          title && title !== "null" && GetPostAuthor(item) && title.trim() &&
                          <Grid item key={GetPostId(item)}>
                              <PostDisp user={props.user} post={item} 
                                    rem={removePost} admin={adminInProps ? props.admin : false} 
                                    checked={adminInProps} server={props.server}/>
                          </Grid>
                        );
                      });

    return (
      <>
      <Grid
        container
        direction="column"
        justify="center"
        alignItems="center"
        spacing={2}
        key="grid-show"
      >
        {postsToShow}
      </Grid>
      {/* {grids} */}
      </>
    );
  }

  // const Ops = [
  //   {label: "Ascending", value: "Asc"},
  //   {label: "Descending", value: "Desc"}
  // ]

  // function GenButton(props) {
  //   return (
  //     <button onClick={() => setView(props.type)} className={view===props.type ? "blueButton" : "whiteButton"}>
  //       {props.type}
  //     </button>
  //   );
  // }

  return(
    <>
      {/* <GenButton type="Time" />
      <GenButton type="Likes" />
      <GenButton type="Name" />
      <GenButton type="Comments" />      
      
      <Select 
        options={Ops} 
        defaultValue={{label: "Ascending", value: "Asc"}}
        onChange={e => setPageView(e.value)}
      /> */}
      <ShowPosts />
    </>
  ); 
}

function MenuOptions(props) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const history = useHistory();

  const handleClick = (event) => {
    props.setter();
    setAnchorEl(event.currentTarget);
    event.stopPropagation();
  };

  const handleClose = (event) => {
    setAnchorEl(null);
    event.stopPropagation();
  };

  const deleteEdit = [
            <MenuItem key={"del"} onClick={e => handleOverlayClicks(e,props.rem,handleClose)}>
              Delete
            </MenuItem>, 
            <MenuItem key={"edit"} onClick={e => handleOverlayClicks(e, props.edit, handleClose)}>
              Edit
            </MenuItem>]

  return (
    <div>
      <IconButton
        aria-label="more"
        aria-controls="long-menu"
        aria-haspopup="true"
        onClick={handleClick}
        key="more"
      >
        <MoreVertIcon key="more-ver"/>
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        key="long-menu"
      >
        {props.canDelete && deleteEdit.map((item) => {
                                            return (
                                              item
                                            );
                                          })
        }
        <MenuItem key={"hide"} onClick={e => handleOverlayClicks(e,() => props.view("none"), handleClose)}>
          Hide
        </MenuItem>
      </Menu>
    </div>
  );
}

// prevents clicks propagating to post
function handleOverlayClicks(e, func, handleClose) {
  e.stopPropagation();
  func();
  if(handleClose) handleClose(e);
}

// const MemoizedCard = React.memo(PostDisp, (prevProps, nextProps) => {
//   console.log("MEMO");
//   return true;
// });

export function ConvertDates(secs) {
  secs = Number(secs);
  var d = Math.floor(secs / 86400);
  var h = Math.floor(secs % 86400 / 3600);
  var m = Math.floor(secs % 3600 / 60);
  var s = Math.floor(secs % 3600 % 60);

  if(d > 7) return null; 
  if(d > 1) return d + (d == 1 ? " day " : " days ") + "ago";
  if(h > 1) return h + "h ago";
  return m + "m ago";
}


export function PostDisp(props) {
  const history = useHistory();
  const [adminOrAuthor, setAdmin] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(props.checked); 
  const [view, setView] = useState("block");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(GetPostTitle(props.post));
  const [description, setDescription] = useState(GetPostContent(props.post, true)[0]);
  const [body, setBody] = useState(GetPostContent(props.post))
    
  const maxTopicLength = 250; // should not exceed 250 characters
  const maxDescriptionLength = 10000; // post should not exceed 10000 characters
  const { register, handleSubmit, errors } = useForm(); // hooks form

  useEffect(() => {
    setAdmin(props.admin || 
            (GetPostAuthor(props.post) === GetAuthorId(props.user) && 
              GetPostHost(props.post) === GetAuthorHost(props.user)));
    if(!GetPostPostedTo(props.post)){
      props.post['posted_to'] = props.server;
    }
    // console.log("mounted!!!!!!!"); 
    console.log(GetPostAuthor(props.post), GetAuthorId(props.user), (GetPostAuthor(props.post) === GetAuthorId(props.user)));
    console.log(GetPostHost(props.post), GetAuthorHost(props.user), GetPostHost(props.post) === GetAuthorHost(props.user));
  }, []);



  const item = props.post;

  const titleEdit = <TextField
                    id="title"
                    label="Title"
                    multiline
                    variant="outlined"
                    name="title"
                    key="titleInput"
                    fullWidth
                    defaultValue={title}
                    maxLength={maxTopicLength}
                    inputRef={register({required: "Required"})}
                  />

  const descript = <>
                      <TextField
                        id="body"
                        label="Description"
                        multiline
                        name="body"
                        variant="outlined"
                        key="bodyInput"
                        fullWidth 
                        defaultValue={description}
                        maxLength={maxDescriptionLength}
                        inputRef={register({required: "Required"})}
                      />
                      <button onClick={() => setEditing(false)}>Cancel</button>
                      <button type="submit">Save</button>
                    </>

  const authorLinks = <Link to={LinkProfile(item)} onClick={e => e.stopPropagation()}>
                        {GetPostAuthor(item)}
                      </Link>
                      
  const communityLinks = <Link to={LinkCommunity(item)} onClick={e => e.stopPropagation()}>
                          {GetPostCommunityId(item)} 
                        </Link>
                        
  
  // server post was posted to
  const postedTo = GetPostPostedTo(item) ? GetPostPostedTo(item) : props.server;
  const datePosted = ConvertDates((new Date().getTime() / 1000) - GetPostTimeCreated(item));
  const format = {
    day: "numeric",
    month: "2-digit",
    year: "numeric"
};
  const dateShow = datePosted ? datePosted : new Date(GetPostTimeCreated(item)*1000).toLocaleString("en-gb", format);
  const head = <> 
                <Typography variant="h5" align="left"> 
                  {communityLinks}
                  <Typography color="textSecondary" align="left" display="inline" variant="h6">
                   • posted by: {authorLinks} • {dateShow} • from {GetPostHost(item)} • to {postedTo}
                  </Typography>
                </Typography>
                {editing && props.comment
                ? titleEdit 
                : <Typography variant="h3" align="left">
                    <b>{title}</b>
                  </Typography>}
              </>



  const handleDataForm = (data) => {
      console.log(data);
      let toSend = {
        title: data.title,
        content: [{markdown:{text:data.body}}]
      }
      const success = () => {
        setTitle(data.title);
        setDescription(data.body);
        setEditing(false);
        props.post.content = [{markdown:{text:data.body}}];
        setBody(GetPostContent(props.post));
      }

      Edit(GetPostId(props.post), toSend, success, 'post', GetPostPostedTo(props.post));    
  }
    
  const onSubmit = data => handleDataForm(data); // handling post submit



  const classes = useStyles();
  
  const setter = () => {
    // check only once
    if(!alreadyDone) {
      // don't check if already know
      if(!adminOrAuthor) {
        checkUserAdmin(setAdmin, props.user, props.post, postedTo);
        setAlreadyDone(true);
      }
    }
  }

  const handleDelete = (id, post) => {
    const success = () => {
      console.log('removing post from comment page');
      history.push(LinkMain); // go back to main page
    }
    Delete(id, success, 'post', GetPostPostedTo(post));
  }

  // FIX CONTENT ARR HERE!!!!!!
  const content = <Typography variant="h5" align="left" className={props.comment ? classes.comment : classes.type}>
                    {body[0]}
                  </Typography>

  // const contentDisp = content && content.length !== 0 && 
  //                     content.map((p) => {
  //                       return (
  //                         <Typography variant="h5" component="p" align="left" className={props.comment ? classes.comment : classes.type}>
  //                           {p}
  //                         </Typography>
  //                       );
  //                     }) 

  // const OnePost = React.memo((props) => {
  //   console.log('rendered', i);
    

  // }, (prevProps, nextProps) => {
  //   console.log('hey');
  //   return true}); 
  // return(
  //   <OnePost 
  // )
  console.log(props.comment, item);
  return(
    <div style={{display: view}}>
        <Card className={props.comment ? classes.nohover : classes.root} onClick={() => {if(!props.comment) history.push(LinkComment(item))}}>
          <form onSubmit={handleSubmit(onSubmit)} className='SubmitForm'>
          <CardHeader
            action={
              <MenuOptions 
                id={GetPostId(item)} 
                rem={() => props.comment ? handleDelete(GetPostId(item), item) : props.rem(GetPostId(item), item)} 
                view={setView} 
                setter={setter}
                edit={() => props.comment ? setEditing(true) : history.push(LinkComment(props.post))} 
                canDelete={adminOrAuthor}
              />
            }
            title={head}
            className={classes.header}
          />
          {(description !== "" || editing) &&
          <CardContent className={classes.content}>
            {editing && props.comment 
                ? descript 
                : content
            }
          </CardContent>
          }
          </form>
          <CardActions disableSpacing className={classes.actions}>
            <IconButton aria-label="comments" component="span">
              <ChatIcon />
              {props.comments ? props.comments : GetPostComments(props.post).length}
            </IconButton>
            {GetLikedUsers(props.post) &&          
            <ShowLikes post ={props.post} user={props.user} />
            }
          </CardActions>
        </Card>
    </div>
  );
} // PostDisp

export function ShowLikes(props) {
  // LikePost
  // DislikePost
  // DeLikePost
  // DeDislikePost
  const liked = GetLikedUsers(props.post);
  const disliked = GetDislikedUsers(props.post);
  const [like, setLike] = useState(0);
  const [newLike, setNewLike] = useState(0);
  const [base, setBase] = useState(0)
  const classes = useStyles();
  
  useEffect(() => {
    const hasLiked = liked.findIndex((user) => GetAuthorId(user) === GetAuthorId(props.user));
    var likedNum;
    if(hasLiked === -1) { // has not liked
      const hasDisliked = disliked.findIndex((user) => GetAuthorId(user) === GetAuthorId(props.user));
      likedNum = hasDisliked === -1 ? 0 : -1; // disliked, or neutral
    } else {
      likedNum = 1;
    }
    setLike(likedNum);
    setBase(liked.length-disliked.length-likedNum);
  }, []);
  // const base = liked.length - disliked.length;

  function ModifyLike(type, num) {
    let request = {id: GetPostId(props.post), 
                  author: props.user}
    const success = () => {
      setLike(num);
      // setNewLike(newNum); // reflect modification
    }
    ModLike(type, request, success);
  }

  const likeClass = like == 1 ? "green" : null;
  const dislikeClass = like == -1 ? "red" : null;

  const clickedLike = () => {
    like == 1 ? ModifyLike('DeLikePost', 0) : ModifyLike('LikePost', 1);
  }
  const clickedDislike = () => {
    like == -1 ? ModifyLike('DeDislikePost', 0) : ModifyLike('DislikePost', -1);
  }
  const toDisp = base+like;
  return(
    <>
      {/* <div> Likes: {base + newLike} </div> */}
      <IconButton 
        aria-label="like" 
        onClick={(e) => handleOverlayClicks(e, clickedLike)}
      >
        <ArrowDropUpIcon style={{ color: likeClass, fontSize: 40}}/>
      </IconButton>
      {toDisp}
      <IconButton 
        aria-label="dislike" 
        onClick={(e) => handleOverlayClicks(e, clickedDislike)}
      >
        <ArrowDropDownIcon style={{ color: dislikeClass, fontSize: 40}}/>
      </IconButton>
      {/* <button onClick={(e) => handleOverlayClicks(e, clickedLike)} className={likeClass}> 
        Like
      </button>
      <button onClick={(e) =>handleOverlayClicks(e, clickedDislike)} className={dislikeClass}>
        Dislike 
      </button>  */}
    </>
  )
}

// users can only delete posts they have created
export function Options(props) { 
    if(props.admin || 
      (GetPostAuthor(props.post) === GetAuthorId(props.user) && 
      GetPostHost(props.post) === GetAuthorHost(props.user)))  {
        return(
           <button
            onClick={props.rem}
            className="btn btn-lg btn-outline-danger ml-4"
            >
            Delete
            </button>
        );
    }
    return null;
}


export function DisplayCommunity(props) {
  const [description, setDescription] = useState(null);
  const [title, setTitle] = useState('');
  const [show, setShow] = useState(false);
  const history = useHistory();
  const id = props.community.id;
  const host = props.community.host;
  // succesfully got community info
  const success = (community) => {
    setDescription(GetCommunityDescription(community));
    setTitle(GetCommunityTitle(community));
  }
  const get = () => {
    if(description === null) { // description has not been set yet
      GetCommunityById(id, success, host);
    }
    setShow(true);
  }
  // console.log(host);

  return(
    <><div className='dispCommunities'>
      {host &&
        <>
          <Link to={props.create ? LinkCreate(id,host) : LinkFromCommunity(id, host)}>
            <h5>{host}</h5>
            <h3>{id}</h3>
          </Link>
          {show  
          ? <>
              <h2>Title: {title}</h2>
              <p>Description: {description}</p>
              <button onClick={() => setShow(false)}>Hide</button>
            </>
          : <button onClick={() => get()}>Show More</button> 
          }
        </>
      }
      </div>
    </>
  );
}

export function checkAdmin(admins, user) { 
    var i;
    for(i = 0 ; i < admins.length ; i++) {
      console.log('admin', admins[i]);
      console.log('user', user);
      if(GetAuthorId(admins[i]) === GetAuthorId(user) &&
        GetAuthorHost(admins[i]) === GetAuthorHost(user)) {
          console.log('found admin');
          return true;
      }
    }
    return false;
}

export function checkUserAdmin(setAdmin, user, post, target) {
  const success = (community) => {
    var admins = GetCommunityAdmins(community);
    setAdmin(checkAdmin(admins, user));
  }
  GetCommunityById(GetPostCommunityId(post), success, target);
}



//    <Paper>
    //      {/* || Likes (1) ||  rest of post (11)           || */}
    //      <Grid container spacing={0} direction="row"> 
    //        <Grid item xs={1}> 
    //          Likes
    // //       </Grid>
    // //       {/* rest of post */}
    // //       {/* <Grid item container direction="column" alignItems="stretch" xs={11}> */}
    // //         {/* header + options 
    // //         post title 
    // //         content   
    // //         settings           */}
    // //         {/* <!-- ||      header        || options || --> */}
    // //       <Grid container item direction="row" xs={11} spacing={1}>  
    // //         <Grid item xs={11}>
    // //           {head} 
    // //         </Grid>
    // //         <IconButton aria-label="settings" position="absolute" top="0px" right="0px">
    // //           <MoreHorizIcon />
    // //         </IconButton>
    // //       {/* </Grid> */}
    // //       {/* <!-- Post title --> */}
    // //         <Grid item xs={12}>
    // //           <Typography variant="h6" align="left"> 
    // //             {GetPostTitle(item)}
    // //           </Typography>
    // //         </Grid>
    // //         {/* <!-- Post content --> */}
    // //         <Grid item xs={12}>
    // //           <Typography variant="body2" noWrap={true} align="left" padding="8px">
    // //             {GetPostContent(item)}
    // //           </Typography>
    // //         </Grid>
    // //         {/* <!-- settings --> */}
    // //         <Grid item xs={12}>
    // //           <IconButton aria-label="add to favorites">
    // //             <FavoriteIcon />
    // //           </IconButton>
    // //           <IconButton aria-label="share">
    // //             <ShareIcon />
    // //           </IconButton>
    // //         </Grid> 
    // //       </Grid>
    // //     </Grid>
    // //   </Paper>
    // // </div>




/* <Header item={item} />
      <Link to={LinkComment(item)}>
        <h3>{GetPostTitle(item)}</h3>
        <p>{GetPostContent(item)}</p>                    
        <span> Comments: {GetPostComments(item).length} </span>
      </Link>
      <span> Likes: {GetPostLikeCount(item)} </span>
      {showOption 
        ? <> 
        <Options user={props.user} post={item} 
          rem={() => props.rem(GetPostId(item))} admin={admin}/>
          <button onClick={() => setOption(false)}>Hide options</button>
          </>
        : <button onClick={() => setter()}>Show Options</button>
      } */



/* OLD SHOWPOST CODE */
    // function rowRenderer({key, index, style}) {
    //   return (
    //     <Grid item id={key} key={key} style={style}>
    //         <PostDisp user={props.user} post={props.posts[index]} 
    //               rem={removePost} admin={adminInProps ? props.admin : false} 
    //               checked={adminInProps}/>
    //     </Grid>
    //   );
    // }

  
  // // If there are more items to be loaded then add an extra row to hold a loading indicator.
  // const itemCount = props.hasNextPage ? props.posts.length + 1 : props.posts.length;

  // // Only load 1 page of items at a time.
  // // Pass an empty callback to InfiniteLoader in case it asks us to load more than once.
  // const loadMoreItems = props.isNextPageLoading ? () => {} : props.loadNextPage;

  // // Every row is loaded except for our loading indicator row.
  // const isItemLoaded = index => props.posts && (!props.hasNextPage || index < props.posts.length);

  // // Render an item or a loading indicator.
  // const Item = ({ index, style }) => {
  //   const item = props.posts[index];
  //   const title = GetPostTitle(item);
  //   let content;
  //   if (!isItemLoaded(index)) {
  //     content = "Loading...";
  //   } else {
  //     content = 
  //     // <Grid item>
  //                 title && title !== "null" && GetPostAuthor(item) && title.trim() &&
  //                 <PostDisp user={props.user} post={item} 
  //                 rem={removePost} admin={adminInProps ? props.admin : false} 
  //                 checked={adminInProps} server={props.server}/>
  //               // {/* </Grid> */}
  //   }

  //   return <div style={{
  //     ...style,
  //     left: style.left + 20,
  //     top: style.top + 20,
  //   }}>
  //   {content}</div>;
  // };
  // const items = props.posts && props.posts.map(item => 
  //               GetPostTitle(item) && GetPostTitle(item) !== "null" && GetPostAuthor(item) && GetPostTitle(item).trim() &&
  //               <div> 
  //               <PostDisp user={props.user} post={item} 
  //                 rem={removePost} admin={adminInProps ? props.admin : false} 
  //                 checked={adminInProps} getHeight={true}/> 
  //                 </div>);
  // const cellMeasurerProps = useCellMeasurer({items});

  // const grids = 
  //   <InfiniteLoader
  //     isItemLoaded={isItemLoaded}
  //     itemCount={itemCount}
  //     loadMoreItems={loadMoreItems}
  //   >
  //     {({ onItemsRendered, ref }) => (
  //     // <Grid
  //     //   container
  //     //   direction="column"
  //     //   justify="center"
  //     //   alignItems="center"
  //     //   spacing={2}
  //     // >
  //       <List
  //       height={1000}
  //       width={900}
  //       {...cellMeasurerProps}
  //     >
  //         {Item}
  //       </List>
  //     // </Grid>
  //     )}
  //   </InfiniteLoader>
  //   // <Grid
  //   //                 container
  //   //                 direction="column"
  //   //                 justify="center"
  //   //                 alignItems="center"
  //   //                 spacing={2}
  //   //               >
  //   //               {props.posts &&
  //   //               <AutoSizer>
  //   //                 {({height, width}) => (
  //   //                   <List
  //   //                     height={1000}
  //   //                     rowCount={props.posts.length}
  //   //                     rowHeight={40}
  //   //                     rowRenderer={rowRenderer}
  //   //                     width={1000}
  //   //                   />
  //   //                 )}
  //   //               </AutoSizer>
  //   //               }
  //   //               </Grid>
    // const OnePost = React.memo(({item, i}) => {
    //   console.log('rendered', i);
    //   // console.log(item, i);
    //   const title = GetPostTitle(item);
    //   return(
    //     title && title !== "null" && GetPostAuthor(item) && title.trim() &&
    //       <Grid item key={GetPostId(item)}>
    //           <PostDisp user={props.user} post={item} 
    //                 rem={removePost} admin={adminInProps ? props.admin : false} 
    //                 checked={adminInProps} key={GetPostId(item)+title}/>
    //       </Grid>
    //   );
    // }, (prevProps, nextProps) => {
    //   console.log('hey');
    //   return true}); 
    
    // const postsToShow = props.posts && props.posts.length !== 0 && props.posts.map((item, i) => {
    //                     // only shows posts, not comments, and posts with authors, and posts with titles
    //                     return (
    //                       <OnePost item={item} i={i} key={i}/>
    //                     );
    //                   });
