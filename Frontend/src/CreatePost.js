import React from 'react';
import './index.css';
import './style.css';
// import InfiniteScroll from 'react-infinite-scroll-component';
import { useState, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { useForm } from "react-hook-form";
import {Community} from './Communities'
import Display from './Display'
import {GetPostId, Post, LinkComment} from './RequestsPosts'
// import $ from 'jquery';
import { useLocation, useHistory, useParams } from "react-router-dom";
import Collapsible from 'react-collapsible';

export default function CreatePost(props) {
    const { register, handleSubmit, errors } = useForm(); // hooks form
    const history = useHistory();
    const { server, community } = useParams();
    const maxTopicLength = 250; // should not exceed 250 characters
    const maxDescriptionLength = 10000; // post should not exceed 10000 characters
    
    // handles creating a new post
    const handleDataForm = (data) => {
        console.log(data);

        let newPost = { community: community, // creating new post
                        title: data.title,
                        content: [{markdown:{text: data.description}}]
                    };
        let jsonPost = JSON.stringify(newPost); // convert to JSON to send
        console.log('posting', jsonPost);
        const success = (data) => { // success creating post
            console.log(data);
            data['posted_to'] = decodeURIComponent(server);
            history.push(LinkComment(data));
        }
        Post(jsonPost, success, decodeURIComponent(server));
    }

    const onSubmit = data => handleDataForm(data); // handling post submit

    return (
      <>
        {/* <form className='createPostFormOuter'> */}
            <form onSubmit={handleSubmit(onSubmit)} className='createPostFormInner'>
                <h1>Create a Post!</h1>
                <label>Topic:</label>
                <br></br>
                <input 
                    name="title" 
                    placeholder="Post title" 
                    maxLength={maxTopicLength}
                    ref={register({required: "Required"})}
                />
                <label>Description: 
                    <textarea 
                        rows = "8" cols = "75" 
                        name="description" 
                        maxLength={maxDescriptionLength} 
                        ref={register({required: "Required"})} 
                    ></textarea>
                </label>
                <button type="submit">Submit</button>
            </form>
            <Collapsible triggerTagName="help" trigger="Need help posting an image?" transitionTime="350" className= "collapsible">
                <p>The syntax for posting an image is:<br></br>![Alt text](image_URL)<br></br>For example: ![Alt text](https://picsum.photos/536/354)</p>
            </Collapsible>
        {/* </form> */}
      </>
    );
}

