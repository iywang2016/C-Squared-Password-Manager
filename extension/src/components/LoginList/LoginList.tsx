import React, { useState, useEffect } from 'react';
import './LoginList.css';

interface LoginListProps {
  masterUsername: string;
}

interface LoginEntry {
  domain: string;
  username: string;
  passwordAndIv: string;
}

export default function LoginList({ masterUsername }: LoginListProps) {
  const [logins, setLogins] = useState<LoginEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllLogins() {
      try {
        setLoading(true);
        setError(null);

        const getDomainsMessage = {
          type: "GET_DOMAINS",
          masterUser: masterUsername
        };
        const domainsResponse = await chrome.runtime.sendMessage(getDomainsMessage);

        if (!domainsResponse.success) {
          throw new Error(domainsResponse.error || "Failed to fetch domains");
        }

        const domains: string[] = JSON.parse(domainsResponse.data);
        const loginPromises = domains.map(async (domain) => {
          const getPassMessage = {
            type: "GET_PASSWORDS",
            masterUser: masterUsername,
            domain: domain
          };
          const passResponse = await chrome.runtime.sendMessage(getPassMessage);

          if (!passResponse.success) return [];

          const userPassMap = JSON.parse(passResponse.data);

          return Object.entries(userPassMap).map(([username, passwordAndIv]) => ({
            domain,
            username,
            passwordAndIv: passwordAndIv as string
          }));
        });

        const allLoginsArrays = await Promise.all(loginPromises);
        const combinedLogins = allLoginsArrays.flat();

        setLogins(combinedLogins);
      } catch (err: any) {
        setError(err.message || "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (masterUsername) {
      fetchAllLogins();
    }
  }, [masterUsername]);

  if (loading) return <div className="status-text">Loading your saved logins...</div>;
  if (error) return <div className="status-text error">Error: {error}</div>;

  return (
    <div className="login-list-container">
      <h3 className="login-list-title">Your Saved Logins</h3>

      {logins.length === 0 ? (
        <p className="status-text">No logins saved yet.</p>
      ) : (
        <div className="table-wrapper">
          <table className="login-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Username</th>
                <th>Password</th>
              </tr>
            </thead>
            <tbody>
              {logins.map((login, index) => {
                const encryptedPass = login.passwordAndIv.split('#')[0];

                return (
                  <tr key={`${login.domain}-${login.username}-${index}`}>
                    <td>{login.domain}</td>
                    <td>{login.username}</td>
                    <td className="password-cell">
                      {encryptedPass.substring(0, 10)}...
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}