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

import { Link } from 'react-router-dom'
import '../styles/signup.css'

function Signup() {
  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>회원가입</h1>

        {/* TODO: useState로 이름 입력 상태 관리 */}
        <input type="text" placeholder="이름" />

        {/* TODO: useState로 아이디 입력 상태 관리 */}
        <input type="text" placeholder="아이디" />

        {/* TODO: 이메일 입력값 상태 관리 및 형식 검증 */}
        <input type="email" placeholder="이메일" />

        {/* TODO: 비밀번호 입력 상태 관리 */}
        <input type="password" placeholder="비밀번호" />

        {/* TODO:
            1. 회원가입 API 호출
            2. 입력값 validation
            3. 회원가입 성공 시 로그인 페이지 이동
        */}
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