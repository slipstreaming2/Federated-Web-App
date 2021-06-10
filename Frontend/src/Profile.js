import React, { useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import {Display} from './Display';
import {GetUserById, Get, GetUserAbout, errReport} from './RequestsPosts';
import "./style.css";
import $ from "jquery";


export default function Profile(props) {
    const [posts, setPosts] = useState([]);
    const [about, setAbout] = useState("");
    const [finished, setFinished] = useState(false);
    const { server, user } = useParams();

    useEffect(() => {
      const success = (data) => {
        console.log('profile data', data);
        var promises = [];
        setAbout(GetUserAbout(data));
        data.posts.forEach((item) => {
          const dataSuccess = (post) => {
            post['posted_to'] = item.host;
            setPosts(p => [post, ...p]);
          }
          Get(item.id, dataSuccess, item.host, false, promises);
        })
        Promise.allSettled(promises).then((result) => {
          //reach here regardless of rejection/network failure
          errReport(result);
          setFinished(true)
        });
      }
      GetUserById(user, success, decodeURIComponent(server));
    }, []);
    
    return(
        <>
        <div className='profileForm'>
          <h2>{user}</h2>
          <h4>{about}</h4>
          <Display posts={posts} user={props.user} setPosts={setPosts} />
        </div>
        {!finished && 
          // <CircularProgress color="secondary"/>
          <h4>Loading...</h4>
        }
        </>
    );
}
