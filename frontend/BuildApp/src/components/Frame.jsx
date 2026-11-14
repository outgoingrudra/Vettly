import React,{useState} from 'react';
import './LandingNav.css';
import './AppNav.css';
import './ThemeSwitch.css';

const themes=['Paper','Clay','Night'];
function ThemeSwitch({ theme, change }) {
  return <div className="theme-switch" role="group" aria-label="Color theme">
    {themes.map(name => <button key={name} type="button" title={name + ' theme'}
      aria-label={name + ' theme'} aria-pressed={theme === name}
      onClick={() => change(name)}>
      <span className={'theme-swatch theme-swatch-' + name.toLowerCase()} aria-hidden="true"/>
      <span className="theme-name">{name}</span>
    </button>)}
  </div>;
}
function LandingNav({ theme, change, home }) {
  return <header className="landing-nav">
    <Brand/>
    <nav aria-label="Explore Vettly">
      <a href="/#preview">Product preview</a>
      <a href="/#questions">FAQs</a>
    </nav>
    <div className="nav-actions">
      <ThemeSwitch theme={theme} change={change}/>
      {home && <a className="nav-signin" href="/login">Sign in <span aria-hidden="true">→</span></a>}
    </div>
  </header>;
}

export function Brand(){return <a className="brand" href="/" aria-label="Vettly home"><img className="brand-fold" src="/fold-mark.png" width="36" height="36" alt=""/>Vettly</a>}
function AppNav({ theme, change, user }) {
  const path = location.pathname;
  const authPage = /^\/(login|signup|forgot-password|reset-password|verify-email|resend-verification)\/?$/.test(path);
  return <header className="app-nav">
    {path === '/account' ? <a className="app-profile-link" href="/account" aria-label="My profile">
      {user?.profilePicture ? <img src={user.profilePicture} alt=""/> :
        <span aria-hidden="true">{user?.name?.slice(0, 1) || '•'}</span>}
      My profile
    </a> : <a className="app-wordmark" href={authPage ? '/' : '/host'}>Vettly<span> / {authPage ? 'Account' : 'Workspace'}</span></a>}
    {!authPage && <nav aria-label="Workspace navigation">
        <a href="/host" aria-current={path === '/host' ? 'page' : undefined}>Interviews</a>
        <a href="/account" aria-current={path === '/account' ? 'page' : undefined}>Account</a>
    </nav>}
    <ThemeSwitch theme={theme} change={change}/>
  </header>;
}
export default function Frame({children,home,user}){
  const [theme,setTheme]=useState(document.documentElement.dataset.theme || 'Paper');
  function change(value){
    document.documentElement.dataset.theme=value;
    setTheme(value);
    try{localStorage.setItem('vettly-theme',value)}catch{}
  }
  return <div className="frame"><a className="skip" href="#content">Skip to content</a>
    {home ? <LandingNav theme={theme} change={change} home/> : <AppNav theme={theme} change={change} user={user}/>}
    {children}</div>
}
