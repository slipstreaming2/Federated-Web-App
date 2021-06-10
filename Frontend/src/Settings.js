import React, { useState, useEffect } from "react";
import {GetUserById, home, GetUserAbout} from './RequestsPosts';
import {EditCache} from './Caching'
import "./style.css";
import $ from "jquery";
import Cookies from 'universal-cookie';
import { useForm } from "react-hook-form";

export default function Settings(props) {
  const cookies = new Cookies();//cookies used to get the ID
  const [about, setAbout] = useState("");

  //Error constant used to output the error message sent from the back-end
  const errors = (xhr, error, errorThrown) => {
    var x = JSON.parse(xhr.responseText);
    alert(x.message);
}
  
  //Constants for the showing of the four forms
  const [questionReset, setQuestionReset] = useState(false);
  const [passwordResetWithPassword, setPasswordResetWithPassword] = useState(false);
  const [passwordResetWithQuestion, setPasswordResetWithQuestion] = useState(false);
  const [aboutEdit, setAboutEdit] = useState(false);

  //Constants for the opening of one form and closing all the rest
  const passwordResetWithPasswordOpen = () => {setPasswordResetWithPassword(true);
                                               setPasswordResetWithQuestion(false);
                                               setQuestionReset(false);
                                               setAboutEdit(false);}
  const passwordResetWithQuestionOpen = () => {setPasswordResetWithPassword(false);
                                               setPasswordResetWithQuestion(true);
                                               setQuestionReset(false);
                                               setAboutEdit(false);}
  const questionResetOpen = () => {setPasswordResetWithPassword(false);
                                   setPasswordResetWithQuestion(false);
                                   setQuestionReset(true);
                                   setAboutEdit(false);}
  const editAboutOpen = () => {setPasswordResetWithPassword(false);
                               setPasswordResetWithQuestion(false);
                               setQuestionReset(false);
                               setAboutEdit(true);}
  
  //Check to ensure password meets the rules set
  function validatePassword (newPassword) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/.test(newPassword)
  }

  useEffect(() => {
    const success = (data) => {
      console.log('profile data', data);
      setAbout(GetUserAbout(data) + "     ");//about is updated and spaces added to the end of the about to create distance between the about and edit button
    }
    GetUserById(cookies.get('id'), success, home);//User data is retrieved using the cookie ID
  }, []);

    function StartPasswordResetWithPassword() {
      const { register, handleSubmit} = useForm();
      
      const handleDataForm = (data) => {
        if((data.newPassword === data.passwordReEnter) && validatePassword(data.newPassword)){//password validation checks
          let UpdatePasswordWithPassword = {
            id: cookies.get('id'),
            password: data.oldPassword,
            new_password: data.newPassword
          }// object that will be used for the JSON is created

          let jsonObject = JSON.stringify(UpdatePasswordWithPassword);//JSON is created
          console.log(jsonObject);
          $.ajax({
            url: 'https://cs3099user-a4.host.cs.st-andrews.ac.uk/api/UpdatePasswordWithPassword/',//Address for the UpdatePasswordWithPassword request
            type: 'POST',
            data: jsonObject,
            contentType: 'application/json',
            error: errors,//Error handling
            success: function (data) {
                console.log(data);
                setPasswordResetWithPassword(false);//Form is closed upon success
            }
        })
        }
      }
      
      const onSubmit = data => handleDataForm(data); // handling post submit
  
      return(
        <div>
        <form onSubmit={handleSubmit(onSubmit)} className="resetPasswordWithPasswordForm">
          <label>Old Password</label>
            <input 
              name="oldPassword"
              ref={register({required: "Required"})} 
            />
          <label>New Password</label>
            <input 
              name="newPassword"
              ref={register({required: "Required"})}
            />
          <label>Re-enter New Password</label>
            <input 
              name="passwordReEnter"
              ref={register({required: "Required"})}
            />
          <button onClick={() => setPasswordResetWithPassword(false)}>Cancel</button>
          <button type="submit">Update Password</button>
        </form>
        </div>
      );
    }

    function StartPasswordResetWithQuestion() {
      const { register, handleSubmit} = useForm();
      
      const handleDataForm = (data) => {
        if((data.newPassword === data.passwordReEnter) && validatePassword(data.newPassword)){//password validation checks
          let ChangePasswordWithA = {
            id: cookies.get('id'),
            password: data.newPassword,
            answer: data.answer
          }// object that will be used for the JSON is created

          let jsonObject = JSON.stringify(ChangePasswordWithA);//JSON is created
          console.log(jsonObject);
          $.ajax({
            url: 'https://cs3099user-a4.host.cs.st-andrews.ac.uk/api/UpdateUser/',//Address for the ChangePasswordWithA request
            type: 'POST',
            data: jsonObject,
            contentType: 'application/json',
            error: errors,//Error handling
            success: function (data) {
                console.log(data);
                setPasswordResetWithQuestion(false);//Form is closed upon success
            }
        })
        }
      }
      
      const onSubmit = data => handleDataForm(data); // handling post submit
  
      return(
        <div>
        <form onSubmit={handleSubmit(onSubmit)} className="resetPasswordWithQuestionForm">
          <label>Security Answer</label> 
            <input 
              name="answer"
              ref={register({required: "Required"})} 
            />
          <label>New Password</label> 
            <input 
              name="newPassword"
              ref={register({required: "Required"})}
            />
          <label>Re-enter New Password</label>
            <input 
              name="passwordReEnter"
              ref={register({required: "Required"})}
            />
          <button onClick={() => setPasswordResetWithQuestion(false)}>Cancel</button>
          <button type="submit">Update Password</button>
        </form>
        </div>
      );
    }

    function StartQuestionReset() {
      const { register, handleSubmit } = useForm();
      //Presence checks
      const handleDataForm = (data) => {
        if(data.question.length > 0 && data.answer.length > 0){//question answer presence checks
          let UpdateQAWithPassword  = {
            id: cookies.get('id'),
            password: data.password,
            question: data.question,
            answer: data.answer
          }// object that will be used for the JSON is created

          let jsonObject = JSON.stringify(UpdateQAWithPassword);//JSON is created
          console.log(jsonObject);
          $.ajax({
            url: 'https://cs3099user-a4.host.cs.st-andrews.ac.uk/api/UpdateQAWithPassword/',//Address for the ChangePasswordWithA request
            type: 'POST',
            data: jsonObject,
            contentType: 'application/json',
            error: errors,//Error handling
            success: function (data) {
                console.log(data);
                setQuestionReset(false);//Form is closed upon success
            }
        })
        }
      }
      
      const onSubmit = data => handleDataForm(data); // handling post submit
  
      return(
        <div>
        <form onSubmit={handleSubmit(onSubmit)} className="resetPasswordWithQuestionForm">
          <label>Password</label>
            <input 
              name="password"
              ref={register({required: "Required"})} 
            />
          <label>Security Question</label>
            <input 
              name="question"
              ref={register({required: "Required"})}
            />
          <label>Answer </label>
          <input 
              name="answer"
              ref={register({required: "Required"})}
            />
          <button onClick={() => setQuestionReset(false)}>Cancel</button>
          <button type="submit">Change Security Question</button>
        </form>
        </div>
      );
    }

    function EditAbout() {
      const maxAboutLength = 280; // about should not exceed 280 characters
      const { register, handleSubmit} = useForm();
      
      const handleDataForm = (data) => {
        let UpdateAbout   = {
          id: cookies.get('id'),
          about: data.about
        }// object that will be used for the JSON is created

        let jsonObject = JSON.stringify(UpdateAbout);//JSON is created
        console.log(jsonObject);
        $.ajax({
          url: 'https://cs3099user-a4.host.cs.st-andrews.ac.uk/api/UpdateAbout/',//Address for the ChangePasswordWithA request
          type: 'PUT',
          data: jsonObject,
          contentType: 'application/json',
          error: errors,//Error handling
          success: function (data) {
              var x = UpdateAbout.about;
              console.log(x);
              console.log(data.about);
              EditCache('https://cs3099user-a4.host.cs.st-andrews.ac.uk/api/users/'+UpdateAbout.id+'?targetHost=cs3099user-a4.host.cs.st-andrews.ac.uk',
                         UpdateAbout.about, 'about');//Cache is updated as the about has been changed
              setAbout(x + "     ");//Spaces added to the end of the about to create distance between the about and edit button
              setAboutEdit(false);//Form is closed upon success
          }
      })
      }
      
      const onSubmit = data => handleDataForm(data); // handling post submit
      
      var properAbout = about.slice(0, about.length-5);//the additional spaces are removed so the about does not contain them when it is reassigned
      return(
        <form onSubmit={handleSubmit(onSubmit)} className='SubmitForm'>
          <textarea rows = "3" cols = "35" name="about" defaultValue={properAbout}  maxLength={maxAboutLength}ref={register({required: "Required"})}></textarea>
          <button onClick={() => setAboutEdit(false)}>Cancel</button>
          <button type="submit">Save</button>
        </form>
      );
    }

  return(
    <div className="Settings">
      <h2>{cookies.get('id')}</h2>
      {aboutEdit 
        ? <EditAbout/>
        : <> 
            <h4>{about}<button className="btn btn-lg btn-outline-danger ml-4" onClick={editAboutOpen}>Edit</button></h4>
          </>
      }
      {passwordResetWithPassword 
        ? <StartPasswordResetWithPassword/>
        : <> 
            <button className="btn btn-lg btn-outline-danger ml-4" onClick={passwordResetWithPasswordOpen}>Change Password Via Old Password</button>
          </>
      }
      {passwordResetWithQuestion 
        ? <StartPasswordResetWithQuestion/>
        : <> 
            <button className="btn btn-lg btn-outline-danger ml-4" onClick={passwordResetWithQuestionOpen}>Change Password Via Security Question</button>
          </>
      }
      {questionReset 
        ? <StartQuestionReset/>
        : <> 
            <button className="btn btn-lg btn-outline-danger ml-4" onClick={questionResetOpen}>Change Security Question</button>
          </>
      }
      
    </div>
  );
}