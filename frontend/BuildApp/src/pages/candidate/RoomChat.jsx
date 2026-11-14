import React, { useEffect, useRef, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { request } from '../../api';

export default function RoomChat({ interviewId, user }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [retry, setRetry] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(user?.id);
  const channelRef = useRef(null);
  const messagesRef = useRef(null);
  const followMessages = useRef(true);

  useEffect(() => {
    let active = true;
    let client;
    let subscription;
    setConnected(false);
    setError('');
    setMessages([]);
    followMessages.current = true;

    async function connect() {
      const getToken = async () => (await request('/stream/' + interviewId + '/token', {})).data;
      const access = await getToken();
      if (!active) return;
      setCurrentUserId(access.user.id);

      client = new StreamChat(access.apiKey);
      await client.connectUser(user || access.user, async () => (await getToken()).token);
      if (!active) {
        await client.disconnectUser();
        return;
      }

      const channel = client.channel('messaging', access.chatChannelId);
      await channel.watch();
      if (!active) {
        await client.disconnectUser();
        return;
      }

      channelRef.current = channel;
      setConnected(true);
      setMessages([...channel.state.messages]);
      subscription = channel.on('message.new', () => {
        if (active) setMessages([...channel.state.messages]);
      });
    }

    connect().catch(async failure => {
      await client?.disconnectUser().catch(() => {});
      if (active) setError(failure.message || 'Could not load room chat.');
    });

    return () => {
      active = false;
      channelRef.current = null;
      subscription?.unsubscribe();
      client?.disconnectUser();
    };
  }, [interviewId, user?.id, retry]);

  useEffect(() => {
    if (followMessages.current && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  async function send(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !channelRef.current || sending) return;

    setSending(true);
    setError('');
    try {
      await channelRef.current.sendMessage({ text });
      setDraft('');
    } catch (failure) {
      setError(failure.message || 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  }

  return <section className="room-chat" aria-label="Room chat">
    {!connected && !error && <p role="status">Connecting to chat…</p>}
    <ol className="room-chat-messages" aria-live="polite" ref={messagesRef}
      onScroll={event => {
        const list = event.currentTarget;
        followMessages.current = list.scrollHeight - list.scrollTop - list.clientHeight < 48;
      }}>
      {connected && !messages.length && <li className="room-chat-empty">No messages yet.</li>}
      {messages.map(message => <li key={message.id}>
        <div className="room-chat-meta">
          <strong>{message.user?.id === currentUserId ? 'You' : message.user?.name || 'Participant'}</strong>
          {message.created_at && <time dateTime={new Date(message.created_at).toISOString()}>{new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>}
        </div>
        <p>{message.text}</p>
      </li>)}
    </ol>
    {error && <div role="alert" className="room-chat-error">{error}{!connected && <button type="button" onClick={() => setRetry(value => value + 1)}>Retry chat</button>}</div>}
    <form onSubmit={send}>
      <label htmlFor="room-message">Message</label>
      <input id="room-message" value={draft} onChange={event => setDraft(event.target.value)}
        maxLength={2000} disabled={!connected || sending} placeholder="Write to the room" />
      <button type="submit" disabled={!draft.trim() || !connected || sending}>Send</button>
    </form>
  </section>;
}
