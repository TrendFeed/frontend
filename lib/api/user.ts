// 백엔드 API 통신 함수들
import { getIdToken } from "../firebase/auth";

// 백엔드 API URL (환경 변수로 설정)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// 사용자 데이터 타입
export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: string;
}

// API 요청 헤더 생성 (Firebase 토큰 포함)
const getHeaders = async (): Promise<HeadersInit> => {
  const token = await getIdToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// 백엔드에 사용자 정보 저장/업데이트
export const syncUserToBackend = async (userData: UserData): Promise<void> => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/api/users/sync`, {
      method: "POST",
      headers,
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error("Failed to sync user to backend");
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error syncing user to backend:", error);
    throw error;
  }
};

// 백엔드에서 사용자 정보 가져오기
export const getUserFromBackend = async (uid: string): Promise<any> => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/api/users/${uid}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to get user from backend");
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error getting user from backend:", error);
    throw error;
  }
};

// 백엔드에서 사용자 삭제
export const deleteUserFromBackend = async (uid: string): Promise<void> => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/api/users/${uid}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to delete user from backend");
    }
  } catch (error: any) {
    console.error("Error deleting user from backend:", error);
    throw error;
  }
};

// 사용자 프로필 업데이트
export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserData>
): Promise<any> => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/api/users/${uid}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error("Failed to update user profile");
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};
