import {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import PageDefaultLayout from '../../layouts/PageDefaultLayout.tsx';
import useLogin from '../../hooks/useLogin.ts';
import CheckFetchError from '../../constant/CheckFetchError.ts';
import useLoginErrorBox from '../../hooks/useLoginErrorBox.tsx';
import CheckStringType from '../../constant/CheckStringType.ts';
import AuthControl from '../../constant/AuthControl.ts';
import '@styles/LoginPage.scss';

function LoginEmailAuthPage() {
  const navigate = useNavigate();
  const [fetching, setFetching] = useState<boolean>(false);
  const [authCode, setAuthCode] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const email = new URLSearchParams(window.location.search).get('email') ?? '';

  const AuthCodeInputRef = useRef<HTMLInputElement>(null);
  const {setErrorMessage, ErrorBox} = useLoginErrorBox();

  const {isLogin} = useLogin();
  useEffect(() => {
    if (isLogin)
      navigate('/', {replace: true});
    document.title = 'AllCll | 이메일 로그인';
  }, [isLogin, navigate]);

  useEffect(() => {
    AuthCodeInputRef.current?.focus();

    function onEnter(e: KeyboardEvent) {
      if (e.key === 'Enter')
        login();
    }

    AuthCodeInputRef.current?.addEventListener('keydown', onEnter);
    return () => {
      AuthCodeInputRef.current?.removeEventListener('keydown', onEnter);
    };
  }, [login]);

  function login() {
    if (!CheckStringType.authCode(authCode)) {
      setErrorMessage('인증번호 형식이 올바르지 않습니다');
      AuthCodeInputRef.current?.focus();
      return;
    }

    setFetching(true);
    fetch('/api/v2/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({email, authCode})
    }).then(async res => {

      const errors = [
        {errorBody: 'Email address not found', errorMessage: '가입 시도한 적 없는 메일 주소입니다'},
        {errorBody: 'Invalid email format', errorMessage: '이메일 형식이 올바르지 않습니다'},
        {errorBody: 'Authentication failed', errorMessage: '인증 번호가 일치하지 않음', action: () => AuthCodeInputRef.current?.focus()},
      ];
      await CheckFetchError(res, errors, navigate);

      await AuthControl.login(navigate, await res.text());
    })
      .catch(e => setErrorMessage(e.message))
      .finally(() => setFetching(false));
  }

  function resendAuthCode() {
    setSending(true);
    fetch('/api/v2/auth/login/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({email})
    }).then(async res => {
      const errors = [
        {errorBody: 'Email address not found', errorMessage: '가입 시도한 적 없는 메일 주소입니다'},
        {errorBody: 'Invalid email format', errorMessage: '이메일 형식이 올바르지 않습니다'},
      ];
      await CheckFetchError(res, errors, navigate);
    })
      .catch(e => setErrorMessage(e.message))
      .finally(() => setSending(false));
  }

  return (
    <PageDefaultLayout className='login_page'>
      <div className='login_layout'>
        <h1>AllCll 이메일 로그인</h1>

        {ErrorBox}

        {!sending && !ErrorBox && (
          <p className='message_box'>
            이메일로 인증번호를 발송했습니다. <br/>
            인증번호를 입력해주세요.
          </p>
        )}
        <input type='text'
               placeholder='인증번호'
               ref={AuthCodeInputRef}
               disabled={fetching}
               value={authCode}
               onChange={e => setAuthCode(e.target.value)}/>

        <button onClick={login} disabled={fetching}>로그인</button>
        <div className='flex_row'>
          <button className='link' onClick={() => navigate('/login/password')}>비밀번호로 로그인</button>
          <button className='link' onClick={resendAuthCode} disabled={sending}>인증번호 재전송</button>
        </div>
      </div>
    </PageDefaultLayout>
  );
}

export default LoginEmailAuthPage;