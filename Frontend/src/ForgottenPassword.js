import React, { useState } from "react";
import {home} from './RequestsPosts';
import { Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import { useHistory } from 'react-router-dom';
import "./style.css";
import $ from "jquery";
import Cookies from 'universal-cookie';

export default function ForgottenPassword() {
  const history = useHistory();//history used to change pages
  const cookies = new Cookies();//cookies used to store data that will be used on other pages

  const [username, getUsername] = useState("");//useState used to keep the state up to date with the field's contents 

  //Error constant used to output the error message sent from the back-end
  const errors = (xhr, error, errorThrown) => {
    var x = JSON.parse(xhr.responseText);
    alert(x.message);
}

  //Presence checks along w/ password match check
  function validateForm() {
    return username.length > 0;
  }

  function handleSubmit(event) {
    cookies.set('tempID', username, { path: '/', secure: true, sameSite: true, maxAge: 300});//temporary ID cookie is set with an expiry of 5 minutes, this is used on the ResetPassword page
    cookies.set('host', home, { path: '/', maxAge: 86400});//host cookie is set with an expiry of 24 hours
    let GetQuestion = {id : username}// object that will be used for the JSON is created
    let jsonObject = JSON.stringify(GetQuestion);//JSON is created
    console.log(jsonObject);
    $.ajax({
      url: 'https://cs3099user-a4.host.cs.st-andrews.ac.uk/api/GetQuestion/',//Address for the resetRequester request
      type: 'PUT',
      data: jsonObject,
      contentType: 'application/json',
      error: errors,//Error handling
      success: function (data) {
          var x = JSON.parse(data.user);
          console.log(data);
          console.log(x);
          cookies.set('question', x.question, { path: '/', secure: true, httpOnly: true, sameSite: true, maxAge: 300});//Question cookie is set with an expiry of 5 minutes, this will be used on the ResetPassword page
          history.push('/ResetPassword');//Redirected to security question page w/ the username stored
      }
    })
    event.preventDefault();
  }

  //When the button of type 'submit' is pressed, the handleSubmit() function is called.
  return (
    <div className="forgottenPassword">
      <img src={"https://i.imgur.com/1mtyMwX.png"} alt="Wabberjocky" width="175" height="150"/>
      <h1>WABBERJOCKY</h1>
      <h2>So you've forgotten your password. Enter your username to begin the password reset process.</h2>
      <form className="submitUsername" onSubmit={handleSubmit}>
        <FormGroup controlId="username" bsSize="large">
          <ControlLabel>Username</ControlLabel>
          <FormControl
            autoFocus
            type="username"
            value={username}
            onChange={e => getUsername(e.target.value)}
          />
        </FormGroup>
        <Button block bsSize="large" disabled={!validateForm()} type="submit">
          Submit
        </Button>
        <form className="returnToLogin" action="./" onSubmit={handleSubmit}>
          <Button block bsSize="large" type="submit">
            Return to Login
          </Button>
        </form>
      </form>
    </div>
  );
}