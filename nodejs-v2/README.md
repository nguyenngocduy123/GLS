- [Quick Links](#quick-links)
- [Installation](#installation)
    - [Step 1-5: Programs Required](#step-1-5-programs-required)
    - [Step 6-7: Set-up (cmd/terminal)](#step-6-7-set-up-cmdterminal)
    - [Step 8: Set-up Configuration](#step-8-set-up-configuration)
    - [Step 9: Set-up MSSQL](#step-9-set-up-mssql)
    - [Step 10: Run](#step-10-run)
- [Temp Folders](#temp-folders)
- [Package.json](#packagejson)
    - [How should I upgrade packages?](#how-should-i-upgrade-packages)
- [Test](#test)

# Quick Links

| System Component | URL                       |
| ---------------- | ------------------------- |
| Planner Web App  | http://localhost/planner/ |
| Driver App       | http://localhost/driver2/ |

-------

# Installation

## Step 1-5: Programs Required

Step 1: **Install Nodejs** - Install the latest stable version (at least 8.10.0) of Nodejs via [nodejs.org](https://nodejs.org/en/)

Step 2: **Install MongoDB** - Install the latest stable version (at least 3.4) of MongoDB via [mongodb.com](https://www.mongodb.com/download-center)

Step 3: **Install MSSQL** - Install MSSQL 2014

Step 4: **Install Java** - Install Java JRE version 8 via [oracle.com](http://www.oracle.com/technetwork/java/javase/downloads/index.html)

Step 5: **Install Git** - Install the latest version (at least 2.16.0) via [git-scm.com](https://git-scm.com/downloads)

## Step 6-7: Set-up (cmd/terminal)

Step 6: **Clone source code**

For **development**, `git clone http://10.218.68.162:8888/root/vrp-nodejs.git -b develop`

For **production**, `git clone http://10.218.68.162:8888/root/vrp-nodejs.git --single-branch`

Step 7: **Install the required modules**

1. `cd vrp-nodejs`
2. `npm install`

## Step 8: Set-up Configuration

Step 8: **Server Configuration**

* Modify `nano setting.js`

Default settings require _wired_ SIMTech network or VPN to connect to the databases.

## Step 9: Set-up MSSQL

Step 9: **Database migration**

Skip this step if you are using default `setting.js`.

This step will create tables and the relationships without dropping existing tables (if any).

1. Create database (without schema/tables), as defined in setting.js
1. `npm run db:migrate`

## Step 10: Run

Step 10: **Set environment variable**

This step is for **production** only.

* Windows: `setx NODE_ENV production`
    - Check if correct: `echo %NODE_ENV%`
* Linux (Ubuntu): `NODE_ENV=production`
    - Check if correct: `echo $NODE_ENV`

Step 11: **Run project**

* Windows: `npm run start`
* Linux (Ubuntu): `nodejs main.js`

# Temp Folders

These folders are created **automatically** when project is run.

Purpose of each folder:

* **tmp**: Stores temporary files, including logs
    - Files are periodically deleted using a Linux script.
* **data/offline\_files**: Stores files that were stored on driver's device when there is no Internet.
    - Files are deleted only if update database is successful.
    - **Manual maintenance is required.**

-------

# Package.json

Last upgraded on **28 August 2018**.

## How should I upgrade packages?

Step 1. **Installation**

* If you are using vscode, install extension 'Version Lens' (pflannery.vscode-versionlens)
* If you are not using vscode, `npm install -g npm-check-updates`

Step 2: **Check which package(s) need to be upgraded**

* If you are using vscode, open `package.json`
* If you are not using vscode, `ncu`

Step 3: **Upgrade and Test**

Each package should be upgraded manually and checked for bugs before proceeding to the next package.

* If you are not using vscode,
    1. `ncu -u <%LIBRARY_NAME>`
    1. `npm i`
    1. Test
        - If OK, repeat.

-------

# Test

The following test cases might have errors when run simultaneously:
* Tests that checks whether folder contains x number of files
* Tests that checks database table contains x rows

Do not use `--detectLeaks` because `mongodb` uses `require_optional` (i.e. some modules are optional) but jest requires all packages to be properly resolved, otherwise the modules are counted as memory leaks.

Use `--watch` without `--runInBand`, otherwise the test cases will never end

Use `--watch` and re-run failed test cases - These test cases should pass in subsequent calls
