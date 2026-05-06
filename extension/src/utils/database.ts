import axios from 'axios';

interface LoginResponse {
  logins: Map<string, string>;
}

export const fetchPasswords = async (masterUsername: string, domain: string): Promise<LoginResponse | undefined> => {
  try {
    const response = await axios.get<LoginResponse>(`/database/get_passwords/${masterUsername}/${domain}`);
    return response.data;
  } catch (error) {
    console.log("Error fetching passwords: " + error);
  }
};