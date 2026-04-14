/*
  [추후 백엔드/API 연동 예정]

  Signup 페이지는 사용자 계정 생성을 위한 회원가입 UI입니다.

  현재는 프론트엔드 UI 프로토타입 단계로,
  실제 사용자 등록 기능은 구현되어 있지 않습니다.

  추후 백엔드 연동 시 아래와 같은 흐름으로 동작할 예정입니다.

  1. 사용자 입력값 수집
     - username (아이디)
     - email (이메일)
     - password (비밀번호)
     - passwordConfirm (비밀번호 확인)

  2. 입력값 유효성 검사
     - 아이디 중복 여부
     - 이메일 형식 검사
     - 비밀번호 길이 및 규칙 검사
     - 비밀번호 확인 일치 여부

  3. 회원가입 API 요청

     POST /api/auth/signup

     요청 예시:
     {
       username: string
       email: string
       password: string
     }

  4. 회원가입 성공 시
     - 로그인 페이지 이동
     - 또는 자동 로그인 처리

  5. 회원가입 실패 시
     - 오류 메시지 표시
     - 입력값 재확인 요청
*/

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/signup.css'

function Signup() {
  const navigate = useNavigate()

  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSignup = async () => {
    setErrorMessage('')

    if (!userName || !email || !password || !passwordConfirm) {
      setErrorMessage('모든 항목을 입력해주세요.')
      return
    }
    if (password !== passwordConfirm) {
      setErrorMessage('비밀번호가 일치하지 않습니다.')
      return
    }
    if (password.length < 6) {
      setErrorMessage('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.message || '회원가입에 실패했습니다.')
        return
      }

      navigate('/login')
    } catch (error) {
      setErrorMessage('서버 연결에 실패했습니다.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>회원가입</h1>

        <input
          type="text"
          placeholder="이름"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호 확인"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
        />

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <button onClick={handleSignup}>회원가입</button>

        <p>
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>

        <Link to="/" className="back-link">
          홈으로
        </Link>
      </div>
    </div>
  )
}

export default Signup