import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Frame from './components/Frame';
import Loading from './components/Loading';
import Account from './pages/Account';
import Scorecard from './pages/Scorecard';
import Home from './pages/Home';
import CandidateInterview from './pages/candidate/CandidateInterview';
import Workspace from './pages/host/Workspace';
import HostVideoRoom from './pages/host/HostVideoRoom';
import InvitationArt from './pages/InvitationArt';
import Auth from './pages/Auth';
import {auth} from './api';
import {finishLogin,requireLogin} from './loginRedirect';
import {handleInternalLink} from './navigation';
import './styles.css';

const forms=['login','signup','forgot-password','reset-password','verify-email','resend-verification'];
const pageTitles={
  home:'Interview workspace',login:'Sign in',signup:'Create account',
  'forgot-password':'Forgot password','reset-password':'Reset password',
  'verify-email':'Verify email','resend-verification':'Resend verification',
  account:'My profile',host:'Interviews',
};
function App(){
 const [route,setRoute]=useState({ revision: 0 });
 const [user,setUser]=useState(null),[error,setError]=useState('');
 const [profile,setProfile]=useState(null);
 const [sessions,setSessions]=useState(null);
 const page=location.pathname.replace(/^\/|\/$/g,'') || 'home';
 const hostRoute = /^(?:host|host\/new|host\/interviews\/([^/]+)(\/edit)?)$/.exec(page);
 const hostRoom = /^host\/interviews\/([^/]+)\/video$/.exec(page);
 const joinRoute = /^interviews\/([^/]+)\/(join|assessment|video)$/.exec(page);
 const resultRoute = /^results\/([^/]+)$/.exec(page);
 const protectedPage = !!hostRoom || !!resultRoute || !!joinRoute || !!hostRoute || page === 'account';
 const currentUser=user;
 const retryPage=()=>setRoute(current=>({revision:current.revision+1}));
 useEffect(()=>{
   const changed=()=>setRoute(current=>({ revision: current.revision+1 }));
   const signedOut=()=>{setUser(null);setProfile(null);setSessions(null)};
   window.addEventListener('popstate',changed);
   window.addEventListener('vettly:navigate',changed);
   window.addEventListener('vettly:logout',signedOut);
   document.addEventListener('click',handleInternalLink);
   return ()=>{window.removeEventListener('popstate',changed);window.removeEventListener('vettly:navigate',changed);window.removeEventListener('vettly:logout',signedOut);document.removeEventListener('click',handleInternalLink)};
 },[]);
 useEffect(()=>{
   document.title='Vettly · '+(pageTitles[page] || (hostRoom || joinRoute?.[2]==='video'?'Video room':joinRoute?.[2]==='assessment'?'Assessment':resultRoute?'Scorecard':joinRoute?'Join interview':hostRoute?'Interview workspace':'Page unavailable'));
   if(!protectedPage && !['signup','login'].includes(page))return;
   let active=true;
   setError('');
   if(user){
     if(!protectedPage)finishLogin();
     return;
   }
   auth('me').then(({data})=>{if(!active)return;if(protectedPage){setUser(data.user)}else finishLogin()})
    .catch(e=>{if(!active)return;if(e.status===401){setUser(null);setProfile(null);setSessions(null);if(protectedPage)requireLogin()}else if(protectedPage)setError('Your account could not be loaded.')});
   return ()=>{active=false};
 },[route]);
 if (hostRoom) return <Frame user={currentUser}>
   {currentUser ? <HostVideoRoom key={hostRoom[1]} id={hostRoom[1]}/> :
     <main id="content" className="workspace">{error ? <p role="alert">{error} <button onClick={retryPage}>Retry</button></p> : <Loading/>}</main>}
 </Frame>;
 if (resultRoute) return <Frame><main id="content" className="workspace">
   {currentUser ? <Scorecard key={route.revision} id={resultRoute[1]}/> : error ? <p role="alert">{error} <button onClick={retryPage}>Retry</button></p> : <Loading/>}
 </main></Frame>;
 if (page === 'account') return <Frame user={currentUser}><main id="content" className="profile-page">
   {error ? <p role="alert">{error} <a href="/account">Retry</a></p> :
     currentUser ? <Account user={currentUser} profile={profile} onProfileChange={setProfile} onUserChange={setUser} sessions={sessions} onSessionsChange={setSessions} onPictureChange={profilePicture => setUser(current => ({ ...current, profilePicture }))}/> : <Loading/>}
 </main></Frame>;
 return <Frame home={page==='home'}>{page==='home'?<Home/>:joinRoute?<main id="content" className="workspace candidate-room">{currentUser?<CandidateInterview key={joinRoute[1]} id={joinRoute[1]} view={joinRoute[2]}/>:error?<p role="alert">{error} <button onClick={retryPage}>Retry</button></p>:<Loading/>}</main>:hostRoute?(currentUser?<Workspace key={route.revision} user={currentUser} id={hostRoute[1]} editing={!!hostRoute[2]} creating={page==='host/new'}/>:<main id="content" className="workspace">{error?<p role="alert">{error} <button onClick={retryPage}>Retry</button></p>:<Loading/>}</main>):<main id="content" className="access">
 {forms.includes(page)?<Auth key={route.revision} route={page} token={new URLSearchParams(location.search).get('token')} onLogin={finishLogin}/>:<section className="account-panel"><h1>Page unavailable.</h1><a href="/">Go home</a></section>}<aside className="access-art"><InvitationArt/></aside></main>}</Frame>
}
createRoot(document.getElementById('root')).render(<App/>);
