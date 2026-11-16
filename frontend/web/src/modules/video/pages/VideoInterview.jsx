
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { StreamChat } from "stream-chat";

import {
    StreamVideoClient,
    StreamVideo,
    StreamCall,
    StreamTheme,
    SpeakerLayout,
    CallControls,
} from "@stream-io/video-react-sdk";

import {
    Chat,
    Channel,
    ChannelHeader,
    MessageList,
    MessageComposer, 
} from "stream-chat-react";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/dist/css/index.css";

import streamService from "../services/streamService.js";
import "../styles/video-interview.css";

function VideoInterview() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [videoClient, setVideoClient] = useState(null);
    const [videoCall, setVideoCall] = useState(null);
    const [chatClient, setChatClient] = useState(null);
    const [chatChannel, setChatChannel] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isHost, setIsHost] = useState(false);
    const [ending, setEnding] = useState(false);

    const videoCallRef = useRef(null);
    const videoClientRef = useRef(null);
    const chatClientRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        async function initializeRoom() {
            let newVideoClient;
            let newCall;
            let newChatClient;

            try {
                // Step 1: Try setting up the room as the recruiter.
                let host = false;

                try {
                    const setupResponse = await streamService.setup(id);

                    console.log("STREAM SETUP SUCCESS:", setupResponse);
                    host = true;
                } catch (setupError) {
                    console.error("STREAM SETUP FAILED:", {
                        message: setupError?.message,
                        status: setupError?.status,
                        data: setupError?.data,
                    });
                }

                if (cancelled) return;

                // Step 2: Request the Stream token.
                const tokenResponse = await streamService.getToken(id);

                console.log("STREAM TOKEN RESPONSE:", tokenResponse);

                const data =
                    tokenResponse?.data?.data ??
                    tokenResponse?.data ??
                    tokenResponse;

                const {
                    apiKey,
                    token,
                    user,
                    callId,
                    chatChannelId,
                } = data || {};

                if (
                    !apiKey ||
                    !token ||
                    !user?.id ||
                    !callId ||
                    !chatChannelId
                ) {
                    throw new Error(
                        "The video room configuration is incomplete."
                    );
                }

                if (cancelled) return;

                // Step 3: Initialize video.
                newVideoClient = new StreamVideoClient({
                    apiKey,
                    user: {
                        id: user.id,
                        name: user.name || "Vettly User",
                    },
                    token,
                });

                videoClientRef.current = newVideoClient;

                newCall = newVideoClient.call("default", callId);
                videoCallRef.current = newCall;

                await newCall.join({ create: false });

                if (cancelled) return;

                await newCall.camera.enable();
                await newCall.microphone.enable();

                if (cancelled) return;

                setVideoClient(newVideoClient);
                setVideoCall(newCall);
                setIsHost(host);

                // Step 4: Initialize chat.
                newChatClient = StreamChat.getInstance(apiKey);
                chatClientRef.current = newChatClient;

                await newChatClient.connectUser(
                    {
                        id: user.id,
                        name: user.name || "Vettly User",
                    },
                    token
                );

                if (cancelled) return;

                const newChannel = newChatClient.channel(
                    "messaging",
                    chatChannelId
                );

                await newChannel.watch();

                if (cancelled) return;

                setChatClient(newChatClient);
                setChatChannel(newChannel);
            } catch (err) {
                console.error("VIDEO INTERVIEW INITIALIZATION FAILED:", {
                    message: err?.message,
                    name: err?.name,
                    code: err?.code,
                    status: err?.status,
                    data: err?.data,
                    error: err,
                });

                if (!cancelled) {
                    setError(
                        err?.data?.message ||
                        err?.message ||
                        "Unable to join the video interview."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        initializeRoom();

        return () => {
            cancelled = true;

            const currentCall = videoCallRef.current;
            const currentVideoClient = videoClientRef.current;
            const currentChatClient = chatClientRef.current;

            videoCallRef.current = null;
            videoClientRef.current = null;
            chatClientRef.current = null;

            if (currentCall) {
                currentCall.leave().catch(console.error);
            }

            if (currentVideoClient) {
                currentVideoClient.disconnectUser().catch(console.error);
            }

            if (currentChatClient) {
                currentChatClient.disconnectUser().catch(console.error);
            }
        };
    }, [id]);

    async function handleEndMeeting() {
        const confirmed = window.confirm(
            "Are you sure you want to end this interview for everyone?"
        );

        if (!confirmed) return;

        try {
            setEnding(true);
            await streamService.end(id);

            navigate(`/interviews/${id}`, { replace: true });
        } catch (err) {
            console.error("END MEETING ERROR:", err);

            setError(
                err?.data?.message ||
                err?.message ||
                "Unable to end the meeting."
            );
        } finally {
            setEnding(false);
        }
    }

    if (loading) {
        return (
            <div className="video-page-state">
                <div className="video-loader" />
                <h2>Connecting to interview...</h2>
                <p>Preparing your camera, microphone and chat.</p>
            </div>
        );
    }

    if (error && (!videoClient || !videoCall)) {
        return (
            <div className="video-page-state">
                <div className="video-error-icon">!</div>
                <h2>Unable to join interview</h2>
                <p>{error}</p>

                <button
                    className="video-secondary-button"
                    onClick={() => navigate(`/interviews/${id}`)}
                >
                    Back to interview
                </button>
            </div>
        );
    }

    if (!videoClient || !videoCall || !chatClient || !chatChannel) {
        return null;
    }

    return (
        <div className="video-interview-page">
            <header className="video-interview-header">
                <div>
                    <span className="video-brand">VETTLY</span>
                    <h1>Live Interview Room</h1>
                    <p>Interview ID: {id}</p>
                </div>

                <div className="video-header-actions">
                    <span className="video-live-indicator">
                        <span />
                        Connected
                    </span>

                    <button
                        className="video-secondary-button"
                        onClick={() => navigate(`/interviews/${id}`)}
                    >
                        Back to details
                    </button>

                    {isHost && (
                        <button
                            className="video-end-button"
                            onClick={handleEndMeeting}
                            disabled={ending}
                        >
                            {ending ? "Ending..." : "End interview"}
                        </button>
                    )}
                </div>
            </header>

            {error && (
                <div className="video-inline-error">{error}</div>
            )}

            <main className="video-interview-layout">
                <section className="video-call-panel">
                    <div className="video-panel-heading">
                        <div>
                            <h2>Video conference</h2>
                            <p>Meet with your interview participants</p>
                        </div>
                    </div>

                    <StreamVideo client={videoClient}>
                        <StreamCall call={videoCall}>
                            <StreamTheme>
                                <div className="video-call-content">
                                    <SpeakerLayout />
                                    <CallControls
                                        onLeave={() =>
                                            navigate(`/interviews/${id}`, {
                                                replace: true,
                                            })
                                        }
                                    />
                                </div>
                            </StreamTheme>
                        </StreamCall>
                    </StreamVideo>
                </section>

                <aside className="video-chat-panel">
                    <div className="video-chat-heading">
                        <div>
                            <h2>Interview chat</h2>
                            <p>Send messages to participants</p>
                        </div>
                    </div>

                    <Chat client={chatClient}>
                        <Channel channel={chatChannel}>
                            <ChannelHeader />
                            <MessageList />
                            <MessageComposer />
                        </Channel>
                    </Chat>
                </aside>
            </main>
        </div>
    );
}

export default VideoInterview;
