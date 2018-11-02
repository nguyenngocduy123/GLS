- [Installation](#installation)
    - [Step 1-5: Programs Required](#step-1-5-programs-required)
    - [Step 3-4: Set-up (cmd/terminal)](#step-3-4-set-up-cmdterminal)
    - [Step 5: Development Environment](#step-5-development-environment)
    - [Step 6: Run](#step-6-run)
- [Deployment](#deployment)
    - [Step 1-2: NPM Publish](#step-1-2-npm-publish)
        - [Potential Issues](#potential-issues)

# Installation

## Step 1-5: Programs Required

Step 1: **Install Nodejs** - Install the latest stable version (at least 8.10.0) of Nodejs via [nodejs.org](https://nodejs.org/en/)

Step 2: **Install Git** - Install the latest version (at least 2.16.0) via [git-scm.com](https://git-scm.com/downloads)

## Step 3-4: Set-up (cmd/terminal)

Step 3: **Clone source code**

`git clone http://10.218.68.162:8888/root/vrp-frontend.git`

Step 4: **Install the required modules**

1. `cd vrp-frontend`
2. `npm install`

## Step 5: Development Environment

* Recommended IDE
    - Visual Studio Code
* Recommended Extensions
    - TSLint (supports formatting and linting)
    - Debugger for Chrome (supports debugging)
    - TypeScript Hero (supports importing packages/components)

Step 5: Configure Debugger Chrome Extension

1. Run Google Chrome with options `"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222`
2. Modify `nano .vscode/launch.json`

Add the following to list of configurations:
```
{
    "name": "Attach to Chrome, with sourcemaps",
    "type": "chrome",
    "request": "attach",
    "port": 9222,
    //"url":"http://localhost:4200",
    "sourceMaps": true,
    "webRoot": "${workspaceRoot}",
    "sourceMapPathOverrides": {
        "webpack:///C:*": "C:/*"
        //"webpack:///*": "/*"
        //"webpack:///./*":"${workspaceRoot}\\*"
    }
}
```

## Step 6: Run

Step 6: **Run project**

1. `npm run start`
2. Open http://localhost:4200 on Google Chrome

# Deployment

## Step 1-2: NPM Publish

Step 1: Build distributions

This step compiles the application into `/dist` folder (default).

`npm run build` [https://github.com/angular/angular-cli/wiki/build](https://github.com/angular/angular-cli/wiki/build)

Step 2: Run gulp scripts

1. `npm install glup -g`
2. `gulp dist` / `gulp gls-dist`

### Potential Issues

Error 1: Out of memory [`FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory`](https://github.com/endel/increase-memory-limit),

1. `npm install -g increase-memory-limit`
2. `increase-memory-limit`
