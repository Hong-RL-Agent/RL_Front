  /*
    [추후 백엔드 인증 API 연동 예정]

    현재 Login 페이지는 UI 프로토타입 단계로,
    실제 로그인 인증 기능은 구현되어 있지 않습니다.

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
      - 메인 페이지 또는 테스트 페이지로 이동

    - 인증 실패 시
      - 오류 메시지 표시
      - 로그인 재시도 가능
  */

import { Link } from 'react-router-dom'
import '../styles/login.css'

function Login() {

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>로그인</h1>

        {/* TODO: 상태 관리(useState)로 입력값 관리 */}
        <input type="text" placeholder="아이디" />

        {/* TODO: 비밀번호 입력 상태 관리 */}
        <input type="password" placeholder="비밀번호" />

        {/* TODO:
            1. 로그인 API 호출
            2. 토큰 저장 (localStorage / cookie)
            3. 로그인 성공 시 페이지 이동
        */}
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