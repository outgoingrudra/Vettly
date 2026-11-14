import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function ShareInvitation({ title, url }) {
  const [qr, setQr] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(url, { width: 280, margin: 2, errorCorrectionLevel: 'M' })
      .then(image => { if (active) setQr(image); })
      .catch(() => { if (active) setError('QR code could not be generated. Use the join link instead.'); });
    return () => { active = false; };
  }, [url]);

  async function share() {
    try {
      await navigator.share({ title, text: 'Join my interview on Vettly', url });
    } catch (failure) {
      if (failure.name !== 'AbortError') setError('Sharing is unavailable in this browser. Copy the join link instead.');
    }
  }

  const message = encodeURIComponent('Join my interview on Vettly: ' + title + '\n' + url);
  return <div className="invitation-share">
    <div className="share-actions">
      {typeof navigator.share === 'function' && <button type="button" onClick={share}>Share link</button>}
      <a href={'https://wa.me/?text=' + message} target="_blank" rel="noreferrer">Share to WhatsApp</a>
    </div>
    {qr && <div className="share-qr"><img src={qr} width="208" height="208" alt="QR code for this interview’s join link"/>
      <a href={qr} download={'vettly-interview-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png'}>Download QR code</a>
    </div>}
    {error && <p role="alert" className="error">{error}</p>}
  </div>;
}
