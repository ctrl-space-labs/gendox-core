<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username') displayInfo=(realm.password && realm.registrationAllowed && !registrationDisabled??); section>

    <#if section = "header">
        <#-- Empty Header -->

    <#elseif section = "form">

        <style>
            /* Hide default header */
            header { display: none !important; }

            /* Input Styles */
            input[type="text"], input[type="password"] {
                background-color: transparent !important;
                border: 1px solid #6b7280 !important;
                color: #ffffff !important;
                border-radius: 6px !important;
                height: 42px !important;
            }

            /* Focus Styles */
            input[type="text"]:focus, input[type="password"]:focus {
                border-color: #00d68f !important;
                background-color: rgba(255,255,255,0.05) !important;
                outline: none !important;
            }

            /* Error Styles (Red Border) */
            input.pf-m-error, input[aria-invalid="true"] {
                border-color: #ff6b6b !important;
                color: #ff6b6b !important;
            }

            /* Error Message Color */
            #input-error-username {
                color: #ff6b6b;
                font-size: 0.9em;
                margin-top: 5px;
                display: block;
            }

            label { color: #ddd !important; }
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

                        <#-- USERNAME INPUT (always rendered; readonly when usernameHidden??) -->
                        <div class="${properties.kcFormGroupClass!}" style="margin-bottom: 20px;">
                            <label for="username" class="${properties.kcLabelClass!}" style="color: #fff; display: block; margin-bottom: 5px;">
                                <#if !realm.loginWithEmailAllowed>
                                    ${msg("username")}
                                <#elseif !realm.registrationEmailAsUsername>
                                    ${msg("usernameOrEmail")}
                                <#else>
                                    ${msg("email")}
                                </#if>
                            </label>

                            <div style="position: relative;">
                                <input tabindex="1" id="username"
                                       aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"
                                       class="${properties.kcInputClass!} <#if messagesPerField.existsError('username','password')>pf-m-error</#if>"
                                       name="username"
                                       value="${(login.username!'')}"
                                       type="text" autofocus autocomplete="username"
                                       <#if usernameHidden??>readonly="readonly" tabindex="-1"</#if>
                                       style="background-color: transparent; color: #fff; border: 1px solid #444;
                                              <#if usernameHidden??>opacity: 0.7; padding-right: 110px; pointer-events: none;</#if>" />

                                <#-- When username is locked by Keycloak, allow user to restart and change email -->
                                <#if usernameHidden??>
                                    <div style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); z-index: 5;">
                                        <a href="${url.loginRestartFlowUrl}"
                                           style="text-decoration: none; color: #00bf8c; font-size: 0.85em; font-weight: 500;">
                                            Change email
                                        </a>
                                    </div>
                                </#if>
                            </div>

                            <#-- ERROR MESSAGE (shows username OR username/password errors) -->
                            <#if messagesPerField.existsError('username','password')>
                                <span id="input-error-username" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                    ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                                </span>
                            <#elseif messagesPerField.existsError('username')>
                                <span id="input-error-username" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                    ${kcSanitize(messagesPerField.get('username'))?no_esc}
                                </span>
                            </#if>
                        </div>

                        <div class="${properties.kcFormGroupClass!} ${properties.kcFormSettingClass!}">
                            <div id="kc-form-options">
                                <#if realm.rememberMe && !usernameHidden??>
                                    <div class="checkbox">
                                        <label style="color: #aab2bd;">
                                            <#if login.rememberMe??>
                                                <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox" checked> ${msg("rememberMe")}
                                            <#else>
                                                <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox"> ${msg("rememberMe")}
                                            </#if>
                                        </label>
                                    </div>
                                </#if>
                            </div>
                        </div>

                        <#-- 🔥 DYNAMIC BUTTON LOGIC 🔥 -->
                        <div id="kc-form-buttons" class="${properties.kcFormGroupClass!}" style="margin-top: 25px;">

                            <#-- If Keycloak is returning to username step with an error, show TRY AGAIN -->
                            <#if messagesPerField.existsError('username','password') || messagesPerField.existsError('username')>
                                <a href="${url.loginRestartFlowUrl}"
                                   class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                                   style="background-color: #00d68f; border: none; color: #ffffff; font-weight: bold; width: 100%; padding: 12px; border-radius: 5px; cursor: pointer; text-decoration: none; display: block; text-align: center;">
                                    TRY AGAIN
                                </a>
                            <#else>
                                <input tabindex="4"
                                       class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                                       name="login" id="kc-login" type="submit" value="NEXT"
                                       style="background-color: #00d68f; border: none; color: #ffffff; font-weight: bold; width: 100%; padding: 12px; border-radius: 5px; cursor: pointer;"/>
                            </#if>

                        </div>

                    </form>
                </#if>
            </div>
        </div>

    <#elseif section = "info" >
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <div id="kc-registration-container" style="text-align: center; margin-top: 15px; color: #aab2bd;">
                <span>New on our platform? <a tabindex="6" href="${url.registrationUrl}" style="color: #00d68f; text-decoration: none;">Create an account</a></span>
            </div>
        </#if>

    <#elseif section = "socialProviders" >
        <#-- If you want to hide IdP buttons completely, keep this section empty. -->
        <#-- Otherwise, restore your previous socialProviders block. -->
    </#if>

</@layout.registrationLayout>
