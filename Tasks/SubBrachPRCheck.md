# Task :
###          To create the Pipeline for check the Sub branch PR or push the code.

## Task Suite : 
###        - Testing Framework : `Plyawright with TS`
###        - Programming Language : `TS`
###        - Dependacies need : `Node`
###        - How to run test : `npm` 
###        - Where to run : `Browsers`
###        - What to validate : `Actual Test execution`
###        - What website being tested : `https://opensource-demo.orangehrmlive.com`
###        - Trigger Configuration : `On push to Qms-Pranav and Qms-Shubham branch only`
###        - Manual Trigger option 
###        - Schedule weekly runs (On every sunday)
###        - What to install : `Node, Browsers, Headless browser drivers`

## Trigger Branches :
         - Qms-Pranav
         - Qms-Shubham

## Credintials :
###       - USERNAME : `${{secrets.TEST_USERNAME}}` - Username also take from the github secrets 
###       - PASSWORD : `${{secrets.TEST_PASSWORD}}` -  Password also take from the github secrets

## Output needed:
###       - Pass/fail count
###       - Test duration
###       - Error logs
###       - Screenshots (for UI tests)
###       - HTML/XML reports
###      - Code coverage report
###       - Send Email on `${{secrets.NOTIFICATION_EMAIL}}` - This is configured mail with github actions 
   
## Pipeline Workflow : 
###              ![alt text](<Screenshot 2025-12-12 173019.png>)
###

## Result Visualization Ideas 
###       - Status : `Success/Failure`
###       - Duration : Ex, `2m 30s`
###       - Tests : Ex, `45 passed, 2 Failed, 3 Skipped`
###       - View Detiled report 
###       - See failing tests
###       - Download Artifacts

## About Pipeline
###       - runs-on : `ubuntu-latest`
###       - timeout-minutes : 30

## Pipline Workfolw 
       -  1. Chechout
       -  2. Setup Node.js
       -  3. Install dependencies
       -  4. Install playwright browsers
       -  5. Run tests with credentials
       -  6. Upload test results
       -  7. Generate Allure report
       -  8. Send email notification on given mail

       
