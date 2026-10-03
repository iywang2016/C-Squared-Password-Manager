# C_Squared Password Manager

C_Squared[^1] is a gamified password manager with two main goals:
1. Secure storage and retrieval of website credentials;
2. Reinforcing good password etiquette by preempting insecure password creation with highly impactful mini-games.

C_Squared is a Chrome extension and is designed to work on the Google Chrome browser.

[^1]: C<sup>2</sup> is named after two (out of four) of the developers as well as the C2: Password Protector assignment from [CSE 121](https://courses.cs.washington.edu/courses/cse121/26sp) at the University of Washington. None of the developers ever took this course. However, they were all very passionate TAs, so all student assignments were of interest to them.

## Contents
* [Motivation](#motivation)
    * [What Makes a Password "Bad"?](#what-makes-a-password-bad)
* [Installation](#installation)
* [Usage](#usage)
    * [Key Functionalities](#key-functionalities)
    * [Security Guarantees](#security-guarantees)
    * [Demo](#demo)

## Motivation
Passwords are widely used in account creation for almost all applications and websites. Although 2FA and MFA have become more commonplace, the importance of a strong password has not diminished. Unfortunately, people often choose ["bad"](#what-makes-a-password-bad) passwords since they are more convenient when the user alone carries the burden of remembering and entering their passwords.

Any password manager can handle the secure storage and retrieval of user passwords. Some password managers have sought to notify users of insecure passwords. However, studies such as the USENIX [Longitudinal Study on the Usability of Password
Managers for Novice Users](https://www.usenix.org/system/files/soups2025-cabarcos.pdf) have indicated that simply *receiving the notification* of an insecure password does not push users to actually improve their password, much less continue to create secure passwords in the future. We are looking to address the root issue of bad user habits.

Rather than leveraging positive feedback to enforce good user habits, we use demeaning mini-games each time the user attempts to create a ["bad"](#what-makes-a-password-bad) password to guarantee user interaction and spur them towards changing their behavior.

### What Makes a Password "Bad"?

We characterize a "bad" password as one that meets any of the conditions:
1. Does not meet the NIST password-length guidance, i.e. consists of fewer than 15 characters
2. Follows a common password pattern (e.g. `abc123`)
3. Matches another of the user's passwords

## Installation
> [!NOTE]
> The application uses a non-persistent, locally-hosted backend—it must be running on your machine for the extension to function properly.

0. **Install prerequisites.** The password manager requires the following to build and run:
    * Java 17 or higher
    * Node.js
1. **Clone the repository.**
```bash
git clone git@github.com:iywang2016/C-Squared-Password-Manager.git
```
2. **Run the backend.** Navigate to the `backend/` directory and start up the Spring Boot application. The server will run on port 8080 by default.
    * For Linux, macOS, Unix-like systems:
    ```bash
    cd backend/
    ./gradlew bootRun
    ```
    * For Windows:
    ```bash
    cd backend/
    gradlew.bat bootRun
    ```
3. **Build the extension.** Navigate to the `extension/` directory to install necessary dependencies and build the extension. This should generate a `dist/` folder containing the extension.
```bash
cd extension/
npm i && npm run build
```
4. **Unpack the extension into Google Chrome.**
    * In the [Chrome Extensions Dashboard](chrome://extensions/), toggle "Developer mode" on.
    * Click "Load unpacked" and open the `dist/` folder from the previous step.
    * Toggle on the C_Squared Password Manager extension.

## Usage
### Key Functionalities
* Secure storage and retrieval of website credentials per C_Squared account
* Selection between multiple saved logins per subdomain
* Password security validation
* Interactive, gamified reinforcement of secure password practices
* Strong password generation to preempt ["bad"](#what-makes-a-password-bad) password creation
* Access to all saved credentials with timed visibility controls for obfuscated passwords

### Security Guarantees
* **Generated passwords are secure and unique to the user.** Each password is generated using a cryptographically secure pseudorandom number generator (CSPRNG) to follow the NIST 15-character minimum guidance.
* **Plaintext passwords will never reach vulnerable sinks.** Passwords for C_Squared accounts are salted and hashed with SHA-256; individual users' website login credentials are encrypted using AES-256.

### Demo
<video src="https://github.com/user-attachments/assets/72f2bdbf-db09-43a7-bf42-8e4e9f9a8509"></video>
