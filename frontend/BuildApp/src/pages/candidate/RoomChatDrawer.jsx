import React, { lazy, Suspense, useRef, useState } from 'react';

const RoomChat = lazy(() => import('./RoomChat'));

export default function RoomChatDrawer({ interviewId }) {
  const dialog = useRef(null);
  const [opened, setOpened] = useState(false);

  function openChat() {
    setOpened(true);
    dialog.current.showModal();
  }

  return <>
    <button type="button" aria-haspopup="dialog" onClick={openChat}>Room chat</button>
    <dialog ref={dialog} className="room-drawer" aria-label="Room chat">
      <header>
        <h2>Room chat</h2>
        <button type="button" onClick={() => dialog.current.close()} aria-label="Close room chat">Close</button>
      </header>
      {opened && <Suspense fallback={<p role="status">Opening chat…</p>}>
        <RoomChat key={interviewId} interviewId={interviewId}/>
      </Suspense>}
    </dialog>
  </>;
}
