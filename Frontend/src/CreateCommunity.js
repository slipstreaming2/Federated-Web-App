import React from 'react';
import './index.css';
import './style.css';
// import InfiniteScroll from 'react-infinite-scroll-component';
import { useState, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { useForm } from "react-hook-form";
import {Community} from './Communities'
import Display from './Display'
import $ from 'jquery';
import {GetAuthorId, GetAuthorHost, LinkFromCommunity, 
        CreatingCommunity, GetCommunityCreated, GetACommunityId} from './RequestsPosts'
import { useLocation, useHistory } from "react-router-dom";

export default function CreateCommunity(props) {
    const { register, handleSubmit, errors } = useForm(); // hooks form
    const history = useHistory();
    const maxCommunityName = 250; // should not exceed 250 characters
    const maxDescriptionLength = 500; // post should not exceed 500 characters
    
    // handles creating a new post
    const handleDataForm = (data) => {
      console.log(data); // data received for post
      let newCommunity =  { title: data.community, 
                            description: data.description,
                            id: GetAuthorId(props.user),
                            hostname: GetAuthorHost(props.user)
                          }
      // let jsonCommunity = JSON.stringify(newCommunity); // convert to JSON to send
      const success = (community) => {
        console.log('community received', community);
        history.push(LinkFromCommunity(GetACommunityId(community), GetAuthorHost(props.user)));
      // TO DO
        // console.log(data);
        // console.log(data.status);
        // if(data.status === "PASS") { // success creating post
        //     console.log(data);
        //     history.push('/Communities/' + );
        // } else { // community did not work
        //     alert("error creating community!");
        // }
      }
      console.log('community creation', newCommunity);
      CreatingCommunity(newCommunity, success);
    }

    const onSubmit = data => handleDataForm(data); // handling post submit

    return (
      <div>
        <form onSubmit={handleSubmit(onSubmit)} className='createCommunityForm'>
          <h1>Create a Community!</h1>
            <label> Community Name:
            <br></br>
            <input
                name="community" 
                placeholder="Community Name" 
                maxLength={maxCommunityName}
                ref={register({required: "Required"})}
              />
            </label>
            <label>Description: 
              <textarea rows = "8" cols = "75" name="description" maxLength={maxDescriptionLength} ref={register({required: "Required"})} ></textarea>
            </label>
            <button type="submit">Submit</button>
        </form>
        </div>
    );
}
