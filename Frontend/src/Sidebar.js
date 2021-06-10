import React from "react";
import { useHistory } from 'react-router-dom';
import { GetAuthorId } from './RequestsPosts';
import {LinkMain, LinkCommunityStatic, LinkCreateCommunity, GetAuthorHost,
        Logout, LinkProfileViaId, LinkLogout, LinkSettings, LinkCreateStatic} from './RequestsPosts';
import { SearchBar } from "./Search";
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import AccountCircle from '@material-ui/icons/AccountCircle';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import Grid from '@material-ui/core/Grid';
import './style.css';

//Style for the navbar
const useStyles = makeStyles(() => ({
  root: {
    flexGrow: 1,
  },
}));

export default function MenuAppBar(props) {
  const history = useHistory();//history used to change pages
  const classes = useStyles();
  //Setter and state of the menus
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [anchorElDeux, setAnchorElDeux] = React.useState(null);
  //Boolean used to track if the menu is opened
  const open = Boolean(anchorEl);
  const communityOpen = Boolean(anchorElDeux)

  //Handler for the opening and closing of the menus
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCommunityMenu = (event) => {
    setAnchorElDeux(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCommunityClose = () => {
    setAnchorElDeux(null);
  };

  //Constant functions for the clicking of each navbar item
  const MainClick = () => {handleClose();//
                           history.push(LinkMain);}//Pushed to the main page
  const CreatePostClick = () => {history.push(LinkCreateStatic)}//Pushed to the create post page
  const ViewCommunityClick = () => {handleCommunityClose();
                              history.push(LinkCommunityStatic);}//Pushed to communites page
  const CreateCommunityClick = () => {handleCommunityClose();
                              history.push(LinkCreateCommunity);}//Pushed to creare community page                                                    
  const ProfileClick = () => {handleClose();
                              history.push(LinkProfileViaId(GetAuthorId(props.user), GetAuthorHost(props.user)));}//Pushed to profile page
  const ProfileSettingsClick = () => {handleClose();
                                      history.push(LinkSettings);}//Pushed to settings page
  const LogoutClick = () => {Logout();//Logout function is called
                             history.push(LinkLogout);}//Pushed back to login page

  return (
    <div className={classes.root}>
      <AppBar style={{ background: '#1F2838' }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="main-page"
            onClick={MainClick}
          >
            <img src={"https://i.imgur.com/1mtyMwX.png"} alt="Wabberjocky" width="100" height="70"/>
            <Typography edge="start" variant="h2">
              Wabberjocky
            </Typography>
          </IconButton>
          <Grid container justify="flex-end" alignItems="flex-end">
            <Grid item>
              <IconButton
                color="inherit"
                aria-label="main-page"
                aria-haspopup="true"
                onClick={CreatePostClick}
              >
                <Typography edge="start" variant="h5">
                  Create Post
                </Typography>
              </IconButton>
            </Grid>
            <Grid item>
            <IconButton
              aria-label="communities"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleCommunityMenu}
              color="inherit"
            >
              <Typography variant="h5">
                Communities
              </Typography>
            </IconButton>
            <Menu
              id="community-appbar"
              anchorEl={anchorElDeux}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={communityOpen}
              onClose={handleCommunityClose}
            >
              <MenuItem onClick={ViewCommunityClick}>View Exisiting</MenuItem>
              <MenuItem onClick={CreateCommunityClick}>Create New</MenuItem>
            </Menu>
            </Grid>
            <Grid item>
            <IconButton
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={open}
              onClose={handleClose}
            >
              <MenuItem onClick={ProfileClick}>Profile</MenuItem>
              <MenuItem onClick={ProfileSettingsClick}>Profile Settings</MenuItem>
              <MenuItem onClick={LogoutClick}>Logout</MenuItem>
            </Menu>
            </Grid>
            <Grid container justify="flex-end" alignItems="flex-end">
            <SearchBar/>
            </Grid>
            </Grid>
      </Toolbar>
      </AppBar>
    </div>
  );
}