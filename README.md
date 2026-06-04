# C_Squared Password Manager

## Project Structure
### backend/
- Has all the springboot java stuff

### extension/
- Has all the google extension and TS stuff
    - Start with google and expand to firefox later
    - React TS + Vite to build

### shared/
- Typescript Types

## Instructions
### Requirements
Before running you must have:
* **Java 17+**
* **Node.js**
* **Google Chrome**

---

### 1. Clone the Repository

```bash
git clone git@gitlab.cs.washington.edu:cse481s-26sp/c_squared.git
```

### 2. Run Backend

Navigate to the backend directory
```bash
cd backend/
```
Mac
```bash
./gradlew bootRun
```

Windows
```bash
gradlew.bat bootRun
```

The server runs on 8080 by default

### 3. Build Chrome Extension

Navigate to the extension directory
```bash
cd extension
```

Install dependencies and build extension
```bash
npm i && npm run build
```

### 4. Test Extension

1. Go to Chrome Extensions Dashboard at chrome://extensions/
2. Toggle Dev Mode
3. Click Load Unpacked and open the dist/
4. Play around with the extension by clicking on the puzzle icon in the upper right of the browser tab (labeled "Extensions"), then clicking on the new icon
5. Note that you need to have the backend running locally to test the front-end extension otherwise things like login won't work

### 5. Test Environments
1. We have found it to work on all of the websites we've tested after the most recent changes to manually saving logins
