<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=false; section>

    <#if section = "show-username">
        <style>
           /* 1. We hide the default headers */
           header.pf-c-login__main-header,
           .kc-form-header,
           .title-container,
           .logo-container,
           #kc-username
           {
               display: none !important;
           }

           /* 2. Set background color for the whole page */
           #kc-form .logo-container,
           #kc-form .title-container {
               display: block !important;
           }

           /* 3. Set input styles */
           input[type="text"], input[type="password"] {
               background-color: rgba(255,255,255,0.05) !important;
               border: 1px solid #6b7280 !important;
               color: #ffffff !important;
               border-radius: 6px !important;
               height: 42px !important;
           }

           /* 4. Set focus styles */
           input:focus {
               border-color: #00d68f !important;
               background-color: rgba(255,255,255,0.1) !important;
               outline: none !important;
           }

           label { color: #ddd !important; }
        </style>

    <#elseif section = "header">
        ${msg("loginAccountTitle")}

    <#elseif section = "form">
        <div id="kc-form">
            <div id="kc-form-wrapper">

                <#-- HEADER -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <div class="logo-container" style="margin-bottom: 20px;">
                        <img src="${url.resourcesPath}/img/gendoxLogo.png" alt="Logo" style="max-width: 100px;">
                    </div>
                    <div class="title-container">
                        <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #fff;">Welcome to Gendox! 👋🏻</h1>
                        <p class="subtitle" style="color: #aab2bd; font-size: 14px;">Please sign in to your account and start the adventure</p>
                    </div>
                </div>

                <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">

                    <#-- USERNAME (Disabled Input - Transparent) -->
                    <div class="${properties.kcFormGroupClass!}">
                        <label for="username" class="${properties.kcLabelClass!}" style="color: #fff; display: block; margin-bottom: 5px;">
                            <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
                        </label>
                        <div style="position: relative;">
                            <input id="username" class="${properties.kcInputClass!}" name="username" value="${(login.username!'')}"
                                type="text" readonly autocomplete="username" tabindex="-1"
                                style="background-color: transparent; color: #fff; border: 1px solid #6b7280; opacity: 0.7; padding-right: 100px; pointer-events: none;" />

                            <div style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); z-index: 5;">
                                <a href="${url.loginRestartFlowUrl}" style="text-decoration: none; color: #00bf8c; font-size: 0.85em; font-weight: 500;">
                                    Change Email
                                </a>
                            </div>
                        </div>
                    </div>

                    <#-- PASSWORD INPUT (Transparent) -->
                    <div class="${properties.kcFormGroupClass!}">
                        <label for="password" class="${properties.kcLabelClass!}" style="color: #fff;">${msg("password")}</label>

                        <div class="${properties.kcInputGroup!}" style="position: relative;">
                            <input tabindex="2" id="password" class="${properties.kcInputClass!} <#if messagesPerField.existsError('username','password')>pf-m-error</#if>"
                                   name="password" type="password" autocomplete="current-password" autofocus
                                   style="background-color: transparent; color: #fff; border: 1px solid #444;" />

                            <button class="${properties.kcFormPasswordVisibilityButtonClass!}" type="button" aria-label="${msg('showPassword')}"
                                    aria-controls="password" data-password-toggle tabindex="3"
                                    data-icon-show="${properties.kcFormPasswordVisibilityIconShow!}"
                                    data-icon-hide="${properties.kcFormPasswordVisibilityIconHide!}"
                                    data-label-show="${msg('showPassword')}"
                                    data-label-hide="${msg('hidePassword')}"
                                    style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #fff;">
                                <i class="${properties.kcFormPasswordVisibilityIconShow!}" aria-hidden="true"></i>
                            </button>
                        </div>

                        <#if messagesPerField.existsError('username','password')>
                            <span id="input-error-password" class="${properties.kcInputErrorMessageClass!}" aria-live="polite" style="color: #ff6b6b;">
                                ${kcSanitize(messagesPerField.getFirstError('password'))?no_esc}
                            </span>
                        </#if>
                    </div>

                    <#-- Forgot Password -->
                    <div class="${properties.kcFormGroupClass!} ${properties.kcFormSettingClass!}">
                        <div id="kc-form-options"></div>
                        <div class="${properties.kcFormOptionsWrapperClass!}" style="text-align: right; margin-top: 5px;">
                            <#if realm.resetPasswordAllowed>
                                <span><a tabindex="5" href="${url.loginResetCredentialsUrl}" style="text-decoration: none; color: #00bf8c;">${msg("doForgotPassword")}</a></span>
                            </#if>
                        </div>
                    </div>

                    <#-- LOGIN BUTTON: White Text (color: #ffffff) -->
                    <div id="kc-form-buttons" class="${properties.kcFormGroupClass!}" style="margin-top: 25px;">
                        <input tabindex="4" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                               name="login" id="kc-login" type="submit" value="LOGIN"
                               style="background-color: #00d68f; border: none; color: #ffffff; font-weight: bold; width: 100%; padding: 12px; border-radius: 5px; cursor: pointer;"/>
                    </div>
                </form>
            </div>
        </div>
        <script type="module" src="${url.resourcesPath}/js/passwordVisibility.js"></script>
    </#if>
</@layout.registrationLayout>