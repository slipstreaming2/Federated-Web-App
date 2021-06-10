import React, { useState } from "react";
import { Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import { useHistory } from 'react-router-dom';
import "./style.css";
import $ from "jquery";
import Collapsible from 'react-collapsible';
import {LinkMain} from './RequestsPosts';
import Cookies from 'universal-cookie';

export default function ResetPassword() {
  const history = useHistory();//history used to change pages
  const cookies = new Cookies();//cookies used to store data that will be used on other pages

  //Check to ensure that the temp ID cookie is not undefined, if it is then the user is sent back to the forgottenPassword page
  if(cookies.get('tempID') === undefined){
    history.push('/ForgottenPassword');
  }
  
  //local variables are assigned thier values from the cookies
  const id = cookies.get('tempID');
  const question = cookies.get('question');

  //useState used to keep the state up to date with the field's contents
  const [answer, getAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordReEnter, setPasswordReEnter] = useState("");

  //Error constant used to output the error message sent from the back-end
  const errors = (xhr, error, errorThrown) => {
    var x = JSON.parse(xhr.responseText);
    alert(x.message);
}

  //Presence checks along w/ password match check
  function validateForm() {
    return answer.length > 0 && newPassword.length > 0 && passwordReEnter.length > 0 && newPassword === passwordReEnter;
  }

  //Check to ensure password meets the rules set
  function validatePassword (newPassword) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/.test(newPassword)
  }

  function handleSubmit(event) {
    let updateUser = {id : id,
                      password: newPassword,
                      answer: answer}// object that will be used for the JSON is created
    let jsonObject = JSON.stringify(updateUser);//JSON is created
    console.log(jsonObject);
    $.ajax({
      url: 'https://cs3099user-a4.host.cs.st-andrews.ac.uk/api/UpdateUser/',//Address for the UpdateUser request
      type: 'POST',
      data: jsonObject,
      contentType: 'application/json',
      error: errors,//Error handling
      success: function (data) {
          cookies.set('id', id, { path: '/', secure: true, sameSite: true, maxAge: 86400});//ID cookie is set with an expiry of 24 hours
          var x = JSON.parse(data.user);
          console.log(data);
          console.log(x);
          history.push(LinkMain);//Redirected to main page
      }
    })
    event.preventDefault();
  }

  //When the button of type 'submit' is pressed, the handleSubmit() function is called.
  return (
    <div className="resetPassword">
      <img src={"https://i.imgur.com/1mtyMwX.png"} alt="Wabberjocky" width="175" height="150"/>
      <h1>WABBERJOCKY</h1>
      <form className="resetPasswordForm" onSubmit={handleSubmit}>
      <ControlLabel>Security Question</ControlLabel>
        <FormGroup controlId="answer" bsSize="large">
        <ControlLabel>{question}</ControlLabel>
          <FormControl
            autoFocus
            type="answer"
            value={answer}
            onChange={e => getAnswer(e.target.value)}
          />
        </FormGroup>
        <FormGroup controlId="newPassword" bsSize="large">
          <ControlLabel>New Password</ControlLabel>
          <FormControl
            type="Password"
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
        <Button block bsSize="large" disabled={!validateForm() || !validatePassword(newPassword)} type="submit">
          Submit
        </Button>
        <form className="returnToLogin" action="./" onSubmit={handleSubmit}>
          <Button block bsSize="large" type="submit">
            Return to Login
          </Button>
        </form>
        <Collapsible triggerTagName="help" trigger="Password Help" transitionTime="350">
          <p>Password must be at least 8 characters long and contain:<br></br>-a lower case letter <br></br>-a capital letter <br></br>-a number <br></br>-a special character</p>
        </Collapsible>
      </form>
    </div>
  );
}