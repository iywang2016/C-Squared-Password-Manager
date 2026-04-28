# C_Squared Password Manager

## Project Structure
### backend/
- Has all the springboot java stuff

### extension/
- Has all the google extension and TS stuff
    - Start with google and expand to firefox later
    - React TS + Vite to build
    - Note from Jon: I hate webback. I hate babel. We are using Vite. :\)

### shared/
- Typescript types nothing cool


### TODOS
- Add a Favicon for the extension and an proper icon for the extension in the store
- Clean up readme and add instructions to build
  - Roughly just do npm run build and go to chrome to load the build


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