import React, { useState, useEffect } from 'react';
import './LoginList.css';
import { loginState } from '../../App';
import { decryptAES256, hex2buf } from '../../utils/encrypt';

interface LoginListProps {
  masterUsername: string;
}

interface LoginEntry {
  domain: string;
  username: string;
  passwordAndIv: string;
  decryptedPass: string;
}

export default function LoginList({ masterUsername }: LoginListProps) {
  const [logins, setLogins] = useState<LoginEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const toggleVisibility = (id: string) => {
    const newSet = new Set(visiblePasswords);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setVisiblePasswords(newSet);
  };

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

        if (!domainsResponse.data) return [];

        const domains: string[] = JSON.parse(domainsResponse.data);

        const loginPromises = domains.map(async (domain) => {
          const getPassMessage = {
            type: "GET_PASSWORDS",
            masterUser: masterUsername,
            domain: domain
          };
          const passResponse = await chrome.runtime.sendMessage(getPassMessage);

          if (!passResponse.success) return [];

          if (!passResponse.data) return [];

          const userPassMap = JSON.parse(passResponse.data);
          const entries = Object.entries(userPassMap);

          const decryptedEntries = await Promise.all(entries.map(async ([username, passwordAndIv]) => {
            const strPass = passwordAndIv as string;
            const split = strPass.split("#");
            const encryptedPass = split[0];
            const iv = split[1];
            let decryptedPass = "Error decrypting";

            if (loginState.masterKey) {
              try {
                decryptedPass = await decryptAES256(
                  loginState.masterKey,
                  hex2buf(encryptedPass).buffer,
                  hex2buf(iv)
                );
              } catch (e) {
                console.error("Failed to decrypt", e);
              }
            }

            return {
              domain,
              username,
              passwordAndIv: strPass,
              decryptedPass
            };
          }));

          return decryptedEntries;
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
                <th>Show</th>
              </tr>
            </thead>
            <tbody>
              {logins.map((login, index) => {
                const id = `${login.domain}-${login.username}-${index}`;
                const isVisible = visiblePasswords.has(id);

                return (
                  <tr key={id}>
                    <td>{login.domain}</td>
                    <td>{login.username}</td>
                    <td className="password-cell">
                      {isVisible ? login.decryptedPass : '********'}
                    </td>
                    <td>
                      <button
                        className="toggle-visibility-button"
                        onClick={() => toggleVisibility(id)}
                      >
                        {isVisible ? 'Hide' : 'Show'}
                      </button>
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