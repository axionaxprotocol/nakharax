@echo off
REM Commit changes in all repos
echo.
echo ============================================================
echo Committing refactor changes in all repositories
echo ============================================================
echo.

set REPOS=nakharax-marketplace nakharax-docs nakharax-deploy nakharax-devtools

for %%r in (%REPOS%) do (
    echo.
    echo [%%r] Adding changes...
    cd %%r
    git add -A
    git commit -m "refactor: clean code and update .gitignore"
    cd ..
)

echo.
echo ============================================================
echo All commits completed!
echo ============================================================
echo.
echo Next step: git push in each repo
