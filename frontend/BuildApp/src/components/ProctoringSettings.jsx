import React, { useState } from 'react';

const checks = [
  ['preventCopyPasteEnabled', 'Block copy, cut and paste', 'Browser'],
  ['tabSwitchDetectionEnabled', 'Track tab switches', 'Browser'],
  ['fullscreenRequired', 'Require fullscreen', 'Browser'],
  ['faceDetectionEnabled', 'Check for a missing face or looking away', 'Camera'],
  ['multipleFaceDetectionEnabled', 'Check for multiple faces', 'Camera'],
  ['cameraDisconnectDetectionEnabled', 'Detect camera disconnection', 'Camera'],
  ['suspiciousGestureDetectionEnabled', 'Record hand movement for review', 'Camera'],
];
const presets = { Off: () => false, 'Browser only': group => group === 'Browser', 'Browser + camera': () => true };
export function hasCountedWarnings(settings) {
  return checks.some(([key]) => key !== 'suspiciousGestureDetectionEnabled' && settings[key]);
}
export function ProctoringSummary({settings}) {
  const enabled = checks.filter(([key]) => settings[key]);
  if (!enabled.length) return <p>Proctoring is off for this interview.</p>;
  return <><ul>{enabled.map(([key,label])=><li key={key}>{label}</li>)}</ul>
    {hasCountedWarnings(settings) && <p>The attempt closes after {settings.warningLimit} counted {Number(settings.warningLimit)===1?'warning':'warnings'}.</p>}
    {settings.suspiciousGestureDetectionEnabled && <p>Hand movement is recorded for host review only. It does not count toward termination.</p>}</>;
}
export default function ProctoringSettings({interview,disabled}) {
  const [settings,setSettings]=useState(()=>Object.fromEntries(checks.map(([key])=>[key,interview?.[key]??true])));
  const enabled=checks.filter(([key])=>settings[key]).length;
  return <fieldset disabled={disabled} className="proctoring-settings"><legend>Interview proctoring</legend>
    <div className="proctor-presets" role="group" aria-label="Proctoring presets">{Object.entries(presets).map(([name,test])=>
      <button key={name} type="button" aria-pressed={checks.every(([key,,group])=>settings[key]===test(group))}
        onClick={()=>setSettings(Object.fromEntries(checks.map(([key,,group])=>[key,test(group)])))}>{name}</button>)}</div>
    <p aria-live="polite">{enabled} of {checks.length} checks enabled</p>
    <div className="form-pair">{['Browser','Camera'].map(group=><div key={group}><h3>{group} checks</h3>
      {checks.filter(([, , g])=>g===group).map(([key,label])=><label key={key} className="monitor-option">
        <input type="checkbox" name={key} checked={settings[key]} onChange={e=>setSettings({...settings,[key]:e.target.checked})}/>{label}
      </label>)}</div>)}</div>
    <label hidden={!hasCountedWarnings(settings)}>Warnings before termination
      <input type="number" min="1" max="1000" required disabled={!hasCountedWarnings(settings)} name="warningLimit" defaultValue={interview?.warningLimit??3}/>
    </label>
    {settings.suspiciousGestureDetectionEnabled && <p>Hand movement is logged for review only.</p>}
  </fieldset>;
}
export const checkKeys = checks.map(([key])=>key);
