<#import "template.ftl" as layout>
<#import "user-profile-commons.ftl" as userProfileCommons>

<#-- MACRO: Ultra Compact Terms Acceptance -->
<#macro termsAcceptance>
    <#if termsAcceptanceRequired??>
        <div class="form-group" style="margin-top: 5px; margin-bottom: 5px;">
            <div class="${properties.kcInputWrapperClass!}">
                <div style="font-size: 0.8em; color: #aab2bd; margin-bottom: 2px;">
                    ${msg("termsTitle")}
                </div>
                <#-- smaller, scrollable terms box -->
                <div id="kc-registration-terms-text" style="background: transparent; color: #ccc; border: 1px solid #6b7280; padding: 5px; height: 60px; overflow-y: scroll; font-size: 0.75em; border-radius: 4px; margin-bottom: 5px;">
                    ${kcSanitize(msg("termsText"))?no_esc}
                </div>
            </div>
        </div>
        <div class="form-group" style="margin-bottom: 10px;">
            <div class="${properties.kcLabelWrapperClass!}" style="display: flex; align-items: center;">
                <input type="checkbox" id="termsAccepted" name="termsAccepted" class="${properties.kcCheckboxInputClass!}"
                       aria-invalid="<#if messagesPerField.existsError('termsAccepted')>true</#if>"
                       style="width: auto; margin-right: 8px;"
                />
                <label for="termsAccepted" class="${properties.kcLabelClass!}" style="color: #fff; margin-bottom: 0; font-size: 0.85em;">${msg("acceptTerms")}</label>
            </div>
            <#if messagesPerField.existsError('termsAccepted')>
                <div class="${properties.kcLabelWrapperClass!}">
                    <span id="input-error-terms-accepted" class="${properties.kcInputErrorMessageClass!}" aria-live="polite" style="color: #ff6b6b; font-size: 0.75em;">
                        ${kcSanitize(messagesPerField.get('termsAccepted'))?no_esc}
                    </span>
                </div>
            </#if>
        </div>
    </#if>
</#macro>

<@layout.registrationLayout displayMessage=messagesPerField.exists('global') displayRequiredFields=false; section>

    <#if section = "header">
    <#-- Header Empty -->

    <#elseif section = "form">

        <style>
            /* Hide Default Template Headers */
            header, .kc-form-header, .pf-c-login__main-header, .logo-container, .title-container { display: none !important; }

            /* Show Custom Header inside form */
            #kc-form .logo-container, #kc-form .title-container { display: block !important; }

            /* COMPACT STYLES */
            .pf-c-form__group, .form-group {
                margin-bottom: 8px !important; /* smaller spacing between fields */
            }

            input.pf-c-form-control, input[type="text"], input[type="password"], input[type="email"] {
                background-color: rgba(255,255,255,0.05) !important;
                color: #ffffff !important;
                border: 1px solid #6b7280 !important;
                height: 36px !important;
                font-size: 13px !important;
                border-radius: 6px !important;
                padding: 5px 10px !important;
            }

            input:focus {
                border-color: #00d68f !important;
                background-color: rgba(255,255,255,0.1) !important;
                outline: none !important;
            }

            label, .pf-c-form__label {
                color: #ddd !important;
                font-size: 0.85em !important;
                margin-bottom: 2px !important;
                display: block !important;
            }

            /* Chrome Autofill Fix */
            input:-webkit-autofill {
                -webkit-box-shadow: 0 0 0 30px #1e1e1e inset !important;
                -webkit-text-fill-color: white !important;
            }
        </style>

        <div id="kc-form">
            <div id="kc-form-wrapper">

                <#-- CUSTOM COMPACT HEADER -->
                <div style="text-align: center; margin-bottom: 15px;">
                    <div class="logo-container" style="margin-bottom: 10px;">
                        <img src="${url.resourcesPath}/img/gendoxLogo.png" alt="Logo" style="max-width: 60px;">
                    </div>
                    <div class="title-container">
                        <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 2px; color: #fff;">Create Account</h1>
                        <p class="subtitle" style="color: #aab2bd; font-size: 12px; margin: 0;">Join Gendox and start the adventure</p>
                    </div>
                </div>

                <form id="kc-register-form" class="${properties.kcFormClass!}" action="${url.registrationAction}" method="post">

                    <@userProfileCommons.userProfileFormFields; callback, attribute>
                        <#if callback = "afterField">
                            <#if passwordRequired?? && (attribute.name == 'username' || (attribute.name == 'email' && realm.registrationEmailAsUsername))>

                                <#-- Password Field -->
                                <div class="${properties.kcFormGroupClass!}">
                                    <div class="${properties.kcLabelWrapperClass!}">
                                        <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label>
                                    </div>
                                    <div class="${properties.kcInputWrapperClass!}">
                                        <div class="${properties.kcInputGroup!}" style="position: relative;">
                                            <input type="password" id="password" class="${properties.kcInputClass!} <#if messagesPerField.existsError('password')>pf-m-error</#if>"
                                                   name="password" autocomplete="new-password" />

                                            <button class="${properties.kcFormPasswordVisibilityButtonClass!}" type="button"
                                                    aria-label="${msg('showPassword')}" aria-controls="password" data-password-toggle
                                                    data-icon-show="${properties.kcFormPasswordVisibilityIconShow!}"
                                                    data-icon-hide="${properties.kcFormPasswordVisibilityIconHide!}"
                                                    data-label-show="${msg('showPassword')}" data-label-hide="${msg('hidePassword')}"
                                                    style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #fff;">
                                                <i class="${properties.kcFormPasswordVisibilityIconShow!}" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                        <#if messagesPerField.existsError('password')>
                                            <span id="input-error-password" class="${properties.kcInputErrorMessageClass!}" aria-live="polite" style="color: #ff6b6b; font-size: 0.8em;">
                                               ${kcSanitize(messagesPerField.get('password'))?no_esc}
                                           </span>
                                        </#if>
                                    </div>
                                </div>

                                <#-- Confirm Password Field -->
                                <div class="${properties.kcFormGroupClass!}">
                                    <div class="${properties.kcLabelWrapperClass!}">
                                        <label for="password-confirm" class="${properties.kcLabelClass!}">${msg("passwordConfirm")}</label>
                                    </div>
                                    <div class="${properties.kcInputWrapperClass!}">
                                        <div class="${properties.kcInputGroup!}" style="position: relative;">
                                            <input type="password" id="password-confirm" class="${properties.kcInputClass!} <#if messagesPerField.existsError('password-confirm')>pf-m-error</#if>"
                                                   name="password-confirm" />

                                            <button class="${properties.kcFormPasswordVisibilityButtonClass!}" type="button"
                                                    aria-label="${msg('showPassword')}" aria-controls="password-confirm" data-password-toggle
                                                    data-icon-show="${properties.kcFormPasswordVisibilityIconShow!}"
                                                    data-icon-hide="${properties.kcFormPasswordVisibilityIconHide!}"
                                                    data-label-show="${msg('showPassword')}" data-label-hide="${msg('hidePassword')}"
                                                    style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #fff;">
                                                <i class="${properties.kcFormPasswordVisibilityIconShow!}" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                        <#if messagesPerField.existsError('password-confirm')>
                                            <span id="input-error-password-confirm" class="${properties.kcInputErrorMessageClass!}" aria-live="polite" style="color: #ff6b6b; font-size: 0.8em;">
                                               ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
                                           </span>
                                        </#if>
                                    </div>
                                </div>
                            </#if>
                        </#if>
                    </@userProfileCommons.userProfileFormFields>

                    <#-- Terms Acceptance (Compact Macro) -->
                    <@termsAcceptance/>

                    <#if recaptchaRequired?? && (recaptchaVisible!false)>
                        <div class="form-group">
                            <div class="${properties.kcInputWrapperClass!}">
                                <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}" data-action="${recaptchaAction}"></div>
                            </div>
                        </div>
                    </#if>

                    <div class="${properties.kcFormGroupClass!}" style="margin-top: 15px;">

                        <#-- REGISTER BUTTON -->
                        <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
                            <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                                   type="submit" value="${msg("doRegister")}"
                                   style="background-color: #00d68f; border: none; color: #ffffff; font-weight: bold; width: 100%; padding: 10px; border-radius: 5px; cursor: pointer; font-size: 14px;"/>
                        </div>

                        <div class="${properties.kcFormOptionsWrapperClass!}" style="text-align: center; margin-top: 10px; font-size: 0.85em;">
                            <span style="color: #aab2bd;"><a href="${url.loginUrl}" style="text-decoration: none; color: #00bf8c;">${kcSanitize(msg("backToLogin"))?no_esc}</a></span>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        <script type="module" src="${url.resourcesPath}/js/passwordVisibility.js"></script>
    </#if>
</@layout.registrationLayout>