import React, { useState, useEffect } from "react";
import { Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import { useHistory, useLocation, useParams, Link } from 'react-router-dom';
import {Display} from './Display';
import {DisplayAllCommunities} from './Communities';
import {GetUserById, SearchUsers, GetFilter, GetCommunityById, 
        GetCommunityIds, Get, GetPostId, LinkProfileViaId,
        LinkSearch, home, Discover, errHandler} from './RequestsPosts';
// import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import "./style.css";
import $ from "jquery";

export function Search(props) {
    const [posts, setPosts] = useState([]);
    const [users, setUsers] = useState([]);
    const [comms, setComms] = useState([]);
    const [finished, setFinished] = useState(false);
    const [prevLimit, setLimit] = useState(10);
    const [servers, setServers] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    
    const { search } = useParams();
    const decodedSearch = decodeURIComponent(search);
    const lowered = decodedSearch.toLowerCase();

    console.log(decodedSearch);
    
    const searching = (filter, server, promises, asyncPosts, limit) => {
        const success = (data) => {
          var i;
          for(i = 0 ; i < data.length ; i++) {
            // have not added yet, add to posts
            if(asyncPosts.findIndex(item => GetPostId(item) === GetPostId(data[i])) === -1) {
              data[i]['posted_to'] = server;
              asyncPosts.push(data[i]);
              // setPosts(prev => [data[i], ...prev]); // update current users on page
            }
          }
          setPosts(asyncPosts);
        }
        GetFilter('limit='+ limit + '&' + 'title=' + filter, success, server, promises);
      }
      
    const findIn = (list, server, promises, asyncComms, asyncPosts, limit) => {
      var i;
      for(i = 0 ; i < list.length ; i++) {
        // found matching community name, get posts
        if(list[i].toLowerCase().indexOf(lowered) !== -1) {
          // setComms(prevComms => [list[i], ...prevComms]); // update current communities on page
          asyncComms.push({id: list[i], host: server});
          // searching('community='+list[i], server, promises, asyncPosts, limit);
        }
      }
      setComms(asyncComms);
    }


    useEffect(() => { // upon page load, get search
      const found = (data) => {
        console.log('found', data);
        data.push(home);
        setServers(data);
        var asyncComms = [];
        var asyncUsers = [];
        var asyncPosts = [];
        var promises = [];
        // initial post title search
        searching(lowered, home, promises, asyncPosts, prevLimit);
        // const search = (num) => {
        //   if(num === data.length) return;
        //   const server = data[num];
        //   const communitySuccess = (d) => {
        //     findIn(data, server, promises, asyncComms, asyncPosts);
        //   }
        //   GetCommunityIds(communitySuccess, server, promises);
      
        //   const successUser = (data) => {
        //       // console.log(data);
        //       var i;
        //       for(i = 0 ; i < data.length ; i++) {
        //         // author name is indeed a prefix
        //         if(data[i].toLowerCase().indexOf(lowered) != -1) {
        //           // searching('author=' + data[i], server, promises, asyncPosts, prevLimit);
        //           var storing = {id: data[i], server: server};
        //           asyncUsers.push(storing);
        //           // setUsers(prevUsers => [storing, ...prevUsers]); // update current users on page
        //         }
        //       }
        //       setUsers(asyncUsers);
        //     }
        //   // get all users, some groups have not implemented prefix
        //   SearchUsers(null, successUser, server, promises);
        //   Promise.allSettled(promises).then((result) => {
        //     //reach here regardless of rejection/network failure
        //     search(num+1)
        //   });
        // }
        // search(0);
        data.forEach((server, i) => {
          const communitySuccess = (data) => {
            findIn(data, server, promises, asyncComms, asyncPosts);
          }
          GetCommunityIds(communitySuccess, server, promises);
      
          const successUser = (data) => {
              // console.log(data);
              var i;
              for(i = 0 ; i < data.length ; i++) {
                // author name is indeed a prefix
                if(data[i].toLowerCase().indexOf(lowered) != -1 && asyncUsers.findIndex(a => a.id === data[i] && a.server === server) === -1) {
                  // searching('author=' + data[i], server, promises, asyncPosts, prevLimit);
                  var storing = {id: data[i], server: server};
                  asyncUsers.push(storing);
                  // setUsers(prevUsers => [storing, ...prevUsers]); // update current users on page
                }
              }
              setUsers(asyncUsers);
            }
          // get all users, some groups have not implemented prefix
          SearchUsers(null, successUser, server, promises);
        });
        Promise.allSettled(promises).then((result) => {
          //reach here regardless of rejection/network failure
          // setUsers(asyncUsers);
          // setPosts(asyncPosts);
          // setComms(asyncComms);
          if(prevLimit >= asyncPosts.length) setHasMore(false);
          errHandler(result);
          setFinished(true);
        });
      }
      Discover(found);
    }, []) // final [] so page does not constantly update itself

    const loadMore = () => {
      setFinished(false);
      var asyncPosts = posts;
      const start = asyncPosts.length;
      var promises = [];
      const limit = prevLimit + 10;
      searching(lowered, home, promises, asyncPosts, limit);
      Promise.allSettled(promises).then((result) => {
          //reach here regardless of rejection/network failure
          errHandler(result);
          // no further info to be found
          if(asyncPosts.length === start) setHasMore(false);
          setLimit(limit); // update limit
          setFinished(true); // remove loading icon
        });
      // servers.forEach((server) => {

      //   comms.forEach((community) => {
      //     searching('community='+community, server, promises, asyncPosts, limit);
      //   });
      //   users.forEach((users) => {
      //     searching('author=' + users.id, server, promises, asyncPosts, limit);
      //   });
      //   Promise.allSettled(promises).then(([result]) => {
      //     //reach here regardless of rejection/network failure
      //     // setUsers(asyncUsers);
      //     // setPosts(asyncPosts);
      //     // setComms(asyncComms);
      //     if(asyncPosts.length === start) setHasMore(false);
      //     setLimit(limit);
      //     setFinished(true);
      //   });

      // });
    }

    const isLoading = !finished ? <h4>Loading...</h4> : null;

  function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box p={3}>
            <Typography>{children}</Typography>
          </Box>
        )}
      </div>
    );
  }

  TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
  };

  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  const useStyles = makeStyles((theme) => ({
    root: {
      flexGrow: 1,
      backgroundColor: theme.palette.background.paper,
    },
  }));

  function SimpleTabs() {
    const classes = useStyles();
    const [value, setValue] = React.useState(() => 0);

    const handleChange = (event, newValue) => {
      setValue(newValue);
    };

    return (
      <div>
        <h3> Searching for: {decodedSearch} </h3>
        <AppBar position="static">
          <Tabs value={value} onChange={handleChange} aria-label="simple tabs example" variant="fullWidth" centered>
            <Tab label="Posts" {...a11yProps(0)} />
            <Tab label="Communities" {...a11yProps(1)} />
            <Tab label="Users" {...a11yProps(2)} />
          </Tabs>
        </AppBar>
        <TabPanel value={value} index={0}>
          <Display posts={posts} user={props.user} setPosts={setPosts} />
          {isLoading}
          {finished && hasMore &&
          <button onClick={() => loadMore()}>
            Load more
          </button>}
        </TabPanel>
        <TabPanel value={value} index={1}>
          <DisplayAllCommunities comms={comms} />
          {isLoading}
        </TabPanel>
        <TabPanel value={value} index={2}>
          <ShowUsers users={users}/>
          {isLoading}
        </TabPanel>
      </div>
    );
  }
  return(<SimpleTabs />);
}




    // return(
    //   <>
    //     <h3> Searching for: {decodedSearch} </h3>
    //     <Tabs>
    //       <TabList>
    //           <Tab>
    //               Communities
    //           </Tab>
    //           <Tab>
    //               Posts
    //           </Tab>
    //           <Tab >
    //               Users
    //           </Tab>
    //       </TabList>
    //       <TabPanel>
    //         <DisplayAllCommunities comms={comms} />
    //         {isLoading}
    //       </TabPanel>
    //       <TabPanel>
    //         <h2>Posts</h2>
    //         <Display posts={posts} user={props.user} setPosts={setPosts} />
    //         {isLoading}
    //         {finished && hasMore &&
    //         <button onClick={() => loadMore()}>
    //           Load more
    //         </button>}
    //       </TabPanel>
    //       <TabPanel>
    //         <h2>Users</h2>
    //         <ShowUsers users={users}/>
    //         {isLoading}
    //       </TabPanel>
    //   </Tabs>

        
    //   </>
    // );
// }

// CHANGE HERE LATER
function ShowUsers(props) {
      return(
        props.users && props.users.sort((a,b) => ( a.server < b.server ) ? 1 : -1).map((item) => ( 
          <div key={item} className='post'>
              <div className='dispCommunities'>
                <Link to={LinkProfileViaId(item.id, item.server)}>
                  <h5>{item.server}</h5>
                  <h3>{item.id}</h3>
                </Link>
              </div>
          </div>
        ))
      );
}

export function SearchBar() {
  const [value, setValue] = useState('');
  const history = useHistory();
  
  const handleSubmit = (e) => {
    history.push(LinkSearch(value));
    e.preventDefault();
  }

  return(
        <form onSubmit={handleSubmit} className = "searchBar"> 
          <input
            type="text" 
            placeholder="Search..."
            value={value}
            onChange={e => setValue(e.target.value)}
          />
          <button type="submit">
            Submit
          </button>
        </form>
      )
}
