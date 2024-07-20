import React, {
  useState,
  useEffect,
  SyntheticEvent,
  ChangeEvent,
  RefObject,
  useRef,
} from "react";
import { useSelector } from "react-redux";
import io, { Socket } from "socket.io-client";
import moment from "moment";
import { RootState } from "../../reducer";
import { Message, UserType } from "../../types";
import { useDispatch } from "react-redux";
import { READ_CHAT_REQUEST } from "../../reducer/post";
import styled from "styled-components";
import { UserRoomList } from "../../pages/Chat";

interface OneOnOneChatRoomType {
  me: UserType | null;
  onDeleteAllMessages: () => void;
  onMessageSubmit: (e: SyntheticEvent) => void;
  inputValue: string;
  messageRef: RefObject<HTMLInputElement>;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  selectedUser: UserType | null;
  room: UserRoomList | null;
  setActiveRoom: (room: UserRoomList | null) => void;
}

const OneOnOneChatRoom = ({
  me,
  onMessageSubmit,
  inputValue,
  messageRef,
  onInputChange,
  room,
  selectedUser,
  setActiveRoom,
}: OneOnOneChatRoomType) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { chatMessages } = useSelector((state: RootState) => state.post);
  const dispatch = useDispatch();
  const roomId = room?.id;
  const socket = useRef<Socket | null>(null);
  const messageListContainerRef = useRef<HTMLDivElement | null>(null);

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
    if (roomId) {
      dispatch({
        type: READ_CHAT_REQUEST,
        data: roomId,
      });
    }
  }, [dispatch, roomId]);

  useEffect(() => {
    socket.current?.emit("joinRoom", roomId, me?.nickname, selectedUser?.id);

    socket.current?.on("receiveMessage", (message) => {
      setMessages((prevMessages: Message[]) => [...prevMessages, message]);
    });

    socket.current?.on("systemMessage", (systemMessage) => {
      setMessages((prevMessages: Message[]) => [
        ...prevMessages,
        systemMessage,
      ]);
    });

    return () => {
      socket.current?.off("receiveMessage");
      dispatch({
        type: "RESET_CHAT_MESSAGES",
      });
    };
  }, [dispatch, me?.nickname, roomId, selectedUser?.id]);

  useEffect(() => {
    if (roomId) {
      setMessages(
        chatMessages.filter((message) => message.ChatRoomId === roomId)
      );
    }
  }, [chatMessages, roomId]);

  useEffect(() => {
    // 스크롤을 메시지 리스트의 마지막으로 이동
    if (messageListContainerRef.current) {
      messageListContainerRef.current.scrollTop =
        messageListContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleExit = () => {
    const isConfirmed = window.confirm(
      "다시 들어올 수 없습니다, 정말 나가겠습니까?"
    );
    if (isConfirmed) {
      socket.current?.emit("leaveRoom", roomId, me);
      setActiveRoom(null);
    }
  };

  const roomName =
    room?.User1?.id === me?.id ? room?.User2?.nickname : room?.User1?.nickname;

  return (
    <ChatRoomContainer>
      <RoomName>{roomName}님과의 채팅</RoomName>
      <ExitButton onClick={handleExit}>나가기</ExitButton>
      <MessageListContainer ref={messageListContainerRef}>
        <MessageList>
          {messages.length < 1 ? (
            <div>메시지가 없습니다</div>
          ) : (
            messages.map((message, i) => {
              const isSystemMessage = message.content.endsWith("systemMessage");
              const messageContent = isSystemMessage
                ? message.content.replace("systemMessage", "")
                : message.content;
              return (
                <React.Fragment key={message.id}>
                  {i === 0 ||
                  moment(message.createdAt).isAfter(
                    messages[i - 1].createdAt,
                    "day"
                  ) ? (
                    <DateSeparator>
                      {moment(message.createdAt).format("YYYY-MM-DD")}
                    </DateSeparator>
                  ) : null}
                  <MessageItem
                    key={message.id}
                    isMe={message.User.id === me?.id}
                    isSystemMessage={isSystemMessage}
                  >
                    <MessageSender isSystemMessage={isSystemMessage}>
                      {message.User.nickname.slice(0, 5)}
                    </MessageSender>
                    <MessageText
                      isMe={message.User.id === me?.id}
                      isSystemMessage={isSystemMessage}
                    >
                      {messageContent}
                    </MessageText>
                    <MessageTime isSystemMessage={isSystemMessage}>
                      {moment(message.createdAt).format("HH:mm")}
                    </MessageTime>
                  </MessageItem>
                </React.Fragment>
              );
            })
          )}
        </MessageList>
      </MessageListContainer>
      <MessageForm onSubmit={onMessageSubmit}>
        <MessageInput
          type="text"
          placeholder="메시지를 입력해주세요"
          value={inputValue}
          ref={messageRef}
          onChange={onInputChange}
        />
        <MessageButton type="submit">전송</MessageButton>
      </MessageForm>
    </ChatRoomContainer>
  );
};

export default OneOnOneChatRoom;

export const ChatRoomContainer = styled.div`
  width: 600px;
  padding: 20px;
  border-radius: 4px;
  border: 1px solid #ccc;
  @media (max-width: 480px) {
    width: 310px;
  }
`;

export const MessageListContainer = styled.div`
  overflow-y: auto;
`;
export const ExitButton = styled.button`
  position: absolute;
  border-radius: 5px;
  padding: 5px;
  right: 2%;
  top: 2%;
  background-color: ${(props) => props.theme.mainColor};
  color: #fff;
  transition: transform 0.3s ease, color 0.3s ease;
  &:hover {
    transform: translateY(-2px);
    color: ${(props) => props.theme.charColor};
  }
`;
export const RoomName = styled.h2`
  color: ${(props) => props.theme.mainColor};
  font-size: 24px;
  margin-bottom: 10px;
`;

export const MessageList = styled.ul`
  width: 530px;
  list-style-type: none;
  padding: 0;
  height: 50vh;
  font-size: 12px;
`;

export interface MessageItemProps {
  isMe: boolean;
  isSystemMessage: boolean;
}

export const MessageItem = styled.li<MessageItemProps>`
  margin-bottom: 10px;
  display: flex;
  flex-direction: ${(props) => (props.isMe ? "row" : "row-reverse")};
  justify-content: ${(props) =>
    props.isSystemMessage ? "center" : "flex-start"};
`;

export const MessageSender = styled.span<
  Pick<MessageItemProps, "isSystemMessage">
>`
  display: ${(props) => (props.isSystemMessage ? "none" : "inline")};
  font-weight: bold;
  line-height: 250%;
`;

export const MessageText = styled.p<MessageItemProps>`
  margin: 5px 0;
  padding: 5px 10px;
  background-color: ${(props) =>
    props.isSystemMessage ? "none" : props.isMe ? "#f0f0f0" : "#ccc"};
  color: ${(props) => (props.isSystemMessage ? "red" : "#000")};
  border-radius: 8px;
  max-width: 70%;
`;

export const MessageTime = styled.span<
  Pick<MessageItemProps, "isSystemMessage">
>`
  display: ${(props) => (props.isSystemMessage ? "none" : "inline")};
  font-size: 12px;
  color: #999;
  align-self: end;
`;

export const MessageForm = styled.form`
  display: flex;
  margin-top: 10px;
  @media (max-width: 480px) {
    height: 50px;
  }
`;

export const MessageInput = styled.input`
  flex: 1;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px 0 0 4px;
`;

export const MessageButton = styled.button`
  flex: 0.1;
  padding: 10px 15px;
  background-color: ${(props) => props.theme.mainColor};
  color: #fff;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  transition: transform 0.3s ease, color 0.3s ease;
  &:hover {
    transform: translateY(-2px);
    color: ${(props) => props.theme.charColor};
  }
  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

export const DateSeparator = styled.div`
  width: 100%;
  font-size: 10px;
  color: #ccc;
  border-bottom: 1px solid #ccc;
  margin: 10px 0;
  text-align: center;
`;
