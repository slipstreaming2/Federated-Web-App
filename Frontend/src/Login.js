import React, { useState } from "react";
import { Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import { useHistory } from 'react-router-dom';
import "./style.css";
import $ from "jquery";
import Collapsible from 'react-collapsible';
import {LinkMain, home} from './RequestsPosts';
import Cookies from 'universal-cookie';

export default function Login() {
  const history = useHistory();//history used to change pages
  const cookies = new Cookies();//cookies used to store data that will be used on other pages

    //useState used to keep the state up to date with the field's contents
    //Log In form
    const [username, getUsername] = useState("");
    const [password, getPassword] = useState("");

    //Register form
    const [name, setName] = useState("");
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordReEnter, setPasswordReEnter] = useState("");
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");

    //Error constant used to output the error message sent from the back-end
    const errors = (xhr, error, errorThrown) => {
        var x = JSON.parse(xhr.responseText);
        alert(x.message);
    }

    //Presence checks
    function validateLogin() {
      return username.length > 0 && password.length > 0;
    }

    //Presence checks along w/ password match check
    function validateRegistration() {
      return name.length > 0 && newUsername.length > 0 && newPassword.length > 0 && passwordReEnter.length > 0 && newPassword === passwordReEnter && question.length > 0 && answer.length > 0;
    }

    //Check to ensure password meets the rules set
    function validatePassword (newPassword) {
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/.test(newPassword)
    }

    function LoginSubmit(event) {
      let accessUser = {id : username,
                        password : password}// object that will be used for the JSON is created
        let jsonObject = JSON.stringify(accessUser);//JSON is created
        console.log(jsonObject);
        $.ajax({
            url: 'https://cs3099user-a4.host.cs.st-andrews.ac.uk/api/AccessUser/',//Address for the AccessUser request
            type: 'POST',
            data: jsonObject,
            contentType: 'application/json',
            error: errors,//Error handling
            success: function (data) {
                var x = JSON.parse(data.user);
                console.log(data);
                console.log(x);
                cookies.set('id', username, { path: '/', secure: true, sameSite: true, maxAge: 86400});//ID cookie is set with an expiry of 24 hours
                cookies.set('host', home, { path: '/', secure: true, sameSite: true, maxAge: 86400});//host cookie is set with an expiry of 24 hours
                history.push(LinkMain);//Redirected to main page
            }
        })
      event.preventDefault();
    }
    
    function registrationSubmit(event) {
      cookies.set('id', newUsername, { path: '/', secure: true, sameSite: true, maxAge: 86400});//ID cookie is set with an expiry of 24 hours
      cookies.set('host', home, { path: '/', secure: true, sameSite: true, maxAge: 86400});//host cookie is set with an expiry of 24 hours
      let CreateUser = {id : newUsername,
                        password: newPassword,
                        name: name,
                        question: question,
                        answer: answer}// object that will be used for the JSON is created
      let jsonObject = JSON.stringify(CreateUser);//JSON is created
      console.log(jsonObject);
      $.ajax({
        url: 'https://cs3099user-a4.host.cs.st-andrews.ac.uk/api/CreateUser/',//Address for the createUser request
        type: 'POST',
        data: jsonObject,
        contentType: 'application/json',
        error: errors,//Error handling
        success: function (data) {
            var x = JSON.parse(data.user);
            console.log(data);
            console.log(x);
            history.push(LinkMain);//Redirected to main page
        }
      })
      event.preventDefault();
    }

    //When the buttons of type 'submit' are pressed, the respective functions are called.
    return (
      <div className="Login">
        <h1>Welcome To</h1>
        <img src={"https://i.imgur.com/1mtyMwX.png"} alt="Wabberjocky" width="175" height="150"/>
        <h2>WABBERJOCKY</h2>
        <form className="loginForm" onSubmit={LoginSubmit}>
        <label className="title" >Login</label>
          <FormGroup controlId="username" bsSize="large">
            <ControlLabel>Username</ControlLabel>
            <FormControl
              autoFocus
              type="username"
              value={username}
              onChange={e => getUsername(e.target.value)}
            />
          </FormGroup>
          <FormGroup controlId="password" bsSize="large">
            <ControlLabel>Password</ControlLabel>
            <FormControl
              type="password"
              value={password}
              onChange={e => getPassword(e.target.value)}
            />
          </FormGroup>
          <Button block bsSize="large" disabled={!validateLogin()} type="submit">
            Login
          </Button>
          <form className="forgottenPassword" action="./ForgottenPassword">
            <Button block bsSize="large" type="submit">
              I've Forgotten My Password
            </Button>
          </form>
        </form>
        <form className="registrationForm" onSubmit={registrationSubmit}>
        <label className="title" >Sign Up</label>
          <FormGroup controlId="name" bsSize="large">
            <ControlLabel>Name</ControlLabel>
            <FormControl
              type="name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </FormGroup>
          <FormGroup controlId="username" bsSize="large">
            <ControlLabel>Username</ControlLabel>
            <FormControl
              type="username"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
            />
          </FormGroup>
          <FormGroup controlId="newPassword" bsSize="large">
            <ControlLabel>Password</ControlLabel>
            <FormControl
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </FormGroup>
          <FormGroup controlId="passwordReEnter" bsSize="large">
            <ControlLabel>Re-enter Password</ControlLabel>
            <FormControl
              type="password"
              value={passwordReEnter}
              onChange={e => setPasswordReEnter(e.target.value)}
            />
          </FormGroup>
          <FormGroup controlId="question" bsSize="large">
            <ControlLabel>Security Question</ControlLabel>
            <FormControl
              type="question"
              value={question}
              onChange={e => setQuestion(e.target.value)}
            />
          </FormGroup>
          <FormGroup controlId="answer" bsSize="large">
            <ControlLabel>Answer</ControlLabel>
            <FormControl
              type="answer"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
            />
          </FormGroup>
          <Button block bsSize="large" disabled={!validateRegistration() ||  !validatePassword(newPassword)} type="submit">
            Create Account
          </Button>
          <Collapsible triggerTagName="help" trigger="Password Help" transitionTime="350">
            <p>Password must be at least 8 characters long and contain:<br></br>-a lower case letter <br></br>-a capital letter <br></br>-a number <br></br>-a special character</p>
          </Collapsible>
        </form>
      </div>
    );
  }
