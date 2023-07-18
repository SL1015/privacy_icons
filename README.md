# privacy_icons
This readme file explains the logic and functions for each file of codes.
## Interface source code
**popup.html**
Structure pop-up page of the extension to display the information panel that websites collect and the user setting panel.
**options.html**
Structure the page where users can modify their privacy preferences to display the provided choices.
## Functions source code
**backend.py**
This file is the backend of the extension that receives and processes requests from the frontend, then send them into the integrated NLP model for analysis.
**popup.js**
This file includes functions and operations behind the interface defined by ‘popup.html’. The function ‘website_setting’ detects whether the current website is in our lists and takes respective operations.
The function ‘user_setting’ obtains users’ preferences saved in ‘options.html’ and displays them in the icon form.
**background.js**
This file works as a transfer station. It receives the URL submission from ‘popup.html’ and sends it to the back end.
**options.js**
This file mainly supports functions and operations behind the interface ‘option.html’, which provides preference selection and save actions.
**jquery-2.2.js**
This file is a dependent JavaScipt file of our html files to perform DOM operations.
