import React from 'react';
import './index.css';
import './style.css';
import InfiniteScroll from 'react-infinite-scroller';
import Button from '@material-ui/core/Button';
import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import {Community} from './Communities'
import {GetFilter, Discover, home, GetPostId, errReport} from './RequestsPosts'
import {Display, Selector} from './Display'
import $ from 'jquery';
import CircularProgress from '@material-ui/core/CircularProgress';
import Cookies from 'universal-cookie';

export default function Page(props) {
  const [posts, setPosts] = useState(() => []);
  const [servers, setServers] = useState(() => []);
  const [finished, setFinished] = useState(() => false);
  const [prevLimit, setLimit] = useState(() => 10);
  const [hasMore, setHasMore] = useState(true);
  const [filtServers, setFilter] = useState([]);
  const [checked, setChecked] = useState({});
  
    useEffect(() => { // upon page load, get all posts
      function found(data) {
        data.push(home);
        setServers(data);
        setFilter(data);
        var promises = [];
        var asyncPosts = [];
        data.forEach((server) => {
          function success(d, textStatus, xhr) {
            console.log('found', d, server);
            var i;
            for(i = 0 ; i < d.length ; i++) {
              d[i]['posted_to'] = server;
              asyncPosts.push(d[i]);
            }
            setPosts(asyncPosts);
          }
          GetFilter('limit='+prevLimit, success, server, promises);
          setChecked(prev => {
            prev[server] = prevLimit;
            return prev;
          });
        });
        Promise.allSettled(promises).then((result) => {
          //reach here regardless of rejection/network failure
          // setPosts(asyncPosts);
          errReport(result);
          setFinished(true)
        });
      }
      Discover(found);
    }, []) // final [] so page does not constantly update itself
    
    const handleChange = (event) => {
      setFilter(event.target.value);
      loadFunc(true);
    }; 


    const loadFunc = (change) => {
      if(!finished) return;
      setFinished(false); // loading in more data
      const newLim = change ? prevLimit : prevLimit + 5;
      var promises = [];
      var count = 0;
      // var newDat = [];
      filtServers.forEach((server) => {
        function success(d, textStatus, xhr) {
          console.log('found', d, server);
          var newDat = [];
          var i;
          for(i = 0 ; i < d.length ; i++) {
            // post not added in yet
            if(posts.findIndex(p => GetPostId(p) === GetPostId(d[i])) == -1) {
              d[i]['posted_to'] = server;
              newDat.push(d[i]);
            }
          }
          if(newDat.length !== 0) {
            count += newDat.length;
            setPosts(prev => [...prev, ...newDat]);
          }
        }
        if(change) {
          if(checked[server] < newLim) {
            GetFilter('limit='+newLim, success, server, promises);
            setChecked(prev => {
              prev[server] = newLim
              return prev;
            });
          }
        } 
        else GetFilter('limit='+newLim, success, server, promises);
      });
      if(!change) setLimit(newLim); // not changing, set limit
      Promise.allSettled(promises).then(([result]) => {
        //reach here regardless of rejection/network failure
        setFinished(true);
        errReport(result);
        if(!hasMore && count !== 0) setHasMore(true); 
        // if(newDat.length === 0) setHasMore(false);
        if(!change && count === 0) setHasMore(false);
        // setPosts(prev => [...prev, ...newDat]);
      });
    }

    // const loadFunc = (change) => {
    //   if(!finished) return;
    //   setFinished(false); // loading in more data
    //   const newLim = prevLimit + 5;
    //   var promises = [];
    //   var count = 0;
    //   // var newDat = [];
    //   servers.forEach((server) => {
    //     function success(d, textStatus, xhr) {
    //       console.log('found', d, server);
    //       var newDat = [];
    //       var i;
    //       for(i = 0 ; i < d.length ; i++) {
    //         // post not added in yet
    //         if(posts.findIndex(p => GetPostId(p) === GetPostId(d[i])) == -1) {
    //           d[i]['posted_to'] = server;
    //           newDat.push(d[i]);
    //         }
    //       }
    //       if(newDat.length !== 0) {
    //         count += newDat.length;
    //         setPosts(prev => [...prev, ...newDat]);
    //       }
    //     }
    //     GetFilter('limit='+newLim, success, server, promises);
    //   });
    //   setLimit(newLim);
    //   Promise.allSettled(promises).then(([result]) => {
    //     //reach here regardless of rejection/network failure
    //     setFinished(true);
    //     // if(newDat.length === 0) setHasMore(false);
    //     if(count === 0) setHasMore(false);
    //     // setPosts(prev => [...prev, ...newDat]);
    //   });
    // }
            // loader={<CircularProgress color="secondary"/>}
    return (
      <>
      <form className='mainForm'>
        <h1>Home Page</h1>
        {/* {finished && */}
          <Selector filt={filtServers} onChange={handleChange} servers={servers} />
          <Display posts={posts} user={props.user} setPosts={setPosts} key="display" filt={filtServers} />
            {/* // loadNextPage={loadFunc} isNextPageLoading={finished} hasNextPage={true}/> */}
        {/* } */}
        {!finished && 
          // <CircularProgress color="secondary"/>
          <h4>Loading...</h4>
        }
        {finished && hasMore &&
          <button onClick={() => loadFunc()}>
            Load more
          </button>}
      </form>
      </>
    );

}

            // var j;
            // for(j = 0 ; j < d.length ; j++) {
            //   // console.log(JSON.parse(JSON.stringify(d[j])));
            //   setPosts(prev => [...prev, d[j]]);
            // }

        // var toAddTo = []
        // // 
        // // , 
        // // var data = ["https://cs3099user-a7.host.cs.st-andrews.ac.uk/", "https://cs3099user-a7.host.cs.st-andrews.ac.uk/"]
        // // console.log('found servers', data);
        // function addOn(d) {
        //   if(data.length == 0) {
        //     setPosts(toAddTo);
        //     return;
        //   }
        //   var j;
        //   for(j = 0 ; j < d.length ; j++) {
        //     toAddTo.push(d[j]);
        //     console.log(JSON.parse(JSON.stringify(d[j])));
        //     // setPosts(prev => [...prev, d[j]]);
        //   }
        //   // GetFilter('limit=10', addOn, data.pop(), keepGoing)
        //   setTimeout(GetFilter('limit=10', addOn, data.pop(), keepGoing), 4000);
        // }
        // function keepGoing() {
        //   if(data.length == 0) {
        //     setPosts(toAddTo);
        //     return;
        //   }
        //   // GetFilter('limit=10', addOn, data.pop(), keepGoing)
        //   setTimeout(GetFilter('limit=10', addOn, data.pop(), keepGoing), 4000);
        // }

        // keepGoing();
        // var data = [];
