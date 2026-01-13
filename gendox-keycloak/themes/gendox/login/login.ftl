<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>

    <#if section = "header">
        <#-- Empty header to prevent duplication -->
    <#elseif section = "form">

        <style>
            /* Hide default template headers */
            header, .kc-form-header, .pf-c-login__main-header, .logo-container, .title-container { display: none !important; }

            /* Show custom header inside the form */
            #kc-form .logo-container, #kc-form .title-container { display: block !important; }

            /* Input Styles */
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

                <#-- Custom Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <div class="logo-container" style="margin-bottom: 20px;">
                        <img src="${url.resourcesPath}/img/gendoxLogo.png" alt="Logo" style="max-width: 100px;">
                    </div>
                    <div class="title-container">
                        <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #fff;">Welcome to Gendox! 👋🏻</h1>
                        <p class="subtitle" style="color: #aab2bd; font-size: 14px;">Invalid username or password</p>
                    </div>
                </div>

                <#if realm.password>
                    <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">

                        <div class="${properties.kcFormGroupClass!}">
                            <label for="username" class="${properties.kcLabelClass!}" style="color:#ddd">Username / Email</label>
                            <input tabindex="1" id="username" class="${properties.kcInputClass!}" name="username" value="${(login.username!'')}" type="text" autofocus autocomplete="username" />
                        </div>

                        <div class="${properties.kcFormGroupClass!}">
                            <label for="password" class="${properties.kcLabelClass!}" style="color:#ddd">Password</label>
                            <input tabindex="2" id="password" class="${properties.kcInputClass!}" name="password" type="password" autocomplete="current-password" />
                        </div>

                        <div id="kc-form-buttons" class="${properties.kcFormGroupClass!}" style="margin-top: 25px;">
                            <input tabindex="4" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                                   name="login" id="kc-login" type="submit" value="LOGIN"
                                   style="background-color: #00d68f; border: none; color: #ffffff; font-weight: bold; width: 100%; padding: 12px; border-radius: 5px; cursor: pointer;"/>
                        </div>
                    </form>
                </#if>
            </div>
        </div>
    </#if>
</@layout.registrationLayout>