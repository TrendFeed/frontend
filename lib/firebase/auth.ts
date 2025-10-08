// Firebase 인증 관련 유틸리티 함수들
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  GithubAuthProvider,
} from "firebase/auth";
import { auth } from "./config";

// 이메일/비밀번호로 회원가입
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // 사용자 프로필 업데이트 (이름 설정)
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName,
      });
    }

    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message || "회원가입에 실패했습니다.");
  }
};

// 이메일/비밀번호로 로그인
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message || "로그인에 실패했습니다.");
  }
};

// Google 로그인
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message || "Google 로그인에 실패했습니다.");
  }
};

// GitHub 로그인
export const signInWithGitHub = async (): Promise<User> => {
  try {
    const provider = new GithubAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message || "GitHub 로그인에 실패했습니다.");
  }
};

// 로그아웃
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message || "로그아웃에 실패했습니다.");
  }
};

// 비밀번호 재설정 이메일 전송
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(
      error.message || "비밀번호 재설정 이메일 전송에 실패했습니다."
    );
  }
};

// 현재 사용자의 ID 토큰 가져오기 (백엔드 인증용)
export const getIdToken = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  } catch (error: any) {
    throw new Error(error.message || "토큰 가져오기에 실패했습니다.");
  }
};
