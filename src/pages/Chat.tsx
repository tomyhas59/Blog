import React, {
  useState,
  useEffect,
  SyntheticEvent,
  ChangeEvent,
  useRef,
  useCallback,
} from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import io, { Socket } from "socket.io-client";

import { RootState } from "../reducer";
import { UserType } from "../types";
import { useDispatch } from "react-redux";
import {
  ADD_CHAT_MESSAGE_REQUEST,
  DELETE_ALL_CHAT_REQUEST,
} from "../reducer/post";
import useOutsideClick from "../hooks/useOutsideClick";
import axios from "axios";
import OneOnOneChatRoom from "../components/chat/OneOnOneChatRoom";

export interface UserRoomList {
  id: number;
  User1: { id: number; nickname: string };
  User2: { id: number; nickname: string };
  User1Join: boolean;
  User2Join: boolean;
}

const Chat = () => {
  const [inputValue, setInputValue] = useState<string>("");
  const { me } = useSelector((state: RootState) => state.user);
  const [userList, setUserList] = useState<UserType[] | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [activeRoom, setActiveRoom] = useState<UserRoomList | null>(null);
  const messageRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const [activeUserOption, setActiveUserOption] = useState<string | null>(null);
  const [userRoomList, setUserRoomList] = useState<UserRoomList[]>([]);
  const [room, setRoom] = useState<UserRoomList | null>(null);
  const roomId = room?.id;
  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    socket.current =
      process.env.NODE_ENV === "production"
        ? io("https://quarrelsome-laura-tomyhas59-09167dc6.koyeb.app")
        : io("http://localhost:3075");

    return () => {
      socket.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchUserChatRooms = async () => {
      try {
        const response = await axios.get(`/post/findChat?userId=${me?.id}`);
        console.log(response.data);

        setUserRoomList(response.data);
      } catch (error) {
        console.error("Error fetching user chat rooms:", error);
      }
    };
    fetchUserChatRooms();

    socket.current?.on("updateUserRoomList", () => {
      fetchUserChatRooms();
    });
  }, [dispatch, me]);

  const createOneOnOneChatRoom = async (user2Id: number) => {
    try {
      const response = await axios.post("/post/chatRoom", { user2Id });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating 1:1 chat room:", error);
      throw error;
    }
  };

  const onUserOptionClick = useCallback((nickname: string) => {
    setActiveUserOption((prev) => (prev === nickname ? null : nickname));
  }, []);

  const userOptoinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (me && socket.current) {
      const userInfo = { id: me.id, nickname: me.nickname };
      socket.current.emit("loginUser", userInfo);
    }

    socket.current?.on("updateUserList", (updatedUserList: UserType[]) => {
      setUserList(updatedUserList);
    });

    socket.current?.on("newRoom", (newRoom: UserRoomList) => {
      setUserRoomList((prev) => {
        const roomExists = prev.find((room) => room.id === newRoom.id);
        if (!roomExists) {
          return [...prev, newRoom];
        }
        return prev;
      });
    });

    socket.current?.on("leaveRoomUserId", (leaveRoomUserId) => {
      setUserRoomList((prev) => {
        const leaveUserIndex = prev.findIndex(
          (room) =>
            room.User1.id === leaveRoomUserId ||
            room.User2.id === leaveRoomUserId
        );
        if (leaveUserIndex !== 1) {
          const newUserRoomList = [...prev];
          newUserRoomList.splice(leaveUserIndex, 1);
          return newUserRoomList;
        }
        return prev;
      });
    });

    return () => {
      socket.current?.off("updateUserList");
    };
  }, [me]);

  const onMessageSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    if (inputValue.trim() !== "") {
      const newMessage = {
        id: new Date().getTime(),
        User: me || null,
        content: inputValue,
        createdAt: new Date().getTime(),
        roomId: roomId,
      };
      socket.current?.emit("sendMessage", newMessage);
      dispatch({
        type: ADD_CHAT_MESSAGE_REQUEST,
        data: {
          content: inputValue,
          ChatRoomId: roomId,
        },
      });
      setInputValue("");
      messageRef.current?.focus();
    }
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const onDeleteAllMessages = useCallback(() => {
    dispatch({
      type: DELETE_ALL_CHAT_REQUEST,
    });
  }, [dispatch]);

  const onUserClick = useCallback(
    async (user: UserType) => {
      try {
        if (me && user.id !== me.id) {
          const chatRoom = await createOneOnOneChatRoom(user.id);
          console.log(chatRoom);
          if (chatRoom) {
            setRoom(chatRoom);
            setSelectedUser(user);
            setActiveRoom(chatRoom);
            const newRoom = {
              id: chatRoom?.id,
              User1: { id: me.id, nickname: me.nickname },
              User2: { id: user.id, nickname: user.nickname },
              User1Join: true,
              User2Join: true,
            };
            if (!userRoomList.some((room) => room.id === chatRoom.id)) {
              socket.current?.emit("createRoom", newRoom);
            }
            setActiveUserOption(null);
          }
        }
      } catch (error) {
        console.error("Error creating 1:1 chat room:", error);
      }
    },
    [me, userRoomList]
  );

  useOutsideClick([userOptoinRef], () => {
    setActiveUserOption(null);
  });

  const renderRoom = () => {
    if (activeRoom === room && room?.id) {
      return (
        <OneOnOneChatRoom
          me={me}
          onDeleteAllMessages={onDeleteAllMessages}
          onMessageSubmit={onMessageSubmit}
          inputValue={inputValue}
          messageRef={messageRef}
          onInputChange={onInputChange}
          room={room}
          selectedUser={selectedUser}
          setActiveRoom={setActiveRoom}
        />
      );
    } else {
      return <ChatContainer>1:1 채팅방</ChatContainer>;
    }
  };

  return (
    <ChatContainer>
      <UserList>
        <ConnectedUsers>{userList?.length || 0}명 접속 중</ConnectedUsers>
        {userList?.map((user) => (
          <li key={user.id}>
            <button onClick={() => onUserOptionClick(user.nickname)}>
              {user.nickname.slice(0, 5)}
            </button>
            {user.id !== me?.id && activeUserOption === user.nickname && (
              <UserOption ref={userOptoinRef}>
                <button
                  onClick={() => {
                    onUserClick(user);
                  }}
                >
                  1:1 채팅하기
                </button>
                <button>팔로우</button>
              </UserOption>
            )}
          </li>
        ))}
      </UserList>
      <RoomList>
        {userRoomList.map((userRoom) => {
          return (
            <RoomItem
              key={userRoom.id}
              onClick={() => {
                setRoom(userRoom);
                setActiveRoom(userRoom);
              }}
            >
              {userRoom.User1.id === me?.id
                ? userRoom.User2.nickname
                : userRoom.User1.nickname}
              님과 채팅
            </RoomItem>
          );
        })}
      </RoomList>
      <ContentWrapper>{renderRoom()}</ContentWrapper>
    </ChatContainer>
  );
};

export default Chat;

const ChatContainer = styled.div`
  display: flex;
  justify-content: center;
  @media (max-width: 480px) {
    display: block;
    text-align: center;
  }
`;

const UserList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  height: 60vh;
  border-radius: 5px;
  background-color: #c0e2f6;
  > li {
    font-size: 20px;
    color: #757272;
    list-style: none;
    position: relative;
    &:hover {
      color: #040303;
      cursor: pointer;
      text-decoration: underline;
    }
  }
  @media (max-width: 480px) {
    width: 300px;
    padding: 10px;
    flex-direction: row;
    overflow-x: auto;
  }
`;

const ConnectedUsers = styled.div`
  color: ${(props) => props.theme.mainColor};
  font-weight: bold;
  margin: 1px;
  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

const RoomList = styled.ul`
  width: 150px;
  padding: 10px;
  margin-right: 20px;
  text-align: center;
  @media (max-width: 480px) {
    width: 300px;
    display: flex;
    overflow-x: auto;
  }
`;

const RoomItem = styled.button`
  min-width: 100px;
  padding: 10px;
  margin-bottom: 10px;
  background-color: ${(props) => props.theme.mainColor};
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  list-style: none;
  font-size: 16px;
  color: #fff;
  cursor: pointer;
  transition: transform 0.3s ease, color 0.3s ease;
  &:hover {
    transform: translateY(-2px);
    color: ${(props) => props.theme.charColor};
  }
  @media (max-width: 480px) {
    font-size: 10px;
    min-width: 50px;
  }
`;

const ContentWrapper = styled.div`
  position: relative;
  width: 600px;
  @media (max-width: 480px) {
    width: 310px;
  }
`;

const UserOption = styled.div`
  left: 20px;
  font-size: 12px;
  position: absolute;
  background-color: ${(props) => props.theme.mainColor};
  border-radius: 5px;
  color: #fff;
  text-align: center;
  & button {
    width: 70px;
    margin: 10px;
    &:hover {
      color: ${(props) => props.theme.charColor};
    }
  }
`;
