: # This is a script that checks the installed library versions in the machine,
: # regardless of operating system.
@ECHO OFF

ECHO ^> [32mNode[0m [33m(Minimum 8.10.0)[0m
CALL node -v

ECHO.

ECHO ^> [32mNpm[0m [33m(Minimum 5.8.0)[0m
CALL npm -v

ECHO.

ECHO ^> [32mIonic[0m [33m(Strictly 4.1.2)[0m
CALL ionic --version

ECHO.

ECHO ^> [32mCordova[0m [33m(Strictly 8.0.0)[0m
CALL cordova -v

ECHO.

ECHO ^> [32mGit[0m [33m(Minimum 2.16.2)[0m
CALL git --version

ECHO.

ECHO ^> [32mAndroid Debugging Tool[0m [33m(Minimum 1.0.32)[0m
CALL adb version

ECHO.

ECHO ^> [32mAndroid Build Tool[0m [33m(Minimum 0.2-3907386)[0m
CALL aapt version

ECHO.

CALL ionic cordova requirements

ECHO [33mExpected Output[0m
ECHO Java JDK: installed 1.8.0
ECHO Android SDK: installed true
ECHO Android target: installed android-28,...
ECHO Gradle: installed C:\Program Files\Android\Android Studio\gradle\gradle-4.1\bin\gradle
ECHO [33m(end)[0m
