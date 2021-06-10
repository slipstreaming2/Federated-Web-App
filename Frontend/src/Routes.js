import React from "react";
import { Route, Switch } from "react-router-dom";
import Login from "./Login";
import ForgottenPassword from "./ForgottenPassword";
import ResetPassword from "./ResetPassword";
import MainLayout from "./MainLayout";
import { useState } from 'react';

export default function Routes() {
  const [user, setUser] = useState({});
  const otherPaths = ["/Main", "/Communities", "/Comments", "/CommunityPosts", "/Profile", "/CreatePost", "/Search", "/CreateCommunity", "/Settings"]
    
    return (
      <>
        <Switch>
            <Route exact path="/">
                <Login/> 
            </Route>
            <Route exact path="/ForgottenPassword">
                <ForgottenPassword />
            </Route>
            <Route exact path="/ResetPassword">
                <ResetPassword />
            </Route>
            <Route path={otherPaths}>
              <MainLayout setUser={setUser} user={user}/>
            </Route>
        </Switch>
      </>
    );
}
