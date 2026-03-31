/*
  [추후 백엔드 인증 API 연동 예정]

  현재 Login 페이지는 UI 프로토타입 단계로,
  실제 로그인 인증 기능은 아직 구현되어 있지 않습니다.

  추후 아래와 같은 흐름으로 백엔드와 연동할 예정입니다.

  - 사용자 아이디 / 비밀번호 입력
  - 로그인 API 요청
    예: POST /api/auth/login
  - 요청 데이터
    {
      username: string,
      password: string
    }

  - 백엔드 인증 성공 시
    - accessToken / refreshToken 발급
    - 로컬스토리지 또는 쿠키에 저장
    - 사용자 정보 상태 저장
    - 권한(role)에 따라 일반 사용자 / 관리자 페이지 이동

  - 인증 실패 시
    - 오류 메시지 표시
    - 로그인 재시도 가능

  [임시 관리자 로그인]
  현재 프로토타입에서는 admin / admin 입력 시
  관리자 대시보드(/admin/dashboard)로 이동합니다.
*/

import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import '../styles/login.css'

function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value)
  }

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage('')

    if (!username.trim() || !password.trim()) {
      setErrorMessage('아이디와 비밀번호를 입력해주세요.')
      return
    }

    // TODO:
    // 1. 일반 사용자 로그인 API 호출
    // 2. 토큰 저장
    // 3. 권한(role)에 따라 페이지 분기

    // 임시 관리자 계정
    if (username === 'admin' && password === 'admin') {
      navigate('/admin/dashboard', {
        state: {
          adminName: 'Administrator',
        },
      })
      return
    }

    // 일반 사용자 임시 처리
    setErrorMessage('현재는 관리자 계정(admin / admin)만 테스트 가능합니다.')
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>로그인</h1>

        <form className="auth-form" onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="아이디"
            value={username}
            onChange={handleUsernameChange}
          />

          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={handlePasswordChange}
          />

          {errorMessage && <p className="auth-error-message">{errorMessage}</p>}

          <button type="submit">로그인</button>
        </form>

        <p>
          아직 계정이 없나요? <Link to="/signup">회원가입</Link>
        </p>

        <p className="admin-login-guide">관리자 테스트 계정: admin / admin</p>

        <Link to="/" className="back-link">
          홈으로
        </Link>
      </div>
    </div>
  )
}

export default Login