import { Link } from 'react-router-dom'
import '../styles/signup.css'

function Signup() {
  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>회원가입</h1>
        <input type="text" placeholder="아이디" />
        <input type="email" placeholder="이메일" />
        <input type="password" placeholder="비밀번호" />
        <input type="password" placeholder="비밀번호 확인" />
        <button>회원가입</button>

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