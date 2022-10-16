import AgoraRTC, {
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  ILocalTrack,
  UID,
} from 'agora-rtc-sdk-ng';
import { Box, Button } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

function App() {
  const [joined, setJoined] = useState(false);
  //import.meta.env

  return (
    <Box width='100%' height='100%' display='flex'>
      {!joined && <Button onClick={() => setJoined(true)}>Join room</Button>}
      {joined && <VideoRoom />}
    </Box>
  );
}

export default App;

//#1 - Start client with APP_ID,TOKEN, CHANNEL
//#2 - use UseEffect to make client listen to 'publish', 'left' event
//#3 - use UseEffect to make client join channel with APP_ID, TOKEN, CHANNEL
//#4 - then chaning with AgoraRTC.createMicrophoneAndCameraTracks() to make request video and audio call from user
//#5 - then client.publish(tracks) to publish the tracks to the channel
//#6 - setUser to render yourself in VideoRoom
//#7 - useEffect clean up using client.off(effectName,cb) and client.leave()
//#8 - useEffect clean up trakcs using client.unpublish(tracks) or tracks.forEach(track => track.close())

export const VideoRoom = () => {
  const APP_ID = 'YOURAPPID';
  const TEMP_VIDEO_ROOM_TOKEN = 'SERVER_GENREATE_TOKEN';
  const CHANNEL_NAME = 'SERVER_GENREATE_CHANNEL_NAME_TO_MATCH_ROOM';
  const [users, setUsers] = useState<
    { uid: UID; videoTrack: ICameraVideoTrack }[]
  >([]);
  const [localTracks, setLocalTracks] = useState<ILocalTrack[]>([]);
  const client = AgoraRTC.createClient({
    mode: 'rtc',
    codec: 'vp8',
  });

  const handleUserJoined = async (
    user: IAgoraRTCRemoteUser,
    mediaType: 'audio' | 'video'
  ) => {
    await client.subscribe(user, mediaType);

    if (user.hasVideo) {
      setUsers((previousUser) => [...previousUser, user]);
    }

    if (user.hasAudio) {
      //do something
    }

    console.log('user joined');
  };

  const handleUserLeft = (
    user: IAgoraRTCRemoteUser,
    mediaType: 'audio' | 'video'
  ) => {
    console.log('user left');
    //people who left will nolonger have uid
    setUsers((previousUser) => previousUser.filter((u) => u.uid !== user.uid));
  };

  useEffect(() => {
    //these 3 are event listener, should clean after unmount
    client.on('user-published', handleUserJoined);
    client.on('user-left', handleUserLeft);
    client
      .join(APP_ID, CHANNEL_NAME, TEMP_VIDEO_ROOM_TOKEN, null)
      .then((uid) =>
        Promise.all([AgoraRTC.createMicrophoneAndCameraTracks(), uid])
      )
      .then(([tracks, uid]) => {
        setLocalTracks((prevTracks) => [...prevTracks, tracks]);
        const [audioTrack, videoTrack] = tracks;
        setUsers((users) => [...users, { uid, audioTrack, videoTrack }]);
        client.publish(tracks);
      });

    return () => {
      client.off('user-published', handleUserJoined);
      client.off('user-left', handleUserLeft);
      client.unpublish(localTracks).then(() => client.leave());
    };
  }, []);
  return (
    <Box>
      <h1>Vide list</h1>
      {users.map((user) => (
        <VideoPlayer key={user.uid} user={user} />
      ))}
    </Box>
  );
};

export const VideoPlayer = ({
  user,
}: {
  user: { uid: UID; videoTrack: ICameraVideoTrack };
}) => {
  const videoRef = useRef<HTMLElement | string>('');

  useEffect(() => {
    user.videoTrack?.play(videoRef.current);
  }, []);
  return (
    <Box>
      <h1>Uid: {user?.uid}</h1>
      <Box width={'200px'} height={'200px'} ref={videoRef}></Box>
    </Box>
  );
};
