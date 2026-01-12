<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>

    <#if section = "header">
    <#-- Κενό Header -->

    <#elseif section = "form">

        <style>
            /* 1. Hide Template Headers */
            header, .kc-form-header, .pf-c-login__main-header, .logo-container, .title-container { display: none !important; }

            /* 2. Show Custom Header inside form */
            #kc-form .logo-container, #kc-form .title-container { display: block !important; }

            /* 3. Input Styles (Transparent & Borders) */
            .pf-c-form__group, .form-group { margin-bottom: 15px !important; }

            input.pf-c-form-control, input[type="text"], input[type="password"] {
                background-color: rgba(255,255,255,0.05) !important;
                color: #ffffff !important;
                border: 1px solid #6b7280 !important;
                height: 42px !important;
                font-size: 14px !important;
                border-radius: 6px !important;
            }

            input:focus {
                border-color: #00d68f !important;
                background-color: rgba(255,255,255,0.1) !important;
                outline: none !important;
            }

            label { color: #ddd !important; font-size: 0.9em !important; margin-bottom: 5px !important; display: block !important;}
        </style>

        <div id="kc-form">
            <div id="kc-form-wrapper">

                <#-- CUSTOM HEADER -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <div class="logo-container" style="margin-bottom: 20px;">
                        <img src="${url.resourcesPath}/img/gendoxLogo.png" alt="Logo" style="max-width: 100px;">
                    </div>
                    <div class="title-container">
                        <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #fff;">Welcome to Gendox! 👋🏻</h1>
                        <p class="subtitle" style="color: #aab2bd; font-size: 14px;">Please sign in to your account and start the adventure</p>
                    </div>
                </div>

                <#if realm.password>
                    <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">

                        <#-- USERNAME INPUT -->
                        <#if !usernameHidden??>
                            <div class="${properties.kcFormGroupClass!}">
                                <label for="username" class="${properties.kcLabelClass!}">
                                    <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
                                </label>

                                <input tabindex="1" id="username" class="${properties.kcInputClass!} <#if messagesPerField.existsError('username','password')>pf-m-error</#if>"
                                       name="username" value="${(login.username!'')}" type="text" autofocus autocomplete="username" />

                                <#if messagesPerField.existsError('username','password')>
                                    <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite" style="color: #ff6b6b; font-size: 0.9em; margin-top: 5px; display: block;">
                                        ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                                    </span>
                                </#if>
                            </div>
                        </#if>

                        <#-- PASSWORD INPUT -->
                        <div class="${properties.kcFormGroupClass!}">
                            <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label>

                            <div class="${properties.kcInputGroup!}" style="position: relative;">
                                <input tabindex="2" id="password" class="${properties.kcInputClass!} <#if messagesPerField.existsError('username','password')>pf-m-error</#if>"
                                       name="password" type="password" autocomplete="current-password" />

                                <button class="${properties.kcFormPasswordVisibilityButtonClass!}" type="button" aria-label="${msg('showPassword')}"
                                        aria-controls="password" data-password-toggle tabindex="3"
                                        data-icon-show="${properties.kcFormPasswordVisibilityIconShow!}"
                                        data-icon-hide="${properties.kcFormPasswordVisibilityIconHide!}"
                                        data-label-show="${msg('showPassword')}" data-label-hide="${msg('hidePassword')}"
                                        style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #fff;">
                                    <i class="${properties.kcFormPasswordVisibilityIconShow!}" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>

                        <div class="${properties.kcFormGroupClass!} ${properties.kcFormSettingClass!}">
                            <div id="kc-form-options">
                                <#if realm.rememberMe && !usernameHidden??>
                                    <div class="checkbox">
                                        <label style="color: #aab2bd;">
                                            <#if login.rememberMe??>
                                                <input tabindex="4" id="rememberMe" name="rememberMe" type="checkbox" checked> ${msg("rememberMe")}
                                            <#else>
                                                <input tabindex="4" id="rememberMe" name="rememberMe" type="checkbox"> ${msg("rememberMe")}
                                            </#if>
                                        </label>
                                    </div>
                                </#if>
                            </div>
                            <div class="${properties.kcFormOptionsWrapperClass!}" style="text-align: right;">
                                <#if realm.resetPasswordAllowed>
                                    <span><a tabindex="5" href="${url.loginResetCredentialsUrl}" style="text-decoration: none; color: #00bf8c;">${msg("doForgotPassword")}</a></span>
                                </#if>
                            </div>
                        </div>

                        <div id="kc-form-buttons" class="${properties.kcFormGroupClass!}" style="margin-top: 25px;">
                            <input tabindex="6" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                                   name="login" id="kc-login" type="submit" value="${msg("doLogIn")}"
                                   style="background-color: #00d68f; border: none; color: #ffffff; font-weight: bold; width: 100%; padding: 12px; border-radius: 5px; cursor: pointer;"/>
                        </div>
                    </form>
                </#if>
            </div>
        </div>
        <script type="module" src="${url.resourcesPath}/js/passwordVisibility.js"></script>

    <#elseif section = "info" >
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <div id="kc-registration-container" style="text-align: center; margin-top: 15px; color: #aab2bd;">
                <span>New on our platform? <a tabindex="7" href="${url.registrationUrl}" style="color: #00d68f; text-decoration: none;">Create an account</a></span>
            </div>
        </#if>
    </#if>

</@layout.registrationLayout>