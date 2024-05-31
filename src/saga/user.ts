import {
  REFRESH_TOKEN_FAILURE,
  REFRESH_TOKEN_REQUEST,
} from "./../reducer/user";
import {
  LOG_IN_FAILURE,
  LOG_IN_REQUEST,
  LOG_IN_SUCCESS,
  LOG_OUT_FAILURE,
  LOG_OUT_REQUEST,
  LOG_OUT_SUCCESS,
  REFRESH_TOKEN_SUCCESS,
  SIGN_UP_FAILURE,
  SIGN_UP_REQUEST,
  SIGN_UP_SUCCESS,
} from "../reducer/user";
import {
  put,
  fork,
  all,
  call,
  takeLatest,
  takeEvery,
} from "redux-saga/effects";
import axios from "axios";
import { SagaIterator } from "redux-saga";

//----------------------------------------------------
function signUpAPI(data: any) {
  return axios.post("/user/signup", data);
}

function* signUp(action: { data: any }): SagaIterator {
  try {
    const result = yield call(signUpAPI, action.data);
    console.log(result);

    yield put({
      //put은 dispatch
      type: SIGN_UP_SUCCESS,
    });
  } catch (err: any) {
    console.error(err);
    yield put({
      type: SIGN_UP_FAILURE,
      error: err.response.data,
    });
  }
}

function* watchSignUp() {
  yield takeLatest<any>(SIGN_UP_REQUEST, signUp);
}

//--------------------------------------------------------
function logInAPI(data: any) {
  return axios.post("/user/login", data);
}

function* logIn(action: { data: any }): SagaIterator {
  try {
    const result = yield call(logInAPI, action.data);
    localStorage.setItem("accessToken", result.data.accessToken);
    localStorage.setItem("refreshToken", result.data.refreshToken);
    yield put({
      //put은 dipatch
      type: LOG_IN_SUCCESS,
      data: result.data,
    });
  } catch (err: any) {
    console.error(err);
    yield put({
      type: LOG_IN_FAILURE,
      error: err.response.data,
    });
  }
}

function* watchLogin() {
  yield takeEvery<any>(LOG_IN_REQUEST, logIn);
}
//--------------------------------------------------------

function refreshTokenAPI() {
  const refreshToken = localStorage.getItem("refreshToken");
  return axios.post("/user/refreshToken", { refreshToken });
}

function* refreshToken(): SagaIterator {
  try {
    const result = yield call(refreshTokenAPI);

    localStorage.setItem("accessToken", result.data.accessToken);
    yield put({
      type: REFRESH_TOKEN_SUCCESS,
      data: result.data,
    });
  } catch (err: any) {
    yield put({
      type: REFRESH_TOKEN_FAILURE,
      error: err.response.data,
    });
  }
}

function* watchRefreshToken() {
  yield takeEvery<any>(REFRESH_TOKEN_REQUEST, refreshToken);
}

//--------------------------------------------------------
function logOutAPI() {
  return axios.post("/user/logout");
}

function* logOut() {
  try {
    yield call(logOutAPI);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    yield put({
      //put은 dipatch
      type: LOG_OUT_SUCCESS,
    });
  } catch (err: any) {
    console.error(err);
    yield put({
      type: LOG_OUT_FAILURE,
      error: err.response.data,
    });
  }
}

function* watchLogOut() {
  yield takeLatest(LOG_OUT_REQUEST, logOut);
}

export default function* userSaga() {
  yield all([
    fork(watchLogin),
    fork(watchLogOut),
    fork(watchSignUp),
    fork(watchRefreshToken),
  ]);
  //fork:  함수의 비동기적인 호출 사용
  //call과 달리 순서 상관없이 실행할 때 사용
  //보통은 이벤트 리스너 함수를 실행할 때 사용

  //all : 보통 fork와 함께 사용, 배열 안의 fork를 병렬적으로 모두 실행 그리고 해당 fork가 모두 실행될 때까지 기다리는 역할
}
