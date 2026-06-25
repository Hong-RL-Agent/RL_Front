import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { apiUrl } from '../lib/api'
import '../styles/login.css'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email.trim() || !password) {
      setErrorMessage('이메일 또는 사용자명과 비밀번호를 입력해주세요.')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.message || '로그인에 실패했습니다.')
        return
      }

      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('userName', data.userName)
      localStorage.setItem('role', data.role)
      localStorage.setItem('userId', String(data.userId))
      localStorage.setItem(
        'user',
        JSON.stringify({
          username: data.userName,
          role: data.role,
        })
      )

      navigate(data.role === 'ADMIN' ? '/admin/dashboard' : '/')
    } catch (error) {
      setErrorMessage('서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>로그인</h1>

        <form className="auth-form" onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="이메일 또는 사용자명"
            value={email}
            onChange={handleEmailChange}
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={handlePasswordChange}
            autoComplete="current-password"
          />

          {errorMessage && <p className="auth-error-message">{errorMessage}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p>
          아직 계정이 없나요? <Link to="/signup">회원가입</Link>
        </p>

        <Link to="/" className="back-link">
          홈으로
        </Link>
      </div>
    </div>
  )
}

export default Login
