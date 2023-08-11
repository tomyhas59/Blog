import React from "react";
import { useState, useRef, useCallback } from "react";
import useInput from "../hooks/useInput";
import { useSelector, useDispatch } from "react-redux";
import {
  REMOVE_RECOMMENT_REQUEST,
  UPDATE_RECOMMENT_REQUEST,
} from "../reducer/post";
import styled from "styled-components";
const ReComment = ({ item }) => {
  const dispatch = useDispatch();
  const id = useSelector((state) => state.user.me?.id);

  //------------------댓글 수정--------------------------------

  const [editComment, setEditComment] = useState({});
  const [content, contentOnChane, setContent] = useInput("");
  const textRef = useRef(null);
  // 현재 열려 있는 댓글의 id추적하기 위한 상태 변수
  // const [currentEditingCommentId, setCurrentEditingCommentId] = useState(null);

  // const onEditCommentHandler = useCallback(
  //   (commentId, item) => {
  //     // 기존 댓글 닫기
  //     if (currentEditingCommentId !== null) {
  //       setEditComment((prev) => ({
  //         ...prev,
  //         [currentEditingCommentId]: false,
  //       }));
  //     }
  //     // 현재 열려 있는 댓글의 id 설정
  //     setCurrentEditingCommentId(commentId);

  //     setEditComment((prev) => ({
  //       ...prev,
  //       [commentId]: !prev[commentId],
  //     }));
  //     setContent(item.content);
  //   },
  //   [currentEditingCommentId, setContent]
  // );

  // // "취소" 버튼을 누를 때 호출되는 함수
  // const handleCancelEdit = useCallback(() => {
  //   setEditComment((prev) => ({
  //     ...prev,
  //     [currentEditingCommentId]: false,
  //   }));
  //   setCurrentEditingCommentId(null);
  //   setContent(""); // "Text" 영역 초기화
  // }, [currentEditingCommentId, setContent]);

  // const handleModifyComment = useCallback(
  //   (commentId) => {
  //     dispatch({
  //       type: UPDATE_RECOMMENT_REQUEST,
  //       data: {
  //         postId: post.id,
  //         commentId: commentId,
  //         content: content,
  //       },
  //     });
  //     setEditComment({});
  //     setCurrentEditingCommentId(null);
  //     setContent(""); // "Text" 영역 초기화
  //   },
  //   [content, dispatch, post.id, setContent]
  // );
  // const Enter = useCallback(
  //   (e, commentId) => {
  //     if (e.key === "Enter") {
  //       handleModifyComment(commentId);
  //     }
  //   },
  //   [handleModifyComment]
  // );

  //---댓글 삭제-----------------------------------------------------
  // const onRemoveComment = useCallback(
  //   (commentId) => {
  //     if (!window.confirm("삭제하시겠습니까?")) return false;
  //     dispatch({
  //       type: REMOVE_RECOMMENT_REQUEST,
  //       data: {
  //         commentId: commentId,
  //         postId: post.id,
  //       },
  //     });
  //   },
  //   [dispatch, post.id]
  // );
  return (
    <>
      {item.ReComments.map((v) => (
        <div key={v.id}>안녕하세요 {v.content}</div>
      ))}
    </>
  );
};

export default ReComment;

const CommentWrapper = styled.div`
  border: 1px solid ${(props) => props.theme.mainColor};
  display: flex;
  width: 100%;
  border-radius: 5px;
  padding: 20px;
`;

const Author = styled.div`
  font-weight: bold;
  width: 10%;
  text-align: center;
  margin-right: 10px;
`;

const Content = styled.div`
  font-weight: bold;
  width: 60%;
`;

const Toggle = styled.button`
  font-weight: bold;
  width: 7%;
`;

const NotLoggedIn = styled.button`
  font-weight: bold;
  width: 8%;
  color: gray;
  cursor: default;
`;

const Button = styled.button`
  background-color: ${(props) => props.theme.mainColor};
  margin: 2px;
  color: #fff;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  :hover {
    opacity: 0.7;
  }
`;

const Text = styled.textarea`
  width: 46%;
`;

const EndFlex = styled.div`
  display: flex;
  justify-content: end;
`;
