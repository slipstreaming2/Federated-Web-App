import React, { useState, useEffect } from "react";
import { Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import { useHistory, useParams } from 'react-router-dom';
import {Display, Selector} from './Display'
import {DisplayCommunity, checkAdmin} from './Display';
import "./style.css";
import $ from "jquery";
import {GetCommunityById, GetCommunityIds, GetCommunityDescription, 
        GetFilter, GetCommunityTitle, GetACommunityId, LinkCreate,
        GetPostContent, GetCommunityAdmins, GetAuthorId, home, errReport,
        GetAuthorHost, DeletingCommunity, LinkMain, Discover, EditCommunity} from './RequestsPosts'
import { useForm } from "react-hook-form";

export function Community(props) {
    const [comms, setComms] = useState([]);
    const [finished, setFinished] = useState(false);
    const [filter, setFilter] = useState([]);
    const [servers, setServers] = useState([]);
    const history = useHistory();

    useEffect(() => { // upon page load, get all communities
      const found = (data) => {
        console.log('found', data);
        data.push(home);
        setFilter(data);
        setServers(data);
        var asyncComms = [];
        var promises = [];
        data.forEach((server) => {
          const success = (d) => {
            console.log('data', server);
            var j;
            for(j = 0 ; j < d.length ; j++) {
              asyncComms.push({id: d[j], host: server});
              // setComms(prev => [...prev, {id: d[j], host: server}]);
            }
            setComms(asyncComms);
          }
          GetCommunityIds(success, server, promises);
        });
        Promise.allSettled(promises).then((result) => {
          //reach here regardless of rejection/network failure
          // setComms(asyncComms);
          errReport(result);
          setFinished(true)
        });
      }
      Discover(found);
    }, []) // final [] so page does not constantly update itself
// onClick={() =>  history.push(LinkFromCommunity(item))}
    const creating = props.create ? "Choose Community to Post In" : "Communities"    

    return(
      <>
        <h1>
          {creating}
        </h1>

        <DisplayAllCommunities comms={comms} create={props.create} filt={filter} servers={servers} setFilter={setFilter} />
        {!finished &&
          <h4>Loading...</h4>}
      </>
    );
}

export function DisplayAllCommunities(props) {
  // console.log(props.comms);
  const handleChange = (event) => {
    props.setFilter(event.target.value);
  }; 

  const filterFunc = (filtServers, post) => {
    if(filtServers) {
      return filtServers.findIndex(s => s===post.host) !== -1;
    } return true;
  }

  return(
    <>
      {props.filt && 
        <Selector filt={props.filt} onChange={handleChange} servers={props.servers} />
      }
      {props.comms && props.comms.filter(a => filterFunc(props.filt, a)).sort((a,b) => a.host < b.host ? 1 : -1).map((item) => ( 
          <div key={item} className="post">
            <DisplayCommunity community={item} create={props.create} />
        </div>
      ))
      }
    </>
  )
}



export function GetCommunityPosts(props) {
    const [posts, setPosts] = useState([]);
    const [communityPage, setCommunity] = useState({});
    const [description, setDescription] = useState('');
    const [editing, setEditing] = useState(false);
    const [admin, setAdmin] = useState(false);
    const { server, community } = useParams();

    const history = useHistory();
    console.log(community);
    const user = props.user;


    useEffect(() => { // upon page load, get community and community posts
      console.log(server);
      const success = (comm) => {
        setCommunity(comm);
        setDescription(GetCommunityDescription(comm));
        
        var admins = GetCommunityAdmins(comm);
        console.log(admins);
        setAdmin(checkAdmin(admins, user));
        
        const postSuccess = (postArr) => {
          setPosts(postArr);
        }
        GetFilter('community='+decodeURIComponent(community), postSuccess, decodeURIComponent(server));
        console.log(admin);
      }
      GetCommunityById(community, success, decodeURIComponent(server));
    }, []) // final [] so page does not constantly update itself
    
    function MakingEdit() {
      const maxDescriptionLength = 500; // post should not exceed 500 characters
      const { register, handleSubmit, errors } = useForm(); // hooks form


      const handleDataForm = (data) => {
          console.log(data);
          const success = () => {
            setDescription(data.body);
            setEditing(false);
          }
          EditCommunity(decodeURIComponent(community), data.body, success);
      }
      
      const onSubmit = data => handleDataForm(data); // handling post submit

      return(
        <form onSubmit={handleSubmit(onSubmit)} className='createCommunityForm'>
          <label>Description: 
              <input 
              name="body" 
              defaultValue={description ? description : GetCommunityDescription(communityPage)}
              maxLength={maxDescriptionLength}
              ref={register({required: "Required"})}
              />
          </label>
          <button onClick={() => setEditing(false)}>Cancel</button>
          <button type="submit">Save</button>
        </form>
      );
    }

    const del = () => {
      const toDel = {id: GetACommunityId(communityPage),
                     user_id: GetAuthorId(user),
                     hostname: GetAuthorHost(user)}
      const success = () => {
        history.push(LinkMain);
      }
      DeletingCommunity(toDel, success);
    }

    const change = editing
                  ?  <MakingEdit />
                  : description


    return(
        <>
        <div className='communitiesForm'>
            <h1> 
                Community: {GetCommunityTitle(communityPage)} 
            </h1>
            <h3>Server: {decodeURIComponent(server)}</h3>
            {admin &&
              <button onClick={() => del()}>Delete Community</button>}
            <p>
              {change}
            </p>
            {!editing && admin && 
            <button onClick={() => setEditing(true)}>Edit</button>
            }
            <button onClick={() => history.push(LinkCreate(GetACommunityId(communityPage), decodeURIComponent(server)))}>Create post</button>
            <Display posts={posts} user={user} setPosts={setPosts} admin={admin} server={decodeURIComponent(server)}/>
        </div>
        </>
    );
}
