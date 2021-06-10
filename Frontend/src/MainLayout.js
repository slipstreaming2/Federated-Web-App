import React from "react";
import { Route, Switch, useRouteMatch, useHistory } from 'react-router-dom';
import Main from "./Main";
import Comment from "./Comments";
import Sidebar from "./Sidebar";
import { Search } from "./Search";
import CreatePost from "./CreatePost";
import Profile from "./Profile";
import { GetCommunityPosts, Community } from "./Communities";
import CreateCommunity from "./CreateCommunity";
import Settings from "./Settings";
import { useState, useEffect } from 'react';
import $ from "jquery";
import Cookies from 'universal-cookie';

export default function MainLayout(props) {
    const cookies = new Cookies();
    const history = useHistory();
    const { url, path } = useRouteMatch();
    
    useEffect(() => { // upon page load, sets user
      if(cookies.get('id') == undefined){
        history.push('/');
      }
      const user = {id: cookies.get('id'), host: cookies.get('host')};
      props.setUser(user);
      console.log(user.host);
    }, []) // final [] so page does not constantly update itself

    return (
      <>
        <Sidebar user={props.user}/>
        <div className="col-md-9">
          <Switch>
              <Route exact path="/Main">
                  <Main user={props.user}/>
              </Route>
              <Route exact path="/Communities/:server/:community/Comments/:postID">
                  <Comment user={props.user}/>
              </Route>
              <Route exact path="/Communities">
                  <Community user={props.user}/>
              </Route>
              <Route exact path="/Communities/:server/:community">
                  <GetCommunityPosts user={props.user}/>
              </Route>
              <Route exact path="/Profile/:server/:user">
                <Profile user={props.user}/>
              </Route>
              <Route exact path="/Communities/:server/:community/CreatePost">
                <CreatePost user={props.user}/>
              </Route>
              <Route exact path="/CreatePost">
                <Community user={props.user} create={true}/>
              </Route>
              <Route exact path="/Search/:search">
                <Search user={props.user}/>
              </Route>
              <Route exact path="/CreateCommunity">
                <CreateCommunity user={props.user}/>
              </Route>
              <Route exact path="/Settings">
                <Settings user={props.user}/>
              </Route>  
          </Switch>
        </div>
      </>
      
    );
}
