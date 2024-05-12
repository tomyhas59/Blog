import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LOG_OUT_REQUEST } from "../../reducer/user";
import Search from "../../components/Search";
import { usePagination } from "../PaginationProvider";
import { RootState } from "../../reducer";
import io from "socket.io-client";

const Header = () => {
  const dispatch = useDispatch();
  const navigator = useNavigate();
  const { isLoggedIn, logOutDone, me, logInError } = useSelector(
    (state: RootState) => state.user
  );
  const socket =
    process.env.NODE_ENV === "production"
      ? io("https://port-0-blog-server-rccln2llvsdixmg.sel5.cloudtype.app")
      : io("http://localhost:3075");

  useEffect(() => {
    if (logInError) {
      alert(logInError);
    }
  }, [logInError]);

  const { paginate } = usePagination();

  useEffect(() => {
    if (logOutDone) {
      dispatch({
        type: "INITIALIZE_STATE", // 초기화 액션 타입
      });
      navigator("/login");
    }
  }, [dispatch, logOutDone, navigator]);

  const handleLogout = useCallback(() => {
    socket.emit("logoutUser", me?.id);
    dispatch({
      type: LOG_OUT_REQUEST,
    });
  }, [dispatch, me?.id]);

  const handleGoHome = useCallback(() => {
    dispatch({
      type: "GO_HOME",
    });
    paginate(1);
    navigator("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [dispatch, navigator, paginate]);

  const goToChat = () => {
    navigator("/chat");
  };

  return (
    <HeaderWrapper>
      <HeaderLogoBtn onClick={handleGoHome}>TMS</HeaderLogoBtn>
      <Nickname>{me && me.nickname + "님 환영합니다"}</Nickname>
      <Search />
      <SignList>
        {!isLoggedIn && (
          <>
            <SignButton>
              <Link to="/signup">회원가입</Link>
            </SignButton>
            <SignButton>
              <Link to="/login">로그인</Link>
            </SignButton>
          </>
        )}
        {isLoggedIn && (
          <>
            <li>
              <Button onClick={handleLogout}>로그아웃</Button>
            </li>
            <li>
              <Button onClick={goToChat}>채팅</Button>
            </li>
          </>
        )}
      </SignList>
    </HeaderWrapper>
  );
};

export default Header;

export const HeaderWrapper = styled.header`
  width: 100%;
  height: 5rem;
  padding: 1rem;
  top: 0;
  z-index: 1000;
  position: fixed;
  background-color: ${(props) => props.theme.subColor};
  display: grid;
  grid-template-columns: repeat(4, 1fr);

  @media (max-width: 680px) {
    height: 10rem;
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const HeaderLogoBtn = styled.button`
  cursor: pointer;
  font-size: 1.5rem;
  color: #ffffff;
  background-color: ${(props) => props.theme.mainColor};
  border-radius: 8px;
  border: 1px solid;
  margin-left: 100px;
  width: 10rem;
  height: 3rem;
  &:hover {
    color: ${(props) => props.theme.charColor};
  }
  @media (max-width: 480px) {
    margin-left: 10px;
    margin-bottom: 10px;
  }
`;

const Nickname = styled.div`
  width: 15rem;
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
  @media (max-width: 480px) {
    transform: scale(0.5) translateX(-200px);
  }
`;

const Button = styled.button`
  background-color: ${(props) => props.theme.mainColor};
  padding: 5px;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  margin: 5px;
  font-weight: bold;
  transition: transform 0.3s ease, color 0.3s ease;
  &:hover {
    transform: translateY(-2px);
    color: ${(props) => props.theme.subColor};
  }
`;

export const SignList = styled.ul`
  display: flex;
  margin-left: 5px;
  color: #fff;
  border-radius: 8px;
  align-items: center;
  height: 2.5rem;
  & > li {
    cursor: pointer;
    margin-left: 3px;
    font-size: 1rem;
    font-weight: bold;
    transition: transform 0.3s ease, color 0.3s ease;
    &:hover {
      transform: translateY(-2px);
      color: ${(props) => props.theme.charColor};
    }
  }
  @media (max-width: 480px) {
    flex-direction: column;
    transform: scale(0.7) translateX(-100px) translateY(-10px);
  }
`;

const SignButton = styled.li`
  background-color: ${(props) => props.theme.mainColor};
  padding: 5px;
  color: #fff;
  border-radius: 8px;
`;
