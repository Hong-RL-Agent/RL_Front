import { Link } from 'react-router-dom'
import '../styles/login.css'

function Login() {
  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>로그인</h1>
        <input type="text" placeholder="아이디" />
        <input type="password" placeholder="비밀번호" />
        <button>로그인</button>

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